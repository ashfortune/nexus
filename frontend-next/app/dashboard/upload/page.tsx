'use client';

import { api } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import DropZone from '../components/upload/Drop_zone';
import InfoCard from '../components/upload/Infocard';
import { Upload, CheckCircle2, AlertCircle, FileText, Plus, Trash2, Download, Save, Table as TableIcon } from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';

interface SalesRow {
  id: string;
  date: string;
  sales: number;
}

/**
 * 매출 데이터를 업로드하거나 웹 편집기를 통해 직접 입력하는 페이지입니다.
 */
const UploadPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [useEditor, setUseEditor] = useState(false);
  const [rows, setRows] = useState<SalesRow[]>([]);
  
  const { user } = useAuthStore();

  // 초기 행 추가
  useEffect(() => {
    if (rows.length === 0 && useEditor) {
      addMember();
    }
  }, [useEditor]);

  const addMember = () => {
    const newRow: SalesRow = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      sales: 0,
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof SalesRow, value: any) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.csv')) {
      setError('CSV 파일만 업로드 가능합니다.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCsvSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Spring Boot의 파싱 API 호출
      const response = await api.post('/api/v1/sales/upload', formData);
      
      if (!response.ok) throw new Error('CSV 파싱에 실패했습니다.');
      
      const result = await response.json();
      
      // 파싱된 데이터를 편집기에 로드
      const importedRows: SalesRow[] = result.data.map((item: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        date: item.date,
        sales: item.sales
      }));
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const hasFutureDate = importedRows.some(r => new Date(r.date) > today);
      
      setRows(importedRows);
      setUseEditor(true);
      
      if (hasFutureDate) {
        setError('불러온 데이터 중 오늘 이후의 날짜가 포함되어 있습니다. 미래 날짜는 저장이 불가능하므로 편집기에서 수정해주세요.');
      } else {
        setCsvSuccess('CSV 데이터가 편집기로 성공적으로 불러와졌습니다. 내용을 확인 후 저장해주세요.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveData = async () => {
    if (rows.length === 0) {
      setError('저장할 데이터가 없습니다.');
      return;
    }

    // 유효성 검사
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 제외하고 날짜만 비교

    const futureRow = rows.find(r => new Date(r.date) > today);
    const invalidFormatRow = rows.find(r => !r.date || r.sales < 0);

    if (futureRow) {
      setError(`미래 날짜(${futureRow.date})의 매출 데이터는 입력할 수 없습니다. 오늘 또는 이전 날짜를 선택해주세요.`);
      return;
    }

    if (invalidFormatRow) {
      setError('날짜와 매출액을 올바르게 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setCsvSuccess(null);

    try {
      const response = await api.post('/api/v1/sales/save', {
        userId: user?.id,
        data: rows.map(r => ({ date: r.date, sales: r.sales }))
      });

      if (!response.ok) throw new Error('데이터 저장 중 오류가 발생했습니다.');

      const result = await response.json();
      setSuccess(result.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={[1, 2]}>
      <div className="min-h-screen p-8 text-[var(--nexus-on-bg)]">

      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] rounded-2xl shadow-lg">
                <Upload size={24} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">데이터 업로드 및 편집</h1>
            </div>
            <p className="text-[var(--nexus-outline)] max-w-2xl text-lg">
              매출 내역을 업로드하거나 웹 편집기에서 직접 입력하세요. (기존 데이터는 덮어씌워집니다)
            </p>
          </div>
          <div className="flex gap-3">
             <a 
               href="/templates/sales_template.csv" 
               download 
               className="flex items-center gap-2 px-4 py-2 bg-[var(--nexus-surface-container)] hover:bg-[var(--nexus-surface-container-high)] border border-[var(--nexus-outline-variant)] rounded-xl text-sm font-medium transition-all"
             >
               <Download size={16} />
               CSV 양식 다운로드
             </a>
             <button
               onClick={() => setUseEditor(!useEditor)}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                 useEditor ? 'bg-[var(--nexus-secondary)] text-[var(--nexus-on-secondary)]' : 'bg-[var(--nexus-surface-container)] border border-[var(--nexus-outline-variant)]'
               }`}
             >
               <TableIcon size={16} />
               {useEditor ? '파일 업로드로 변경' : '웹 편집기 사용'}
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="nexus-card border border-[var(--nexus-outline-variant)] rounded-3xl p-8 shadow-2xl min-h-[400px]">
              {!success ? (
                <>
                  {error && (
                    <div className="mb-6 p-4 bg-[var(--nexus-error)]/10 border border-[var(--nexus-error)]/20 rounded-xl flex items-center gap-3 text-[var(--nexus-error)] text-sm animate-in fade-in slide-in-from-top-2">
                      <AlertCircle size={18} />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}

                  {csvSuccess && (
                    <div className="mb-6 p-4 bg-[#059669]/10 border border-[#059669]/20 rounded-xl flex items-center gap-3 text-[#059669] text-sm animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 size={18} />
                      <span className="font-medium">{csvSuccess}</span>
                    </div>
                  )}

                  {!useEditor ? (
                    <div className="animate-in fade-in duration-500">
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-2 text-[var(--nexus-primary)]">CSV 파일 업로드</h2>
                        <p className="text-[var(--nexus-outline)] text-sm">
                          준비된 CSV 파일을 업로드하여 데이터를 편집기에 로드하세요.
                        </p>
                      </div>
                      <DropZone onFilesSelected={handleFileUpload} isLoading={isLoading} />
                    </div>
                  ) : (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-xl font-semibold text-[var(--nexus-primary)]">웹 데이터 편집기</h2>
                          <p className="text-[var(--nexus-outline)] text-sm">매출 데이터를 직접 수정하거나 추가할 수 있습니다.</p>
                        </div>
                        <button 
                          onClick={addMember}
                          className="flex items-center gap-2 px-3 py-2 bg-[var(--nexus-primary-container)] text-[var(--nexus-on-primary-container)] rounded-lg text-sm hover:opacity-80 transition-all"
                        >
                          <Plus size={16} /> 행 추가
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-[var(--nexus-outline-variant)] max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-[var(--nexus-surface-container-high)] sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="p-4 text-sm font-bold border-b border-[var(--nexus-outline-variant)]">날짜</th>
                              <th className="p-4 text-sm font-bold border-b border-[var(--nexus-outline-variant)]">매출액 (원)</th>
                              <th className="p-4 text-sm font-bold border-b border-[var(--nexus-outline-variant)] w-16">삭제</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => (
                              <tr key={row.id} className="border-b border-[var(--nexus-outline-variant)] hover:bg-[var(--nexus-surface-container)] transition-colors">
                                <td className="p-2">
                                  <input 
                                    type="date" 
                                    value={row.date}
                                    onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                    className="w-full p-2 bg-transparent border-none focus:ring-2 ring-[var(--nexus-primary)] rounded-lg outline-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    value={row.sales}
                                    onChange={(e) => updateRow(row.id, 'sales', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 bg-transparent border-none focus:ring-2 ring-[var(--nexus-primary)] rounded-lg outline-none font-mono"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button 
                                    onClick={() => removeRow(row.id)}
                                    className="p-2 text-[var(--nexus-error)] hover:bg-[var(--nexus-error)]/10 rounded-lg transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {rows.length === 0 && (
                              <tr>
                                <td colSpan={3} className="p-12 text-center text-[var(--nexus-outline)]">
                                  데이터가 없습니다. '행 추가' 버튼을 눌러 입력을 시작하세요.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={handleSaveData}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-8 py-4 bg-[var(--nexus-primary)] hover:bg-[var(--nexus-secondary)] text-[var(--nexus-on-primary)] rounded-2xl font-bold transition-all shadow-xl disabled:opacity-50"
                        >
                          <Save size={20} />
                          {isLoading ? '저장 중...' : '데이터 최종 저장'}
                        </button>
                      </div>
                    </div>
                  )}

                  {isLoading && !useEditor && (
                    <div className="mt-6 flex items-center justify-center gap-3 text-[var(--nexus-primary)] animate-pulse">
                      <div className="w-5 h-5 border-2 border-[var(--nexus-primary)] border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium">데이터를 분석 중입니다...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 flex flex-col items-center text-center animate-in zoom-in duration-500">
                  <div className="p-6 bg-[#059669]/20 rounded-full mb-6 text-[#059669] ring-8 ring-[#059669]/5">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-[var(--nexus-on-bg)]">저장 완료!</h2>
                  <p className="text-[var(--nexus-outline)] mb-8 max-w-md">
                    {success} <br />
                    이제 '예측 및 분석' 메뉴에서 적재된 데이터를 확인하실 수 있습니다.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setSuccess(null);
                        setRows([]);
                        setUseEditor(false);
                      }}
                      className="px-6 py-3 bg-[var(--nexus-surface-container)] hover:bg-[var(--nexus-surface-container-high)] border border-[var(--nexus-outline-variant)] text-[var(--nexus-on-bg)] rounded-xl transition-all"
                    >
                      추가 입력/업로드
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
                    <span className="text-[var(--nexus-primary)]">•</span>
                    <strong>날짜</strong>: YYYY-MM-DD 형식으로 입력하세요.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--nexus-primary)]">•</span>
                    <strong>매출액</strong>: 쉼표 없이 숫자만 입력하세요.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[var(--nexus-primary)]">•</span>
                    <strong>덮어쓰기</strong>: 동일 날짜의 데이터가 존재하면 최신 내용으로 대체됩니다.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default UploadPage;
