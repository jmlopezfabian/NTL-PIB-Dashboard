import React, { useState, useRef, useEffect } from 'react';
import './MultiMunicipioSelector.css';

const MultiMunicipioSelector = ({ municipios, selectedMunicipios, onSelectMunicipios }) => {
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

  const handleToggle = (municipio, e) => {
    e.stopPropagation();
    if (selectedMunicipios.includes(municipio)) {
      onSelectMunicipios(selectedMunicipios.filter(m => m !== municipio));
    } else {
      onSelectMunicipios([...selectedMunicipios, municipio]);
    }
  };

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedMunicipios.length === municipios.length) {
      onSelectMunicipios([]);
    } else {
      onSelectMunicipios([...municipios]);
    }
  };

  const getDisplayText = () => {
    if (selectedMunicipios.length === 0) {
      return 'Seleccionar Municipios...';
    }
    if (selectedMunicipios.length === 1) {
      return selectedMunicipios[0];
    }
    if (selectedMunicipios.length === municipios.length) {
      return 'Todos los municipios';
    }
    return `${selectedMunicipios.length} municipios seleccionados`;
  };

  return (
    <div className="multi-municipio-selector" ref={dropdownRef}>
      <label>Seleccionar Municipios (múltiple):</label>
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
                  checked={selectedMunicipios.length === municipios.length}
                  onChange={handleSelectAll}
                />
                <span>Seleccionar todos</span>
              </label>
            </div>
            <div className="dropdown-list">
              {municipios.map((municipio) => (
                <label key={municipio} className="dropdown-option">
                  <input
                    type="checkbox"
                    checked={selectedMunicipios.includes(municipio)}
                    onChange={(e) => handleToggle(municipio, e)}
                  />
                  <span>{municipio}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiMunicipioSelector;

