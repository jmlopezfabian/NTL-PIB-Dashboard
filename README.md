# Dashboard de NTL y PIB (Flask + React)

Aplicación interactiva para explorar NTL (radianza nocturna) y PIB municipal: series temporales, histogramas, boxplots, comparativos PIB vs NTL, filtros por municipio, rango de fechas y año, y descarga de datos filtrados. Backend en Flask, frontend en React/Vite con Recharts.

## ✨ Qué hace
- **NTL**: métricas de radianza (media, percentiles, etc.), filtros por municipios/fechas/año, series temporales, histogramas, boxplots y comparación entre municipios.
- **PIB**: métricas de PIB municipal, histogramas, boxplots y series temporales.
- **Comparativo PIB vs NTL**: scatter plot (PIB vs NTL) con selección de municipios y métrica de NTL.
- **Descarga de datos**: CSV con columnas seleccionadas (usa “NTL” en lugar de “radianza”).
- **Responsive**: ajustes específicos para móvil (leyendas externas, scroll horizontal en gráficos anchos).

## 🗂️ Estructura
```
.
├── app.py            # API Flask: datos NTL/PIB, filtros, descarga
├── config.py
├── Data/             # CSV locales (ej. municipios_completos_limpio.csv, PIB_completo.csv)
├── frontend/         # React + Vite + Recharts
│   └── src/components
├── Dockerfile        # Build multi-stage (frontend + backend)
└── start.sh
```

## 🚀 Ejecutar en local
1) Backend
```bash
pip install -r requirements.txt
python app.py   # http://localhost:5000
```
2) Frontend
```bash
cd frontend
npm install
npm run dev     # http://localhost:5173 (o el puerto que muestre Vite)
```
Para modo combinado (build + serve estático desde Flask), usa el `Dockerfile`.

## 🔌 Endpoints principales
- `GET /api/data`             Datos NTL (filtros: municipios, rango de fechas, año, columnas)
- `GET /api/pib/data`         Datos PIB
- `GET /api/eda/combined`     Datos combinados PIB+NTL para el scatter
- `GET /api/download`         Descarga CSV NTL (con columnas elegidas)
- `GET /api/pib/download`     Descarga CSV PIB
- `GET /api/municipios`, `/api/years`, `/api/pib/municipios` Metadatos

## 🧰 Notas técnicas
- Cache en memoria para NTL y PIB.
- Fallback a CSV local (`Data/`) si falla Azure Blob o no hay credenciales.
- Deduplicación y agregación trimestral en el scatter PIB vs NTL para evitar saturación.
- Leyendas externas en charts multiserie y scroll horizontal en boxplots en móvil.

## 🛠️ Configuración rápida (Docker/Railway)
Build multi-stage ya listo:
```bash
docker build -t ntl-pib .
docker run -p 5000:5000 ntl-pib
```
Railway usa el `Dockerfile`; el puerto se toma de `$PORT`.

## 📚 Tecnologías
- Backend: Flask, Flask-CORS, Gunicorn, Azure Blob SDK (opcional)
- Frontend: React, Vite, Recharts, Axios
- Dev/Build: Docker multi-stage, npm
