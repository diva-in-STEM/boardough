from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
@app.route("/index")
def index():
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
	return render_template("index.html", dashboards=dashboards)

if __name__ == '__main__':
	app.run(debug=True)