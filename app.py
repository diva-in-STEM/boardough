from flask import Flask, render_template, request, redirect, g, session, url_for
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

DATABASE = './data/database.db'
SECRET = b'\xf3\x7f\xc4\xa0[\x00\xa6\\\xe4\xc48\xa6<\\J{'

app = Flask(__name__)
app.secret_key = SECRET

def get_db():
	db = getattr(g, '_database', None)
	if db is None:
		db = g._database = sqlite3.connect(DATABASE)
	
	return db

def query_db(query, args=(), one=False):
	db = get_db()
	cur = get_db().execute(query, args)
	db.commit()
	rv = cur.fetchall()
	cur.close()
	return (rv[0] if rv else None) if one else rv

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

### Remove for prod
with app.app_context():
	try:
		query_db('insert into users (email, password) values (?, ?)', ('test@example.com', generate_password_hash('abc')))
	except:
		print('Test user already exists')

@app.route("/", methods=["GET", "POST"])
def login():
	if request.method == "GET":
		return render_template('login.html')
	else:
		try:
			emailInput = request.form.get('email')
			passwdInput = request.form.get('password')
		except:
			return render_template('login.html', error="Error getting inputs")
		else:
			try:
				user = query_db('select * from users where email=?', (emailInput,))[0]
			except Exception as e:
				return render_template('login.html', error="No user found with that email")
			else:
				if check_password_hash(user[2], passwdInput):
					session['userID'] = user[0]
					return redirect('/home')
				else:
					return render_template('login.html', error="Password incorrect")

@app.route('/logout')
def logout():
	if 'userID' in session:
		session.pop('userID', None)
		return redirect('/')
	else:
		return redirect('/home', error='Error logging out')

@app.route("/home")
def home(error=''):
	if 'userID' not in session:
		return redirect('/')
	
	if error != '':
		return render_template("index.html", error=error)

	try:
		dashboards = query_db('select * from dashboards where created_by=?', (session['userID'],))
		sources = query_db('select * from sources where created_by=?', (session['userID'],))
		return render_template("index.html", dashboards=dashboards, sources=sources)
	except Exception as e:
		print(f'Error getting data from database: {e}')
		return render_template("index.html", dashboards=[], sources=[], error="Error getting data from database")

@app.route('/sources', methods=['GET'])
def sources_page(error=''):
	if 'userID' not in session:
		return redirect('/')
	
	if error != '':
		return render_template("sources.html", error=error)
	
	try:
		sources = query_db('select * from sources where created_by=?', (session['userID'],))
		subroutes = query_db('select * from subroutes where source_created_by = ?', (session['userID'],))
		return render_template("sources.html", sources=sources, subroutes=subroutes)
	except Exception as e:
		print(f'Error getting sources from database: {e}')
		return render_template("sources.html", error="Error loading sources from database")

@app.route('/configurator/<dashboardID>')
def configurator(dashboardID):
	if 'userID' not in session:
		return redirect('/')
	
	try:
		dashboard = query_db('select * from dashboards where id=?', (dashboardID,))[0]
	except Exception as e:
		return redirect('/home', error=f'Error getting dashboard: {e}')
	else:
		try:
			dash_source = query_db('select * from sources where created_by=? and name=?', (session['userID'], dashboard[5]))[0]
			subroutes = query_db('select * from subroutes where source_name=?', (dash_source[2],))
		except Exception as e:
			return redirect('/home', error=f'Error getting subroutes: {e}')
		else:
			return render_template('configurator.html', dashboard=dashboard, source=dash_source, subroutes=subroutes)
			

	
@app.route('/api/create/dashboard', methods=['POST'])
def create_dashboard():
	if 'userID' not in session:
		return redirect('/')
	
	try:
		dashName = request.form.get('name')
		dashDesc = request.form.get('description')
		dashAPI = request.form.get('api')
		
		if not dashName or not dashDesc or not dashAPI:
			return home(error="All fields are required")
		
		userID = session['userID']
		query_db('insert into dashboards (created_by, name, description, source_name, source_created_by) values (?, ?, ?, ?, ?)', (userID, dashName, dashDesc, dashAPI, userID))
		
		return redirect('/home')
		
	except Exception as e:
		return home(error=f'Error creating dashboard: {e}')

@app.route('/api/create/source', methods=["POST"])
def create_source():
	if 'userID' not in session:
		return redirect('/')
	
	try:
		sourceName = request.form.get('name')
		sourceRoute = request.form.get('route')
		
		if not sourceName or not sourceRoute:
			try:
				sources = query_db('select * from sources where created_by=?', (session['userID'],))
				return render_template("sources.html", sources=sources, error="Source name and route are required")
			except:
				return render_template("sources.html", sources=[], error="Source name and route are required")
		
		userID = session['userID']
		
		# Create the source
		query_db('insert into sources (created_by, name, route) values (?, ?, ?)', (userID, sourceName, sourceRoute))
		
		# Handle subroutes
		subroutes = [value for key, value in request.form.items() if key.startswith('subroute') and value.strip()]
		subroute_errors = []
		
		for subroute in subroutes:
			try:
				query_db('insert into subroutes (path, source_name, source_created_by) values (?, ?, ?)', (subroute, sourceName, userID))
			except Exception as e:
				print(f"Error creating subroute {subroute}: {e}")
				subroute_errors.append(subroute)
		
		if subroute_errors:
			try:
				sources = query_db('select * from sources where created_by=?', (session['userID'],))
				return render_template("sources.html", sources=sources, error=f"Source created but failed to create subroutes: {', '.join(subroute_errors)}")
			except:
				return render_template("sources.html", sources=[], error=f"Source created but failed to create subroutes: {', '.join(subroute_errors)}")
		
		return redirect('/sources')
		
	except Exception as e:
		print(f'Error creating source: {e}')
		try:
			sources = query_db('select * from sources where created_by=?', (session['userID'],))
			return render_template("sources.html", sources=sources, error="Error creating source")
		except:
			return render_template("sources.html", sources=[], error="Error creating source")

@app.route('/api/update/dashboard/<dashboardID>', methods=["POST"])
def update_dashboard(dashboardID):
    if 'userID' in session:
        try:
            dashName = request.form.get('name')  # Fixed: was 'edit-name'
            dashDesc = request.form.get('description')  # Fixed: was 'edit-description'  
            dashAPI = request.form.get('api')  # Fixed: was 'edit-api'
        except Exception as e:
            return home(error=f"Error updating dashboard: {e}")
        else:
            try:
                # Get current dashboard values (returns tuple, not dict)
                current_data = query_db('SELECT name, description, source_name FROM dashboards WHERE id = ?', (dashboardID,), one=True)
                
                if current_data is None:
                    return home(error="Dashboard not found")
                
                # Access tuple elements by index: [0]=name, [1]=description, [2]=source_name
                current_name = current_data[0]
                current_description = current_data[1] 
                current_source_name = current_data[2]
                
                # Build update query dynamically based on changed values
                update_fields = []
                update_values = []
                
                if dashName and dashName != current_name:
                    update_fields.append('name = ?')
                    update_values.append(dashName)
                
                if dashDesc and dashDesc != current_description:
                    update_fields.append('description = ?')
                    update_values.append(dashDesc)
                
                if dashAPI and dashAPI != current_source_name:
                    update_fields.append('source_name = ?')
                    update_values.append(dashAPI)
                
                # Only execute update if there are changes
                if update_fields:
                    update_values.append(dashboardID)  # Add ID for WHERE clause
                    query = f"UPDATE dashboards SET {', '.join(update_fields)} WHERE id = ?"
                    query_db(query, tuple(update_values))
                
                return redirect('/home')
                
            except Exception as e:
                return home(error=f"Error updating dashboard: {e}")
    else:
        return redirect('/')

@app.route('/api/delete/dashboard/<dashboardID>', methods=["POST"])
def delete_dashboard(dashboardID):
    if 'userID' in session:
        try:
            # Check if dashboard exists and belongs to user (if you have user ownership)
            dashboard = query_db('SELECT id FROM dashboards WHERE id = ?', (dashboardID,), one=True)
            
            if dashboard is None:
                return home(error="Dashboard not found")
            
            # Delete the dashboard
            query_db('DELETE FROM dashboards WHERE id = ?', (dashboardID,))
            
            # Redirect back to dashboard page or wherever appropriate
            return redirect(url_for('home'))  # Adjust this to your main dashboard page
            
        except Exception as e:
            return home(error=f"Error deleting dashboard: {e}")
    else:
        return redirect(url_for('login'))  # Adjust to your login route

@app.route('/api/update/source/<sourceName>/<sourceCreatedBy>', methods=["POST"])
def update_source(sourceName, sourceCreatedBy):
    if 'userID' in session:
        try:
            # Get original values from hidden form fields for composite key lookup
            original_name = request.form.get('original_name')
            created_by = request.form.get('created_by')
            
            # Get new values from form
            new_source_name = request.form.get('name')
            new_source_route = request.form.get('route')
           
            # Handle subroutes
            subroutes = [value for key, value in request.form.items() if key.startswith('subroute') and value.strip()]
           
        except Exception as e:
            return redirect('/sources?error=' + str(e))
        else:
            try:
                # Get current source values using composite key
                current_data = query_db(
                    'SELECT name, route FROM sources WHERE name = ? AND created_by = ?', 
                    (original_name, created_by), 
                    one=True
                )
               
                if current_data is None:
                    return redirect('/sources?error=Source not found')
               
                current_name = current_data[0]
                current_route = current_data[1]
               
                # Build update query dynamically based on changed values
                update_fields = []
                update_values = []
               
                if new_source_name and new_source_name != current_name:
                    update_fields.append('name = ?')
                    update_values.append(new_source_name)
               
                if new_source_route and new_source_route != current_route:
                    update_fields.append('route = ?')
                    update_values.append(new_source_route)
               
                # Only execute update if there are changes
                if update_fields:
                    update_values.extend([original_name, created_by])
                    query = f"UPDATE sources SET {', '.join(update_fields)} WHERE name = ? AND created_by = ?"
                    query_db(query, tuple(update_values))
               
                # Handle subroutes update
                subroute_errors = []
                
                if subroutes:
                    # Get the current source identifier after potential name change
                    source_name_for_subroutes = new_source_name if new_source_name else original_name
                    
                    # Delete existing subroutes
                    query_db('DELETE FROM subroutes WHERE source_name = ? AND source_created_by = ?', 
                           (original_name, created_by))
                    
                    # Insert new subroutes
                    for subroute in subroutes:
                        try:
                            query_db('INSERT INTO subroutes (path, source_name, source_created_by) VALUES (?, ?, ?)', 
                                   (subroute, source_name_for_subroutes, created_by))
                        except Exception as e:
                            print(f"Error updating subroute {subroute}: {e}")
                            subroute_errors.append(subroute)
                
                if subroute_errors:
                    try:
                        sources = query_db('select * from sources where created_by=?', (session['userID'],))
                        return render_template("sources.html", sources=sources, error=f"Source updated but failed to update subroutes: {', '.join(subroute_errors)}")
                    except:
                        return render_template("sources.html", sources=[], error=f"Source updated but failed to update subroutes: {', '.join(subroute_errors)}")
               
                return redirect('/sources')
               
            except Exception as e:
                return redirect('/sources?error=' + str(e))
    else:
        return redirect('/')

@app.route('/api/delete/source/<sourceName>/<sourceCreatedBy>', methods=["POST"])
def delete_source(sourceName, sourceCreatedBy):
    if 'userID' in session:
        try:
            # Check if source exists
            source = query_db('SELECT * FROM sources WHERE name = ? and created_by = ?', (sourceName, sourceCreatedBy), one=True)
            if source is None:
                return redirect('/sources?error=Source not found')
            
            # Check if any dashboards are using this source
            dashboards_using_source = query_db('SELECT COUNT(*) FROM dashboards WHERE source_name = (SELECT name FROM sources WHERE name = ? and created_by = ?)', (sourceName, sourceCreatedBy))
            if dashboards_using_source and dashboards_using_source[0][0] > 0:
                return redirect('/sources?error=Cannot delete source: it is being used by existing dashboards')
           
            # Delete related subroutes first
            query_db('DELETE FROM subroutes WHERE source_name = ? and source_created_by = ?', (sourceName, sourceCreatedBy))
            
            # Delete the source
            query_db('DELETE FROM sources WHERE name = ? and created_by = ?', (sourceName, sourceCreatedBy))
           
            return redirect('/sources')
           
        except Exception as e:
            return redirect('/sources?error=' + str(e))
    else:
        return redirect('/')

if __name__ == '__main__':
	app.run(debug=True)