import React from 'react';
import './MetricaSelector.css';

const METRICAS = [
  { value: 'Media_de_radianza', label: 'Media de Radianza' },
  { value: 'Maximo_de_radianza', label: 'Máximo de Radianza' },
  { value: 'Minimo_de_radianza', label: 'Mínimo de Radianza' },
  { value: 'Suma_de_radianza', label: 'Suma de Radianza' },
  { value: 'Desviacion_estandar_de_radianza', label: 'Desviación Estándar' },
  { value: 'Percentil_25_de_radianza', label: 'Percentil 25' },
  { value: 'Percentil_50_de_radianza', label: 'Percentil 50 (Mediana)' },
  { value: 'Percentil_75_de_radianza', label: 'Percentil 75' },
  { value: 'Cantidad_de_pixeles', label: 'Cantidad de Píxeles' }
];

const MetricaSelector = ({ selectedMetrica, onSelectMetrica }) => {
  return (
    <div className="metrica-selector">
      <label htmlFor="metrica-select">Seleccionar Métrica:</label>
      <select
        id="metrica-select"
        value={selectedMetrica}
        onChange={(e) => onSelectMetrica(e.target.value)}
        className="select-input"
      >
        {METRICAS.map((metrica) => (
          <option key={metrica.value} value={metrica.value}>
            {metrica.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MetricaSelector;
export { METRICAS };

