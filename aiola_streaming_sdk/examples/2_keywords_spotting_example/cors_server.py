from flask import Flask, send_from_directory
from werkzeug.serving import make_ssl_devcert

app = Flask(__name__, static_url_path='', static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    # Generate SSL certificate (only required the first time)
    make_ssl_devcert('./ssl', host='localhost')

    app.run(ssl_context=('ssl.crt', 'ssl.key'), port=3000)