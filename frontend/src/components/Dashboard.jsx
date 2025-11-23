import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './Dashboard.css';
import MultiMunicipioSelector from './MultiMunicipioSelector';
import MultiMetricaSelector from './MultiMetricaSelector';
import RadianzaChart from './RadianzaChart';
import ComparacionMunicipios from './ComparacionMunicipios';
import DateRangeSlider from './DateRangeSlider';
import YearSelector from './YearSelector';
import { METRICAS } from './MetricaSelector';

// Usar /api en producción o variable de entorno (adaptado para Vite)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const Dashboard = () => {
  const [municipios, setMunicipios] = useState([]);
  const [selectedMunicipios, setSelectedMunicipios] = useState([]);
  const [selectedMetricas, setSelectedMetricas] = useState(['Media_de_radianza']);
  const [municipioData, setMunicipioData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [showMarkers, setShowMarkers] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedMunicipios.length > 0) {
      loadMultipleMunicipioData(selectedMunicipios, selectedYear);
    }
  }, [selectedMunicipios, selectedYear]);

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
    }
  };

  const loadComparison = async (metric, year = null) => {
    try {
      const params = { metric, top: 10 };
      if (year) {
        params.year = year;
      }
      const response = await axios.get(`${API_BASE_URL}/comparison`, { params });
      if (response.data.success) setComparisonData(response.data.data);
    } catch (err) {
      console.error('Error al cargar comparación:', err);
    }
  };

  useEffect(() => {
    if (selectedMetricas.length > 0) {
      loadComparison(selectedMetricas[0], selectedYear);
    }
  }, [selectedMetricas, selectedYear]);

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

  const handleDateRangeChange = (range) => {
    setDateRange(range);
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
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
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

  // Determinar si usar facetas (múltiples métricas)
  const useFacets = selectedMetricas.length > 1;
  const multipleMunicipios = selectedMunicipios.length > 1;

  return (
    <div className="dashboard-container">
      <div className="dashboard-controls">
        <div className="controls-row">
          <MultiMunicipioSelector
            municipios={municipios}
            selectedMunicipios={selectedMunicipios}
            onSelectMunicipios={setSelectedMunicipios}
          />
          <MultiMetricaSelector
            selectedMetricas={selectedMetricas}
            onSelectMetricas={setSelectedMetricas}
          />
          <YearSelector
            years={years}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
          />
        </div>
        {municipioData.length > 0 && (
          <div className="date-range-control">
            <DateRangeSlider 
              data={municipioData} 
              onRangeChange={handleDateRangeChange}
            />
          </div>
        )}
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
      </div>

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
            />
          </div>
        )}

        <div className="chart-card">
          <h2>Comparación de Municipios</h2>
          <p className="chart-subtitle">
            {METRICAS.find(m => m.value === selectedMetricas[0])?.label || selectedMetricas[0]}
          </p>
          <ComparacionMunicipios data={comparisonData} selectedMetrica={selectedMetricas[0]} preAggregated />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

