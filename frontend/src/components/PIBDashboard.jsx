import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './Dashboard.css';
import MultiMunicipioSelector from './MultiMunicipioSelector';
import DateRangeSlider from './DateRangeSlider';
import RadianzaChart from './RadianzaChart';
import BoxPlot from './BoxPlot';

// Usar /api en producción o variable de entorno (adaptado para Vite)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Métrica fija: solo PIB Municipal
const SELECTED_METRICA = 'pib_mun';
const COLORS = [
  '#667eea', '#764ba2', '#e74c3c', '#2ecc71', '#f39c12', '#3498db',
  '#9b59b6', '#e67e22', '#1abc9c', '#c0392b', '#16a085', '#d35400',
  '#2980b9', '#8e44ad', '#27ae60'
];

const PIBDashboard = () => {
  const [activeTab, setActiveTab] = useState('visualizacion'); // 'visualizacion' o 'eda'
  const [municipios, setMunicipios] = useState([]);
  const [selectedMunicipios, setSelectedMunicipios] = useState([]);
  const [municipioData, setMunicipioData] = useState([]);
  const [pibData, setPibData] = useState([]); // Para EDA
  const [pibDataAll, setPibDataAll] = useState([]); // Todos los datos sin filtrar para box plot
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const lastRangeRef = useRef(null); // Evitar bucles de actualización por callbacks que se disparan en cada render
  const [showMarkers, setShowMarkers] = useState(true);
  const [loadingMunicipioData, setLoadingMunicipioData] = useState(false);

  // Ref para el timeout de debounce
  const debounceTimerRef = useRef(null);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        await axios.get(`${API_BASE_URL}/health`);
      } catch (healthErr) {
        setError('El backend no está disponible. Asegúrate de que esté ejecutándose en http://localhost:5000');
        setLoading(false);
        return;
      }

      const municipiosRes = await axios.get(`${API_BASE_URL}/pib/municipios`);

      if (municipiosRes.data.success) {
        setMunicipios(municipiosRes.data.municipios);
        if (municipiosRes.data.municipios.length > 0) {
          setSelectedMunicipios([municipiosRes.data.municipios[0]]);
        }
      } else {
        console.error('Error en municipios:', municipiosRes.data.error);
        setError(`Error al cargar municipios: ${municipiosRes.data.error}`);
      }

    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError(`Error al cargar los datos: ${errorMessage}`);
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMultipleMunicipioData = useCallback(async (municipiosList) => {
    try {
      setLoadingMunicipioData(true);
      // Limpiar datos primero para evitar mostrar datos antiguos
      setMunicipioData([]);
      
      if (municipiosList.length === 0) {
        setLoadingMunicipioData(false);
        return;
      }
      
      // Limitar a 3 municipios simultáneos para mejor rendimiento
      const maxConcurrent = 3;
      const allData = [];
      
      // Procesar en lotes para evitar sobrecargar el servidor
      for (let i = 0; i < municipiosList.length; i += maxConcurrent) {
        const batch = municipiosList.slice(i, i + maxConcurrent);
        const promises = batch.map(municipio => 
          axios.get(`${API_BASE_URL}/pib/municipio/${encodeURIComponent(municipio)}`)
        );
        
        const responses = await Promise.all(promises);
        const batchData = responses
          .filter(res => res.data.success)
          .flatMap(res => res.data.data.map(item => ({
            ...item,
            Fecha: item.fecha, // Normalizar nombre de columna para el gráfico
            Municipio: item.municipio,
            [SELECTED_METRICA]: item[SELECTED_METRICA] // Asegurar que la métrica esté disponible
          })));
        
        allData.push(...batchData);
      }
      
      setMunicipioData(allData);
    } catch (err) {
      console.error('Error al cargar datos de municipios:', err);
      setMunicipioData([]); // Limpiar en caso de error
    } finally {
      setLoadingMunicipioData(false);
    }
  }, []);

  const loadEdaData = useCallback(async () => {
    try {
      // Limpiar datos primero
      setPibData([]);
      
      if (selectedMunicipios.length === 0) {
        return;
      }
      
      // Cargar datos filtrados por municipios seleccionados (sin límite)
      const params = new URLSearchParams();
      selectedMunicipios.forEach(municipio => {
        params.append('municipios', municipio);
      });
      
      const response = await axios.get(`${API_BASE_URL}/pib/data?${params.toString()}`);
      
      if (response.data.success) {
        setPibData(response.data.data);
      }
      
      // Cargar TODOS los datos sin filtrar para el box plot
      const allDataResponse = await axios.get(`${API_BASE_URL}/pib/data`);
      if (allDataResponse.data.success) {
        setPibDataAll(allDataResponse.data.data);
      }
    } catch (err) {
      console.error('Error cargando datos EDA:', err);
      setPibData([]);
    }
  }, [selectedMunicipios]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounce para la carga de datos de municipios
  useEffect(() => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (selectedMunicipios.length > 0) {
      // Debounce de 300ms para evitar cargas excesivas
      debounceTimerRef.current = setTimeout(() => {
        loadMultipleMunicipioData(selectedMunicipios);
      }, 300);
    } else {
      // Limpiar datos cuando no hay municipios seleccionados
      setMunicipioData([]);
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [selectedMunicipios, loadMultipleMunicipioData]);

  // Cargar datos del EDA cuando cambia la pestaña o los municipios
  useEffect(() => {
    if (activeTab === 'eda' && municipios.length > 0) {
      loadEdaData();
    }
  }, [activeTab, selectedMunicipios, loadEdaData, municipios.length]);

  // Filtrar datos según el rango de fechas seleccionado
  const filteredMunicipioData = useMemo(() => {
    if (!dateRange || !municipioData || municipioData.length === 0) {
      return municipioData;
    }

    return municipioData.filter(item => {
      const fecha = item.fecha || item.Fecha;
      if (!fecha) return false;
      
      const itemDate = new Date(fecha);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [municipioData, dateRange]);

  // Estadísticas descriptivas para PIB (EDA)
  const pibStats = useMemo(() => {
    if (!pibData || pibData.length === 0 || activeTab !== 'eda') return null;
    
    const pibValues = pibData
      .map(d => parseFloat(d.pib_mun))
      .filter(v => !isNaN(v) && v > 0);
    
    if (pibValues.length === 0) return null;

    const sorted = pibValues.slice().sort((a, b) => a - b);
    const sum = pibValues.reduce((a, b) => a + b, 0);
    const mean = sum / pibValues.length;
    const variance = pibValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / pibValues.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: pibValues.length,
      mean: mean.toFixed(2),
      median: sorted[Math.floor(sorted.length / 2)].toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: sorted[0].toFixed(2),
      max: sorted[sorted.length - 1].toFixed(2),
      q1: sorted[Math.floor(sorted.length * 0.25)].toFixed(2),
      q3: sorted[Math.floor(sorted.length * 0.75)].toFixed(2)
    };
  }, [pibData, activeTab]);

  // Formateo compacto para ejes numéricos
  const formatAxisNumber = (value) => {
    if (value === null || value === undefined) return '';
    // Redondear a la decena más cercana para terminar en 0
    const rounded = Math.round(value / 10) * 10;
    if (Math.abs(rounded) >= 1_000_000) return `${(rounded / 1_000_000).toFixed(1)}M`;
    if (Math.abs(rounded) >= 1_000) return `${(rounded / 1_000).toFixed(0)}K`;
    return rounded.toFixed(0);
  };

  // Histograma de PIB general (sin muestreo, todos los municipios seleccionados)
  const pibHistogramResult = useMemo(() => {
    if (!pibData || pibData.length === 0 || activeTab !== 'eda') return { data: [], min: 0, max: 0 };
    
    const selected = selectedMunicipios.length > 0 ? selectedMunicipios : municipios;
    if (!selected || selected.length === 0) return { data: [], min: 0, max: 0 };

    const pibValues = pibData
      .filter(d => selected.includes((d.municipio || '').toString()))
      .map(d => parseFloat(d.pib_mun))
      .filter(v => !isNaN(v) && v > 0);

    if (pibValues.length === 0) return { data: [], min: 0, max: 0 };

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < pibValues.length; i++) {
      const val = pibValues[i];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    const bins = 30; // bins moderados
    const range = max - min;
    const binWidth = range === 0 ? 1 : range / bins;

    const histogram = Array(bins).fill(0).map((_, i) => {
      const binMin = min + i * binWidth;
      const binMax = min + (i + 1) * binWidth;
      return {
        bin: i + 1,
        count: 0,
        mid: binMin + binWidth / 2,
        min: binMin,
        max: binMax,
        range: `${formatAxisNumber(binMin)} - ${formatAxisNumber(binMax)}`
      };
    });

    pibValues.forEach(val => {
      const binIndex = range === 0 ? 0 : Math.min(Math.floor((val - min) / binWidth), bins - 1);
      histogram[binIndex].count++;
    });

    return { data: histogram, min, max };
  }, [pibData, activeTab, selectedMunicipios, municipios]);

  // Datos para Box Plot por Municipio (no afectado por filtros de municipio)
  const boxPlotData = useMemo(() => {
    if (!pibDataAll || pibDataAll.length === 0 || activeTab !== 'eda') return [];
    
    // Agrupar datos por municipio
    const groupedByMunicipio = {};
    
    for (let i = 0; i < pibDataAll.length; i++) {
      const d = pibDataAll[i];
      const municipio = (d.municipio || '').toString().trim();
      const valor = parseFloat(d.pib_mun);
      
      if (municipio && !isNaN(valor) && valor > 0) {
        if (!groupedByMunicipio[municipio]) {
          groupedByMunicipio[municipio] = [];
        }
        groupedByMunicipio[municipio].push(valor);
      }
    }
    
    // Calcular estadísticas de box plot para cada municipio
    const boxPlotStats = Object.keys(groupedByMunicipio).map(municipio => {
      const values = groupedByMunicipio[municipio].sort((a, b) => a - b);
      const n = values.length;
      
      if (n === 0) return null;
      
      const minVal = values[0];
      const maxVal = values[n - 1];
      const q1 = values[Math.floor(n * 0.25)];
      const median = values[Math.floor(n * 0.5)];
      const q3 = values[Math.floor(n * 0.75)];
      
      // Calcular IQR y detectar outliers
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      const outliers = values.filter(v => v < lowerBound || v > upperBound);
      const whiskerMin = Math.max(minVal, lowerBound);
      const whiskerMax = Math.min(maxVal, upperBound);
      
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
    }).filter(Boolean).sort((a, b) => b.median - a.median); // Ordenar por mediana descendente
    
    return boxPlotStats;
  }, [pibDataAll, activeTab]);

  const handleDateRangeChange = useCallback((range) => {
    // Normalizar clave para comparar y evitar setState repetidos
    const key = range ? `${range.startDate || ''}|${range.endDate || ''}` : '';
    if (lastRangeRef.current === key) return;
    lastRangeRef.current = key;
    setDateRange(range);
  }, []);

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
      const response = await axios.get(`${API_BASE_URL}/pib/download`, {
        params: params,
        responseType: 'blob'
      });
      
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener nombre de archivo del header Content-Disposition o usar uno por defecto
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'datos_pib.csv';
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
        <div className="loading">Cargando datos de PIB...</div>
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

  const multipleMunicipios = selectedMunicipios.length > 1;

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
        </div>
        {activeTab === 'visualizacion' && municipioData.length > 0 && (
          <div className="date-range-control">
            <DateRangeSlider 
              data={municipioData.map(item => ({ Fecha: item.fecha || item.Fecha }))} 
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
              Descargar Datos
            </button>
          </div>
        )}
      </div>

      {activeTab === 'visualizacion' && (
        <div className="charts-grid">
        <div className="chart-card">
          <h2>PIB Municipal</h2>
          <RadianzaChart 
            data={filteredMunicipioData.map(item => ({
              Fecha: item.fecha || item.Fecha,
              Municipio: item.municipio || item.Municipio,
              [SELECTED_METRICA]: item[SELECTED_METRICA]
            }))} 
            selectedMetrica={SELECTED_METRICA}
            multipleMunicipios={multipleMunicipios}
            showMarkers={showMarkers}
            loading={loadingMunicipioData}
          />
        </div>
      </div>
      )}

      {activeTab === 'eda' && (
        <div className="eda-content">
          <h2>
            Análisis Exploratorio de Datos - PIB
            {selectedMunicipios.length > 0 && selectedMunicipios.length < municipios.length && (
              <span className="municipio-filter-indicator">
                {' '}({selectedMunicipios.length} {selectedMunicipios.length === 1 ? 'municipio' : 'municipios'} seleccionado{selectedMunicipios.length === 1 ? '' : 's'})
              </span>
            )}
          </h2>
          
          <div className="chart-card">
            <h3>Distribución de PIB (Histograma)</h3>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={pibHistogramResult.data} barCategoryGap={0} margin={{ top: 10, right: 20, left: 50, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  dataKey="mid"
                  domain={[pibHistogramResult.min, pibHistogramResult.max]}
                  tickFormatter={formatAxisNumber}
                  tickCount={10}
                  tick={{ fontSize: 12 }}
                  height={40}
                  label={{ value: 'PIB Municipal', position: 'insideBottom', offset: -5 }}
                />
                <YAxis width={55} label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' } }} />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(_, payload) => {
                    const p = payload && payload[0] && payload[0].payload;
                    if (p) return `Rango: ${formatAxisNumber(p.min)} - ${formatAxisNumber(p.max)}`;
                    return '';
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Frecuencia"
                  fill={COLORS[0]}
                  fillOpacity={0.35}
                  stroke={COLORS[0]}
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Distribución de PIB Municipal por Municipio</h3>
            <p className="chart-subtitle" style={{ fontStyle: 'italic', color: '#666', marginBottom: '1rem' }}>
              (No afectado por filtros de municipio)
            </p>
            <BoxPlot 
              data={boxPlotData}
              yAxisLabel="PIB Municipal"
              height={Math.max(500, boxPlotData.length * 40)}
            />
          </div>

          {pibStats && (
            <div className="stats-card">
              <h3>Estadísticas Descriptivas</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Número de registros:</span>
                  <span className="stat-value">{pibStats.count}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Media:</span>
                  <span className="stat-value">{pibStats.mean}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Mediana:</span>
                  <span className="stat-value">{pibStats.median}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Desviación Estándar:</span>
                  <span className="stat-value">{pibStats.stdDev}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Mínimo:</span>
                  <span className="stat-value">{pibStats.min}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Máximo:</span>
                  <span className="stat-value">{pibStats.max}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Q1 (Percentil 25):</span>
                  <span className="stat-value">{pibStats.q1}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Q3 (Percentil 75):</span>
                  <span className="stat-value">{pibStats.q3}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PIBDashboard;
