import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './Dashboard.css';
import MultiMunicipioSelector from './MultiMunicipioSelector';
import DateRangeSlider from './DateRangeSlider';
import RadianzaChart from './RadianzaChart';

// Usar /api en producción o variable de entorno (adaptado para Vite)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Métrica fija: solo PIB Municipal
const SELECTED_METRICA = 'pib_mun';

const PIBDashboard = () => {
  const [municipios, setMunicipios] = useState([]);
  const [selectedMunicipios, setSelectedMunicipios] = useState([]);
  const [municipioData, setMunicipioData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [showMarkers, setShowMarkers] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedMunicipios.length > 0) {
      loadMultipleMunicipioData(selectedMunicipios);
    }
  }, [selectedMunicipios]);

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

  const loadMultipleMunicipioData = async (municipiosList) => {
    try {
      // Cargar todos los años (sin filtro)
      const promises = municipiosList.map(municipio => {
        return axios.get(`${API_BASE_URL}/pib/municipio/${encodeURIComponent(municipio)}`);
      });
      
      const responses = await Promise.all(promises);
      const allData = responses
        .filter(res => res.data.success)
        .flatMap(res => res.data.data.map(item => ({
          ...item,
          Fecha: item.fecha, // Normalizar nombre de columna para el gráfico
          Municipio: item.municipio,
          [SELECTED_METRICA]: item[SELECTED_METRICA] // Asegurar que la métrica esté disponible
        })));
      
      setMunicipioData(allData);
    } catch (err) {
      console.error('Error al cargar datos de municipios:', err);
    }
  };

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
      <div className="dashboard-controls">
        <div className="controls-row">
          <MultiMunicipioSelector
            municipios={municipios}
            selectedMunicipios={selectedMunicipios}
            onSelectMunicipios={setSelectedMunicipios}
          />
        </div>
        {municipioData.length > 0 && (
          <div className="date-range-control">
            <DateRangeSlider 
              data={municipioData.map(item => ({ Fecha: item.fecha || item.Fecha }))} 
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
        <div className="chart-card">
          <h2>PIB Municipal</h2>
          {multipleMunicipios && (
            <p className="chart-subtitle">
              Municipios: {selectedMunicipios.join(', ')}
            </p>
          )}
          <RadianzaChart 
            data={filteredMunicipioData.map(item => ({
              Fecha: item.fecha || item.Fecha,
              Municipio: item.municipio || item.Municipio,
              [SELECTED_METRICA]: item[SELECTED_METRICA]
            }))} 
            selectedMetrica={SELECTED_METRICA}
            multipleMunicipios={multipleMunicipios}
            showMarkers={showMarkers}
          />
        </div>
      </div>
    </div>
  );
};

export default PIBDashboard;

