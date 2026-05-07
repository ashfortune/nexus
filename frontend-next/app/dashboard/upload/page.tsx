'use client';

import { api } from '@/lib/api';
import React, { useState } from 'react';
import DropZone from '../components/upload/Drop_zone';
import InfoCard from '../components/upload/Infocard';
import { Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';

/**
 * 매출 CSV 파일을 업로드하여 데이터베이스에 적재하는 페이지 컴포넌트입니다.
 */
const UploadPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.csv')) {
      setError('CSV 파일만 업로드 가능합니다.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { user } = useAuthStore.getState();
      const response = await api.post('/api/v1/ai/dashboard/upload-sales', formData, {
        baseUrl: process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000',
        headers: { 'X-User-Id': user?.id || '' } // Let browser handle boundary for multipart, but add our header
      });

      if (!response.ok) {
        // 1. 서버가 왜 거절했는지 진짜 이유를 텍스트로 뽑아냅니다.
        const errorDetail = await response.text();

        // 2. 개발자 도구 콘솔에 빨간 글씨로 출력합니다.
        console.error(`백엔드 거절 사유 (상태코드: ${response.status}):`, errorDetail);

        // 3. 에러를 던집니다.
        throw new Error(`데이터 적재 실패: ${response.status} 에러가 발생했습니다.`);
      }

      const result = await response.json();
      setSuccess(result.message);
    } catch (err: any) {
      console.error('파일 업로드 에러:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 text-[var(--nexus-on-bg)]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] rounded-2xl shadow-lg">
              <Upload size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">데이터 업로드</h1>
          </div>
          <p className="text-[var(--nexus-outline)] max-w-2xl text-lg">
            과거 매출 내역이 담긴 CSV 파일을 업로드하여 데이터베이스에 저장하세요. 저장된 데이터는
            분석 및 예측 시스템의 기초 자료로 활용됩니다.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="nexus-card border border-[var(--nexus-outline-variant)] rounded-3xl p-8 shadow-2xl">
              {!success ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2 text-[var(--nexus-primary)]">CSV 파일 업로드</h2>
                    <p className="text-[var(--nexus-outline)] text-sm">
                      분석할 매출 내역이 담긴 CSV 파일을 드래그 앤 드롭 하세요.
                    </p>
                  </div>
                  <DropZone onFilesSelected={handleFileUpload} isLoading={isLoading} />
                  {isLoading && (
                    <div className="mt-6 flex items-center justify-center gap-3 text-[var(--nexus-primary)] animate-pulse">
                      <div className="w-5 h-5 border-2 border-[var(--nexus-primary)] border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">데이터를 안전하게 적재 중입니다...</span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-6 p-4 bg-[var(--nexus-error)]/10 border border-[var(--nexus-error)]/20 rounded-xl flex items-center gap-3 text-[var(--nexus-error)] text-sm">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-500">
                  <div className="p-6 bg-[#059669]/20 rounded-full mb-6 text-[#059669] ring-8 ring-[#059669]/5">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-[var(--nexus-on-bg)]">업로드 완료!</h2>
                  <p className="text-[var(--nexus-outline)] mb-8 max-w-md">
                    {success} <br />
                    이제 '예측 및 분석' 메뉴에서 적재된 데이터를 확인하실 수 있습니다.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSuccess(null)}
                      className="px-6 py-3 bg-[var(--nexus-surface-container)] hover:bg-[var(--nexus-surface-container-high)] border border-[var(--nexus-outline-variant)] text-[var(--nexus-on-bg)] rounded-xl transition-all"
                    >
                      추가 업로드
                    </button>
                    <Link
                      href="/dashboard/predict"
                      className="px-6 py-3 bg-[var(--nexus-primary)] hover:bg-[var(--nexus-secondary)] text-[var(--nexus-on-primary)] rounded-xl font-semibold transition-all shadow-lg"
                    >
                      분석 결과 보러가기
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="space-y-6">
              <InfoCard />
              <div className="bg-[var(--nexus-surface-container-highest)] border border-[var(--nexus-outline-variant)] rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-[var(--nexus-on-bg)]">
                  <FileText size={18} className="text-[var(--nexus-primary)]" />
                  파일 가이드
                </h3>
                <ul className="text-sm text-[var(--nexus-outline)] space-y-3">
                  <li className="flex gap-2">
                    <span className="text-[var(--nexus-primary)]">•</span>첫 번째 열은 '날짜'여야 합니다. (예:
                    2024-04-30)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--nexus-primary)]">•</span>두 번째 열은 '매출액'이어야 합니다.
                    (예: 500000)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--nexus-primary)]">•</span>
                    헤더(Header)가 포함되어 있어도 자동으로 인식합니다.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
