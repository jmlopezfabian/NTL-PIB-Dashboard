import React, { useMemo } from 'react';
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

const ComparacionMunicipios = ({ data, selectedMetrica = 'Media_de_radianza', preAggregated = false }) => {
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

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (preAggregated) {
      // data: [{Municipio, promedio}] o {municipio, promedio}
      return data.map(item => ({
        municipio: item.municipio || item.Municipio,
        promedio: Number(item.promedio) || 0
      }));
    }
    // Modo anterior: calcular en el cliente (menos eficiente)
    const municipioStats = {};
    data.forEach(item => {
      const municipio = item.Municipio;
      if (!municipioStats[municipio]) {
        municipioStats[municipio] = { municipio, total: 0, count: 0 };
      }
      const valor = parseFloat(item[selectedMetrica]) || 0;
      municipioStats[municipio].total += valor;
      municipioStats[municipio].count += 1;
    });
    return Object.values(municipioStats)
      .map(stat => ({ municipio: stat.municipio, promedio: stat.count > 0 ? (stat.total / stat.count) : 0 }))
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, 10);
  }, [data, selectedMetrica, preAggregated]);

  if (chartData.length === 0) {
    return <div className="no-data">No hay datos disponibles</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart 
        data={chartData} 
        margin={{ top: 5, right: 30, left: 60, bottom: 60 }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
          dataKey="municipio" 
          angle={-45}
          textAnchor="end"
          height={100}
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
          formatter={(value) => value.toFixed(2)}
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            color: '#2a2a2a',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
          labelStyle={{ color: '#2a2a2a' }}
          cursor={false}
        />
        <Legend 
          wrapperStyle={{ color: '#2a2a2a' }}
        />
        <Bar 
          dataKey="promedio" 
          fill="#667eea" 
          name={`Promedio - ${getMetricaLabel(selectedMetrica)}`}
          activeBar={{
            fill: '#7c8ee8',
            stroke: 'none',
            strokeWidth: 0,
            opacity: 1
          }}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ComparacionMunicipios;

