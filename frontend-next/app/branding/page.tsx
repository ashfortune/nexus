"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  LayoutGrid, 
  Trash2, 
  ExternalLink,
  Rocket,
  Palette,
  LineChart,
  ShieldCheck,
} from "lucide-react";

// Types matching backend DTOs
interface Brand {
  id: string;
  title: string;
  industryCategoryId: string;
  currentStep: string;
  createdAt: string;
  logoUrl?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api/v1";

export default function BrandListPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("userId");
        
        if (!userId) {
          console.warn("User ID not found in localStorage");
          setIsLoading(false);
          return;
        }

        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE_URL}/branding?userId=${userId}`, {
          headers
        });
        if (!res.ok) throw new Error("Failed to fetch brands");
        const data = await res.json();
        setBrands(data);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const selectedBrand = brands.find(b => b.id === selectedBrandId);

  const handleDelete = async () => {
    if (!selectedBrandId) return;
    if (confirm("정말 이 브랜드를 삭제하시겠습니까?")) {
      try {
        const res = await fetch(`${API_BASE_URL}/branding/${selectedBrandId}`, { 
          method: 'DELETE' 
        });
        if (res.ok) {
          setBrands(brands.filter(b => b.id !== selectedBrandId));
          setSelectedBrandId(null);
        } else {
          alert("삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("Delete failed:", error);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const getIndustryIcon = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'tech': return <Rocket className="w-12 h-12 text-blue-500" />;
      case 'design': return <Palette className="w-12 h-12 text-purple-500" />;
      case 'marketing': return <LineChart className="w-12 h-12 text-green-500" />;
      case 'e-commerce': return <ShieldCheck className="w-12 h-12 text-orange-500" />;
      default: return <LayoutGrid className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] font-sans">
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Welcome Section */}
        <section className="text-left mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-primary-container)] text-[var(--nexus-on-primary-container)] rounded-full text-[10px] font-black uppercase tracking-widest">
              Branding Engine v3.0
            </div>
            <h2 className="text-6xl font-black tracking-tight leading-[0.9]">Nexus Brand<br /><span className="text-[var(--nexus-primary)]">Command Center</span></h2>
            <p className="text-gray-500 font-medium text-lg">혁신적인 브랜딩 여정을 한곳에서 관리하세요.</p>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <Link 
              href="/branding/create"
              className="inline-flex items-center gap-3 bg-[var(--nexus-primary)] text-white px-10 py-5 rounded-2xl font-black hover:bg-[var(--nexus-primary-container)] transition-all transform hover:-translate-y-1 active:scale-95 shadow-2xl shadow-[var(--nexus-primary)]/20"
            >
              Start New Project <Plus className="w-5 h-5" />
            </Link>
          </div>
        </section>

        <div className="flex items-center gap-2 mb-12 p-1 bg-[var(--nexus-surface-container)] w-fit rounded-2xl border border-[var(--nexus-outline-variant)]">
          {['Overview', 'Performance', 'Settings'].map((tab) => (
            <button 
              key={tab}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                tab === 'Overview' 
                ? 'bg-white text-[var(--nexus-primary)] shadow-sm' 
                : 'text-gray-500 hover:text-[var(--nexus-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand History Grid */}
          <section className="lg:col-span-8 space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-black tracking-tight">Your Brand History</h3>
                <p className="text-gray-400 font-medium">Review the brands you've created.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="aspect-square bg-[var(--nexus-surface-container)] animate-pulse rounded-[2.5rem]" />
                ))
              ) : (
                brands.map((brand) => (
                  <div 
                    key={brand.id}
                    onClick={() => setSelectedBrandId(brand.id)}
                    className={`group relative aspect-square flex flex-col items-center justify-center p-10 rounded-[3rem] transition-all cursor-pointer border-2 ${
                      selectedBrandId === brand.id 
                      ? 'bg-white border-[var(--nexus-primary)] shadow-[0_30px_60px_-15px_rgba(11,26,125,0.15)] -translate-y-3' 
                      : 'bg-[var(--nexus-surface-lowest)] border-transparent hover:border-[var(--nexus-outline-variant)] hover:shadow-xl hover:-translate-y-1'
                    }`}
                  >
                    <div className="mb-8 transform transition-transform group-hover:scale-110 duration-700 w-36 h-36 flex items-center justify-center bg-[var(--nexus-surface-low)] rounded-[2.5rem] p-6 border border-[var(--nexus-outline-variant)]/30">
                      {brand.logoUrl ? (
                        <img 
                          src={brand.logoUrl.startsWith('http') || brand.logoUrl.startsWith('data:') ? brand.logoUrl : `${process.env.NEXT_PUBLIC_FASTAPI_URL}${brand.logoUrl}`} 
                          alt={brand.title} 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        getIndustryIcon(brand.industryCategoryId)
                      )}
                    </div>
                    <h4 className="text-2xl font-black mb-2 text-center text-[var(--nexus-on-bg)]">{brand.title}</h4>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">{brand.createdAt}</p>
                    </div>
                    {selectedBrandId === brand.id && (
                      <div className="absolute top-8 right-8">
                        <div className="w-4 h-4 bg-[var(--nexus-primary)] rounded-full animate-pulse shadow-[0_0_15px_rgba(11,26,125,0.5)]" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Action Panel */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="sticky top-32">
              <h3 className="text-4xl font-black tracking-tight mb-2 text-[var(--nexus-primary)]">Overview</h3>
              <p className="text-gray-500 font-bold mb-10 text-sm">브랜드 정보 및 자산을 관리하세요.</p>

              <div className="bg-white border border-[var(--nexus-outline-variant)]/30 rounded-[3rem] p-10 shadow-[0_40px_80px_-20px_rgba(7,30,39,0.08)]">
                {selectedBrand ? (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-[var(--nexus-surface-low)] rounded-[2rem] flex items-center justify-center p-4 overflow-hidden border border-[var(--nexus-outline-variant)]/30">
                        {selectedBrand.logoUrl ? (
                          <img 
                            src={selectedBrand.logoUrl.startsWith('http') || selectedBrand.logoUrl.startsWith('data:') ? selectedBrand.logoUrl : `${process.env.NEXT_PUBLIC_FASTAPI_URL}${selectedBrand.logoUrl}`} 
                            alt={selectedBrand.title} 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          getIndustryIcon(selectedBrand.industryCategoryId)
                        )}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-[var(--nexus-on-bg)] mb-1">{selectedBrand.title}</h4>
                        <span className="inline-block px-3 py-1 bg-[var(--nexus-tertiary-fixed)] text-[var(--nexus-tertiary)] text-[10px] font-black rounded-lg uppercase tracking-widest">
                          {selectedBrand.currentStep}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {selectedBrand.currentStep === 'COMPLETED' ? (
                        <Link 
                          href={`/branding/${selectedBrand.id}`}
                          className="flex items-center justify-center gap-3 p-6 bg-[var(--nexus-primary)] text-white rounded-2xl hover:bg-[var(--nexus-primary-container)] transition-all font-black shadow-lg shadow-[var(--nexus-primary)]/20"
                        >
                          <ExternalLink className="w-5 h-5" />
                          <span>View Detail Report</span>
                        </Link>
                      ) : (
                        <Link 
                          href={`/branding/create?resumeId=${selectedBrand.id}`}
                          className="flex items-center justify-center gap-3 p-6 bg-[var(--nexus-secondary)] text-white rounded-2xl hover:bg-[var(--nexus-secondary-container)] transition-all font-black shadow-lg shadow-[var(--nexus-secondary)]/20"
                        >
                          <Rocket className="w-5 h-5 animate-bounce" />
                          <span>이어하기 (Resume)</span>
                        </Link>
                      )}
                      
                      <button 
                        onClick={handleDelete}
                        className="flex items-center justify-center gap-3 p-6 border-2 border-[var(--nexus-outline-variant)] text-gray-400 rounded-2xl hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all font-black"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>Remove Project</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Project History</h5>
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-[var(--nexus-surface-low)] rounded-2xl border border-[var(--nexus-outline-variant)]/20">
                            <div className="flex items-center gap-4">
                              <div className="w-2 h-2 bg-[var(--nexus-primary)] rounded-full" />
                              <span className="text-xs font-bold text-[var(--nexus-on-bg)]">Metadata Synchronized</span>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">2d ago</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-24 h-24 bg-[var(--nexus-surface-low)] rounded-[2.5rem] flex items-center justify-center text-[var(--nexus-outline-variant)] border-2 border-dashed border-[var(--nexus-outline-variant)]/50">
                      <LayoutGrid className="w-12 h-12" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-[var(--nexus-on-bg)] mb-2">Ready to Launch</h4>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">왼쪽의 브랜드 카드를 선택하여 세부 관리 메뉴를 활성화하세요.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

    </div>
  );
}
