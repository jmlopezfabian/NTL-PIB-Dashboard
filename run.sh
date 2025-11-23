#!/bin/bash

# Script para ejecutar la aplicación Flask localmente

echo "🚀 Iniciando aplicación Flask..."

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    echo "📦 Activando entorno virtual..."
    source venv/bin/activate
else
    echo "⚠️  No se encontró entorno virtual. Creando uno nuevo..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📥 Instalando dependencias..."
    pip install -r requirements.txt
fi

# Verificar si las dependencias están instaladas
if ! python -c "import flask" 2>/dev/null; then
    echo "📥 Instalando dependencias..."
    pip install -r requirements.txt
fi

echo "✅ Todo listo!"
echo "🌐 La aplicación estará disponible en: http://localhost:5000"
echo ""

# Ejecutar la aplicación
python app.py

