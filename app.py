from flask import Flask, render_template, request, redirect, g, session
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
		return render_template("sources.html", sources=sources)
	except Exception as e:
		print(f'Error getting sources from database: {e}')
		return render_template("sources.html", error="Error loading sources from database")

@app.route('/configurator/<dashboardID>')
def configurator(dashboardID):
	if 'userID' not in session:
		return redirect('/')
	
	try:
		dashboard = query_db('select * from dashboards where id=?', (dashboardID,))
	except Exception as e:
		return redirect('/home', error=f'Error getting dashboard: {e}')
	else:
		return render_template('configurator.html', dashboard=dashboard[0])
	
@app.route('/api/create-dashboard', methods=['POST'])
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
		print(f'Error creating dashboard: {e}')
		try:
			dashboards = query_db('select * from dashboards where created_by=?', (session['userID'],))
			return home(error="Error creating dashboard")
		except:
			return home(error="Error creating dashboard")

@app.route('/api/create-source', methods=["POST"])
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

if __name__ == '__main__':
	app.run(debug=True)