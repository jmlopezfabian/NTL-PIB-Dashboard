import React, { useState, useEffect, useMemo } from 'react';
import './DateRangeSlider.css';

const DateRangeSlider = ({ data, onRangeChange }) => {
  // Extraer fechas únicas y ordenarlas
  const dates = useMemo(() => {
    if (!data || data.length === 0) return [];
    const uniqueDates = [...new Set(data.map(item => {
      const fecha = item.Fecha?.split(' ')[0] || item.Fecha;
      return fecha;
    }))].filter(Boolean).sort();
    return uniqueDates;
  }, [data]);

  const [minIndex, setMinIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(dates.length - 1);

  useEffect(() => {
    // Resetear el rango cuando cambien los datos
    if (dates.length > 0) {
      setMinIndex(0);
      setMaxIndex(dates.length - 1);
    }
  }, [dates.length]);

  useEffect(() => {
    // Notificar cambios en el rango
    if (dates.length > 0 && onRangeChange) {
      onRangeChange({
        startDate: dates[minIndex],
        endDate: dates[maxIndex]
      });
    }
  }, [minIndex, maxIndex, dates, onRangeChange]);

  const handleMinChange = (e) => {
    const newMin = parseInt(e.target.value);
    if (newMin <= maxIndex) {
      setMinIndex(newMin);
    } else {
      // Si el mínimo supera al máximo, intercambiar
      setMinIndex(maxIndex);
      setMaxIndex(newMin);
    }
  };

  const handleMaxChange = (e) => {
    const newMax = parseInt(e.target.value);
    if (newMax >= minIndex) {
      setMaxIndex(newMax);
    } else {
      // Si el máximo cae por debajo del mínimo, intercambiar
      setMaxIndex(minIndex);
      setMinIndex(newMax);
    }
  };

  if (dates.length === 0) {
    return (
      <div className="date-range-slider">
        <div className="no-dates">No hay fechas disponibles</div>
      </div>
    );
  }

  const startDate = dates[minIndex];
  const endDate = dates[maxIndex];
  const totalDates = dates.length;

  // Calcular porcentajes para el rango seleccionado
  const divisor = totalDates > 1 ? totalDates - 1 : 1;
  const minPercent = (minIndex / divisor) * 100;
  const maxPercent = (maxIndex / divisor) * 100;

  return (
    <div className="date-range-slider">
      <label className="slider-label">Rango de Fechas</label>
      <div className="slider-container">
        <div className="slider-wrapper">
          {/* Barra de fondo con el rango seleccionado */}
          <div className="slider-track">
            <div 
              className="slider-range"
              style={{
                left: `${minPercent}%`,
                width: `${maxPercent - minPercent}%`
              }}
            />
          </div>
          
          {/* Sliders superpuestos */}
          <input
            type="range"
            min="0"
            max={totalDates - 1}
            value={minIndex}
            onChange={handleMinChange}
            className="slider slider-min"
          />
          <input
            type="range"
            min="0"
            max={totalDates - 1}
            value={maxIndex}
            onChange={handleMaxChange}
            className="slider slider-max"
          />
        </div>
        <div className="slider-info">
          <div className="date-display">
            <span className="date-label">Desde:</span>
            <span className="date-value">{startDate}</span>
          </div>
          <div className="date-display">
            <span className="date-label">Hasta:</span>
            <span className="date-value">{endDate}</span>
          </div>
          <div className="date-count">
            {maxIndex - minIndex + 1} de {totalDates} fechas
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeSlider;

