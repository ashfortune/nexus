'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar
} from 'recharts';

interface GraphProps {
  data: any[];
}

const SalesAnalysisGraph: React.FC<GraphProps> = ({ data }) => {
  return (
    <div className="w-full h-[400px] bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.5)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            yAxisId="left"
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 10000).toLocaleString()}만`}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(23, 23, 23, 0.8)', 
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              color: '#fff'
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="actual"
            name="실제 매출"
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorActual)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="movingAverage"
            name="7일 이동평균"
            stroke="#ffc658"
            strokeWidth={3}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="returnRate"
            name="수익률(%)"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={{ r: 4, fill: '#82ca9d' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesAnalysisGraph;
