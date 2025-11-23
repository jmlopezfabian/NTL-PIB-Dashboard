import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './Dashboard.css';
import MultiMunicipioSelector from './MultiMunicipioSelector';
import DateRangeSlider from './DateRangeSlider';
import YearSelector from './YearSelector';
import RadianzaChart from './RadianzaChart';
import ComparacionMunicipios from './ComparacionMunicipios';

// Usar /api en producción o variable de entorno (adaptado para Vite)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const PIB_METRICAS = [
  { value: 'pib_mun', label: 'PIB Municipal' },
  { value: 'pibe', label: 'PIB Estatal' },
  { value: 'porc_pob', label: 'Porcentaje de Población' }
];

const PIBDashboard = () => {
  const [municipios, setMunicipios] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [selectedMunicipios, setSelectedMunicipios] = useState([]);
  const [selectedEntidad, setSelectedEntidad] = useState(null);
  const [selectedMetrica, setSelectedMetrica] = useState('pib_mun');
  const [municipioData, setMunicipioData] = useState([]);
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
      
      try {
        await axios.get(`${API_BASE_URL}/health`);
      } catch (healthErr) {
        setError('El backend no está disponible. Asegúrate de que esté ejecutándose en http://localhost:5000');
        setLoading(false);
        return;
      }

      const [municipiosRes, entidadesRes, yearsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/pib/municipios`),
        axios.get(`${API_BASE_URL}/pib/entidades`),
        axios.get(`${API_BASE_URL}/pib/years`)
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

      if (entidadesRes.data.success) {
        setEntidades(entidadesRes.data.entidades);
      }

      if (yearsRes.data.success) {
        setYears(yearsRes.data.years);
        if (yearsRes.data.years.length > 0) {
          setSelectedYear(yearsRes.data.years[0]);
        }
      }

    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError(`Error al cargar los datos: ${errorMessage}`);
      console.error('Error completo:', err);
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
        return axios.get(`${API_BASE_URL}/pib/municipio/${encodeURIComponent(municipio)}`, { params });
      });
      
      const responses = await Promise.all(promises);
      const allData = responses
        .filter(res => res.data.success)
        .flatMap(res => res.data.data.map(item => ({
          ...item,
          Fecha: item.fecha, // Normalizar nombre de columna para el gráfico
          Municipio: item.municipio,
          [selectedMetrica]: item[selectedMetrica] // Asegurar que la métrica esté disponible
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
          <div className="metrica-selector" style={{background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)'}}>
            <label htmlFor="pib-metrica-select">Métrica:</label>
            <select
              id="pib-metrica-select"
              value={selectedMetrica}
              onChange={(e) => setSelectedMetrica(e.target.value)}
              className="select-input"
              style={{background: '#fafafa', color: '#2a2a2a', border: '2px solid rgba(0,0,0,0.1)'}}
            >
              {PIB_METRICAS.map((metrica) => (
                <option key={metrica.value} value={metrica.value}>
                  {metrica.label}
                </option>
              ))}
            </select>
          </div>
          <YearSelector
            years={years}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
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
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>{PIB_METRICAS.find(m => m.value === selectedMetrica)?.label || selectedMetrica}</h2>
          {multipleMunicipios && (
            <p className="chart-subtitle">
              Municipios: {selectedMunicipios.join(', ')}
            </p>
          )}
          <RadianzaChart 
            data={filteredMunicipioData.map(item => ({
              Fecha: item.fecha || item.Fecha,
              Municipio: item.municipio || item.Municipio,
              [selectedMetrica]: item[selectedMetrica]
            }))} 
            selectedMetrica={selectedMetrica}
            multipleMunicipios={multipleMunicipios}
            showMarkers={showMarkers}
          />
        </div>
      </div>
    </div>
  );
};

export default PIBDashboard;

