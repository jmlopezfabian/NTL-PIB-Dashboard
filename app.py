from flask import Flask, render_template, jsonify
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/info')
def info():
    return jsonify({
        'message': '¡Hola desde Railway!',
        'environment': os.getenv('RAILWAY_ENVIRONMENT', 'local'),
        'python_version': os.sys.version.split()[0]
    })

@app.route('/api/health')
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

