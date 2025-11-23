import React, { useState, useRef, useEffect } from 'react';
import { METRICAS } from './MetricaSelector';
import './MultiMetricaSelector.css';

const MultiMetricaSelector = ({ selectedMetricas, onSelectMetricas }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (metrica, e) => {
    e.stopPropagation();
    if (selectedMetricas.includes(metrica)) {
      onSelectMetricas(selectedMetricas.filter(m => m !== metrica));
    } else {
      onSelectMetricas([...selectedMetricas, metrica]);
    }
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedMetricas.length === METRICAS.length) {
      onSelectMetricas([]);
    } else {
      onSelectMetricas(METRICAS.map(m => m.value));
    }
  };

  const getDisplayText = () => {
    if (selectedMetricas.length === 0) {
      return 'Seleccionar Métricas...';
    }
    if (selectedMetricas.length === 1) {
      return METRICAS.find(m => m.value === selectedMetricas[0])?.label || selectedMetricas[0];
    }
    if (selectedMetricas.length === METRICAS.length) {
      return 'Todas las métricas';
    }
    return `${selectedMetricas.length} métricas seleccionadas`;
  };

  return (
    <div className="multi-metrica-selector" ref={dropdownRef}>
      <label>Seleccionar Métricas (múltiple):</label>
      <div className="dropdown-container">
        <button
          type="button"
          className="dropdown-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{getDisplayText()}</span>
          <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
        </button>
        {isOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-header">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMetricas.length === METRICAS.length}
                  onChange={handleSelectAll}
                />
                <span>Seleccionar todas</span>
              </label>
            </div>
            <div className="dropdown-list">
              {METRICAS.map((metrica) => (
                <label key={metrica.value} className="dropdown-option">
                  <input
                    type="checkbox"
                    checked={selectedMetricas.includes(metrica.value)}
                    onChange={(e) => handleToggle(metrica.value, e)}
                  />
                  <span>{metrica.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiMetricaSelector;

