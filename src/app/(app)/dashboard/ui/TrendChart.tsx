'use client'

import { useState } from 'react'

type TrendData = {
  date: string
  count: number
}

export default function TrendChart({ data }: { data: TrendData[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const chartHeight = 120
  const chartWidth = 100

  // Calcular métricas
  const totalTickets = data.reduce((sum, d) => sum + d.count, 0)
  const avgPerDay = (totalTickets / data.length).toFixed(1)
  const todayCount = data[data.length - 1]?.count || 0
  const yesterdayCount = data[data.length - 2]?.count || 0
  const change = yesterdayCount > 0 
    ? ((todayCount - yesterdayCount) / yesterdayCount * 100).toFixed(0)
    : todayCount > 0 ? '+100' : '0'
  const isPositive = todayCount >= yesterdayCount

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth
    const y = chartHeight - (item.count / maxCount) * chartHeight
    return { x, y, count: item.count, date: item.date }
  })

  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
  const areaD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`

  return (
    <div className="card shadow-lg border-0 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="card-body">
        {/* Header con métricas resumen */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Tendencia de Tickets</h3>
              <p className="text-xs text-gray-600">Últimos 7 días • Nuevos tickets creados</p>
            </div>
          </div>
          
          {/* Badge de cambio */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isPositive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <svg className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {isPositive ? '+' : ''}{change}%
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{totalTickets}</div>
            <div className="text-[10px] text-blue-700 font-medium uppercase tracking-wide mt-0.5">Total esta semana</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 text-center border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">{avgPerDay}</div>
            <div className="text-[10px] text-purple-700 font-medium uppercase tracking-wide mt-0.5">Promedio/día</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-center border border-green-100">
            <div className="text-2xl font-bold text-green-600">{todayCount}</div>
            <div className="text-[10px] text-green-700 font-medium uppercase tracking-wide mt-0.5">Creados hoy</div>
          </div>
        </div>

        {/* Gráfico interactivo */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-32"
            preserveAspectRatio="none"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))' }}
          >
            <defs>
              <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            {/* Líneas de referencia */}
            {[0.25, 0.5, 0.75].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="#e5e7eb"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}
            
            {/* Área bajo la curva */}
            <path 
              d={areaD} 
              fill="url(#trendGradient)"
              className="animate-fadeIn"
            />
            
            {/* Línea principal */}
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-md"
            />
            
            {/* Puntos interactivos */}
            {points.map((point, index) => (
              <g key={index}>
                {/* Área de hover más grande (invisible) */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                
                {/* Punto visible */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredIndex === index ? "4" : "2.5"}
                  fill={hoveredIndex === index ? "#059669" : "#10b981"}
                  className={`transition-all duration-200 ${hoveredIndex === index ? 'drop-shadow-lg' : 'drop-shadow'}`}
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* Anillo exterior en hover */}
                {hoveredIndex === index && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    opacity="0.3"
                    className="animate-pulse"
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            ))}
          </svg>
          
          {/* Tooltip flotante */}
          {hoveredIndex !== null && (
            <div 
              className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs font-medium z-10 animate-fadeIn pointer-events-none"
              style={{
                left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
                top: '-65px',
                transform: 'translateX(-50%)'
              }}
            >
              <div className="flex flex-col gap-1">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{data[hoveredIndex].count}</div>
                  <div className="text-[10px] text-gray-300">
                    {data[hoveredIndex].count === 1 ? 'ticket creado' : 'tickets creados'}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase mt-1">
                    {new Date(data[hoveredIndex].date).toLocaleDateString('es-ES', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                </div>
                {hoveredIndex > 0 && (
                  <div className="text-[10px] text-gray-400 text-center pt-1 border-t border-gray-700">
                    {data[hoveredIndex].count > data[hoveredIndex - 1].count ? '+' : ''}
                    {data[hoveredIndex].count - data[hoveredIndex - 1].count} vs día anterior
                  </div>
                )}
              </div>
              {/* Flecha del tooltip */}
              <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          )}
        </div>

        {/* Etiquetas de días con fechas exactas */}
        <div className="grid grid-cols-7 gap-1 text-xs mt-4">
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx
            const isToday = idx === data.length - 1
            const dateObj = new Date(item.date)
            
            return (
              <div 
                key={idx} 
                className={`text-center transition-all duration-200 cursor-pointer p-1.5 rounded-lg ${
                  isHovered 
                    ? 'bg-green-100 transform scale-105' 
                    : isToday 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Número del día del mes (fecha exacta) */}
                <div className={`font-bold text-lg ${
                  isHovered 
                    ? 'text-green-700' 
                    : isToday 
                      ? 'text-blue-700' 
                      : 'text-gray-700'
                }`}>
                  {dateObj.getDate()}
                </div>
                
                {/* Día de la semana */}
                <div className={`text-[10px] uppercase tracking-wide font-medium ${
                  isHovered 
                    ? 'text-green-600' 
                    : isToday 
                      ? 'text-blue-600' 
                      : 'text-gray-500'
                }`}>
                  {dateObj.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                
                {/* Número de tickets creados ese día */}
                <div className={`text-[11px] font-semibold mt-1 px-1.5 py-0.5 rounded ${
                  isHovered 
                    ? 'bg-green-600 text-white' 
                    : isToday 
                      ? 'bg-blue-600 text-white' 
                      : item.count > 0 
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-gray-100 text-gray-400'
                }`}>
                  {item.count} {item.count === 1 ? 'ticket' : 'tickets'}
                </div>
                
                {isToday && (
                  <div className="text-[9px] text-blue-600 font-semibold mt-0.5">HOY</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
