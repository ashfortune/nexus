'use client';

import React, { useState } from 'react';
import DropZone from '../components/upload/Drop_zone';
import InfoCard from '../components/upload/Infocard';
import { Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
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
      const response = await fetch(process.env.NEXT_PUBLIC_FASTAPI_URL + '/api/v1/ai/dashboard/upload-sales', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // 1. 서버가 왜 거절했는지 진짜 이유를 텍스트로 뽑아냅니다.
        const errorDetail = await response.text();

        // 2. 개발자 도구 콘솔에 빨간 글씨로 출력합니다. (여기에 진짜 범인이 있습니다!)
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
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
              <Upload size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">데이터 업로드</h1>
          </div>
          <p className="text-white/60 max-w-2xl text-lg">
            과거 매출 내역이 담긴 CSV 파일을 업로드하여 데이터베이스에 저장하세요.
            저장된 데이터는 분석 및 예측 시스템의 기초 자료로 활용됩니다.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              {!success ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2 text-indigo-400">CSV 파일 업로드</h2>
                    <p className="text-white/40 text-sm">분석할 매출 내역이 담긴 CSV 파일을 드래그 앤 드롭 하세요.</p>
                  </div>
                  <DropZone onFilesSelected={handleFileUpload} isLoading={isLoading} />
                  {isLoading && (
                    <div className="mt-6 flex items-center justify-center gap-3 text-indigo-400 animate-pulse">
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">데이터를 안전하게 적재 중입니다...</span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-500">
                  <div className="p-6 bg-green-500/20 rounded-full mb-6 text-green-400 ring-8 ring-green-500/5">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">업로드 완료!</h2>
                  <p className="text-white/60 mb-8 max-w-md">
                    {success} <br />
                    이제 '예측 및 분석' 메뉴에서 적재된 데이터를 확인하실 수 있습니다.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setSuccess(null)}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                    >
                      추가 업로드
                    </button>
                    <Link
                      href="/dashboard/predict"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/20"
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
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-400" />
                  파일 가이드
                </h3>
                <ul className="text-sm text-white/60 space-y-3">
                  <li className="flex gap-2">
                    <span className="text-indigo-400">•</span>
                    첫 번째 열은 '날짜'여야 합니다. (예: 2024-04-30)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400">•</span>
                    두 번째 열은 '매출액'이어야 합니다. (예: 500000)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400">•</span>
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
