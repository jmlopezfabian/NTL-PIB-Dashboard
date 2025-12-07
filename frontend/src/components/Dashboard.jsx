import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import './Dashboard.css';
import MultiMunicipioSelector from './MultiMunicipioSelector';
import MultiMetricaSelector from './MultiMetricaSelector';
import MetricaSelector, { METRICAS } from './MetricaSelector';
import RadianzaChart from './RadianzaChart';
import DateRangeSlider from './DateRangeSlider';
import YearSelector from './YearSelector';
import BoxPlot from './BoxPlot';

// Usar /api en producción o variable de entorno (adaptado para Vite)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Paleta de colores para municipios
const COLORS = [
  '#667eea',  '#764ba2',  '#e74c3c',  '#2ecc71',  '#f39c12',
  '#3498db',  '#9b59b6',  '#e67e22',  '#1abc9c',  '#c0392b',
  '#16a085',  '#d35400',  '#2980b9',  '#8e44ad',  '#27ae60'
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('visualizacion'); // 'visualizacion' o 'eda'
  const [municipios, setMunicipios] = useState([]);
  const [selectedMunicipios, setSelectedMunicipios] = useState([]);
  const [selectedMetricas, setSelectedMetricas] = useState(['Media_de_radianza']);
  const [selectedMetrica, setSelectedMetrica] = useState('Media_de_radianza'); // Para EDA
  const [municipioData, setMunicipioData] = useState([]);
  const [radianzaData, setRadianzaData] = useState([]); // Para EDA
  const [radianzaDataAll, setRadianzaDataAll] = useState([]); // Para box plot
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [edaDataLoaded, setEdaDataLoaded] = useState(false);
  const [loadingMunicipioData, setLoadingMunicipioData] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedMunicipios.length > 0) {
      loadMultipleMunicipioData(selectedMunicipios, selectedYear);
    } else {
      // Limpiar datos cuando no hay municipios seleccionados
      setMunicipioData([]);
    }
  }, [selectedMunicipios, selectedYear]);

  // Cargar datos del EDA cuando se cambia a la pestaña EDA o cuando cambian los municipios
  useEffect(() => {
    if (activeTab === 'eda' && municipios.length > 0) {
      // Resetear el flag cuando cambian los municipios para forzar recarga
      setEdaDataLoaded(false);
      loadEdaData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMunicipios, municipios.length]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Primero verificar que el backend esté disponible
      try {
        await axios.get(`${API_BASE_URL}/health`);
      } catch (healthErr) {
        setError('El backend no está disponible. Asegúrate de que esté ejecutándose en http://localhost:5000');
        setLoading(false);
        return;
      }

      const [municipiosRes, yearsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/municipios`),
        axios.get(`${API_BASE_URL}/years`)
      ]);

      if (municipiosRes.data.success) {
        setMunicipios(municipiosRes.data.municipios);
        if (municipiosRes.data.municipios.length > 0) {
          setSelectedMunicipios([municipiosRes.data.municipios[0]]);
        }
      } else {
        console.error('Error en municipios:', municipiosRes.data.error);
        setError(`Error al cargar municipios: ${municipiosRes.data.error}`);
      }

      if (yearsRes.data.success) {
        setYears(yearsRes.data.years);
        // Seleccionar el año más reciente por defecto
        if (yearsRes.data.years.length > 0) {
          setSelectedYear(yearsRes.data.years[0]);
        }
      } else {
        console.error('Error al cargar años:', yearsRes.data.error);
      }

    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError(`Error al cargar los datos: ${errorMessage}`);
      console.error('Error completo:', err);
      if (err.response?.data?.traceback) {
        console.error('Traceback:', err.response.data.traceback);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMultipleMunicipioData = async (municipiosList, year = null) => {
    try {
      setLoadingMunicipioData(true);
      // Limpiar datos primero para evitar mostrar datos antiguos
      setMunicipioData([]);
      
      if (municipiosList.length === 0) {
        setLoadingMunicipioData(false);
        return;
      }
      
      const promises = municipiosList.map(municipio => {
        const params = {};
        if (year) {
          params.year = year;
        }
        return axios.get(`${API_BASE_URL}/municipio/${encodeURIComponent(municipio)}`, { params });
      });
      
      const responses = await Promise.all(promises);
      const allData = responses
        .filter(res => res.data.success)
        .flatMap(res => res.data.data);
      
      setMunicipioData(allData);
    } catch (err) {
      console.error('Error al cargar datos de municipios:', err);
      setMunicipioData([]); // Limpiar en caso de error
    } finally {
      setLoadingMunicipioData(false);
    }
  };


  // Filtrar datos según el rango de fechas seleccionado
  const filteredMunicipioData = useMemo(() => {
    if (!dateRange || !municipioData || municipioData.length === 0) {
      return municipioData;
    }

    return municipioData.filter(item => {
      const fecha = item.Fecha?.split(' ')[0] || item.Fecha;
      if (!fecha) return false;
      
      const itemDate = new Date(fecha);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [municipioData, dateRange]);

  const handleDateRangeChange = useCallback((range) => {
    setDateRange(range);
  }, []);

  // Determinar si usar facetas (múltiples métricas) - DEBE estar antes de returns tempranos
  const useFacets = selectedMetricas.length > 1;
  const multipleMunicipios = selectedMunicipios.length > 1;

  // Estadísticas descriptivas para Radianza (EDA) - DEBE estar antes de returns tempranos
  const radianzaStats = useMemo(() => {
    if (!radianzaData || radianzaData.length === 0 || activeTab !== 'eda') return null;
    
    const radianzaValues = radianzaData
      .map(d => parseFloat(d.Media_de_radianza))
      .filter(v => !isNaN(v) && v > 0);
    
    if (radianzaValues.length === 0) return null;

    const sorted = radianzaValues.slice().sort((a, b) => a - b);
    const sum = radianzaValues.reduce((a, b) => a + b, 0);
    const mean = sum / radianzaValues.length;
    const variance = radianzaValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / radianzaValues.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: radianzaValues.length,
      mean: mean.toFixed(2),
      median: sorted[Math.floor(sorted.length / 2)].toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: sorted[0].toFixed(2),
      max: sorted[sorted.length - 1].toFixed(2),
      q1: sorted[Math.floor(sorted.length * 0.25)].toFixed(2),
      q3: sorted[Math.floor(sorted.length * 0.75)].toFixed(2)
    };
  }, [radianzaData, activeTab]);

  // Histograma de Radianza (EDA) - DEBE estar antes de returns tempranos
  const radianzaHistogram = useMemo(() => {
    if (!radianzaData || radianzaData.length === 0 || activeTab !== 'eda') return [];
    
    const sampledData = radianzaData;
    
    const radianzaValues = sampledData
      .map(d => parseFloat(d[selectedMetrica]))
      .filter(v => !isNaN(v) && v > 0);
    
    if (radianzaValues.length === 0) return [];
    
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < radianzaValues.length; i++) {
      const val = radianzaValues[i];
      if (val < min) min = val;
      if (val > max) max = val;
    }
    
    // Más barras (50 bins)
    const bins = 50;
    const binWidth = (max - min) / bins;
    
    const histogram = Array(bins).fill(0).map((_, i) => ({
      bin: i + 1,
      count: 0,
      mid: min + (i + 0.5) * binWidth,
      min: min + i * binWidth,
      max: min + (i + 1) * binWidth
    }));
    
    radianzaValues.forEach(val => {
      const binIndex = Math.min(Math.floor((val - min) / binWidth), bins - 1);
      histogram[binIndex].count++;
    });
    
    return histogram;
  }, [radianzaData, activeTab, selectedMetrica]);


  // Suma de Radianza por Año y Municipio (EDA) - DEBE estar antes de returns tempranos
  const sumaRadianzaPorAnioMunicipio = useMemo(() => {
    if (!radianzaData || radianzaData.length === 0 || activeTab !== 'eda') return { chartData: [], municipios: [] };
    
    const grouped = new Map();
    const municipiosSet = new Set();
    
    for (let i = 0; i < radianzaData.length; i++) {
      const d = radianzaData[i];
      const fecha = d.Fecha?.split('T')[0] || d.Fecha || d.fecha;
      const municipio = (d.Municipio || d.municipio || '').toString().trim();
      const sumaRadianza = parseFloat(d.Suma_de_radianza);
      
      if (fecha && municipio && !isNaN(sumaRadianza) && sumaRadianza > 0) {
        const yearMatch = fecha.toString().match(/(\d{4})/);
        let year = yearMatch ? parseInt(yearMatch[1]) : null;
        
        if (!year || year < 2000 || year > 2100) {
          try {
            const dateObj = new Date(fecha);
            if (!isNaN(dateObj.getTime())) {
              year = dateObj.getFullYear();
            }
          } catch (e) {}
        }
        
        if (year && !isNaN(year) && year >= 2000 && year <= 2100) {
          municipiosSet.add(municipio);
          const key = `${year}-${municipio}`;
          const existing = grouped.get(key);
          if (existing) {
            existing.suma += sumaRadianza;
          } else {
            grouped.set(key, { año: year, municipio, suma: sumaRadianza });
          }
        }
      }
    }
    
    const municipios = Array.from(municipiosSet).sort();
    const años = [...new Set(Array.from(grouped.values()).map(d => d.año))].sort((a, b) => a - b);
    
    const chartData = años.map(año => {
      const dataPoint = { año };
      municipios.forEach(municipio => {
        const key = `${año}-${municipio}`;
        const item = grouped.get(key);
        dataPoint[municipio] = item ? item.suma : null;
      });
      return dataPoint;
    });
    
    return { chartData, municipios };
  }, [radianzaData, activeTab]);

  // Box Plot Data (EDA) - DEBE estar antes de returns tempranos
  const boxPlotData = useMemo(() => {
    if (!radianzaDataAll || radianzaDataAll.length === 0 || activeTab !== 'eda') return [];
    
    const groupedByMunicipio = {};
    
    for (let i = 0; i < radianzaDataAll.length; i++) {
      const d = radianzaDataAll[i];
      const municipio = (d.Municipio || '').toString().trim();
      const valor = parseFloat(d[selectedMetrica]);
      
      if (municipio && !isNaN(valor) && valor > 0) {
        if (!groupedByMunicipio[municipio]) {
          groupedByMunicipio[municipio] = [];
        }
        groupedByMunicipio[municipio].push(valor);
      }
    }
    
    const boxPlotStats = Object.keys(groupedByMunicipio).map(municipio => {
      const values = groupedByMunicipio[municipio].sort((a, b) => a - b);
      const n = values.length;
      
      if (n === 0) return null;
      
      const min = values[0];
      const max = values[n - 1];
      const q1 = values[Math.floor(n * 0.25)];
      const median = values[Math.floor(n * 0.5)];
      const q3 = values[Math.floor(n * 0.75)];
      
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      const outliers = values.filter(v => v < lowerBound || v > upperBound);
      const whiskerMin = Math.max(min, lowerBound);
      const whiskerMax = Math.min(max, upperBound);
      
      return {
        municipio,
        min: whiskerMin,
        q1,
        median,
        q3,
        max: whiskerMax,
        outliers,
        count: n
      };
    }).filter(Boolean).sort((a, b) => b.median - a.median);
    
    return boxPlotStats;
  }, [radianzaDataAll, selectedMetrica, activeTab]);

  // Scatter Plot: Media de Radianza vs Desviación Estándar (EDA)
  // Lógica exacta: grouped_data = ntl.groupby("Municipio")[["Media_de_radianza", "Desviacion_estandar_de_radianza"]].mean().reset_index()
  // Función para calcular ticks "bonitos" con pasos redondeados
  const getNiceTicks = useCallback((min, max, numTicks = 5) => {
    const range = max - min;
    const rawStep = range / (numTicks - 1);
    
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalizedStep = rawStep / magnitude;
    
    let niceStep;
    if (normalizedStep <= 1) niceStep = 1;
    else if (normalizedStep <= 2) niceStep = 2;
    else if (normalizedStep <= 5) niceStep = 5;
    else niceStep = 10;
    
    niceStep = niceStep * magnitude;
    
    // Ajustar min y max para que sean múltiplos del paso
    const niceMin = Math.floor(min / niceStep) * niceStep;
    const niceMax = Math.ceil(max / niceStep) * niceStep;
    
    // Generar ticks
    const ticks = [];
    for (let tick = niceMin; tick <= niceMax; tick += niceStep) {
      ticks.push(tick);
    }
    
    return { ticks, min: niceMin, max: niceMax };
  }, []);

  const scatterPlotData = useMemo(() => {
    if (!radianzaDataAll || radianzaDataAll.length === 0 || activeTab !== 'eda') return [];
    
    const groupedByMunicipio = {};
    
    // Agrupar datos por municipio (equivalente a groupby("Municipio"))
    for (let i = 0; i < radianzaDataAll.length; i++) {
      const d = radianzaDataAll[i];
      const municipio = (d.Municipio || '').toString().trim();
      
      if (!municipio) continue;
      
      // Obtener valores de las columnas (equivalente a [["Media_de_radianza", "Desviacion_estandar_de_radianza"]])
      // El backend puede devolver strings vacíos, así que los tratamos como NaN
      let media = d.Media_de_radianza;
      let desvStd = d.Desviacion_estandar_de_radianza;
      
      // Convertir a número (equivalente a astype(float))
      if (media === '' || media === null || media === undefined) {
        media = NaN;
      } else {
        media = parseFloat(media);
      }
      
      if (desvStd === '' || desvStd === null || desvStd === undefined) {
        desvStd = NaN;
      } else {
        desvStd = parseFloat(desvStd);
      }
      
      // Agrupar todos los valores (pandas ignora NaN automáticamente en .mean())
      if (!groupedByMunicipio[municipio]) {
        groupedByMunicipio[municipio] = { media: [], desvStd: [] };
      }
      
      // Solo agregar valores numéricos válidos (NaN se excluyen)
      if (!isNaN(media) && isFinite(media)) {
        groupedByMunicipio[municipio].media.push(media);
      }
      if (!isNaN(desvStd) && isFinite(desvStd)) {
        groupedByMunicipio[municipio].desvStd.push(desvStd);
      }
    }
    
    // Calcular promedio (equivalente a .mean())
    const scatterData = Object.keys(groupedByMunicipio)
      .map(municipio => {
        const medias = groupedByMunicipio[municipio].media;
        const desvStds = groupedByMunicipio[municipio].desvStd;
        
        // Solo incluir si hay al menos un valor válido en cada columna
        if (medias.length === 0 || desvStds.length === 0) return null;
        
        // Calcular media (promedio) - equivalente a .mean()
        const promedioMedia = medias.reduce((sum, val) => sum + val, 0) / medias.length;
        const promedioDesvStd = desvStds.reduce((sum, val) => sum + val, 0) / desvStds.length;
        
        return {
          municipio,
          media: promedioMedia,
          desvStd: promedioDesvStd
        };
      })
      .filter(Boolean);
    
    return scatterData;
  }, [radianzaDataAll, activeTab]);

  // Calcular ticks bonitos para los ejes del scatter plot
  const scatterAxisTicks = useMemo(() => {
    if (!scatterPlotData || scatterPlotData.length === 0) {
      return { xTicks: null, yTicks: null };
    }
    
    const mediaValues = scatterPlotData.map(d => d.media).filter(v => !isNaN(v) && isFinite(v));
    const desvStdValues = scatterPlotData.map(d => d.desvStd).filter(v => !isNaN(v) && isFinite(v));
    
    if (mediaValues.length === 0 || desvStdValues.length === 0) {
      return { xTicks: null, yTicks: null };
    }
    
    const mediaMin = Math.min(...mediaValues);
    const mediaMax = Math.max(...mediaValues);
    const desvStdMin = Math.min(...desvStdValues);
    const desvStdMax = Math.max(...desvStdValues);
    
    const xTicks = getNiceTicks(mediaMin, mediaMax, 5);
    const yTicks = getNiceTicks(desvStdMin, desvStdMax, 5);
    
    return { xTicks, yTicks };
  }, [scatterPlotData, getNiceTicks]);

  const loadEdaData = async () => {
    try {
      // Limpiar datos primero
      setRadianzaData([]);
      
      const params = new URLSearchParams();
      if (selectedMunicipios.length > 0) {
        selectedMunicipios.forEach(municipio => {
          params.append('municipios', municipio);
        });
      }
      
      // Cargar datos filtrados (solo si hay municipios seleccionados)
      const promises = [];
      
      if (selectedMunicipios.length > 0) {
        promises.push(
          axios.get(`${API_BASE_URL}/data?${params.toString()}`)
            .then(res => {
              if (res.data.success) {
                setRadianzaData(res.data.data);
              }
            })
        );
      }
      
      // Siempre cargar todos los datos para el box plot (no filtrado)
      promises.push(
        axios.get(`${API_BASE_URL}/data`)
          .then(res => {
            if (res.data.success) {
              setRadianzaDataAll(res.data.data);
            }
          })
          .catch(err => console.warn('Error cargando datos completos para box plot:', err))
      );
      
      await Promise.all(promises);
      setEdaDataLoaded(true);
    } catch (err) {
      console.error('Error cargando datos EDA:', err);
      setRadianzaData([]);
    }
  };

  const handleDownloadData = async () => {
    try {
      // Construir parámetros de la petición
      const params = new URLSearchParams();
      
      // Agregar municipios si están seleccionados
      if (selectedMunicipios.length > 0) {
        selectedMunicipios.forEach(municipio => {
          params.append('municipios', municipio);
        });
      }
      
      // Agregar año si está seleccionado
      if (selectedYear) {
        params.append('year', selectedYear);
      }
      
      // Agregar rango de fechas si está seleccionado
      if (dateRange) {
        if (dateRange.startDate) {
          params.append('from', dateRange.startDate);
        }
        if (dateRange.endDate) {
          params.append('to', dateRange.endDate);
        }
      }
      
      // Hacer la petición para descargar
      const response = await axios.get(`${API_BASE_URL}/download`, {
        params: params,
        responseType: 'blob'
      });
      
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener nombre de archivo del header Content-Disposition o usar uno por defecto
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'datos_radianza.csv';
      if (contentDisposition) {
        // Extraer el nombre del archivo del header Content-Disposition
        // Maneja tanto filename="archivo.csv" como filename=archivo.csv
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?([^'";]+)['"]?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].trim();
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar datos:', err);
      alert('Error al descargar los datos. Por favor, intenta nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Cargando datos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="eda-tabs">
        <button
          className={`eda-tab ${activeTab === 'visualizacion' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualizacion')}
        >
          Visualización
        </button>
        <button
          className={`eda-tab ${activeTab === 'eda' ? 'active' : ''}`}
          onClick={() => setActiveTab('eda')}
        >
          EDA
        </button>
      </div>

      <div className="dashboard-controls">
        <div className="controls-row">
          <MultiMunicipioSelector
            municipios={municipios}
            selectedMunicipios={selectedMunicipios}
            onSelectMunicipios={setSelectedMunicipios}
          />
          {activeTab === 'visualizacion' ? (
            <>
          <MultiMetricaSelector
            selectedMetricas={selectedMetricas}
            onSelectMetricas={setSelectedMetricas}
          />
          <YearSelector
            years={years}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
          />
            </>
          ) : (
            <MetricaSelector
              selectedMetrica={selectedMetrica}
              onSelectMetrica={setSelectedMetrica}
            />
          )}
        </div>
        {activeTab === 'visualizacion' && municipioData.length > 0 && (
          <div className="date-range-control">
            <DateRangeSlider 
              data={municipioData} 
              onRangeChange={handleDateRangeChange}
            />
          </div>
        )}
        {activeTab === 'visualizacion' && (
        <div className="chart-controls">
          <button 
            className={`toggle-markers-btn ${showMarkers ? 'active' : ''}`}
            onClick={() => setShowMarkers(!showMarkers)}
            title={showMarkers ? 'Ocultar markers' : 'Mostrar markers'}
          >
            {showMarkers ? '●' : '○'} {showMarkers ? 'Ocultar Markers' : 'Mostrar Markers'}
          </button>
          <button 
            className="download-btn"
            onClick={handleDownloadData}
            title="Descargar datos filtrados como CSV"
          >
            ⬇ Descargar Datos
          </button>
        </div>
        )}
      </div>

      {activeTab === 'visualizacion' && (
      <div className="charts-grid">
        {useFacets ? (
          // Facetas: un gráfico por métrica
          selectedMetricas.map((metrica) => {
            const metricaLabel = METRICAS.find(m => m.value === metrica)?.label || metrica;
            return (
              <div key={metrica} className="chart-card">
                <h2>{metricaLabel}</h2>
                {multipleMunicipios && (
                  <p className="chart-subtitle">
                    Municipios: {selectedMunicipios.join(', ')}
                  </p>
                )}
                <RadianzaChart 
                  data={filteredMunicipioData} 
                  selectedMetrica={metrica}
                  multipleMunicipios={multipleMunicipios}
                  showMarkers={showMarkers}
                  loading={loadingMunicipioData}
                />
              </div>
            );
          })
        ) : (
          // Sin facetas: un solo gráfico con la métrica seleccionada
          <div className="chart-card">
            <h2>{METRICAS.find(m => m.value === selectedMetricas[0])?.label || selectedMetricas[0]}</h2>
            {multipleMunicipios && (
              <p className="chart-subtitle">
                Municipios: {selectedMunicipios.join(', ')}
              </p>
            )}
            <RadianzaChart 
              data={filteredMunicipioData} 
              selectedMetrica={selectedMetricas[0] || 'Media_de_radianza'}
              multipleMunicipios={multipleMunicipios}
              showMarkers={showMarkers}
              loading={loadingMunicipioData}
            />
          </div>
        )}
      </div>
      )}

      {activeTab === 'eda' && (
        <div className="eda-content">
          <h2>
            Análisis Exploratorio de Datos - NTL
            {selectedMunicipios.length > 0 && selectedMunicipios.length < municipios.length && (
              <span className="municipio-filter-indicator">
                {' '}({selectedMunicipios.length} {selectedMunicipios.length === 1 ? 'municipio' : 'municipios'} seleccionado{selectedMunicipios.length === 1 ? '' : 's'})
              </span>
            )}
          </h2>

        <div className="chart-card">
            <h3>Distribución de {METRICAS.find(m => m.value === selectedMetrica)?.label || selectedMetrica} (Histograma)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={radianzaHistogram}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mid" 
                  type="number"
                  scale="linear"
                  domain={['dataMin', 'dataMax']}
                  tick={false}
                  label={{ 
                    value: METRICAS.find(m => m.value === selectedMetrica)?.label || selectedMetrica, 
                    position: 'insideBottom', 
                    offset: -5 
                  }}
                />
                <YAxis 
                  label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${value}`, 'Frecuencia']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0] && payload[0].payload) {
                      const data = payload[0].payload;
                      return `Rango: ${data.min.toFixed(2)} - ${data.max.toFixed(2)}`;
                    }
                    return '';
                  }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    padding: '10px'
                  }}
                />
                <Bar dataKey="count" fill="#764ba2" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Distribución de {METRICAS.find(m => m.value === selectedMetrica)?.label || selectedMetrica} por Municipio</h3>
            <BoxPlot 
              data={boxPlotData}
              yAxisLabel={METRICAS.find(m => m.value === selectedMetrica)?.label || selectedMetrica}
              height={Math.max(500, boxPlotData.length * 50)}
            />
          </div>

          <div className="chart-card">
            <h3>Media vs Desviación estándar de NTL por Municipio</h3>
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 80, left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  dataKey="media"
                  name="Media de NTL"
                  label={{ 
                    value: 'Media de NTL', 
                    position: 'insideBottom', 
                    offset: -5,
                    style: { textAnchor: 'middle' }
                  }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                  domain={scatterAxisTicks.xTicks ? [scatterAxisTicks.xTicks.min, scatterAxisTicks.xTicks.max] : ['dataMin', 'dataMax']}
                  ticks={scatterAxisTicks.xTicks ? scatterAxisTicks.xTicks.ticks : undefined}
                  allowDecimals={false}
                />
                <YAxis 
                  type="number"
                  dataKey="desvStd"
                  name="Desviación Estándar"
                  label={{ 
                    value: 'Desviación Estándar de NTL', 
                    angle: -90, 
                    position: 'left',
                    offset: 10,
                    style: { textAnchor: 'middle', fill: '#2a2a2a' }
                  }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => Math.round(value).toString()}
                  domain={scatterAxisTicks.yTicks ? [scatterAxisTicks.yTicks.min, scatterAxisTicks.yTicks.max] : ['dataMin', 'dataMax']}
                  ticks={scatterAxisTicks.yTicks ? scatterAxisTicks.yTicks.ticks : undefined}
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '8px',
                          padding: '10px',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                        }}>
                          <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '5px' }}>
                            {data.municipio}
                          </p>
                          <p style={{ margin: '3px 0', fontSize: '12px' }}>
                            Media: {data.media.toFixed(2)}
                          </p>
                          <p style={{ margin: '3px 0', fontSize: '12px' }}>
                            Desv. Est.: {data.desvStd.toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter 
                  name="Municipios" 
                  data={scatterPlotData} 
                  fill="#667eea"
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    if (!cx || !cy || !payload) return null;
                    
                    const index = scatterPlotData.findIndex(d => d.municipio === payload.municipio);
                    const color = COLORS[index >= 0 ? index % COLORS.length : 0];
                    
                    return (
                      <g>
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={5} 
                          fill={color}
                          stroke="#fff"
                          strokeWidth={1.5}
                        />
                        {/* Etiqueta a la derecha del punto (ha="right" en Python) */}
                        <text 
                          x={cx + 8} 
                          y={cy + 4} 
                          textAnchor="start" 
                          fontSize="9" 
                          fill="#2a2a2a" 
                          fontWeight="400"
                          style={{ pointerEvents: 'none' }}
                        >
                          {payload.municipio}
                        </text>
                      </g>
                    );
                  }}
                >
                  {scatterPlotData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Suma de NTL por Año y Municipio</h3>
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={sumaRadianzaPorAnioMunicipio.chartData} margin={{ top: 20, right: 30, left: 80, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="año" 
                  type="number"
                  scale="linear"
                  domain={['dataMin', 'dataMax']}
                  label={{ value: 'Año', position: 'insideBottom', offset: -5 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ 
                    value: 'Suma de NTL', 
                    angle: -90, 
                    position: 'left',
                    offset: 10,
                    style: { textAnchor: 'middle', fill: '#2a2a2a' }
                  }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value.toString();
                  }}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (value === null || value === undefined) return 'N/A';
                    return [`${value.toLocaleString('es-MX')}`, name];
                  }}
                  labelFormatter={(label) => `Año: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                {sumaRadianzaPorAnioMunicipio.municipios.map((municipio, index) => {
                  const color = COLORS[index % COLORS.length];
                  return (
                    <Line
                      key={municipio}
                      type="monotone"
                      dataKey={municipio}
                      stroke={color}
                      strokeWidth={2}
                      name={municipio}
                      dot={false}
                      connectNulls={true}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

