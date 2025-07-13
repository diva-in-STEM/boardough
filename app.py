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
			print('Error getting inputs')
			return redirect('/')
		else:
			try:
				user = query_db('select * from users where email=?', (emailInput,))[0]
			except:
				print('Error querying db')
				return redirect('/')
			else:
				if check_password_hash(user[2], passwdInput):
					session['userID'] = user[0]
					return redirect('/home')

@app.route("/home")
def home():
	if session['userID']:
		dashboards = query_db('select * from dashboards where created_by=?', (session['userID'],))
		sources = query_db('select * from sources where created_by=?', (session['userID'],))
		return render_template("index.html", dashboards=dashboards, sources=sources)
	else:
		return redirect('/')

@app.route('/sources', methods=['GET'])
def sources_page():
	if session['userID']:
		sources = query_db('select * from sources where created_by=?', (session['userID'],))
		return render_template("sources.html", sources=sources)
	else:
		return redirect('/')

@app.route('/api/create-dashboard', methods=['POST'])
def create_dashboard():
	if session['userID']:
		try:
			dashName = request.form.get('name')
			dashDesc = request.form.get('description')
			dashAPI = request.form.get('api')
		except:
			## Error
			return redirect('/home')
		else:
			userID = session['userID']
			query_db('insert into dashboards (created_by, name, description, source_name, source_created_by) values (?, ?, ?, ?, ?)', (userID, dashName, dashDesc, dashAPI, userID))

			return redirect('/home')
	else:
		return redirect('/')

@app.route('/api/create-source', methods=["POST"])
def create_source():
	if session['userID']:
		try:
			sourceName = request.form.get('name')
			sourceRoute = request.form.get('route')
		except:
			## Error
			return redirect('/sources')
		else:
			try:
				userID = session['userID']
				query_db('insert into sources (created_by, name, route) values (?, ?, ?)', (userID, sourceName, sourceRoute))
			except:
				return redirect('/sources')
			else:
				subroutes = [value for key, value in request.form.items() if key.startswith('subroute')]
				for subroute in subroutes:
					try:
						query_db('insert into subroutes (path, source_name, source_created_by) values (?, ?, ?)', (subroute, sourceName, userID))
					except:
						print("Error creating subroute")
			return redirect('/sources')
	else:
		return redirect('/')

if __name__ == '__main__':
	app.run(debug=True)