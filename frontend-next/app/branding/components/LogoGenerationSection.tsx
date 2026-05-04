"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL + "/api/v1/ai/branding";

interface Logo {
  id: string;
  url: string;
}

export default function LogoGenerationSection({
  identity,
  onBack,
  onComplete,
}: {
  identity: any;
  onBack: () => void;
  onComplete: (logo: Logo) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateLogos = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const targetId = identity?.identityId || identity?.id; 
      
      const response = await fetch(`${API_BASE_URL}/identity/${targetId}/logo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        const newLogos = result.data.map((l: any) => ({
          id: l.tempId,
          url: l.imageUrl.startsWith("http") || l.imageUrl.startsWith("data:")
            ? l.imageUrl
            : `${process.env.NEXT_PUBLIC_FASTAPI_URL}${l.imageUrl}`,
        }));
        setLogos(newLogos);
        if (newLogos.length > 0) setSelectedLogoId(newLogos[0].id);
      } else {
        throw new Error(result.message || "로고 생성에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("Logo generation error:", err);
      setError(err.message || "백엔드 서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSelection = async () => {
    const selected = logos.find(l => l.id === selectedLogoId);
    if (!selected) return;

    setIsFinalizing(true);
    try {
      const targetId = identity?.identityId || identity?.id;
      // Base64 데이터인 경우 그대로 전송, 일반 URL인 경우 상대 경로 추출
      const sendUrl = selected.url.startsWith("data:image") 
        ? selected.url 
        : selected.url.replace(process.env.NEXT_PUBLIC_FASTAPI_URL + "", "");

      const response = await fetch(`${API_BASE_URL}/identity/${targetId}/logo/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: sendUrl }),
      });

      const result = await response.json();
      if (result.success) {
        // 확정된 ID와 함께 완료 처리
        onComplete({ ...selected, id: result.logoAssetId });
      } else {
        throw new Error(result.message || "로고 확정에 실패했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "로고를 확정하는 중 오류가 발생했습니다.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      if (url.startsWith("data:image")) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("Download failed:", err);
      alert("다운로드에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-tertiary-fixed)] text-[var(--nexus-tertiary)] rounded-full text-[10px] font-black uppercase tracking-widest">
          AI Design Studio
        </div>
        <h2 className="text-4xl font-black text-[var(--nexus-on-bg)] tracking-tight">Logo Visualizations</h2>
        <p className="text-gray-500 font-medium max-w-xl mx-auto text-sm leading-relaxed">
          인공지능이 제안하는 브랜드 컨셉입니다. 마음에 드는 디자인을 선택하시면 브랜드의 핵심 아이덴티티가 완성됩니다.
        </p>
        {!logos.length && (
          <div className="pt-6">
            <button
              onClick={generateLogos}
              disabled={isGenerating}
              className={`px-12 py-5 bg-[var(--nexus-primary)] text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl shadow-[var(--nexus-primary)]/20 hover:-translate-y-1 active:scale-95 ${
                isGenerating ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--nexus-primary-container)]"
              }`}
            >
              {isGenerating ? "Analyzing Visual Patterns..." : "Generate Logo Concepts"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-12">
        {/* Top Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white border border-[var(--nexus-outline-variant)]/30 rounded-[2.5rem] shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center text-[var(--nexus-primary)] border border-[var(--nexus-outline-variant)]/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Brand Identity</h4>
              <p className="text-xl font-black text-[var(--nexus-on-bg)]">{identity?.brandName}</p>
            </div>
          </div>

          <div className="p-8 bg-white border border-[var(--nexus-outline-variant)]/30 rounded-[2.5rem] shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center text-[var(--nexus-secondary)] border border-[var(--nexus-outline-variant)]/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Slogan Strategy</h4>
              <p className="text-sm font-bold text-[var(--nexus-on-bg)] italic opacity-70">"{identity?.slogan}"</p>
            </div>
          </div>
        </div>

        {/* Logos Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black text-[var(--nexus-on-bg)] tracking-tight">Curated Designs</h3>
            {logos.length > 0 && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">3 Options Generated</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {isGenerating ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="aspect-square bg-[var(--nexus-surface-low)] rounded-[3rem] border border-[var(--nexus-outline-variant)]/20 flex flex-col items-center justify-center gap-6 animate-pulse">
                  <div className="w-12 h-12 border-4 border-[var(--nexus-primary-container)]/20 border-t-[var(--nexus-primary)] rounded-full animate-spin"></div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Drafting Concept 0{i}...</p>
                </div>
              ))
            ) : logos.length > 0 ? (
              logos.map((logo, idx) => (
                <div
                  key={logo.id}
                  className={`group relative flex flex-col gap-4`}
                >
                  <div 
                    onClick={() => setSelectedLogoId(logo.id)}
                    className={`relative aspect-square cursor-pointer overflow-hidden rounded-[3.5rem] border-4 transition-all duration-700 p-2 ${
                      selectedLogoId === logo.id
                        ? "border-[var(--nexus-primary)] bg-white shadow-[0_40px_80px_-20px_rgba(11,26,125,0.2)] -translate-y-3"
                        : "border-transparent bg-[var(--nexus-surface-low)] hover:border-[var(--nexus-outline-variant)]"
                    }`}
                  >
                    <div className="w-full h-full rounded-[3rem] overflow-hidden bg-white flex items-center justify-center p-12">
                      <img
                        src={logo.url}
                        alt={`Logo Option ${idx + 1}`}
                        className="max-w-full max-h-full object-contain transition-transform duration-[2s] group-hover:scale-110 filter drop-shadow-sm"
                      />
                    </div>
                    {selectedLogoId === logo.id && (
                      <div className="absolute top-6 right-6">
                        <div className="w-10 h-10 bg-[var(--nexus-primary)] text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white animate-in zoom-in duration-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleDownload(logo.url, `Logo_Option_${idx+1}.png`)}
                    className="flex items-center justify-center gap-2 py-3 text-[10px] font-black text-gray-400 hover:text-[var(--nexus-primary)] transition-all uppercase tracking-widest"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Asset
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-28 bg-[var(--nexus-surface-low)] rounded-[4rem] border-2 border-dashed border-[var(--nexus-outline-variant)]/30 flex flex-col items-center justify-center text-gray-400 gap-6 transition-all">
                <div className="w-20 h-20 rounded-[2rem] border-2 border-dashed border-gray-300 flex items-center justify-center opacity-30">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Ready to Visualize</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer / Notice */}
      <div className="bg-[var(--nexus-surface-low)] border border-[var(--nexus-outline-variant)]/40 rounded-2xl p-5 flex items-start gap-4">
        <div className="text-gray-400 mt-0.5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-[var(--nexus-on-bg)]">Notice: 저작권 및 상표권 안내</h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            AI가 제안하는 본 로고 디자인은 창업 준비를 위한 <strong>초안(Draft) 용도</strong>입니다. 실제 상표(Trademark) 등록 및 상업적 사용을 위해서는 KIPRIS 등을 통한 <strong>유사성 검토와 전문가의 리터칭</strong>을 권장합니다.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-12 border-t border-[var(--nexus-outline-variant)]/20 flex flex-col md:flex-row justify-between items-center gap-8">
        <button
          onClick={onBack}
          className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[var(--nexus-on-bg)] transition-colors"
        >
          ← Back to Identity Choice
        </button>

        <div className="flex gap-4 w-full md:w-auto">
          {logos.length > 0 && (
            <button
              onClick={generateLogos}
              disabled={isGenerating || isFinalizing}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-5 border-2 border-[var(--nexus-outline-variant)]/30 rounded-2xl text-xs font-black text-gray-500 hover:bg-white hover:border-[var(--nexus-outline-variant)] transition-all active:scale-95 uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          )}
          <button
            disabled={!selectedLogoId || isGenerating || isFinalizing}
            onClick={handleConfirmSelection}
            className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${
              selectedLogoId && !isGenerating && !isFinalizing
                ? "bg-[var(--nexus-primary)] text-white hover:bg-[var(--nexus-primary-container)] shadow-[var(--nexus-primary)]/30"
                : "bg-gray-100 text-gray-300 cursor-not-allowed shadow-none"
            }`}
          >
            {isFinalizing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

