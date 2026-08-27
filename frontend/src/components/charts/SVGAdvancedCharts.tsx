import React from 'react';

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  category?: string;
}

export const SVGLineChart: React.FC<{ data: ChartDataPoint[]; width?: number; height?: number; color?: string }> = ({
  data,
  width = 600,
  height = 240,
  color = '#6366f1',
}) => {
  if (!data || data.length === 0) return <div className="text-slate-500 text-xs">No chart data available</div>;

  const padding = 40;
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const minY = Math.min(...data.map((d) => d.y), 0);

  const getX = (index: number) => padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
  const getY = (val: number) => height - padding - ((val - minY) / (maxY - minY || 1)) * (height - 2 * padding);

  const points = data.map((d, i) => `${getX(i)},${getY(d.y)}`).join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      <line x1={padding} y1={getY(0)} x2={width - padding} y2={getY(0)} stroke="#334155" strokeDasharray="3 3" />
      <line x1={padding} y1={getY(maxY / 2)} x2={width - padding} y2={getY(maxY / 2)} stroke="#334155" strokeDasharray="3 3" />
      <line x1={padding} y1={getY(maxY)} x2={width - padding} y2={getY(maxY)} stroke="#334155" strokeDasharray="3 3" />

      {/* Area fill */}
      <polygon
        points={`${getX(0)},${height - padding} ${points} ${getX(data.length - 1)},${height - padding}`}
        fill="url(#lineGrad)"
      />

      {/* Line path */}
      <polyline fill="none" stroke={color} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {data.map((d, i) => (
        <circle key={i} cx={getX(i)} cy={getY(d.y)} r="4" fill="#0f172a" stroke={color} strokeWidth="2" className="hover:r-6 transition" />
      ))}
    </svg>
  );
};

export const SVGBarChart: React.FC<{ data: ChartDataPoint[]; width?: number; height?: number; color?: string }> = ({
  data,
  width = 600,
  height = 240,
  color = '#06b6d4',
}) => {
  if (!data || data.length === 0) return <div className="text-slate-500 text-xs">No chart data available</div>;

  const padding = 40;
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const barWidth = Math.max(8, (width - 2 * padding) / data.length - 8);

  const getX = (index: number) => padding + index * ((width - 2 * padding) / data.length) + 4;
  const getY = (val: number) => height - padding - (val / maxY) * (height - 2 * padding);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {data.map((d, i) => {
        const barH = (d.y / maxY) * (height - 2 * padding);
        return (
          <g key={i}>
            <rect
              x={getX(i)}
              y={getY(d.y)}
              width={barWidth}
              height={barH}
              rx="4"
              fill={color}
              className="hover:opacity-80 transition cursor-pointer"
            />
            <text x={getX(i) + barWidth / 2} y={height - padding + 16} textAnchor="middle" fill="#94a3b8" fontSize="10">
              {d.x}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
