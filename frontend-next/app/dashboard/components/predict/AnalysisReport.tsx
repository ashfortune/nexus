'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar } from 'lucide-react';

const SalesAnalysisGraph = dynamic(() => import('./graph'), { ssr: false });

interface AnalysisReportProps {
  data: {
    prediction?: {
      amount: number;
      date: string;
      confidence: number;
    };
    predictedSales?: number; // 레거시/폴백 지원용
    movingAverage: number;
    returnRate: number;
    analysisData: any[];
    predictionMethod?: string;
    nextMonthForecast?: number;
    analysisReport?: string;
  };
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ data }) => {
  const predictedSales = data?.prediction?.amount ?? data?.predictedSales ?? 0;
  const analysisData = data?.analysisData ?? [];
  const totalDays = analysisData.length;
  
  const latestData = totalDays > 0 
    ? analysisData[totalDays - 1] 
    : { actual: 0, date: '' };
    
  const isPositive = (data?.returnRate ?? 0) >= 0;

  const startDate = totalDays > 0 ? analysisData[0]?.date : null;
  const endDate = totalDays > 0 ? analysisData[totalDays - 1]?.date : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 분석 기간 안내 뱃지 */}
      {startDate && endDate && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2.5 px-5 py-2.5 bg-[var(--nexus-surface-container-high)] border border-[var(--nexus-outline-variant)] rounded-2xl shadow-sm">
            <div className="p-1.5 bg-[var(--nexus-primary)]/10 rounded-lg">
              <Calendar size={16} className="text-[var(--nexus-primary)]" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-2">
              <span className="text-xs text-[var(--nexus-outline)] font-medium">분석 데이터 범위:</span>
              <span className="text-sm font-bold text-[var(--nexus-on-bg)]">
                {startDate} <span className="mx-1 text-[var(--nexus-outline)]">~</span> {endDate}
                <span className="ml-2 text-xs font-normal text-[var(--nexus-primary)] bg-[var(--nexus-primary)]/10 px-2 py-0.5 rounded-full border border-[var(--nexus-primary)]/20">
                  {totalDays}일 분석됨
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 예측 매출 카드 */}
        <div className="nexus-card border border-[var(--nexus-outline-variant)] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={80} className="text-[var(--nexus-primary)]" />
          </div>
          <p className="text-[var(--nexus-outline)] text-sm font-medium mb-1">
            <span className="text-[var(--nexus-primary)] font-bold">{data?.prediction?.date || '내일'}</span> 예상 매출
          </p>
          <h3 className="text-3xl font-bold text-[var(--nexus-on-bg)] mb-2">
            ₩ {predictedSales.toLocaleString()}
          </h3>
          <div className="flex items-center gap-1 text-xs text-[var(--nexus-primary)]">
            <Activity size={14} />
            <span className="font-medium truncate max-w-[220px]">
              AI 데이터 분석 결과
            </span>
          </div>
        </div>

        {/* 최근 매출 평균 카드 */}
        <div className="nexus-card border border-[var(--nexus-outline-variant)] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={80} className="text-[var(--nexus-secondary)]" />
          </div>
          <p className="text-[var(--nexus-outline)] text-sm font-medium mb-1">최근 7일 매출 평균</p>
          <h3 className="text-3xl font-bold text-[var(--nexus-on-bg)] mb-2">
            ₩ {data.movingAverage.toLocaleString()}
          </h3>
          <p className="text-xs text-[var(--nexus-outline)] italic">
            {startDate ? startDate.substring(5) : ''} ~ {endDate ? endDate.substring(5) : ''} 평균치
          </p>
        </div>

        {/* 매출 변동률 카드 */}
        <div className="nexus-card border border-[var(--nexus-outline-variant)] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {isPositive ? <TrendingUp size={80} className="text-[#059669]" /> : <TrendingDown size={80} className="text-[var(--nexus-error)]" />}
          </div>
          <p className="text-[var(--nexus-outline)] text-sm font-medium mb-1">매출 변동 추이</p>
          <h3
            className={`text-3xl font-bold mb-2 ${isPositive ? 'text-[#059669]' : 'text-[var(--nexus-error)]'}`}
          >
            {isPositive ? '+' : ''}{data.returnRate.toFixed(2)}%
          </h3>
          <div className="flex items-center gap-1 text-xs">
            {isPositive ? (
              <TrendingUp size={14} className="text-[#059669]" />
            ) : (
              <TrendingDown size={14} className="text-[var(--nexus-error)]" />
            )}
            <span className={isPositive ? 'text-[#059669]' : 'text-[var(--nexus-error)]'}>
              최근 판매일(<span className="font-bold">{latestData.date || '어제'}</span>) 대비
            </span>
          </div>
        </div>
      </div>

      <div className="nexus-card border border-[var(--nexus-outline-variant)] rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-[var(--nexus-on-bg)]">매출 분석 보고서</h2>
              {startDate && endDate && (
                <span className="text-xs bg-[var(--nexus-primary-container)]/20 text-[var(--nexus-primary)] font-semibold px-2.5 py-1 rounded-lg border border-[var(--nexus-primary)]/10">
                  📅 조회 기간: {startDate} ~ {endDate} (총 {totalDays}일 분석)
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--nexus-outline)]">지표별 시계열 분석 그래프를 확인해 보세요.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex flex-wrap items-center gap-3.5 text-xs font-medium">
              <div className="flex items-center gap-2 bg-[var(--nexus-primary-container)]/10 px-3 py-1.5 rounded-full border border-[var(--nexus-primary)]/20">
                <span className="w-2 h-2 rounded-full bg-[var(--nexus-primary)] shadow-[0_0_8px_rgba(11,26,125,0.4)]"></span>
                <span className="text-[var(--nexus-on-bg)]/80">실제 매출</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0ea5e9]/10 px-3 py-1.5 rounded-full border border-[#0ea5e9]/20">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9] shadow-[0_0_10px_#0ea5e9]"></span>
                <span className="text-[var(--nexus-on-bg)]/80 font-bold">TimesFM AI 예측점</span>
              </div>
              <div className="flex items-center gap-2 bg-[#f59e0b]/10 px-3 py-1.5 rounded-full border border-[#f59e0b]/20">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span>
                <span className="text-[var(--nexus-on-bg)]/80">Statsmodels 통계 예측선</span>
              </div>
              <div className="flex items-center gap-2 bg-[#ffc658]/10 px-3 py-1.5 rounded-full border border-[#ffc658]/20">
                <span className="w-2 h-2 rounded-full bg-[#ffc658]"></span>
                <span className="text-[var(--nexus-on-bg)]/80">7일 이동평균</span>
              </div>
              <div className="flex items-center gap-2 bg-[#10b981]/10 px-3 py-1.5 rounded-full border border-[#10b981]/20">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                <span className="text-[var(--nexus-on-bg)]/80">일별 수익률</span>
              </div>
            </div>
          </div>
        </div>
        
        <SalesAnalysisGraph 
          data={analysisData} 
        />
      </div>

      <div className="bg-[var(--nexus-surface-container-highest)] border border-[var(--nexus-outline-variant)] rounded-3xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:scale-105 transition-transform duration-700">
          <Activity size={180} className="text-[var(--nexus-primary)]" />
        </div>
        
        <h4 className="text-[var(--nexus-on-bg)] font-semibold mb-3 flex items-center gap-2 text-base">
          <Activity size={18} className="text-[var(--nexus-primary)]" />
          AI 심층 분석 코멘트
        </h4>
        
        <div className="space-y-4">
          <p className="text-[var(--nexus-on-bg)]/80 text-sm leading-relaxed">
            {data?.analysisReport || (
              `최근 7일 이동평균이 ${(data?.movingAverage ?? 0) > (analysisData[0]?.actual ?? 0) ? '상승' : '하향'} 곡선을 그리고 있습니다. ` +
              `평균 수익률은 ${(data?.returnRate ?? 0).toFixed(2)}%로 측정되었으며, 내일은 오늘보다 약 ${Math.abs(predictedSales - (latestData?.actual ?? 0)).toLocaleString()}원 정도 ` +
              `${predictedSales > (latestData?.actual ?? 0) ? '높은' : '낮은'} 매출이 발생할 것으로 예측됩니다.`
            )}
          </p>
          
          {(data.predictionMethod || data.nextMonthForecast) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--nexus-outline)] border-t border-[var(--nexus-outline-variant)] pt-3">
              {data.predictionMethod && (
                <div className="flex items-center gap-1.5">
                  <span>예측 기법:</span>
                  <span className="font-semibold text-[var(--nexus-primary)] bg-[var(--nexus-primary)]/10 px-2 py-0.5 rounded-lg border border-[var(--nexus-primary)]/20">
                    {data.predictionMethod}
                  </span>
                </div>
              )}
              {data.predictionMethod && data.nextMonthForecast && (
                <span className="text-[var(--nexus-outline-variant)] hidden sm:inline">|</span>
              )}
              {data.nextMonthForecast && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-amber-500" />
                  <span className="text-[var(--nexus-on-bg)]">다음 달(30일) 예상 누적 매출:</span>
                  <span className="font-bold text-amber-500 text-sm">
                    ₩ {data.nextMonthForecast.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisReport;
