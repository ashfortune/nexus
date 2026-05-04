"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  Rocket, 
  Palette, 
  CheckCircle2,
  Layers,
  Share2,
  Calendar,
  Download
} from "lucide-react";

interface BrandIdentity {
  id: string;
  brandName: string;
  slogan: string;
  brandStory: string;
  isSelected: boolean;
  logoUrl?: string;
  marketingAssets?: {
    id: string;
    type: string;
    fileUrl: string;
  }[];
}

interface BrandDetail {
  id: string;
  title: string;
  industryCategoryId: string;
  keywords: Record<string, any>;
  currentStep: string;
  identities: BrandIdentity[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1";
const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL + "";

export default function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrandDetail = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE_URL}/branding/${id}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch brand detail");
        const data = await res.json();
        setBrand(data);
      } catch (error) {
        console.error("Failed to fetch brand detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandDetail();
  }, [id]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("다운로드에 실패했습니다. CORS 설정을 확인해주세요.");
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!brand) return <div className="min-h-screen flex items-center justify-center">Brand not found</div>;

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] font-sans">
      <main className="max-w-6xl mx-auto px-6 py-16 space-y-16">
        {/* Overview Header */}
        <section className="bg-white p-12 rounded-[3.5rem] border border-[var(--nexus-outline-variant)]/30 shadow-[0_30px_60px_-15px_rgba(7,30,39,0.05)] flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--nexus-primary-container)]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          
          <div className="w-48 h-48 bg-[var(--nexus-surface-low)] rounded-[3rem] flex items-center justify-center shrink-0 border border-[var(--nexus-outline-variant)]/20 shadow-inner">
            {brand.industryCategoryId === 'Tech' ? <Rocket className="w-24 h-24 text-[var(--nexus-primary)]" /> : <Palette className="w-24 h-24 text-[var(--nexus-secondary)]" />}
          </div>
          
          <div className="space-y-8 text-center md:text-left flex-1 relative">
            <div className="space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-[var(--nexus-tertiary-fixed)] text-[var(--nexus-tertiary)] text-[10px] font-black rounded-lg uppercase tracking-widest">
                  {brand.currentStep}
                </span>
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> ARCHIVED MAY 2026
                </span>
              </div>
              <h2 className="text-5xl font-black tracking-tight text-[var(--nexus-on-bg)]">{brand.title}</h2>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {brand.keywords?.extracted_keywords && brand.keywords.extracted_keywords.map((kw: string, i: number) => (
                <span key={i} className="px-5 py-2 bg-[var(--nexus-surface-low)] text-[var(--nexus-primary)] text-[10px] font-black rounded-full uppercase tracking-wider border border-[var(--nexus-outline-variant)]/20">
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Identity */}
        <section className="space-y-10">
          <div className="flex items-end justify-between px-2">
            <div>
              <h3 className="text-3xl font-black tracking-tight">Identity Definition</h3>
              <p className="text-gray-400 font-bold text-sm mt-1">확정된 브랜드 아이덴티티와 핵심 가치입니다.</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[var(--nexus-primary)] transition-colors shadow-sm">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {brand.identities.filter(i => i.isSelected).map((identity) => (
              <div 
                key={identity.id}
                className="p-12 rounded-[4rem] border border-[var(--nexus-primary)] bg-white shadow-[0_40px_100px_-20px_rgba(11,26,125,0.1)] relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-[var(--nexus-primary)]" />
                
                <div className="flex justify-between items-start mb-12">
                  <div className="w-16 h-16 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center border border-[var(--nexus-outline-variant)]/30">
                    <CheckCircle2 className="w-10 h-10 text-[var(--nexus-primary)]" />
                  </div>
                  <div className="text-right">
                    <span className="px-4 py-1.5 bg-[var(--nexus-primary)] text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-[var(--nexus-primary)]/20">Final Selection</span>
                  </div>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-16">
                  <div className="flex-1 space-y-10">
                    <div className="space-y-2">
                      <h4 className="text-5xl font-black text-[var(--nexus-on-bg)] leading-tight">{identity.brandName}</h4>
                      <p className="text-2xl font-bold italic text-[var(--nexus-secondary)] opacity-60">"{identity.slogan}"</p>
                    </div>
                    <div className="p-10 bg-[var(--nexus-surface-low)] rounded-[3rem] border border-[var(--nexus-outline-variant)]/20 relative">
                      <div className="absolute top-6 left-10 text-[10px] font-black text-[var(--nexus-primary)] uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                        <Layers className="w-3 h-3" /> Core Story
                      </div>
                      <p className="text-lg leading-relaxed text-[var(--nexus-on-bg)] pt-8 font-medium">
                        {identity.brandStory}
                      </p>
                    </div>
                  </div>

                  {identity.logoUrl && (
                    <div className="lg:w-80 shrink-0">
                      <div className="p-10 bg-white border border-[var(--nexus-outline-variant)]/30 rounded-[3.5rem] shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center gap-6">
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Master Logo</h5>
                        <div className="w-full aspect-square flex items-center justify-center p-6 bg-[var(--nexus-bg)] rounded-[2.5rem] border border-[var(--nexus-outline-variant)]/10">
                          <img 
                            src={identity.logoUrl.startsWith('http') || identity.logoUrl.startsWith('data:') ? identity.logoUrl : `${FASTAPI_BASE_URL}${identity.logoUrl}`} 
                            alt="Brand Logo" 
                            className="max-w-full max-h-full object-contain filter drop-shadow-sm"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const url = identity.logoUrl?.startsWith('http') || identity.logoUrl?.startsWith('data:') 
                              ? identity.logoUrl 
                              : `${FASTAPI_BASE_URL}${identity.logoUrl}`;
                            handleDownload(url!, `${identity.brandName}_logo`);
                          }}
                          className="text-[10px] font-black text-[var(--nexus-primary)] uppercase tracking-widest hover:underline pt-2"
                        >
                          Download PNG
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {brand.identities.filter(i => i.isSelected).length === 0 && (
              <div className="p-20 bg-[var(--nexus-surface-low)] rounded-[3rem] border-2 border-dashed border-[var(--nexus-outline-variant)]/40 text-center flex flex-col items-center gap-4">
                <Palette className="w-12 h-12 text-gray-300" />
                <p className="font-bold text-gray-400">선택된 브랜드 정체성이 없습니다.</p>
              </div>
            )}
          </div>
        </section>

        {/* Assets Preview */}
        <section className="space-y-10">
          <div className="px-2">
            <h3 className="text-3xl font-black tracking-tight">Marketing Assets</h3>
            <p className="text-gray-400 font-bold text-sm mt-1">브랜드 가치를 극대화하는 마케팅 결과물입니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {brand.identities.find(i => i.isSelected)?.marketingAssets?.length ? (
              brand.identities.find(i => i.isSelected)?.marketingAssets?.map((asset) => (
                <div key={asset.id} className="group flex flex-col gap-6">
                  <div className="relative aspect-[4/5] bg-white rounded-[3rem] overflow-hidden border border-[var(--nexus-outline-variant)]/30 transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(7,30,39,0.15)] hover:-translate-y-2 p-3">
                    <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-[var(--nexus-surface-low)]">
                      <img 
                        src={asset.fileUrl.startsWith('http') ? asset.fileUrl : `${FASTAPI_BASE_URL}${asset.fileUrl}`} 
                        alt={asset.type} 
                        className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                      />
                    </div>
                  </div>
                  <div className="px-6">
                    <h4 className="text-[10px] font-black text-[var(--nexus-secondary)] uppercase tracking-[0.3em]">
                      {asset.type.replace('_', ' ')}
                    </h4>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-lg font-black text-[var(--nexus-on-bg)]">
                          {asset.type === 'BUSINESS_CARD' ? 'Premium Business Card' : 
                           asset.type === 'MENU' ? 'Strategic Menu Layout' : 
                           asset.type === 'POSTER' ? 'Visual Communication Poster' : 'Marketing Material'}
                        </p>
                        <button 
                          onClick={() => {
                            const url = asset.fileUrl.startsWith('http') ? asset.fileUrl : `${FASTAPI_BASE_URL}${asset.fileUrl}`;
                            handleDownload(url, `${brand.title}_${asset.type}`);
                          }}
                          className="w-8 h-8 rounded-full bg-[var(--nexus-surface-low)] flex items-center justify-center text-[var(--nexus-primary)] hover:bg-[var(--nexus-primary)] hover:text-white transition-all shadow-sm"
                          title="Download PNG"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 bg-[var(--nexus-surface-low)] rounded-[4rem] border-2 border-dashed border-[var(--nexus-outline-variant)]/30 flex flex-col items-center justify-center text-gray-400 gap-6">
                <Layers className="w-16 h-16 opacity-10" />
                <p className="font-bold text-gray-300">생성된 마케팅 에셋이 없습니다.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
