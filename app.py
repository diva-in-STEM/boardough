from flask import Flask, render_template, request, redirect

app = Flask(__name__)

dashboards = [
		{
			'name': 'Dashboard One',
			'details': 'Source: api.app.com'
        },
		{
			'name': 'Dashboard Two',
			'details': 'Source: api.game.com'
        },
]

sources = [
	{
		'name': 'Twitter',
		'route': 'api.x.com'
	}
]

@app.route("/")
@app.route("/home")
def index():
	return render_template("index.html", dashboards=dashboards)

@app.route('/sources', methods=['GET'])
def sources_page():
	return render_template("sources.html", sources=sources)

@app.route('/api/create-dashboard', methods=['POST'])
def create_dashboard():
	try:
		dashName = request.form.get('name')
		dashAPI = request.form.get('api')
	except:
		## Error
		return redirect('/home')
	else:
		dashboards.append({
			'name': dashName,
			'route': f"Source: {dashAPI}"
		})

		return redirect('/home')

@app.route('/api/create-source', methods=["POST"])
def create_source():
	try:
		sourceName = request.form.get('name')
		sourceRoute = request.form.get('route')
	except:
		## Error
		return redirect('/sources')
	else:
		sources.append({
			'name': sourceName,
			'details': f"Source: {sourceRoute}"
		})
		
		return redirect('/sources')

if __name__ == '__main__':
	app.run(debug=True)