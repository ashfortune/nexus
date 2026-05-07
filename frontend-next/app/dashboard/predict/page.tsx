'use client';

import { api } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import AnalysisReport from '../components/predict/AnalysisReport';
import { LineChart, LayoutDashboard, Database, AlertCircle, RefreshCcw } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

/**
 * 매출 데이터를 바탕으로 분석 리포트와 예측 결과를 보여주는 페이지 컴포넌트입니다.
 */
const PredictPage = () => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { user } = useAuthStore.getState();
      const response = await api.get('/api/v1/ai/prediction/analysis', {
        baseUrl: process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000',
        params: { userId: user?.id || '' }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '데이터를 불러오는 중 오류가 발생했습니다.');
      }
      const result = await response.json();
      setAnalysisResult(result.data);
    } catch (err: any) {
      console.error('분석 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  return (
    <div className="min-h-screen p-8 text-[var(--nexus-on-bg)]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] rounded-2xl shadow-lg">
                <LineChart size={24} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">매출 예측 및 분석 리포트</h1>
            </div>
            <p className="text-[var(--nexus-outline)] max-w-2xl text-lg">
              데이터베이스에 적재된 매출 내역을 바탕으로 한 심층 분석 결과입니다. 지수평활법(SES)과
              이동평균(MA)을 활용하여 내일의 성과를 예측합니다.
            </p>
          </div>

          <button
            onClick={fetchAnalysis}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--nexus-surface-container)] hover:bg-[var(--nexus-surface-container-high)] border border-[var(--nexus-outline-variant)] rounded-2xl transition-all disabled:opacity-50 text-[var(--nexus-on-bg)]"
          >
            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
            새로고침
          </button>
        </header>

        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-[var(--nexus-primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--nexus-primary)] font-medium text-lg">
              AI가 데이터를 심층 분석하고 있습니다...
            </p>
          </div>
        ) : error ? (
          <div className="h-[50vh] nexus-card border border-[var(--nexus-outline-variant)] rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center shadow-xl">
            <div className="p-6 bg-[var(--nexus-error)]/10 rounded-full mb-6 text-[var(--nexus-error)]">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[var(--nexus-on-bg)]">데이터가 부족합니다</h2>
            <p className="text-[var(--nexus-outline)] mb-8 max-w-md text-lg">
              {error} <br />
              분석을 위해 먼저 과거 매출 데이터를 업로드해 주세요.
            </p>
            <Link
              href="/dashboard/upload"
              className="flex items-center gap-2 px-8 py-4 bg-[var(--nexus-primary)] hover:bg-[var(--nexus-secondary)] text-[var(--nexus-on-primary)] rounded-2xl font-bold transition-all shadow-xl"
            >
              <Database size={20} />
              데이터 업로드하러 가기
            </Link>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <AnalysisReport data={analysisResult} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictPage;
