"use client";

import { useState } from "react";

interface Identity {
  identityId: string; // 백엔드 UUID 규격에 맞춤
  brandName: string;
  slogan: string;
  brandStory: string;
  keywords: string[];
}

const mockIdentities: Identity[] = [
  {
    identityId: "550e8400-e29b-41d4-a716-446655440000",
    brandName: "네이처링크 (NatureLink)",
    slogan: "자연과 일상을 잇는 건강한 연결",
    brandStory: "친환경 소재와 지속 가능한 가치를 우선시하는 정직한 브랜드입니다.",
    keywords: ["친환경", "미니멀", "신뢰"],
  },
  {
    identityId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    brandName: "테크에지 (TechEdge)",
    slogan: "기술의 경계를 넓히는 혁신",
    brandStory: "최신 기술력과 세련된 디자인으로 미래를 선도하는 프리미엄 브랜드입니다.",
    keywords: ["혁신", "정밀", "미래지향"],
  },
  {
    identityId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    brandName: "데일리허브 (DailyHub)",
    slogan: "매일의 일상을 더 편리하게",
    brandStory: "친근하고 편리한 서비스로 고객의 일상 속에 자연스럽게 스며드는 브랜드입니다.",
    keywords: ["친근함", "편리함", "일상"],
  },
];

export default function IdentitySelectionSection({
  namingOptions,
  onBack,
  onComplete,
}: {
  namingOptions: Identity[];
  onBack: () => void;
  onComplete: (identity: Identity) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 데이터가 없을 경우를 대비한 방어 코드
  if (!namingOptions || namingOptions.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
        <p className="text-gray-500">추천된 브랜드 정보가 없습니다. 다시 시도해 주세요.</p>
        <button onClick={onBack} className="mt-4 text-sm font-bold text-black underline">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-black text-[var(--nexus-on-bg)] tracking-tight">Identity Candidates</h2>
        <p className="text-gray-500 font-medium max-w-lg mx-auto text-sm">대표님의 비즈니스 모델에 가장 부합하는 3가지 브랜드 정체성 후보입니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {namingOptions.map((item) => (
          <div
            key={item.identityId}
            onClick={() => setSelectedId(item.identityId)}
            className={`cursor-pointer group relative p-10 rounded-[2.5rem] transition-all duration-500 border-2 overflow-hidden ${
              selectedId === item.identityId
                ? "border-[var(--nexus-primary)] bg-white shadow-[0_30px_60px_-15px_rgba(11,26,125,0.12)] -translate-y-2"
                : "border-[var(--nexus-outline-variant)]/30 bg-[var(--nexus-surface-low)]/50 hover:border-[var(--nexus-outline-variant)]"
            }`}
          >
            {selectedId === item.identityId && (
              <div className="absolute top-6 right-6 w-10 h-10 bg-[var(--nexus-primary)] text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            
            <div className="space-y-6 relative">
              <div className="space-y-2">
                <h3 className="font-black text-2xl text-[var(--nexus-on-bg)] group-hover:text-[var(--nexus-primary)] transition-colors">{item.brandName}</h3>
                <p className="text-sm text-[var(--nexus-secondary)] font-bold italic opacity-70 leading-relaxed">"{item.slogan}"</p>
              </div>
              
              <div className="h-px w-12 bg-[var(--nexus-outline-variant)]/30" />
              
              <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-5">
                {item.brandStory}
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {item.keywords?.map((kw) => (
                  <span key={kw} className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 bg-[var(--nexus-surface-container)] text-[var(--nexus-primary)] rounded-lg">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-[var(--nexus-outline-variant)]/20">
        <button
          onClick={onBack}
          className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[var(--nexus-on-bg)] transition-colors"
        >
          ← Back to Strategy Analysis
        </button>
        <button
          disabled={!selectedId}
          onClick={() => {
            const selected = namingOptions.find(i => i.identityId === selectedId);
            if (selected) onComplete(selected);
          }}
          className={`w-full md:w-auto px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${
            selectedId
              ? "bg-[var(--nexus-primary)] text-white hover:bg-[var(--nexus-primary-container)] shadow-[var(--nexus-primary)]/30"
              : "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
          }`}
        >
          Confirm and Proceed to Logo Design
        </button>
      </div>
    </div>
  );
}

