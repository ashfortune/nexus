'use client';

import { api } from '@/lib/api';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import InterviewSection from '../components/InterviewSection';
import IdentitySelectionSection from '../components/IdentitySelectionSection';
import LogoGenerationSection from '../components/LogoGenerationSection';
import BrandingAssetsSection from '../components/BrandingAssetsSection';

function BrandingPageContent() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  const [step, setStep] = useState(1);
  const [isResuming, setIsResuming] = useState(!!resumeId);
  const [brandData, setBrandData] = useState<any>({
    description: '',
    namingOptions: [],
    selectedIdentity: null,
    selectedLogo: null,
    projectId: null,
    chatHistory: [],
    keywords: [],
    isFinished: false,
  });

  // 데이터 이어하기 로직
  useEffect(() => {
    if (resumeId) {
      const fetchResumeData = async () => {
        try {
          const res = await api.get(`/api/v1/branding/${resumeId}`);
          const data = await res.json();
          // 상태 및 데이터 복구
          const recoveredData: any = {
            projectId: data.id,
            namingOptions: data.identities || [],
            chatHistory: Array.isArray(data.chatHistory) ? data.chatHistory : [],
            keywords: data.keywords?.extracted_keywords || [],
            selectedIdentity: data.identities?.find((i: any) => i.isSelected) || null,
            isFinished:
              data.industryCategoryId !== '550e8400-e29b-41d4-a716-446655440000' &&
              data.keywords?.extracted_keywords?.length > 0,
          };
          // 현재 단계 결정
          let startStep = 1;
          if (data.currentStep === 'NAMING_READY') startStep = 2;
          else if (data.currentStep === 'LOGO_GENERATION') startStep = 3;
          else if (data.currentStep === 'ASSET_SELECT') startStep = 4;
          else if (data.currentStep === 'COMPLETED') startStep = 4;
          
          setBrandData(recoveredData);
          setStep(startStep);
        } catch (error) {
          console.error('Resume failed:', error);
          alert('데이터를 불러오지 못했습니다. 새로운 프로젝트로 시작합니다.');
        } finally {
          setIsResuming(false);
        }
      };
      fetchResumeData();
    }
  }, [resumeId]);

  // 브라우저 이탈 방지 경고 및 안내
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Step 4(최종 확정 단계)가 아니거나 데이터가 있는 경우 경고
      if (step < 4) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step]);

  const handleInterviewComplete = (namingOptions: any[]) => {
    setBrandData({ ...brandData, namingOptions });
    setStep(2);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  if (isResuming) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--nexus-surface-lowest)]">
        <div className="w-16 h-16 border-4 border-[var(--nexus-primary-container)]/20 border-t-[var(--nexus-primary)] rounded-full animate-spin mb-8" />
        <h2 className="text-xl font-black text-[var(--nexus-on-bg)] uppercase tracking-[0.2em] animate-pulse">
          Syncing Session...
        </h2>
        <p className="text-gray-400 mt-2 font-medium">이전 브랜딩 데이터를 복구하고 있습니다.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-16 flex flex-col gap-12">
      {/* Step Indicator (Hextech Blueprint Style) */}
      <div className="flex flex-col items-center gap-6 mb-4">
        <div className="flex items-center gap-2 md:gap-4 p-2 bg-[var(--nexus-surface-low)]/50 border border-[var(--nexus-outline-variant)]/30 rounded-full overflow-x-auto max-w-full">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2 md:gap-4">
              <div
                className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 ${
                  step === s
                    ? 'bg-[var(--nexus-primary)] text-white shadow-[0_10px_30px_-5px_rgba(11,26,125,0.3)] scale-105'
                    : step > s
                      ? 'bg-[var(--nexus-tertiary-fixed)] text-[var(--nexus-tertiary)]'
                      : 'bg-transparent text-gray-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-colors ${
                    step === s
                      ? 'border-white bg-white text-[var(--nexus-primary)]'
                      : step > s
                        ? 'border-[var(--nexus-tertiary)] bg-transparent text-[var(--nexus-tertiary)]'
                        : 'border-gray-300 bg-transparent text-gray-400'
                  }`}
                >
                  {s}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap hidden sm:inline">
                  {s === 1 ? 'Analysis' : s === 2 ? 'Identity' : s === 3 ? 'Visuals' : 'Marketing'}
                </span>
              </div>
              {s < 4 && (
                <div className="w-4 h-0.5 bg-[var(--nexus-outline-variant)]/20 last:hidden" />
              )}
            </div>
          ))}
        </div>

        {/* 안내 문구 추가 */}
        {step < 4 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--nexus-error-container)]/10 border border-[var(--nexus-error)]/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500">
            <svg className="w-4 h-4 text-[var(--nexus-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-[11px] font-bold text-[var(--nexus-error)]">
              주의: 최종 확정 전 페이지를 새로고침하거나 뒤로가기를 누르면 진행 중인 데이터가 초기화될 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 animate-in fade-in duration-1000">
        {step === 1 && (
          <InterviewSection
            onComplete={handleInterviewComplete}
            initialProjectId={brandData.projectId}
            initialMessages={brandData.chatHistory}
            initialKeywords={brandData.keywords}
            initialIsFinished={brandData.isFinished}
          />
        )}
        {step === 2 && (
          <IdentitySelectionSection
            namingOptions={brandData.namingOptions}
            onBack={prevStep}
            onComplete={(identity) => {
              setBrandData({ ...brandData, selectedIdentity: identity });
              nextStep();
            }}
          />
        )}
        {step === 3 && (
          <LogoGenerationSection
            identity={brandData.selectedIdentity}
            onBack={prevStep}
            onComplete={(logo) => {
              setBrandData({ ...brandData, selectedLogo: logo });
              nextStep();
            }}
          />
        )}
        {step === 4 && (
          <BrandingAssetsSection
            identity={brandData.selectedIdentity}
            logo={brandData.selectedLogo}
            onBack={prevStep}
          />
        )}
      </div>
    </main>
  );
}

export default function BrandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--nexus-surface-lowest)]">
          <div className="w-16 h-16 border-4 border-[var(--nexus-primary-container)]/20 border-t-[var(--nexus-primary)] rounded-full animate-spin mb-8" />
          <h2 className="text-xl font-black text-[var(--nexus-on-bg)] uppercase tracking-[0.2em] animate-pulse">
            Loading...
          </h2>
        </div>
      }
    >
      <BrandingPageContent />
    </Suspense>
  );
}
