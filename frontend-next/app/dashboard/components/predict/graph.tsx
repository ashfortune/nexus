'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';

interface GraphProps {
  data: any[];
  mode?: 'comparison' | 'trends';
}

/**
 * 차트 호버 시 디테일 정보 및 비교 GAP(오차액, 오차율)을 고해상도로 보여주는 커스텀 툴팁
 */
const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    const isComparison = mode === 'comparison';
    
    return (
      <div className="bg-[var(--nexus-surface-lowest)]/95 border border-[var(--nexus-outline-variant)] rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[var(--nexus-outline)] text-xs font-semibold mb-2.5 flex items-center gap-1.5">
          <span>📅</span> {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            if (entry.value === undefined || entry.value === null) return null;
            return (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2 h-2 rounded-full shadow-lg" 
                    style={{ 
                      backgroundColor: entry.stroke || entry.fill || '#fff',
                      boxShadow: `0 0 6px ${entry.stroke || entry.fill || '#fff'}`
                    }}
                  />
                  <span className="text-[var(--nexus-on-bg)]/80 text-xs font-medium">{entry.name}</span>
                </div>
                <span className="text-[var(--nexus-on-bg)] font-bold text-xs">
                  {entry.name.includes('%') || entry.name.includes('수익률')
                    ? `${entry.value.toFixed(2)}%`
                    : `₩ ${entry.value.toLocaleString()}`}
                </span>
              </div>
            );
          })}

          {/* 오차액 및 오차 정확도 계산 (비교 탭 활성화 시 노출) */}
          {isComparison && payload.length >= 1 && (
            (() => {
              const actualVal = payload.find((p: any) => p.dataKey === 'actual')?.value;
              const predictedVal = payload.find((p: any) => p.dataKey === 'predicted')?.value;
              
              if (actualVal !== undefined && actualVal !== null && predictedVal !== undefined && predictedVal !== null) {
                const diff = predictedVal - actualVal;
                const errorPercent = actualVal !== 0 ? (diff / actualVal) * 100 : 0;
                const absDiff = Math.abs(diff);
                const isOver = diff > 0;

                return (
                  <div className="border-t border-[var(--nexus-outline-variant)] mt-3 pt-2.5 flex flex-col gap-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[var(--nexus-outline)] font-medium">예측 편차 (GAP)</span>
                      <span className={`font-semibold ${isOver ? 'text-amber-500' : 'text-indigo-500'}`}>
                        {isOver ? '+' : '-'} ₩ {absDiff.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[var(--nexus-outline)] font-medium">예측 편차율</span>
                      <span className={`font-semibold ${isOver ? 'text-amber-500' : 'text-indigo-500'}`}>
                        {isOver ? '+' : ''}{errorPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            })()
          )}
        </div>
      </div>
    );
  }
  return null;
};

const SalesAnalysisGraph: React.FC<GraphProps> = ({ data, mode = 'comparison' }) => {
  const isComparison = mode === 'comparison';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] nexus-card border border-[var(--nexus-outline-variant)] flex items-center justify-center">
        <div className="text-[var(--nexus-primary)] font-medium animate-pulse">차트를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] nexus-card border border-[var(--nexus-outline-variant)] p-4 shadow-xl relative">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
          <defs>
            {/* 기존 그라데이션 */}
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
            {/* 비교용 인디고 블루 실제 매출 그라데이션 */}
            <linearGradient id="colorActualComp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--nexus-primary)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--nexus-primary)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="var(--nexus-outline-variant)" vertical={false} />
          
          <XAxis
            dataKey="date"
            stroke="var(--nexus-outline)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          
          <YAxis
            yAxisId="left"
            stroke="var(--nexus-outline)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₩ ${(value / 10000).toLocaleString()}만`}
            dx={-5}
          />

          {!isComparison && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--nexus-outline)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              dx={5}
            />
          )}

          {/* 호버 시 고급 툴팁 활성화 */}
          <Tooltip content={<CustomTooltip mode={mode} />} />

          {isComparison ? (
            // 탭 1: 실제 vs AI 예측 비교 모드 (TimesFM)
            <>
              {/* 실제 매출 (Indigo Area) */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="actual"
                name="실제 매출"
                stroke="var(--nexus-primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActualComp)"
                activeDot={{ r: 5, stroke: 'var(--nexus-primary)', strokeWidth: 2, fill: '#fff' }}
              />
              {/* TimesFM AI 예측 (강조되는 내일 단일 Point 점) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="timesfm"
                name="TimesFM AI 예측점"
                stroke="#0ea5e9"
                strokeWidth={0} // 선은 그리지 않음
                dot={{ r: 7, stroke: '#0ea5e9', strokeWidth: 3, fill: '#fff' }}
                activeDot={{ r: 9, stroke: '#0ea5e9', strokeWidth: 3, fill: '#fff' }}
              />
            </>
          ) : (
            // 탭 2: 실제 vs 통계 트렌드 비교 모드 (Statsmodels)
            <>
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="actual"
                name="실제 매출"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorActual)"
                activeDot={{ r: 5, stroke: '#8884d8', strokeWidth: 2, fill: '#fff' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="predicted"
                name="Statsmodels 통계 예측선"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 1.5, stroke: '#f59e0b', strokeWidth: 1, fill: '#f59e0b' }}
                activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="movingAverage"
                name="7일 이동평균"
                stroke="#ffc658"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: '#ffc658', strokeWidth: 2, fill: '#fff' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="returnRate"
                name="일별 수익률(%)"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={{ r: 3, fill: '#82ca9d' }}
                activeDot={{ r: 5, stroke: '#82ca9d', strokeWidth: 2, fill: '#fff' }}
              />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesAnalysisGraph;
