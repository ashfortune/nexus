'use client';

import { api } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import AnalysisReport from '../components/predict/AnalysisReport';
import { LineChart, LayoutDashboard, Database, AlertCircle, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * 매출 데이터를 바탕으로 분석 리포트와 예측 결과를 보여주는 페이지 컴포넌트입니다.
 */
const PredictPage = () => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { user } = useAuthStore.getState();
      // 저장 시 자동 분석된 결과를 단순히 조회(GET)함
      const response = await api.get('/api/v1/sales/results', {
        params: { userId: user?.id || '' }
      });
      
      const result = await response.json();
      
      if (result.status === 'no_data') {
        setError(result.message);
      } else if (result.status === 'success') {
        setAnalysisResult(result.data);
      } else {
        throw new Error(result.detail || '데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      console.error('분석 데이터 로드 실패:', err);
      setError(err.message || '서버와의 통신에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 진입 시 자동으로 최신 분석 결과 로드
  useEffect(() => {
    fetchAnalysis();
  }, []);

  return (
    <AuthGuard allowedRoles={[1, 2]}>
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
              데이터베이스에 쌓인 매출 내역을 바탕으로 AI가 내일의 예상 매출과 <br />
              전반적인 비즈니스 흐름을 정밀하게 분석한 결과입니다.
            </p>
          </div>

          {analysisResult && (
            <button
              onClick={fetchAnalysis}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--nexus-surface-container)] hover:bg-[var(--nexus-surface-container-high)] border border-[var(--nexus-outline-variant)] rounded-2xl transition-all disabled:opacity-50 text-[var(--nexus-on-bg)]"
            >
              <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
              리포트 새로고침
            </button>
          )}
        </header>

        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 border-4 border-[var(--nexus-primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--nexus-primary)] font-medium text-lg">
              최신 분석 리포트를 불러오고 있습니다...
            </p>
          </div>
        ) : !analysisResult && !error ? (
          // 초기 진입 상태: 분석 시작 버튼 표시
          <div className="h-[50vh] nexus-card border border-[var(--nexus-outline-variant)] rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center shadow-xl">
            <div className="p-6 bg-[var(--nexus-primary)]/10 rounded-full mb-6 text-[var(--nexus-primary)]">
              <Database size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[var(--nexus-on-bg)]">분석 리포트가 준비되었습니다</h2>
            <p className="text-[var(--nexus-outline)] mb-8 max-w-md text-lg">
              저장된 매출 데이터를 바탕으로 생성된 <br />
              최신 분석 리포트를 확인해 보세요.
            </p>
            <button
              onClick={fetchAnalysis}
              className="flex items-center gap-2 px-10 py-5 bg-[var(--nexus-primary)] hover:bg-[var(--nexus-secondary)] text-[var(--nexus-on-primary)] rounded-2xl font-bold transition-all shadow-xl text-lg"
            >
              <LineChart size={22} />
              현재 데이터로 분석하기
            </button>
          </div>
        ) : error ? (
          // 데이터 부족 또는 에러 상태
          <div className="h-[50vh] nexus-card border border-[var(--nexus-outline-variant)] rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center shadow-xl">
            <div className="p-6 bg-[var(--nexus-error)]/10 rounded-full mb-6 text-[var(--nexus-error)]">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-[var(--nexus-on-bg)]">데이터를 준비해 주세요</h2>
            <p className="text-[var(--nexus-outline)] mb-8 max-w-md text-lg">
              {error}
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
    </AuthGuard>
  );
};

export default PredictPage;
