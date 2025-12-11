import React, { useState } from 'react';
import { ResponsiveContainer } from 'recharts';

const BoxPlot = ({ data, yAxisLabel, height = 500 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="no-data">No hay datos disponibles</div>;
  }

  // Calcular dimensiones - estilo horizontal profesional
  const margin = { top: 50, right: 60, bottom: 70, left: 150 };
  const chartHeight = Math.max(height, data.length * 55);
  // Ajustar ancho según viewport para evitar corte en móviles
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1100;
  const chartWidth = Math.max(650, Math.min(1100, viewportWidth - 32));
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;
  
  // Encontrar el rango de valores
  const allValues = data.flatMap(d => [d.min, d.max, ...(d.outliers || [])]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  // Calcular un máximo ajustado - usar el máximo real sin padding extra
  // Solo un pequeño padding mínimo (2%) para que los outliers no toquen el borde
  const padding = Math.max((maxValue - minValue) * 0.02, maxValue * 0.01);
  const adjustedMax = maxValue + padding;
  const adjustedMin = Math.max(0, minValue - padding * 0.3); // Muy poco padding a la izquierda
  const valueRange = adjustedMax - adjustedMin || 1;
  
  // Función para convertir valor a posición X
  const valueToX = (value) => {
    const x = margin.left + ((value - adjustedMin) / valueRange) * plotWidth;
    // Asegurar que no exceda el ancho del plot
    return Math.min(x, margin.left + plotWidth);
  };
  
  // Altura de cada box (más espaciosa)
  const boxHeight = Math.min(32, plotHeight / data.length * 0.6);
  const spacing = plotHeight / data.length;
  
  // Colores suaves y profesionales como en la imagen
  const getBoxColor = (index) => {
    const colors = [
      '#6BA3D8', // Azul claro
      '#7BC8A4', // Verde menta
      '#FF9F9F', // Rosa suave
      '#FFB366', // Naranja claro
      '#B19CD9', // Lavanda
      '#4ECDC4', // Turquesa
      '#FFE66D', // Amarillo claro
      '#FF8C94', // Coral suave
      '#95C5E8', // Azul cielo
      '#A8E6CF'  // Verde agua
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

  // Calcular ticks del eje X con valores redondeados y legibles
  const getXTicks = () => {
 
    const niceNumber = (range, count) => {
      const rawStep = range / count;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const normalizedStep = rawStep / magnitude;
      
      let niceStep;
      if (normalizedStep <= 1) niceStep = 1;
      else if (normalizedStep <= 2) niceStep = 2;
      else if (normalizedStep <= 5) niceStep = 5;
      else niceStep = 10;
      
      return niceStep * magnitude;
    };
    
    const numTicks = 10; // Aumentado de 5 a 10 para más ticks
    const step = niceNumber(valueRange, numTicks);
    
    // Redondear min y max a múltiplos del step, usando los valores ajustados
    const niceMin = Math.floor(adjustedMin / step) * step;
    // Calcular el máximo de ticks basado en el maxValue real, no en adjustedMax
    // Esto evita que el último tick esté muy lejos del último dato
    let niceMax = Math.ceil(maxValue / step) * step;
    
    // Si el niceMax está demasiado lejos del maxValue, usar el step anterior
    if (niceMax > maxValue * 1.15) {
      niceMax = Math.floor(maxValue / step) * step;
      // Si eso resulta en un valor menor que maxValue, usar el siguiente step
      if (niceMax < maxValue) {
        niceMax = Math.ceil(maxValue / step) * step;
      }
    }
    
    // Asegurar que niceMax no exceda adjustedMax
    niceMax = Math.min(niceMax, adjustedMax);
    
    // Generar ticks
    const ticks = [];
    for (let value = niceMin; value <= niceMax; value += step) {
      // Solo agregar ticks que no excedan el maxValue real por mucho
      if (value <= maxValue * 1.1) {
        ticks.push(value);
      }
    }
    
    return ticks;
  };

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
          {/* Grid lines verticales sutiles */}
          {getXTicks().map((value, idx) => {
            const x = valueToX(value);
            return (
              <line
                key={`grid-${idx}`}
                x1={x}
                y1={margin.top}
                x2={x}
                y2={margin.top + plotHeight}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
            );
          })}

          {/* Líneas horizontales sutiles entre municipios */}
          {data.map((_, i) => {
            const y = margin.top + (i + 1) * spacing;
            return (
              <line
                key={`hgrid-${i}`}
                x1={margin.left}
                y1={y}
                x2={margin.left + plotWidth}
                y2={y}
                stroke="#f8f8f8"
                strokeWidth="1"
              />
            );
          })}

          {/* Eje Y con nombres de municipios - mejor tipografía */}
          {data.map((d, i) => {
            const y = margin.top + (i + 0.5) * spacing;
            const isHovered = hoveredIndex === i;
            return (
              <text
                key={`label-${i}`}
                x={margin.left - 25}
                y={y}
                textAnchor="end"
                fontSize="13"
                fill={isHovered ? "#1a1a1a" : "#4a4a4a"}
                fontWeight={isHovered ? "600" : "500"}
                alignmentBaseline="middle"
                style={{ 
                  transition: 'all 0.2s ease',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {d.municipio}
              </text>
            );
          })}

          {/* Eje X principal - terminar en el valor máximo real para evitar espacio muerto */}
          <line
            x1={margin.left}
            y1={margin.top + plotHeight}
            x2={valueToX(maxValue)}
            y2={margin.top + plotHeight}
            stroke="#2a2a2a"
            strokeWidth="2.5"
          />

          {/* Ticks del eje X */}
          {getXTicks().map((value, idx, array) => {
            const x = valueToX(value);
            // Formatear el valor de manera más legible
            const formatValue = (val) => {
              if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
              if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
              // Si el valor es un entero, mostrarlo sin decimales
              if (val % 1 === 0) return val.toLocaleString('es-MX', { maximumFractionDigits: 0 });
              // Si tiene decimales, mostrar máximo 1 decimal
              return val.toLocaleString('es-MX', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
            };
            
            // Verificar si el valor formateado es el mismo que el anterior para evitar duplicados
            const formattedValue = formatValue(value);
            const prevFormattedValue = idx > 0 ? formatValue(array[idx - 1]) : null;
            
            // Si el valor formateado es igual al anterior, no mostrar el texto
            if (formattedValue === prevFormattedValue) {
              return (
                <g key={`tick-${idx}`}>
                  <line
                    x1={x}
                    y1={margin.top + plotHeight}
                    x2={x}
                    y2={margin.top + plotHeight + 6}
                    stroke="#2a2a2a"
                    strokeWidth="2"
                  />
                </g>
              );
            }
            
            return (
              <g key={`tick-${idx}`}>
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
                  fontSize="12"
                  fill="#555"
                  fontWeight="500"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                  {formattedValue}
                </text>
              </g>
            );
          })}

          {/* Label del eje X */}
          <text
            x={margin.left + plotWidth / 2}
            y={chartHeight - 15}
            textAnchor="middle"
            fontSize="14"
            fill="#2a2a2a"
            fontWeight="600"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          >
            {yAxisLabel}
          </text>

          {/* Box plots - estilo limpio y moderno */}
          {data.map((d, i) => {
            const y = margin.top + (i + 0.5) * spacing;
            const boxY = y - boxHeight / 2;
            
            const xMin = valueToX(d.min);
            const xQ1 = valueToX(d.q1);
            const xMedian = valueToX(d.median);
            const xQ3 = valueToX(d.q3);
            const xMax = valueToX(d.max);
            const boxWidth = xQ3 - xQ1;
            
            const isHovered = hoveredIndex === i;
            const boxColor = getBoxColor(i);
            const darkerColor = isHovered ? boxColor : boxColor;

            return (
              <g 
                key={`box-${i}`}
                onMouseEnter={(e) => handleMouseEnter(e, i)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer' }}
                opacity={isHovered ? 1 : hoveredIndex !== null ? 0.4 : 1}
              >
                {/* Whisker inferior (línea desde min hasta Q1) */}
                <line
                  x1={xMin}
                  y1={y}
                  x2={xQ1}
                  y2={y}
                  stroke="#333"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Cap inferior */}
                <line
                  x1={xMin}
                  y1={y - 5}
                  x2={xMin}
                  y2={y + 5}
                  stroke="#333"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Caja (Q1 a Q3) - estilo más limpio con mejor opacidad */}
                <rect
                  x={xQ1}
                  y={boxY}
                  width={boxWidth}
                  height={boxHeight}
                  fill={boxColor}
                  fillOpacity={isHovered ? "0.85" : "0.75"}
                  stroke={darkerColor}
                  strokeWidth={isHovered ? "2.5" : "2"}
                  rx="3"
                  ry="3"
                  style={{ 
                    transition: 'all 0.2s ease',
                    filter: isHovered ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))' : 'none'
                  }}
                />

                {/* Línea de mediana - más visible */}
                <line
                  x1={xMedian}
                  y1={boxY}
                  x2={xMedian}
                  y2={boxY + boxHeight}
                  stroke="#fff"
                  strokeWidth={isHovered ? "3" : "2.5"}
                  strokeLinecap="round"
                  opacity="0.95"
                />

                {/* Whisker superior (línea desde Q3 hasta max) */}
                <line
                  x1={xQ3}
                  y1={y}
                  x2={xMax}
                  y2={y}
                  stroke="#333"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Cap superior */}
                <line
                  x1={xMax}
                  y1={y - 5}
                  x2={xMax}
                  y2={y + 5}
                  stroke="#333"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Outliers - más visibles */}
                {d.outliers && d.outliers.map((outlier, oIdx) => {
                  const xOutlier = valueToX(outlier);
                  return (
                    <circle
                      key={`outlier-${i}-${oIdx}`}
                      cx={xOutlier}
                      cy={y}
                      r={isHovered ? "5" : "4.5"}
                      fill="#FF6B6B"
                      stroke="#FF4757"
                      strokeWidth="1.5"
                      opacity={isHovered ? 1 : 0.85}
                      style={{ transition: 'all 0.2s ease' }}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </ResponsiveContainer>
      
      {/* Tooltip mejorado con mejor diseño */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y + 15}px`,
            backgroundColor: '#ffffff',
            border: `2px solid ${getBoxColor(hoveredIndex)}`,
            borderRadius: '10px',
            padding: '14px 18px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
            zIndex: 1000,
            pointerEvents: 'none',
            fontSize: '12px',
            minWidth: '220px',
            transition: 'all 0.2s ease',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          <p style={{ 
            margin: 0, 
            fontWeight: 'bold', 
            fontSize: '16px',
            color: getBoxColor(hoveredIndex),
            borderBottom: `2px solid ${getBoxColor(hoveredIndex)}`,
            paddingBottom: '10px',
            marginBottom: '12px'
          }}>
            {data[hoveredIndex].municipio}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Mínimo:</p>
            <p style={{ margin: 0, fontWeight: '600', textAlign: 'right', color: '#2a2a2a' }}>
              {data[hoveredIndex].min?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Q1:</p>
            <p style={{ margin: 0, fontWeight: '600', textAlign: 'right', color: '#2a2a2a' }}>
              {data[hoveredIndex].q1?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Mediana:</p>
            <p style={{ margin: 0, fontWeight: 'bold', textAlign: 'right', color: getBoxColor(hoveredIndex), fontSize: '13px' }}>
              {data[hoveredIndex].median?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Q3:</p>
            <p style={{ margin: 0, fontWeight: '600', textAlign: 'right', color: '#2a2a2a' }}>
              {data[hoveredIndex].q3?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Máximo:</p>
            <p style={{ margin: 0, fontWeight: '600', textAlign: 'right', color: '#2a2a2a' }}>
              {data[hoveredIndex].max?.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
            </p>
          </div>
          {data[hoveredIndex].outliers && data[hoveredIndex].outliers.length > 0 && (
            <p style={{ 
              margin: '12px 0 0 0', 
              color: '#FF6B6B',
              fontWeight: '600',
              fontSize: '12px',
              paddingTop: '10px',
              borderTop: '1px solid #eee'
            }}>
              ⚠ Outliers: {data[hoveredIndex].outliers.length}
            </p>
          )}
          <p style={{ 
            margin: '10px 0 0 0', 
            fontSize: '11px', 
            color: '#999',
            fontStyle: 'italic',
            textAlign: 'center',
            paddingTop: '10px',
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
