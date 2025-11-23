# Web App para Railway

Una aplicación web sencilla creada con Flask para practicar despliegue en Railway.

## 🚀 Características

- Interfaz web moderna y responsive
- API REST con endpoints de información y salud
- Lista para despliegue en Railway
- Diseño atractivo con gradientes

## 📋 Requisitos

- Python 3.8+
- pip

## 🛠️ Instalación Local

1. Clona o descarga este repositorio

2. Crea un entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. Instala las dependencias:
```bash
pip install -r requirements.txt
```

4. Ejecuta la aplicación:
```bash
python app.py
```

5. Abre tu navegador en `http://localhost:5000`

## 🚂 Despliegue en Railway

### Opción 1: Conectando un repositorio Git

1. Crea una cuenta en [Railway](https://railway.app)
2. Crea un nuevo proyecto
3. Selecciona "Deploy from GitHub repo" (o GitLab/Bitbucket)
4. Conecta tu repositorio
5. Railway detectará automáticamente que es una app Python
6. Agrega las variables de entorno si es necesario
7. ¡Listo! Railway desplegará automáticamente tu app

### Opción 2: Desde la línea de comandos

1. Instala Railway CLI:
```bash
npm install -g @railway/cli
```

2. Inicia sesión:
```bash
railway login
```

3. Inicializa el proyecto:
```bash
railway init
```

4. Despliega:
```bash
railway up
```

## 📁 Estructura del Proyecto

```
.
├── app.py              # Aplicación Flask principal
├── requirements.txt    # Dependencias Python
├── Procfile           # Configuración para Railway
├── railway.json       # Configuración avanzada de Railway
├── templates/         # Plantillas HTML
│   └── index.html     # Página principal
└── README.md          # Este archivo
```

## 🔌 Endpoints de la API

- `GET /` - Página principal
- `GET /api/info` - Información del sistema
- `GET /api/health` - Estado de salud del servidor

## 📝 Notas

- Railway automáticamente detecta aplicaciones Python/Flask
- El puerto se configura automáticamente mediante la variable de entorno `PORT`
- Gunicorn se usa como servidor WSGI para producción
- La aplicación está lista para escalar horizontalmente

## 🎨 Personalización

Puedes personalizar:
- Los colores y estilos en `templates/index.html`
- Los endpoints de la API en `app.py`
- La configuración de despliegue en `railway.json`

¡Buena suerte con tu despliegue! 🚀

