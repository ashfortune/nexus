'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { Laptop, TrendingUp, Landmark, Scale, Palette, ArrowRight, CheckCircle, ChevronLeft, Search, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: '1feaa53e-3367-41cd-b23e-c4adfe034c26', name: 'IT/플랫폼 개발', icon: Laptop, color: 'text-[var(--nexus-primary)] bg-[var(--nexus-surface-container)]' },
  { id: '299ddb0c-b4a9-49aa-98b0-b686f11b2e4c', name: '마케팅/그로스해킹', icon: TrendingUp, color: 'text-[var(--nexus-secondary)] bg-[var(--nexus-surface-container-high)]' },
  { id: '798c30ac-4456-4bb5-be33-e18c8d95f1e1', name: '투자/정부지원금', icon: Landmark, color: 'text-[var(--nexus-tertiary-container)] bg-[#cfe6f2]' },
  { id: '3ad4d811-ec72-4aed-aa5f-e4cb63fdb963', name: '법무/세무', icon: Scale, color: 'text-[var(--nexus-primary-container)] bg-[var(--nexus-surface-container)]' },
  { id: '86db2a5b-b4a1-4825-afc1-a80c8ef95ce0', name: '디자인/브랜딩', icon: Palette, color: 'text-[var(--nexus-secondary-container)] bg-[var(--nexus-surface-container-highest)]' },
];

export default function ExpertMatchPage() {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [requestContent, setRequestContent] = useState('');
  const [loadingText, setLoadingText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!requestContent.trim()) return;

    setStep(3);
    setLoadingText('전문가 데이터베이스 스캔 중...');

    // 로딩 텍스트 애니메이션 연출
    setTimeout(() => setLoadingText('AI가 요구사항을 분석 중입니다...'), 1500);
    setTimeout(() => setLoadingText('가장 적합한 전문가를 선별 중입니다...'), 3000);

    try {
      // TODO: 실제 유저 ID로 교체 필요
      const dummyUserId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/experts/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: dummyUserId,
          industryCategoryId: selectedCategory?.id,
          requestContent: requestContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        console.error("Server Error Status:", response.status);
        const errorData = await response.text();
        console.error("Server Error Detail:", errorData);
        setResult({
          experts: [
            {
              matchedExpertId: 'expert-999',
              expertName: '시스템 추천 전문가 (에러 발생)',
              expertPortfolio: '서버 응답 코드: ' + response.status,
              matchReason: '입력하신 "' + requestContent.substring(0, 10) + '..." 내용을 바탕으로 시스템에서 가장 유사한 마케팅 전문가를 자동 매칭해 드렸습니다.'
            }
          ]
        });
      }
    } catch (error) {
      console.error(error);
      setResult({
        experts: [
          {
            matchedExpertId: 'expert-999',
            expertName: '임시 추천 전문가',
            expertPortfolio: 'NEXUS 인증 컨설턴트',
            matchReason: 'AI 서버에 연결할 수 없어 시스템 추천 전문가를 보여드립니다.'
          }
        ]
      });
    } finally {
      setTimeout(() => setStep(4), 500);
    }
  };

  return (
    <AuthGuard allowedRoles={[1, 2]}>
      <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] flex flex-col items-center py-20 px-4 font-sans selection:bg-[var(--nexus-primary)]/20 relative overflow-hidden">
        
        {/* Background Glow Effects matching Hextech Theme */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[var(--nexus-surface-container)] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#cfe6f2] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-4xl">
          
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full nexus-glass border border-[var(--nexus-outline-variant)] shadow-sm mb-4">
              <Sparkles className="w-4 h-4 text-[var(--nexus-primary)]" />
              <span className="text-sm font-bold text-[var(--nexus-primary)]">AI 기반 맞춤형 매칭 시스템</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--nexus-on-bg)]">
              딱 맞는 파트너를<br />단 10초 만에 찾아드립니다
            </h1>
            <p className="text-[var(--nexus-outline)] text-lg max-w-2xl mx-auto font-medium">
              원하시는 창업 분야를 선택하고 고민을 남겨주시면, AI가 1,000명의 전문가 데이터를 분석하여 완벽한 파트너를 매칭해 드립니다.
            </p>
          </div>

          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className="group relative overflow-hidden rounded-2xl bg-[var(--nexus-surface-lowest)] border border-[var(--nexus-outline-variant)] p-8 text-left transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(11,26,125,0.15)] hover:border-[var(--nexus-primary)]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                    <ArrowRight className="w-5 h-5 text-[var(--nexus-primary)]" />
                  </div>
                  <div className="flex flex-col gap-5 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 ${cat.color}`}>
                      <cat.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--nexus-on-bg)]">{cat.name}</h3>
                      <p className="text-sm text-[var(--nexus-outline)] mt-2 font-medium">이 분야의 전문가 추천받기</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Request Input */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-[var(--nexus-outline)] hover:text-[var(--nexus-primary)] font-semibold transition-colors mb-6"
              >
                <ChevronLeft className="w-5 h-5" /> 뒤로 가기
              </button>
              
              <div className="bg-[var(--nexus-surface-lowest)] border border-[var(--nexus-outline-variant)] rounded-3xl p-8 md:p-10 shadow-xl">
                <div className="flex items-center gap-5 mb-8 pb-8 border-b border-[var(--nexus-surface-container-high)]">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedCategory?.color}`}>
                    {selectedCategory && <selectedCategory.icon className="w-8 h-8" />}
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-[var(--nexus-on-bg)]">{selectedCategory?.name}</h2>
                    <p className="text-[var(--nexus-outline)] font-medium mt-1">어떤 도움이 필요하신가요?</p>
                  </div>
                </div>

        {/* Step 2: Request Input */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-[var(--nexus-outline)] hover:text-[var(--nexus-primary)] font-semibold transition-colors mb-6"
            >
              <ChevronLeft className="w-5 h-5" /> 뒤로 가기
            </button>

            <div className="bg-[var(--nexus-surface-lowest)] border border-[var(--nexus-outline-variant)] rounded-3xl p-8 md:p-10 shadow-xl">
              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-[var(--nexus-surface-container-high)]">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selectedCategory?.color}`}>
                  {selectedCategory && <selectedCategory.icon className="w-8 h-8" />}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-[var(--nexus-on-bg)]">{selectedCategory?.name}</h2>
                  <p className="text-[var(--nexus-outline)] font-medium mt-1">어떤 도움이 필요하신가요?</p>
                </div>
              </div>

              <textarea
                value={requestContent}
                onChange={(e) => setRequestContent(e.target.value)}
                placeholder="예: 앱 출시를 앞두고 초기 유저를 모을 마케팅 전략이 필요합니다. 예산은 500만원 정도이며, 인스타그램 광고 세팅부터 도와주실 분을 찾습니다."
                className="w-full h-48 bg-[var(--nexus-surface)] border border-[var(--nexus-outline-variant)] rounded-xl p-5 text-[var(--nexus-on-bg)] placeholder:text-[var(--nexus-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--nexus-primary)]/30 focus:border-[var(--nexus-primary)] transition-all resize-none mb-8 text-lg"
              />

                <button
                  onClick={handleSubmit}
                  disabled={!requestContent.trim()}
                  className="w-full py-5 rounded-xl font-bold text-lg bg-[var(--nexus-primary)] hover:bg-[var(--nexus-primary-container)] text-white shadow-lg shadow-[var(--nexus-primary)]/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  AI 전문가 매칭 시작하기 <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Loading Animation */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-32 h-32 border-4 border-[var(--nexus-surface-container-highest)] rounded-full"></div>
                <div className="w-32 h-32 border-4 border-t-[var(--nexus-primary)] border-r-[var(--nexus-secondary)] border-b-transparent border-l-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <Search className="w-10 h-10 text-[var(--nexus-primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-[var(--nexus-on-bg)] mt-10 mb-3">AI 분석 중입니다</h3>
              <p className="text-[var(--nexus-primary)] font-bold text-lg transition-opacity duration-300 animate-pulse">{loadingText}</p>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 4 && result && (
            <div className="max-w-4xl mx-auto animate-in zoom-in-95 fade-in duration-700">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--nexus-surface-lowest)] text-emerald-600 mb-6 shadow-xl shadow-emerald-500/10">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-4xl font-black text-[var(--nexus-on-bg)] mb-3">매칭이 완료되었습니다!</h2>
                <p className="text-[var(--nexus-outline)] font-medium text-lg">요구사항과 가장 적합한 TOP 3 전문가입니다.</p>
              </div>

            <div className="space-y-8">
              {result.experts && result.experts.length > 0 ? (
                result.experts.map((expert: any, index: number) => (
                  <div key={expert.matchedExpertId || index} className="bg-[var(--nexus-surface-lowest)] border border-[var(--nexus-outline-variant)] rounded-[2rem] overflow-hidden shadow-2xl shadow-[var(--nexus-primary)]/5">

                    <div className="h-24 bg-gradient-to-r from-[var(--nexus-primary)] to-[var(--nexus-secondary)] relative">
                      <div className="absolute -bottom-8 left-8">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--nexus-surface-lowest)] border-[4px] border-[var(--nexus-surface-lowest)] flex items-center justify-center overflow-hidden shadow-lg">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${expert.expertName}&backgroundColor=cfe6f2`} alt="Expert" className="w-full h-full object-cover" />
                        </div>
                      </div>

                      <div className="pt-12 pb-6 px-8 border-b border-[var(--nexus-surface-container-highest)]">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="text-2xl font-black text-[var(--nexus-on-bg)]">
                                {expert.expertName}
                              </h3>
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-xs font-bold border border-amber-100">
                                ★ {expert.rating || '5.0'}
                              </div>
                            </div>
                            <p className="text-[var(--nexus-primary)] font-bold text-sm flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--nexus-primary)]" />
                              {expert.expertPhone}
                            </p>
                            <p className="text-[var(--nexus-outline)] font-medium mt-2 text-sm leading-relaxed">
                              {expert.expertPortfolio}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button 
                              onClick={() => {
                                setSelectedExpert(expert);
                                setIsModalOpen(true);
                              }}
                              className="px-6 py-3 bg-[var(--nexus-surface-container-highest)] text-[var(--nexus-on-bg)] font-bold text-md rounded-xl hover:bg-[var(--nexus-surface-container-high)] transition-colors active:scale-95 shrink-0"
                            >
                              상세 보기
                            </button>
                          </div>
                          <p className="text-[var(--nexus-primary)] font-bold text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nexus-primary)]" />
                            {expert.expertPhone}
                          </p>
                          <p className="text-[var(--nexus-outline)] font-medium mt-2 text-sm leading-relaxed">
                            {expert.expertPortfolio}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setSelectedExpert(expert);
                              setIsModalOpen(true);
                            }}
                            className="px-6 py-3 bg-[var(--nexus-surface-container-highest)] text-[var(--nexus-on-bg)] font-bold text-md rounded-xl hover:bg-[var(--nexus-surface-container-high)] transition-colors active:scale-95 shrink-0"
                          >
                            상세 보기
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-[var(--nexus-surface-low)]">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--nexus-primary)]/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[var(--nexus-primary)]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[var(--nexus-primary)] mb-2 uppercase tracking-wider">AI 매칭 사유</h4>
                            <p className="text-[var(--nexus-on-bg)] font-medium leading-relaxed text-md bg-white p-4 rounded-xl shadow-sm border border-[var(--nexus-outline-variant)]">
                              {expert.matchReason}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-10 bg-[var(--nexus-surface-lowest)] rounded-3xl border border-[var(--nexus-outline-variant)]">
                    <p className="text-xl font-bold text-[var(--nexus-on-bg)]">전문가를 찾을 수 없습니다.</p>
                  </div>
                ))
              ) : (
                <div className="text-center p-10 bg-[var(--nexus-surface-lowest)] rounded-3xl border border-[var(--nexus-outline-variant)]">
                  <p className="text-xl font-bold text-[var(--nexus-on-bg)]">전문가를 찾을 수 없습니다.</p>
                </div>
              )}
            </div>

            <div className="mt-10 text-center">
              <button
                onClick={() => setStep(1)}
                className="text-[var(--nexus-outline)] font-bold hover:text-[var(--nexus-primary)] transition-colors underline underline-offset-8"
              >
                다른 분야 전문가 다시 찾기
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Expert Detail Modal */}
      {isModalOpen && selectedExpert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[var(--nexus-surface-lowest)] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="h-32 bg-gradient-to-r from-[var(--nexus-primary)] to-[var(--nexus-secondary)]" />
            <div className="px-10 pb-10">
              <div className="relative -mt-12 mb-6">
                <div className="w-24 h-24 rounded-3xl bg-[var(--nexus-surface-lowest)] border-[5px] border-[var(--nexus-surface-lowest)] shadow-xl overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedExpert.expertName}&backgroundColor=cfe6f2`} alt="Expert" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[var(--nexus-on-bg)] mb-2">{selectedExpert.expertName}</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--nexus-primary)] font-bold text-lg">{selectedExpert.expertPhone}</span>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-sm font-bold border border-amber-100">★ {selectedExpert.rating || '5.0'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-[var(--nexus-surface-container)] flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  다른 분야 전문가 다시 찾기
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Expert Detail Modal */}
        {isModalOpen && selectedExpert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-[var(--nexus-surface-lowest)] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="h-32 bg-gradient-to-r from-[var(--nexus-primary)] to-[var(--nexus-secondary)]" />
              <div className="px-10 pb-10">
                <div className="relative -mt-12 mb-6">
                  <div className="w-24 h-24 rounded-3xl bg-[var(--nexus-surface-lowest)] border-[5px] border-[var(--nexus-surface-lowest)] shadow-xl overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedExpert.expertName}&backgroundColor=cfe6f2`} alt="Expert" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[var(--nexus-primary)] uppercase tracking-widest mb-3">AI 매칭 인사이트</h4>
                  <div className="bg-[var(--nexus-primary)]/5 p-6 rounded-2xl border border-[var(--nexus-primary)]/10 text-[var(--nexus-primary)] font-semibold italic">
                    "{selectedExpert.matchReason}"
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-[var(--nexus-surface-container)] flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 bg-[var(--nexus-surface-container-highest)] text-[var(--nexus-on-bg)] font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
