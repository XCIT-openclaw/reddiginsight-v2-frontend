'use client';

import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface RingChartData {
  name: string;
  value: number;
  color: string;
}

interface RingChartProps {
  data: RingChartData[];
  size?: 'small' | 'medium' | 'large';
  strokeWidth?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const RingChart: React.FC<RingChartProps> = ({ 
  data, 
  size = 'medium',
  strokeWidth = 10,
  innerRadius = size === 'small' ? 30 : size === 'large' ? 50 : 40,
  outerRadius = size === 'small' ? 40 : size === 'large' ? 70 : 55,
}) => {
  // Determine container size based on ring size
  const containerSize = size === 'small' ? 100 : size === 'large' ? 180 : 140;

  // Calculate the percentage of completed/positive score for text display
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const primaryValue = data[0]?.value || 0; // Assuming first item is the primary metric
  const percentage = totalValue > 0 ? Math.round((primaryValue / totalValue) * 100) : 0;

  // Calculate circumference for stroke-dasharray (needed for the background circle)
  const radius = (innerRadius + outerRadius) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center">
      <div style={{ position: 'relative', width: containerSize, height: containerSize }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Background circle (optional, creates a subtle track behind the data) */}
            <defs>
              <linearGradient id="shadow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f0f0f0" />
                <stop offset="100%" stopColor="#e0e0e0" />
              </linearGradient>
            </defs>
            
            {/* Main pie chart for the actual data */}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={0}
              dataKey="value"
              startAngle={180}
              endAngle={0} // Top half filled
              stroke="none"
              cornerRadius={strokeWidth / 2} // Rounded edges
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            
            {/* Center text showing the main metric */}
            <text 
              x="50%" 
              y="50%" 
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xl font-bold fill-gray-800 dark:fill-gray-200"
            >
              {`${percentage}%`}
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-col items-center">
        {data.map((item, index) => (
          <div key={index} className="flex items-center mb-1">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: item.color }} 
            />
            <span className="text-xs text-muted-foreground">
              {item.name}: {item.value.toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RingChart;