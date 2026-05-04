'use client';

import React from 'react';
import SalesAnalysisGraph from './graph';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface AnalysisReportProps {
  data: {
    predictedSales: number;
    movingAverage: number;
    returnRate: number;
    analysisData: any[];
  };
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ data }) => {
  const latestData = data.analysisData[data.analysisData.length - 1];
  const isPositive = data.returnRate >= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 예측 매출 카드 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={80} />
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">내일 예상 매출</p>
          <h3 className="text-3xl font-bold text-white mb-2">
            ₩ {data.predictedSales.toLocaleString()}
          </h3>
          <div className="flex items-center gap-1 text-xs text-blue-400">
            <Activity size={14} />
            <span>지수평활법(SES) 기반 분석 결과</span>
          </div>
        </div>

        {/* 7일 이동평균 카드 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={80} />
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">7일 이동평균</p>
          <h3 className="text-3xl font-bold text-white mb-2">
            ₩ {data.movingAverage.toLocaleString()}
          </h3>
          <p className="text-xs text-white/40">최근 일주일 평균 트렌드</p>
        </div>

        {/* 평균 수익률 카드 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {isPositive ? <TrendingUp size={80} /> : <TrendingDown size={80} />}
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">평균 수익률(성장률)</p>
          <h3 className={`text-3xl font-bold mb-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {data.returnRate.toFixed(2)}%
          </h3>
          <div className="flex items-center gap-1 text-xs">
            {isPositive ? <TrendingUp size={14} className="text-green-400" /> : <TrendingDown size={14} className="text-red-400" />}
            <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
              전일 대비 변화 분석
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">매출 분석 보고서</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#8884d8]"></span>
              <span className="text-white/60">실제 매출</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ffc658]"></span>
              <span className="text-white/60">이동평균</span>
            </div>
          </div>
        </div>
        <SalesAnalysisGraph data={data.analysisData} />
      </div>

      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-6">
        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
          <Activity size={18} />
          AI 분석 코멘트
        </h4>
        <p className="text-white/80 text-sm leading-relaxed">
          최근 7일 이동평균이 {data.movingAverage > data.analysisData[0].actual ? '상승' : '하향'} 곡선을 그리고 있습니다. 
          평균 수익률은 {data.returnRate.toFixed(2)}%로 측정되었으며, 내일은 오늘보다 약 
          {Math.abs(data.predictedSales - latestData.actual).toLocaleString()}원 정도 
          {data.predictedSales > latestData.actual ? '높은' : '낮은'} 매출이 발생할 것으로 예측됩니다.
        </p>
      </div>
    </div>
  );
};

export default AnalysisReport;
