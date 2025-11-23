from flask import Flask, jsonify
from flask_cors import CORS
import os
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permitir peticiones desde el frontend React

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

@app.route('/api/chart-data')
def chart_data():
    # Genera datos de ejemplo para la gráfica
    # En una app real, estos datos vendrían de una base de datos
    labels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    data = [random.randint(10, 100) for _ in range(7)]
    
    return jsonify({
        'labels': labels,
        'datasets': [{
            'label': 'Visitas',
            'data': data,
            'backgroundColor': 'rgba(102, 126, 234, 0.5)',
            'borderColor': 'rgba(102, 126, 234, 1)',
            'borderWidth': 2
        }]
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

