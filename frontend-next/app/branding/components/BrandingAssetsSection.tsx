'use client';

import { api } from '@/lib/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || '';
const API_BASE_PATH = '/api/v1/ai/branding';

interface Logo {
  id: string;
  url: string;
  availableAssetTypes?: Array<{
    type: string;
    name: string;
    description: string;
  }>;
}

interface Asset {
  id: string;
  type: string;
  title: string;
  description: string;
  imageUrl: string;
}

export default function BrandingAssetsSection({
  identity,
  logo,
  onBack,
}: {
  identity: any;
  logo: Logo;
  onBack: () => void;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // 가이드 데이터가 없는 경우 기본값 제공 (방어적 코드)
  const availableAssets = logo?.availableAssetTypes || [
    { type: 'BUSINESS_CARD', name: '명함', description: '브랜드 로고가 담긴 세련된 명함' },
    { type: 'MENU', name: '메뉴판/가격표', description: '가독성 좋은 브랜드 전용 메뉴판' },
    { type: 'POSTER', name: '포스터', description: '매장 분위기를 살려주는 홍보용 포스터' }
  ];

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleGenerateAssets = async () => {
    if (selectedTypes.length === 0) {
      alert('최소 하나 이상의 에셋 타입을 선택해 주세요.');
      return;
    }

    setIsGenerating(true);
    try {
      const targetId = identity?.identityId || identity?.id;
      const response = await api.post(`${API_BASE_PATH}/identity/${targetId}/assets`, {
        assetTypes: selectedTypes
      }, {
        baseUrl: FASTAPI_URL,
      });
      const result = await response.json();

      if (result.success) {
        const newAssets = result.data.map((a: any) => ({
          ...a,
          imageUrl: a.imageUrl.startsWith('http')
            ? a.imageUrl
            : `${FASTAPI_URL}${a.imageUrl}`,
        }));
        setAssets(newAssets);
      } else {
        alert(result.message || '에셋 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('Asset generation error:', err);
      alert('에셋을 생성하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      // 이미지 다운로드는 인증이 필요할 수 있으므로 api.get 사용
      const response = await api.get(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* 1. Final Brand Logo Section (A1) */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-primary-fixed-dim)] text-[var(--nexus-primary)] rounded-full text-[10px] font-black uppercase tracking-widest">
            Identity Master
          </div>
          <h2 className="text-4xl font-black text-[var(--nexus-on-bg)] tracking-tight">
            Final Brand Signature
          </h2>
          <p className="text-gray-500 font-medium max-w-lg mx-auto text-sm">
            확정된 브랜드 로고와 핵심 자산입니다. 다양한 포맷으로 활용하세요.
          </p>
        </div>

        <div className="max-w-4xl mx-auto p-12 bg-white border border-[var(--nexus-outline-variant)]/30 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(7,30,39,0.08)] flex flex-col md:flex-row items-center gap-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--nexus-primary)]/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />

          <div className="w-64 h-64 bg-[var(--nexus-surface-low)] rounded-[2.5rem] flex items-center justify-center p-12 border border-[var(--nexus-outline-variant)]/20 shadow-inner group">
            {logo?.url ? (
              <img
                src={logo.url}
                alt="Final Logo"
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 filter drop-shadow-xl"
              />
            ) : (
              <div className="text-gray-400 font-medium">No Logo</div>
            )}
          </div>

          <div className="flex-1 space-y-8 text-center md:text-left relative">
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-[var(--nexus-on-bg)] tracking-tight">
                {identity?.brandName || 'Unknown Brand'}
              </h3>
              <p className="text-sm font-bold text-[var(--nexus-secondary)] italic opacity-70">
                "{identity?.slogan || 'No slogan provided'}"
              </p>
              <div className="h-1 w-12 bg-[var(--nexus-primary)] rounded-full mt-4" />
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button
                onClick={() =>
                  handleDownload(logo?.url || '', `${identity?.brandName || 'Brand'}_Logo.png`)
                }
                disabled={!logo?.url}
                className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                  logo?.url
                    ? 'bg-[var(--nexus-primary)] text-white hover:bg-[var(--nexus-primary-container)] shadow-xl shadow-[var(--nexus-primary)]/20 active:scale-95'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Master PNG
              </button>
              <button className="px-8 py-4 bg-[var(--nexus-surface-low)] text-gray-500 border border-[var(--nexus-outline-variant)]/30 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white hover:border-[var(--nexus-outline-variant)] transition-all">
                Export Source (SVG)
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-[var(--nexus-outline-variant)]/30 to-transparent w-full" />

      {/* 2. Mockups Grid Section (A2) */}
      <section className="space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-secondary-fixed-dim)] text-[var(--nexus-secondary)] rounded-full text-[10px] font-black uppercase tracking-widest">
            Marketing Visualizer
          </div>
          <h2 className="text-4xl font-black text-[var(--nexus-on-bg)] tracking-tight">
            Ecosystem Mockups
          </h2>
          <p className="text-gray-500 font-medium max-w-lg mx-auto text-sm leading-relaxed">
            로고가 실제 비즈니스 현장에서 어떻게 활용될 수 있는지 확인해 보세요.
          </p>
        </div>

        {!assets.length && (
          <div className="space-y-12 animate-in fade-in zoom-in duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {availableAssets.map((item: any) => (
                <div
                  key={item.type}
                  onClick={() => toggleType(item.type)}
                  className={`group p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden ${
                    selectedTypes.includes(item.type)
                      ? 'bg-white border-[var(--nexus-primary)] shadow-2xl shadow-[var(--nexus-primary)]/10 -translate-y-2'
                      : 'bg-[var(--nexus-surface-low)] border-transparent hover:border-[var(--nexus-outline-variant)]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
                    selectedTypes.includes(item.type)
                      ? 'bg-[var(--nexus-primary)] text-white'
                      : 'bg-white text-gray-400'
                  }`}>
                    {selectedTypes.includes(item.type) ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  <h4 className={`text-lg font-black mb-2 ${selectedTypes.includes(item.type) ? 'text-[var(--nexus-on-bg)]' : 'text-gray-500'}`}>
                    {item.name}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                  
                  {selectedTypes.includes(item.type) && (
                    <div className="absolute top-4 right-4">
                      <div className="w-2 h-2 bg-[var(--nexus-primary)] rounded-full animate-ping" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={handleGenerateAssets}
                disabled={isGenerating || selectedTypes.length === 0}
                className={`px-16 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-4 ${
                  selectedTypes.length > 0 && !isGenerating
                    ? 'bg-[var(--nexus-secondary)] text-white shadow-2xl shadow-[var(--nexus-secondary)]/30 hover:-translate-y-1 active:scale-95'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Branding Assets...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate {selectedTypes.length} Selected Assets
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {isGenerating
            ? [1, 2, 3].map((i) => (
                <div key={i} className="space-y-6 animate-pulse">
                  <div className="aspect-[4/3] bg-[var(--nexus-surface-low)] rounded-[3rem] border border-[var(--nexus-outline-variant)]/20" />
                  <div className="space-y-3 px-4">
                    <div className="h-3 bg-[var(--nexus-surface-low)] rounded-full w-1/3" />
                    <div className="h-5 bg-[var(--nexus-surface-low)] rounded-full w-3/4" />
                  </div>
                </div>
              ))
            : assets.map((asset) => (
                <div key={asset.id} className="group flex flex-col gap-6">
                  <div className="relative aspect-[4/3] bg-[var(--nexus-surface-low)] rounded-[3rem] overflow-hidden border border-[var(--nexus-outline-variant)]/30 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(7,30,39,0.15)] hover:-translate-y-2">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 font-black text-[9px] uppercase tracking-[0.3em] italic opacity-20 group-hover:opacity-0 transition-opacity">
                      Rendering {asset.title}...
                    </div>
                    <img
                      src={asset.imageUrl}
                      alt={asset.title}
                      className="w-full h-full object-cover transition-all duration-[1.5s] group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleDownload(asset.imageUrl, `${asset.title}.png`)}
                        className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:bg-[var(--nexus-primary)] hover:text-white"
                      >
                        Download Asset
                      </button>
                    </div>
                  </div>
                  <div className="px-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-[var(--nexus-secondary)] rounded-full" />
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {asset.type}
                      </h4>
                    </div>
                    <p className="text-base font-black text-[var(--nexus-on-bg)] leading-tight">
                      {asset.description}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* Bottom Actions */}
      <div className="pt-16 border-t border-[var(--nexus-outline-variant)]/20 flex flex-col md:flex-row justify-between items-center gap-8">
        <button
          onClick={onBack}
          className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[var(--nexus-on-bg)] transition-colors"
        >
          ← Back to Visual Design
        </button>
        <button
          onClick={() => {
            alert('모든 브랜딩 과정이 완료되었습니다! 대표님의 브랜드 보드로 이동합니다.');
            router.push('/branding');
          }}
          className="w-full md:w-auto px-16 py-6 bg-[var(--nexus-primary)] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-[var(--nexus-primary)]/30 hover:bg-[var(--nexus-primary-container)] hover:-translate-y-1 active:scale-95 transition-all"
        >
          Finalize and Exit Studio
        </button>
      </div>
    </div>
  );
}
