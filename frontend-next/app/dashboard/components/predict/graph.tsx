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

  // 데이터를 Recharts가 선호하는 숫자 형식으로 확실하게 변환
  const safeData = React.useMemo(() => {
    if (!data) return [];
    return data.map(item => ({
      ...item,
      actual: item.actual !== null && item.actual !== undefined ? Number(item.actual) : null,
      predicted: item.predicted !== null && item.predicted !== undefined ? Number(item.predicted) : null,
      timesfm: item.timesfm !== null && item.timesfm !== undefined ? Number(item.timesfm) : null,
      movingAverage: item.movingAverage !== null && item.movingAverage !== undefined ? Number(item.movingAverage) : null,
      returnRate: item.returnRate !== null && item.returnRate !== undefined ? Number(item.returnRate) : null,
    }));
  }, [data]);

  // 데이터 유입 및 타입 검증을 위한 상세 로그
  React.useEffect(() => {
    if (mounted && data) {
      console.log('======= AI 분석 그래프 데이터 디버깅 =======');
      console.log('1. 전체 데이터 개수:', data.length);
      if (data.length > 0) {
        console.log('2. 데이터 샘플 (첫 3건):', data.slice(0, 3));
        console.log('3. 데이터 타입 확인 (첫 번째 데이터의 actual):', typeof data[0]?.actual);
        console.log('4. 변환 후 샘플 (첫 3건):', safeData.slice(0, 3));
      } else {
        console.warn('⚠️ 데이터가 비어 있습니다!');
      }
      console.log('==========================================');
    }
  }, [mounted, data, safeData]);

  if (!mounted) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-[var(--nexus-surface-container)] rounded-2xl border border-[var(--nexus-outline-variant)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--nexus-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--nexus-primary)] font-medium">차트 준비 중...</p>
        </div>
      </div>
    );
  }

  // 데이터가 없을 경우 처리
  if (!safeData || safeData.length === 0) {
    return (
      <div className="w-full h-[400px] flex flex-col items-center justify-center bg-[var(--nexus-surface-container)] rounded-2xl border border-[var(--nexus-outline-variant)] border-dashed">
        <p className="text-[var(--nexus-outline)] font-medium">표시할 그래프 데이터가 없습니다.</p>
        <p className="text-xs text-[var(--nexus-outline)]/60 mt-2">매출 데이터를 먼저 업로드해 주세요.</p>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-[400px] relative mt-6 bg-[var(--nexus-surface-container-low)]/30 rounded-2xl border border-[var(--nexus-outline-variant)]/50 flex items-center justify-center overflow-hidden"
      style={{ minHeight: '400px', width: '100%' }}
    >
      <div className="w-full h-full p-4">
        <ResponsiveContainer width="99%" height="99%">
          <ComposedChart 
            data={safeData} 
            margin={{ top: 30, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            
            <XAxis
              dataKey="date"
              stroke="#333"
              fontSize={11}
              tickLine={true}
              axisLine={true}
              dy={10}
              tick={{ fill: '#333' }}
            />
            
            <YAxis
              yAxisId="left"
              stroke="#333"
              fontSize={11}
              tickLine={true}
              axisLine={true}
              width={60}
              tick={{ fill: '#333' }}
              tickFormatter={(value) => {
                if (value >= 10000) return `${(value / 10000).toFixed(1)}만`;
                return value.toLocaleString();
              }}
            />

            {!isComparison && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                fontSize={11}
                tickLine={true}
                axisLine={true}
              />
            )}

            <Tooltip content={<CustomTooltip mode={mode} />} />

            {isComparison ? (
              <>
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="actual"
                  name="실제 매출"
                  stroke="#000000"
                  strokeWidth={3}
                  fill="#000000"
                  fillOpacity={0.1}
                  connectNulls={true}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="timesfm"
                  name="예측점"
                  stroke="#333"
                  strokeWidth={0}
                  dot={{ r: 8, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
                />
              </>
            ) : (
              <>
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="actual"
                  name="실제 매출"
                  stroke="#000"
                  strokeWidth={2}
                  fill="#000"
                  fillOpacity={0.1}
                  connectNulls={true}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="predicted"
                  name="통계 예측선"
                  stroke="#333"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="movingAverage"
                  name="이동평균"
                  stroke="#666"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="returnRate"
                  name="수익률(%)"
                  stroke="#000"
                  strokeWidth={2}
                  dot={true}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesAnalysisGraph;
