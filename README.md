# Web App para Railway

Una aplicación web sencilla creada con Flask para practicar despliegue en Railway.

## 🚀 Características

- Interfaz web moderna y responsive
- API REST con endpoints de información y salud
- Gráfica interactiva con Chart.js
- Lista para despliegue en Railway
- Diseño atractivo con gradientes

## 📋 Requisitos

- Python 3.8+
- pip

## 🛠️ Instalación y Ejecución Local

### Opción 1: Script Automático (Recomendado)

```bash
./run.sh
```

Este script automáticamente:
- Crea el entorno virtual si no existe
- Instala las dependencias
- Ejecuta la aplicación

### Opción 2: Manual Paso a Paso

1. **Crea un entorno virtual:**
```bash
python3 -m venv venv
```

2. **Activa el entorno virtual:**
```bash
# En Linux/Mac:
source venv/bin/activate

# En Windows:
venv\Scripts\activate
```

3. **Instala las dependencias:**
```bash
pip install -r requirements.txt
```

4. **Ejecuta la aplicación:**
```bash
python app.py
```

5. **Abre tu navegador:**
   - Ve a: `http://localhost:5000`
   - Deberías ver la interfaz con la gráfica y los botones

### Comandos Rápidos

Si ya tienes el entorno virtual configurado:
```bash
source venv/bin/activate  # Solo si no está activo
python app.py
```

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
├── run.sh             # Script para ejecutar localmente
├── templates/         # Plantillas HTML
│   └── index.html     # Página principal con gráfica
└── README.md          # Este archivo
```

## 🔌 Endpoints de la API

- `GET /` - Página principal con interfaz web
- `GET /api/info` - Información del sistema (JSON)
- `GET /api/health` - Estado de salud del servidor (JSON)
- `GET /api/chart-data` - Datos para la gráfica (JSON)

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

