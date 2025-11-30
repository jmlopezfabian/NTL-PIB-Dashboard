import React, { useState } from 'react';
import { ResponsiveContainer } from 'recharts';

const BoxPlot = ({ data, yAxisLabel, height = 500 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="no-data">No hay datos disponibles</div>;
  }

  // Calcular dimensiones
  const margin = { top: 30, right: 40, bottom: 70, left: 140 };
  const chartHeight = Math.max(height, data.length * 50);
  const chartWidth = 900;
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;
  
  // Encontrar el rango de valores
  const allValues = data.flatMap(d => [d.min, d.max, ...(d.outliers || [])]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue || 1;
  
  // Función para convertir valor a posición X
  const valueToX = (value) => ((value - minValue) / valueRange) * plotWidth;
  
  // Altura de cada box (más grande)
  const boxHeight = Math.min(40, plotHeight / data.length * 0.7);
  const spacing = plotHeight / data.length;
  
  // Colores para cada municipio (gradiente)
  const getBoxColor = (index) => {
    const colors = [
      '#667eea', '#764ba2', '#e74c3c', '#2ecc71', '#f39c12',
      '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#c0392b'
    ];
    return colors[index % colors.length];
  };

  const handleMouseEnter = (e, index) => {
    setHoveredIndex(index);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
        {/* Eje Y con nombres de municipios */}
        {data.map((d, i) => {
          const y = margin.top + (i + 0.5) * spacing;
          const isHovered = hoveredIndex === i;
          return (
            <text
              key={`label-${i}`}
              x={margin.left - 15}
              y={y}
              textAnchor="end"
              fontSize={isHovered ? "13" : "12"}
              fill={isHovered ? "#667eea" : "#2a2a2a"}
              fontWeight={isHovered ? "600" : "500"}
              alignmentBaseline="middle"
              style={{ transition: 'all 0.2s' }}
            >
              {d.municipio}
            </text>
          );
        })}

        {/* Grid lines de fondo */}
        {[0, 0.25, 0.5, 0.75, 1].map(tick => {
          const x = margin.left + tick * plotWidth;
          return (
            <line
              key={`grid-${tick}`}
              x1={x}
              y1={margin.top}
              x2={x}
              y2={margin.top + plotHeight}
              stroke="#e0e0e0"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          );
        })}

        {/* Eje X */}
        <line
          x1={margin.left}
          y1={margin.top + plotHeight}
          x2={margin.left + plotWidth}
          y2={margin.top + plotHeight}
          stroke="#2a2a2a"
          strokeWidth="2.5"
        />

        {/* Ticks del eje X */}
        {[0, 0.25, 0.5, 0.75, 1].map(tick => {
          const value = minValue + tick * valueRange;
          const x = margin.left + tick * plotWidth;
          return (
            <g key={`tick-${tick}`}>
              <line
                x1={x}
                y1={margin.top + plotHeight}
                x2={x}
                y2={margin.top + plotHeight + 6}
                stroke="#2a2a2a"
                strokeWidth="2"
              />
              <text
                x={x}
                y={margin.top + plotHeight + 25}
                textAnchor="middle"
                fontSize="11"
                fill="#666"
                fontWeight="500"
              >
                {value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </text>
            </g>
          );
        })}

        {/* Label del eje X */}
        <text
          x={margin.left + plotWidth / 2}
          y={chartHeight - 15}
          textAnchor="middle"
          fontSize="13"
          fill="#2a2a2a"
          fontWeight="600"
        >
          {yAxisLabel}
        </text>

        {/* Box plots */}
        {data.map((d, i) => {
          const y = margin.top + (i + 0.5) * spacing;
          const boxY = y - boxHeight / 2;
          
          const xMin = margin.left + valueToX(d.min);
          const xQ1 = margin.left + valueToX(d.q1);
          const xMedian = margin.left + valueToX(d.median);
          const xQ3 = margin.left + valueToX(d.q3);
          const xMax = margin.left + valueToX(d.max);
          const boxWidth = xQ3 - xQ1;
          
          const isHovered = hoveredIndex === i;
          const boxColor = getBoxColor(i);
          const boxColorDark = isHovered ? boxColor : boxColor;

          return (
            <g 
              key={`box-${i}`}
              onMouseEnter={(e) => handleMouseEnter(e, i)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: 'pointer' }}
              opacity={isHovered ? 1 : hoveredIndex !== null ? 0.4 : 1}
            >
              {/* Whisker inferior (línea vertical desde min hasta Q1) */}
              <line
                x1={xMin}
                y1={y}
                x2={xMin}
                y2={boxY}
                stroke="#2a2a2a"
                strokeWidth={isHovered ? "2.5" : "2"}
                opacity={isHovered ? 1 : 0.7}
              />
              <line
                x1={xMin - 6}
                y1={y}
                x2={xMin + 6}
                y2={y}
                stroke="#2a2a2a"
                strokeWidth={isHovered ? "2.5" : "2"}
                opacity={isHovered ? 1 : 0.7}
              />

              {/* Caja (Q1 a Q3) con gradiente y sombra */}
              <defs>
                <linearGradient id={`gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={boxColorDark} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={boxColorDark} stopOpacity="0.6" />
                </linearGradient>
                <filter id={`shadow-${i}`}>
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>
              
              <rect
                x={xQ1}
                y={boxY}
                width={boxWidth}
                height={boxHeight}
                fill={`url(#gradient-${i})`}
                stroke={boxColorDark}
                strokeWidth={isHovered ? "2.5" : "2"}
                rx="4"
                ry="4"
                filter={isHovered ? `url(#shadow-${i})` : undefined}
                style={{ transition: 'all 0.2s' }}
              />

              {/* Línea de mediana más destacada */}
              <line
                x1={xMedian}
                y1={boxY}
                x2={xMedian}
                y2={boxY + boxHeight}
                stroke="#ffffff"
                strokeWidth={isHovered ? "3" : "2.5"}
                strokeLinecap="round"
              />

              {/* Whisker superior (línea vertical desde Q3 hasta max) */}
              <line
                x1={xMax}
                y1={y}
                x2={xMax}
                y2={boxY}
                stroke="#2a2a2a"
                strokeWidth={isHovered ? "2.5" : "2"}
                opacity={isHovered ? 1 : 0.7}
              />
              <line
                x1={xMax - 6}
                y1={y}
                x2={xMax + 6}
                y2={y}
                stroke="#2a2a2a"
                strokeWidth={isHovered ? "2.5" : "2"}
                opacity={isHovered ? 1 : 0.7}
              />

              {/* Outliers más visibles */}
              {d.outliers && d.outliers.map((outlier, oIdx) => {
                const xOutlier = margin.left + valueToX(outlier);
                return (
                  <circle
                    key={`outlier-${i}-${oIdx}`}
                    cx={xOutlier}
                    cy={y}
                    r={isHovered ? "4" : "3.5"}
                    fill="#e74c3c"
                    stroke="#c0392b"
                    strokeWidth={isHovered ? "1.5" : "1"}
                    opacity={isHovered ? 1 : 0.8}
                  />
                );
              })}
            </g>
          );
        })}
        </svg>
      </ResponsiveContainer>
      
      {/* Tooltip mejorado */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y + 15}px`,
            backgroundColor: '#ffffff',
            border: `2px solid ${getBoxColor(hoveredIndex)}`,
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: 1000,
            pointerEvents: 'none',
            fontSize: '12px',
            minWidth: '200px',
            transition: 'all 0.2s'
          }}
        >
          <p style={{ 
            margin: 0, 
            fontWeight: 'bold', 
            fontSize: '15px',
            color: getBoxColor(hoveredIndex),
            borderBottom: `2px solid ${getBoxColor(hoveredIndex)}`,
            paddingBottom: '8px',
            marginBottom: '10px'
          }}>
            {data[hoveredIndex].municipio}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Mínimo:</p>
            <p style={{ margin: 0, fontWeight: '600', textAlign: 'right' }}>
              {data[hoveredIndex].min?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Q1:</p>
            <p style={{ margin: 0, fontWeight: '600', textAlign: 'right' }}>
              {data[hoveredIndex].q1?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#666', fontWeight: 'bold' }}>Mediana:</p>
            <p style={{ margin: 0, fontWeight: 'bold', textAlign: 'right', color: getBoxColor(hoveredIndex) }}>
              {data[hoveredIndex].median?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Q3:</p>
            <p style={{ margin: 0, fontWeight: '600', textAlign: 'right' }}>
              {data[hoveredIndex].q3?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Máximo:</p>
            <p style={{ margin: 0, fontWeight: '600', textAlign: 'right' }}>
              {data[hoveredIndex].max?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
          </div>
          {data[hoveredIndex].outliers && data[hoveredIndex].outliers.length > 0 && (
            <p style={{ 
              margin: '10px 0 0 0', 
              color: '#e74c3c',
              fontWeight: '600',
              fontSize: '11px',
              paddingTop: '8px',
              borderTop: '1px solid #eee'
            }}>
              ⚠ Outliers: {data[hoveredIndex].outliers.length}
            </p>
          )}
          <p style={{ 
            margin: '8px 0 0 0', 
            fontSize: '11px', 
            color: '#999',
            fontStyle: 'italic',
            textAlign: 'center',
            paddingTop: '8px',
            borderTop: '1px solid #eee'
          }}>
            N = {data[hoveredIndex].count} registros
          </p>
        </div>
      )}
    </div>
  );
};

export default BoxPlot;

