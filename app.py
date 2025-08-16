from flask import Flask, render_template, request, redirect, g, session, url_for, jsonify
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import secrets
import logging
from functools import wraps
import re
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE = './data/database.db'
# Use environment variable or generate secure random key
SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_bytes(32)

app = Flask(__name__)
app.secret_key = SECRET_KEY

# Security configuration
app.config.update(
    SESSION_COOKIE_SECURE=True,  # HTTPS only
    SESSION_COOKIE_HTTPONLY=True,  # No JavaScript access
    SESSION_COOKIE_SAMESITE='Lax',  # CSRF protection
    PERMANENT_SESSION_LIFETIME=timedelta(hours=24)  # Session timeout
)

def get_db():
    """Get database connection with row factory for easier access."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # Enable dict-like access
    return db

def query_db(query, args=(), one=False):
    """Execute database query with proper error handling."""
    try:
        db = get_db()
        cur = db.execute(query, args)
        db.commit()
        rv = cur.fetchall()
        cur.close()
        return (rv[0] if rv else None) if one else rv
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        raise

def init_db():
    """Initialize database with schema."""
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

@app.teardown_appcontext
def close_connection(exception):
    """Close database connection."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def login_required(f):
    """Decorator to require login for protected routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'userID' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def validate_input(data, field_name, pattern=None, max_length=255):
    """Validate and sanitize input data."""
    if not data or not data.strip():
        raise ValueError(f"{field_name} is required")
    
    data = data.strip()
    
    if len(data) > max_length:
        raise ValueError(f"{field_name} must be less than {max_length} characters")
    
    if pattern and not re.match(pattern, data):
        raise ValueError(f"{field_name} contains invalid characters")
    
    return data

def check_ownership(user_id, table, identifier, id_field='id'):
    """Verify user owns the specified resource."""
    if table == 'sources':
        # For sources, use composite key
        source_name, created_by = identifier.split('|')
        result = query_db(f'SELECT 1 FROM {table} WHERE name = ? AND created_by = ?', 
                         (source_name, created_by), one=True)
    else:
        result = query_db(f'SELECT 1 FROM {table} WHERE {id_field} = ? AND created_by = ?', 
                         (identifier, user_id), one=True)
    return result is not None

def rate_limit_check(user_id, action, limit=10, window=60):
    """Simple rate limiting (in production, use Redis or similar)."""
    # This is a basic implementation - use proper rate limiting in production
    current_time = datetime.now()
    session_key = f"rate_limit_{action}_{user_id}"
    
    if session_key not in session:
        session[session_key] = []
    
    # Clean old entries
    session[session_key] = [
        timestamp for timestamp in session[session_key] 
        if current_time - datetime.fromisoformat(timestamp) < timedelta(seconds=window)
    ]
    
    if len(session[session_key]) >= limit:
        return False
    
    session[session_key].append(current_time.isoformat())
    return True

# Test user creation for development/testing
with app.app_context():
    try:
        query_db('INSERT INTO users (email, password) VALUES (?, ?)', 
                ('test@example.com', generate_password_hash('abc')))
    except sqlite3.IntegrityError:
        logger.info('Test user already exists')

@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template('login.html')
    
    try:
        email = validate_input(request.form.get('email'), 'Email', 
                              r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', 254)
        password = validate_input(request.form.get('password'), 'Password', max_length=128)
        
        # Rate limiting
        if not rate_limit_check(request.remote_addr, 'login', limit=5, window=300):
            logger.warning(f"Rate limit exceeded for IP: {request.remote_addr}")
            return render_template('login.html', error="Too many login attempts. Please try again later.")
        
        user = query_db('SELECT id, email, password FROM users WHERE email = ?', (email,), one=True)
        
        if not user:
            logger.warning(f"Login attempt with non-existent email: {email}")
            return render_template('login.html', error="Invalid email or password")
        
        if not check_password_hash(user['password'], password):
            logger.warning(f"Failed login attempt for user: {email}")
            return render_template('login.html', error="Invalid email or password")
        
        # Clear and regenerate session to prevent session fixation
        session.clear()
        session['userID'] = user['id']
        session['email'] = user['email']
        session.permanent = True
        
        logger.info(f"Successful login for user: {email}")
        return redirect(url_for('home'))
        
    except ValueError as e:
        return render_template('login.html', error=str(e))
    except Exception as e:
        logger.error(f"Login error: {e}")
        return render_template('login.html', error="An error occurred during login")

@app.route('/logout')
@login_required
def logout():
    user_email = session.get('email', 'unknown')
    session.clear()
    logger.info(f"User logged out: {user_email}")
    return redirect(url_for('login'))

@app.route("/home")
@login_required
def home():
    try:
        user_id = session['userID']
        dashboards = query_db('SELECT * FROM dashboards WHERE created_by = ?', (user_id,))
        sources = query_db('SELECT * FROM sources WHERE created_by = ?', (user_id,))
        
        return render_template("dashboards.html", dashboards=dashboards, sources=sources)
        
    except Exception as e:
        logger.error(f'Error getting data from database: {e}')
        return render_template("dashboards.html", dashboards=[], sources=[], 
                             error="Error getting data from database")

@app.route('/sources', methods=['GET'])
@login_required
def sources_page():
    try:
        user_id = session['userID']
        sources = query_db('SELECT * FROM sources WHERE created_by = ?', (user_id,))
        subroutes = query_db('SELECT * FROM subroutes WHERE source_created_by = ?', (user_id,))
        
        return render_template("sources.html", sources=sources, subroutes=subroutes)
        
    except Exception as e:
        logger.error(f'Error getting sources from database: {e}')
        return render_template("sources.html", error="Error loading sources from database")

@app.route('/configurator/<int:dashboard_id>')
@login_required
def configurator(dashboard_id):
    try:
        user_id = session['userID']
        
        # Check ownership
        if not check_ownership(user_id, 'dashboards', dashboard_id):
            logger.warning(f"Unauthorized access attempt to dashboard {dashboard_id} by user {user_id}")
            return redirect(url_for('home')), 403
        
        dashboard = query_db('SELECT * FROM dashboards WHERE id = ? AND created_by = ?', 
                           (dashboard_id, user_id), one=True)
        
        if not dashboard:
            return redirect(url_for('home'))
        
        dash_source = query_db('SELECT * FROM sources WHERE created_by = ? AND name = ?', 
                              (user_id, dashboard['source_name']), one=True)
        
        if not dash_source:
            return redirect(url_for('home'))
        
        subroutes = query_db('SELECT * FROM subroutes WHERE source_name = ? AND source_created_by = ?', 
                           (dash_source['name'], user_id))
        
        return render_template('configurator.html', dashboard=dashboard, 
                             source=dash_source, subroutes=subroutes)
        
    except Exception as e:
        logger.error(f'Error in configurator: {e}')
        return redirect(url_for('home'))

@app.route('/api/create/dashboard', methods=['POST'])
@login_required
def create_dashboard():
    try:
        user_id = session['userID']
        
        # Rate limiting
        if not rate_limit_check(user_id, 'create_dashboard', limit=10, window=3600):
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        name = validate_input(request.form.get('name'), 'Dashboard name', 
                            r'^[a-zA-Z0-9\s\-_]+$', 100)
        description = validate_input(request.form.get('description'), 'Description', max_length=500)
        api_source = validate_input(request.form.get('api'), 'API source', 
                                  r'^[a-zA-Z0-9\-_]+$', 100)
        
        # Verify the API source exists and belongs to the user
        source_exists = query_db('SELECT 1 FROM sources WHERE name = ? AND created_by = ?', 
                               (api_source, user_id), one=True)
        if not source_exists:
            return render_template("dashboards.html", dashboards=[], sources=[], 
                                 error="Selected API source does not exist")
        
        query_db('INSERT INTO dashboards (created_by, name, description, source_name, source_created_by) VALUES (?, ?, ?, ?, ?)', 
                (user_id, name, description, api_source, user_id))
        
        logger.info(f"Dashboard '{name}' created by user {user_id}")
        return redirect(url_for('home'))
        
    except ValueError as e:
        return render_template("dashboards.html", dashboards=[], sources=[], error=str(e))
    except Exception as e:
        logger.error(f'Error creating dashboard: {e}')
        return render_template("dashboards.html", dashboards=[], sources=[], 
                             error="Error creating dashboard")

@app.route('/api/create/source', methods=["POST"])
@login_required
def create_source():
    try:
        user_id = session['userID']
        
        # Rate limiting
        if not rate_limit_check(user_id, 'create_source', limit=5, window=3600):
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        name = validate_input(request.form.get('name'), 'Source name', 
                            r'^[a-zA-Z0-9\-_]+$', 100)
        route = validate_input(request.form.get('route'), 'Route', 
                             r'^[a-zA-Z0-9\-_/\.]+$', 200)
        
        # Check if source name already exists for this user
        existing_source = query_db('SELECT 1 FROM sources WHERE name = ? AND created_by = ?', 
                                 (name, user_id), one=True)
        if existing_source:
            sources = query_db('SELECT * FROM sources WHERE created_by = ?', (user_id,))
            return render_template("sources.html", sources=sources, 
                                 error="A source with this name already exists")
        
        # Create the source
        query_db('INSERT INTO sources (created_by, name, route) VALUES (?, ?, ?)', 
                (user_id, name, route))
        
        # Handle subroutes
        subroutes = [
            validate_input(value, 'Subroute', r'^[a-zA-Z0-9\-_/\.]+$', 200)
            for key, value in request.form.items() 
            if key.startswith('subroute') and value.strip()
        ]
        
        subroute_errors = []
        for subroute in subroutes:
            try:
                query_db('INSERT INTO subroutes (path, source_name, source_created_by) VALUES (?, ?, ?)', 
                        (subroute, name, user_id))
            except Exception as e:
                logger.error(f"Error creating subroute {subroute}: {e}")
                subroute_errors.append(subroute)
        
        if subroute_errors:
            sources = query_db('SELECT * FROM sources WHERE created_by = ?', (user_id,))
            return render_template("sources.html", sources=sources, 
                                 error=f"Source created but failed to create subroutes: {', '.join(subroute_errors)}")
        
        logger.info(f"Source '{name}' created by user {user_id}")
        return redirect(url_for('sources_page'))
        
    except ValueError as e:
        sources = query_db('SELECT * FROM sources WHERE created_by = ?', (session['userID'],))
        return render_template("sources.html", sources=sources, error=str(e))
    except Exception as e:
        logger.error(f'Error creating source: {e}')
        sources = query_db('SELECT * FROM sources WHERE created_by = ?', (session['userID'],))
        return render_template("sources.html", sources=sources, error="Error creating source")

@app.route('/api/update/dashboard/<int:dashboard_id>', methods=["POST"])
@login_required
def update_dashboard(dashboard_id):
    try:
        user_id = session['userID']
        
        # Check ownership
        if not check_ownership(user_id, 'dashboards', dashboard_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        name = validate_input(request.form.get('name'), 'Dashboard name', 
                            r'^[a-zA-Z0-9\s\-_]+$', 100)
        description = validate_input(request.form.get('description'), 'Description', max_length=500)
        api_source = validate_input(request.form.get('api'), 'API source', 
                                  r'^[a-zA-Z0-9\-_]+$', 100)
        
        # Verify the API source exists and belongs to the user
        source_exists = query_db('SELECT 1 FROM sources WHERE name = ? AND created_by = ?', 
                               (api_source, user_id), one=True)
        if not source_exists:
            return render_template("dashboards.html", dashboards=[], sources=[], 
                                 error="Selected API source does not exist")
        
        current_data = query_db('SELECT name, description, source_name FROM dashboards WHERE id = ? AND created_by = ?', 
                               (dashboard_id, user_id), one=True)
        
        if not current_data:
            return jsonify({'error': 'Dashboard not found'}), 404
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        if name != current_data['name']:
            update_fields.append('name = ?')
            update_values.append(name)
        
        if description != current_data['description']:
            update_fields.append('description = ?')
            update_values.append(description)
        
        if api_source != current_data['source_name']:
            update_fields.append('source_name = ?')
            update_values.append(api_source)
        
        if update_fields:
            update_values.extend([dashboard_id, user_id])
            query = f"UPDATE dashboards SET {', '.join(update_fields)} WHERE id = ? AND created_by = ?"
            query_db(query, tuple(update_values))
            logger.info(f"Dashboard {dashboard_id} updated by user {user_id}")
        
        return redirect(url_for('home'))
        
    except ValueError as e:
        return render_template("dashboards.html", dashboards=[], sources=[], error=str(e))
    except Exception as e:
        logger.error(f"Error updating dashboard: {e}")
        return render_template("dashboards.html", dashboards=[], sources=[], 
                             error="Error updating dashboard")

@app.route('/api/delete/dashboard/<int:dashboard_id>', methods=["POST"])
@login_required
def delete_dashboard(dashboard_id):
    try:
        user_id = session['userID']
        
        # Check ownership
        if not check_ownership(user_id, 'dashboards', dashboard_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        dashboard = query_db('SELECT id FROM dashboards WHERE id = ? AND created_by = ?', 
                           (dashboard_id, user_id), one=True)
        
        if not dashboard:
            return render_template("dashboards.html", dashboards=[], sources=[], 
                                 error="Dashboard not found")
        
        query_db('DELETE FROM dashboards WHERE id = ? AND created_by = ?', (dashboard_id, user_id))
        logger.info(f"Dashboard {dashboard_id} deleted by user {user_id}")
        
        return redirect(url_for('home'))
        
    except Exception as e:
        logger.error(f"Error deleting dashboard: {e}")
        return render_template("dashboards.html", dashboards=[], sources=[], 
                             error="Error deleting dashboard")

@app.route('/api/dashboards/save/<int:dashboard_id>', methods=['POST'])
@login_required
def save_dashboard(dashboard_id):
    try:
        user_id = session['userID']
        
        # Check ownership
        if not check_ownership(user_id, 'dashboards', dashboard_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Rate limiting
        if not rate_limit_check(user_id, 'save_dashboard', limit=20, window=3600):
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        dashboard_state = request.get_json()
        if not dashboard_state:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate JSON structure (basic validation)
        if not isinstance(dashboard_state, dict):
            return jsonify({'error': 'Invalid data format'}), 400
        
        json_data = json.dumps(dashboard_state, ensure_ascii=False)
        
        # Limit configuration size (prevent DoS)
        if len(json_data) > 1024 * 1024:  # 1MB limit
            return jsonify({'error': 'Configuration too large'}), 400
        
        query_db('UPDATE dashboards SET configuration = ? WHERE id = ? AND created_by = ?', 
                (json_data, dashboard_id, user_id))
        
        logger.info(f"Dashboard {dashboard_id} configuration saved by user {user_id}")
        return jsonify({'success': True})
        
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON'}), 400
    except Exception as e:
        logger.error(f'Error saving dashboard configuration: {e}')
        return jsonify({'error': 'Error saving dashboard configuration'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return render_template('error.html', error='Page not found'), 404

@app.errorhandler(403)
def forbidden(error):
    return render_template('error.html', error='Access forbidden'), 403

@app.errorhandler(500)
def internal_error(error):
    logger.error(f'Internal server error: {error}')
    return render_template('error.html', error='Internal server error'), 500

if __name__ == '__main__':
    if not app.debug:
        # Production settings
        app.run(host='127.0.0.1', port=5000, debug=False)
    else:
        # Development settings
        app.run(debug=True)