import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Paleta de colores oscuros y vibrantes para mejor visibilidad en fondo claro
const COLORS = [
  '#667eea',  // Azul morado (original)
  '#764ba2',  // Morado (original)
  '#e74c3c',  // Rojo
  '#2ecc71',  // Verde
  '#f39c12',  // Naranja
  '#3498db',  // Azul
  '#9b59b6',  // Morado oscuro
  '#e67e22',  // Naranja oscuro
  '#1abc9c',  // Turquesa
  '#c0392b',  // Rojo oscuro
  '#16a085',  // Verde esmeralda
  '#d35400',  // Naranja rojizo
  '#2980b9',  // Azul oscuro
  '#8e44ad',  // Púrpura
  '#27ae60'   // Verde oscuro
];

const RadianzaChart = ({ 
  data, 
  selectedMetrica = 'Media_de_radianza', 
  multipleMunicipios = false,
  showMarkers = true
}) => {
  // Obtener el nombre de la métrica para mostrar
  const getMetricaLabel = (key) => {
    const labels = {
      'Media_de_radianza': 'Media de Radianza',
      'Maximo_de_radianza': 'Máximo de Radianza',
      'Minimo_de_radianza': 'Mínimo de Radianza',
      'Suma_de_radianza': 'Suma de Radianza',
      'Desviacion_estandar_de_radianza': 'Desviación Estándar',
      'Percentil_25_de_radianza': 'Percentil 25',
      'Percentil_50_de_radianza': 'Percentil 50 (Mediana)',
      'Percentil_75_de_radianza': 'Percentil 75',
      'Cantidad_de_pixeles': 'Cantidad de Píxeles'
    };
    return labels[key] || key;
  };

  // Preparar datos para el gráfico (hooks deben ir antes del return condicional)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    if (multipleMunicipios) {
      // Agrupar por fecha y municipio
      const groupedByDate = {};
      
      data.forEach(item => {
        const fecha = item.Fecha?.split(' ')[0] || item.Fecha;
        const municipio = item.Municipio || item.municipio;
        const valor = parseFloat(item[selectedMetrica]);
        
        if (!groupedByDate[fecha]) {
          groupedByDate[fecha] = { fecha };
        }
        
        // Usar null si el valor no es válido (en lugar de 0)
        groupedByDate[fecha][municipio] = (valor !== null && !isNaN(valor)) ? valor : null;
      });
      
      return Object.values(groupedByDate).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    } else {
      // Modo simple: un solo municipio
      return data
    .map(item => {
      const fecha = item.Fecha?.split(' ')[0] || item.Fecha;
      const valor = parseFloat(item[selectedMetrica]);
      return {
        fecha: fecha,
        // Usar null si el valor no es válido (en lugar de 0)
        valor: (valor !== null && !isNaN(valor)) ? valor : null
      };
    })
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }
  }, [data, selectedMetrica, multipleMunicipios]);

  // Obtener lista de municipios únicos si hay múltiples
  const municipios = useMemo(() => {
    if (!multipleMunicipios || !data || data.length === 0) return [];
    const unique = [...new Set(data.map(item => item.Municipio || item.municipio))].filter(Boolean);
    return unique;
  }, [data, multipleMunicipios]);

  // Verificar datos después de los hooks
  if (!data || data.length === 0 || chartData.length === 0) {
    return <div className="no-data">No hay datos disponibles</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="fecha" 
          angle={-45}
          textAnchor="end"
          height={80}
          interval="preserveStartEnd"
          stroke="#666"
          tick={{ fill: '#666', fontSize: 12 }}
        />
        <YAxis 
          label={{ 
            value: getMetricaLabel(selectedMetrica), 
            angle: -90, 
            position: 'left',
            offset: 10,
            style: { textAnchor: 'middle', fill: '#2a2a2a' }
          }}
          stroke="#666"
          tick={{ fill: '#666', fontSize: 12 }}
        />
        <Tooltip 
          formatter={(value) => value?.toFixed(2) || 'N/A'}
          labelFormatter={(label) => `Fecha: ${label}`}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            color: '#2a2a2a',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
          labelStyle={{ color: '#2a2a2a' }}
        />
        <Legend 
          wrapperStyle={{ color: '#2a2a2a' }}
        />
        {multipleMunicipios && municipios.length > 0 ? (
          municipios.map((municipio, index) => (
            <Line
              key={municipio}
              type="monotone"
              dataKey={municipio}
              stroke={COLORS[index % COLORS.length]}
              name={municipio}
              strokeWidth={2}
              dot={showMarkers ? { r: 2 } : false}
              activeDot={showMarkers ? { r: 4 } : false}
              connectNulls={true}
            />
          ))
        ) : (
        <Line 
          type="monotone" 
          dataKey="valor" 
            stroke="#667eea" 
          name={getMetricaLabel(selectedMetrica)}
          strokeWidth={2}
            dot={showMarkers ? { r: 2, fill: '#667eea' } : false}
            activeDot={showMarkers ? { r: 4, fill: '#764ba2' } : false}
          connectNulls={true}
        />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RadianzaChart;

