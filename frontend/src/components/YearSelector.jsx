import React from 'react';
import './YearSelector.css';

const YearSelector = ({ years, selectedYear, onSelectYear }) => {
  if (!years || years.length === 0) {
    return <div className="year-selector-loading">Cargando años...</div>;
  }

  return (
    <div className="year-selector">
      <label htmlFor="year-select" className="year-selector-label">
        Año:
      </label>
      <select
        id="year-select"
        className="year-selector-select"
        value={selectedYear || ''}
        onChange={(e) => onSelectYear(e.target.value ? parseInt(e.target.value) : null)}
      >
        <option value="">Todos los años</option>
        {years.map(year => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

export default YearSelector;

