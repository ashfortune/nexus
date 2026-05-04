"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, MapPin, Sparkles, ArrowRight, Store, Info, CheckCircle2 } from "lucide-react";
import { SimIndustCatsDto, SimRegCodesDto } from "./types";

interface Props {
  industList: SimIndustCatsDto[];
  regionList: SimRegCodesDto[];
  onSubmit: (industry: SimIndustCatsDto, region: SimRegCodesDto) => void;
  loading: boolean;
}

export default function SimSearchStep({
  industList,
  regionList,
  onSubmit,
  loading,
}: Props) {
  const [industQuery, setIndustQuery] = useState("");
  const [regionQuery, setRegionQuery] = useState("");
  const [selectedIndust, setSelectedIndust] = useState<SimIndustCatsDto | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SimRegCodesDto | null>(null);
  const [showIndustDropdown, setShowIndustDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);

  const [industActiveIndex, setIndustActiveIndex] = useState(-1);
  const [regionActiveIndex, setRegionActiveIndex] = useState(-1);

  const [industFilter, setIndustFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const industRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const regionInputRef = useRef<HTMLInputElement>(null);
  const industInputRef = useRef<HTMLInputElement>(null);

  const industOriginalQuery = useRef("");
  const regionOriginalQuery = useRef("");

  const regionListRef = useRef<HTMLUListElement>(null);
  const industListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (industRef.current && !industRef.current.contains(e.target as Node))
        setShowIndustDropdown(false);
      if (regionRef.current && !regionRef.current.contains(e.target as Node))
        setShowRegionDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 자동 스크롤 포커싱 (지역 리스트)
  useEffect(() => {
    if (regionActiveIndex >= 0 && regionListRef.current) {
      const activeEl = regionListRef.current.children[regionActiveIndex] as HTMLElement;
      if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [regionActiveIndex]);

  // 자동 스크롤 포커싱 (업종 리스트)
  useEffect(() => {
    if (industActiveIndex >= 0 && industListRef.current) {
      const activeEl = industListRef.current.children[industActiveIndex] as HTMLElement;
      if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [industActiveIndex]);

  // 필터링 초기화 로직 제거 (onChange에서 처리)

  const filteredIndust = useMemo(() => industList.filter((i) =>
    (i.industryName || "").toLowerCase().includes(industFilter.toLowerCase())
  ), [industList, industFilter]);

  const filteredRegion = useMemo(() => regionList.filter((r) => {
    const full = `${r.cityName}${r.countyName ? ' ' + r.countyName : ''}`;
    return full.toLowerCase().includes(regionFilter.toLowerCase());
  }), [regionList, regionFilter]);

  const handleSelectIndust = (item: SimIndustCatsDto) => {
    setSelectedIndust(item);
    setIndustQuery(item.industryName);
    setShowIndustDropdown(false);
    setIndustActiveIndex(-1);
    // 아직 지역이 선택되지 않은 경우에만 지역 입력창으로 포커스 이동
    if (!selectedRegion) {
      setTimeout(() => regionInputRef.current?.focus(), 0);
    }
  };

  const handleSelectRegion = (item: SimRegCodesDto) => {
    setSelectedRegion(item);
    setRegionQuery(`${item.cityName}${item.countyName ? ' ' + item.countyName : ''}`);
    setShowRegionDropdown(false);
    setRegionActiveIndex(-1);
    // 아직 업종이 선택되지 않은 경우에만 업종 입력창으로 포커스 이동
    if (!selectedIndust) {
      setTimeout(() => industInputRef.current?.focus(), 0);
    }
  };

  const handleIndustKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (!showIndustDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = industActiveIndex < filteredIndust.length - 1 ? industActiveIndex + 1 : industActiveIndex;
      setIndustActiveIndex(nextIdx);
      const item = filteredIndust[nextIdx];
      if (item) { setIndustQuery(item.industryName); setSelectedIndust(item); }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (industActiveIndex <= 0) { setIndustActiveIndex(-1); setIndustQuery(industOriginalQuery.current); setSelectedIndust(null); }
      else {
        const nextIdx = industActiveIndex - 1;
        setIndustActiveIndex(nextIdx);
        const item = filteredIndust[nextIdx];
        if (item) { setIndustQuery(item.industryName); setSelectedIndust(item); }
      }
    } else if (e.key === "Enter" && industActiveIndex >= 0) {
      handleSelectIndust(filteredIndust[industActiveIndex]);
    }
  };

  const handleRegionKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (!showRegionDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = regionActiveIndex < filteredRegion.length - 1 ? regionActiveIndex + 1 : regionActiveIndex;
      setRegionActiveIndex(nextIdx);
      const item = filteredRegion[nextIdx];
      if (item) { setRegionQuery(`${item.cityName} ${item.countyName}`); setSelectedRegion(item); }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (regionActiveIndex <= 0) { setRegionActiveIndex(-1); setRegionQuery(regionOriginalQuery.current); setSelectedRegion(null); }
      else {
        const nextIdx = regionActiveIndex - 1;
        setRegionActiveIndex(nextIdx);
        const item = filteredRegion[nextIdx];
        if (item) { 
          setRegionQuery(`${item.cityName}${item.countyName ? ' ' + item.countyName : ''}`); 
          setSelectedRegion(item); 
        }
      }
    } else if (e.key === "Enter" && regionActiveIndex >= 0) {
      handleSelectRegion(filteredRegion[regionActiveIndex]);
    }
  };

  const canSubmit = selectedIndust !== null && selectedRegion !== null && !loading;

  const handleSubmit = () => {
    if (selectedIndust && selectedRegion) onSubmit(selectedIndust, selectedRegion);
  };

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] font-inter">
      {/* ─── 히어로 섹션 ─── */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--nexus-primary)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--nexus-surface-container)] rounded-full text-[var(--nexus-primary)] text-[10px] font-black tracking-[0.2em] uppercase">
            <Sparkles size={14} className="animate-pulse" />
            AI 기반 정밀 분석
          </div>
          
          <h1 className="font-manrope text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--nexus-primary)] leading-tight">
            창업 비용 <span className="text-[var(--nexus-secondary)]">시뮬레이션</span>
          </h1>
          
          <p className="text-lg text-[var(--nexus-on-bg)] max-w-2xl font-medium leading-relaxed opacity-90">
            업종과 지역을 선택하면 국토교통부 실거래가 데이터와 필수 설비 DB를<br className="hidden md:block" />
            실시간으로 매칭하여 당신만의 창업 리포트를 생성합니다.
          </p>

          {/* ─── 검색 카드 ─── */}
          <div className="w-full mt-8 bg-white p-8 md:p-12 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(11,26,125,0.08)] border border-[var(--nexus-outline-variant)]/30 flex flex-col gap-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 지역 선택 */}
              <div className="flex flex-col gap-3 relative" ref={regionRef}>
                <label className="text-[11px] font-black text-[var(--nexus-primary)] flex items-center gap-2 px-1 uppercase tracking-wider">
                  <MapPin size={14} /> 지역 선택
                </label>
                <div className="relative group">
                  <input
                    ref={regionInputRef}
                    className="w-full bg-[var(--nexus-surface-low)] border-2 border-transparent focus:border-[var(--nexus-primary)] focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all duration-300 font-medium"
                    placeholder="분석할 지역을 검색하세요"
                    value={regionQuery}
                    onChange={(e) => {
                      setRegionQuery(e.target.value);
                      setRegionFilter(e.target.value); 
                      regionOriginalQuery.current = e.target.value;
                      setShowRegionDropdown(true);
                      setRegionActiveIndex(-1);
                    }}
                    onFocus={() => {
                      if (!selectedRegion) setShowRegionDropdown(true);
                    }}
                    onKeyDown={handleRegionKeyDown}
                  />
                  {selectedRegion && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--nexus-secondary)] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      {selectedRegion.regionCode}
                    </div>
                  )}
                  {showRegionDropdown && filteredRegion.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-[var(--nexus-outline-variant)]/50 overflow-hidden z-50">
                      <ul ref={regionListRef} className="max-h-[300px] overflow-y-auto py-2">
                        {filteredRegion.map((item, idx) => (
                          <li
                            key={item.regionCode}
                            className={`px-5 py-3 cursor-pointer flex justify-between items-center transition-colors ${
                              idx === regionActiveIndex ? "bg-[var(--nexus-surface-container)]" : "hover:bg-[var(--nexus-surface-container)]"
                            }`}
                            onMouseDown={() => handleSelectRegion(item)}
                            onMouseEnter={() => setRegionActiveIndex(idx)}
                          >
                            <span className="font-bold text-sm text-[var(--nexus-on-bg)]">{item.cityName} {item.countyName}</span>
                            <span className="text-[10px] text-[var(--nexus-secondary)] font-mono font-bold">{item.regionCode}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* 업종 선택 */}
              <div className="flex flex-col gap-3 relative" ref={industRef}>
                <label className="text-[11px] font-black text-[var(--nexus-primary)] flex items-center gap-2 px-1 uppercase tracking-wider">
                  <Store size={14} /> 업종 선택
                </label>
                <div className="relative group">
                  <input
                    ref={industInputRef}
                    className="w-full bg-[var(--nexus-surface-low)] border-2 border-transparent focus:border-[var(--nexus-primary)] focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all duration-300 font-medium"
                    placeholder={selectedRegion ? "ex) 한식, 카페, 편의점..." : "지역을 먼저 선택하면 좋습니다"}
                    value={industQuery}
                    onChange={(e) => {
                      setIndustQuery(e.target.value);
                      setIndustFilter(e.target.value); 
                      industOriginalQuery.current = e.target.value;
                      setShowIndustDropdown(true);
                      setIndustActiveIndex(-1);
                    }}
                    onFocus={() => {
                      if (!selectedIndust) setShowIndustDropdown(true);
                    }}
                    onKeyDown={handleIndustKeyDown}
                  />
                  {selectedIndust && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--nexus-primary)] text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                      {selectedIndust.ksicCode}
                    </div>
                  )}
                  {showIndustDropdown && filteredIndust.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-[var(--nexus-outline-variant)]/50 overflow-hidden z-50">
                      <ul ref={industListRef} className="max-h-[300px] overflow-y-auto py-2">
                        {filteredIndust.map((item, idx) => (
                          <li
                            key={item.ksicCode}
                            className={`px-5 py-3 cursor-pointer flex justify-between items-center transition-colors ${
                              idx === industActiveIndex ? "bg-[var(--nexus-surface-container)]" : "hover:bg-[var(--nexus-surface-container)]"
                            }`}
                            onMouseDown={() => handleSelectIndust(item)}
                            onMouseEnter={() => setIndustActiveIndex(idx)}
                          >
                            <span className="font-bold text-sm text-[var(--nexus-on-bg)]">{item.industryName}</span>
                            <span className="text-[10px] text-[var(--nexus-primary)] font-mono font-bold">{item.ksicCode}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              id="sim-submit-btn"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
                canSubmit
                  ? "bg-[var(--nexus-primary)] text-white shadow-[0_20px_40px_-15px_rgba(11,26,125,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-[var(--nexus-surface-container)] text-[var(--nexus-primary)]/20 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  시뮬레이션 시작하기
                  <ArrowRight size={24} />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ─── 미리보기 섹션 ─── */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-[var(--nexus-surface-container-high)] rounded-lg text-[var(--nexus-primary)] text-[10px] font-black uppercase tracking-widest">
                PREVIEW
              </div>
              <h2 className="font-manrope text-3xl md:text-4xl font-bold tracking-tight">넥서스가 제공하는 분석 결과</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[32px] border border-[var(--nexus-outline-variant)]/30 hover:border-[var(--nexus-primary)]/30 transition-all duration-500 group">
              <div className="w-14 h-14 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[var(--nexus-primary)] group-hover:text-white transition-colors">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-4 text-[var(--nexus-primary)]">정밀 실거래가 분석</h3>
              <p className="text-sm text-[var(--nexus-on-bg)] opacity-80 leading-relaxed mb-8 font-medium">
                국토교통부 데이터를 기반으로 해당 지역의 평균 거래가, 평당 가격, 건물 연식을 정밀 분석합니다.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[var(--nexus-surface-container)] rounded-full text-[10px] font-bold">LATEST DATA</span>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[32px] border border-[var(--nexus-outline-variant)]/30 hover:border-[var(--nexus-secondary)]/30 transition-all duration-500 group">
              <div className="w-14 h-14 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[var(--nexus-secondary)] group-hover:text-white transition-colors">
                <Info className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-4 text-[var(--nexus-secondary)]">필수 설비 견적</h3>
              <p className="text-sm text-[var(--nexus-on-bg)] opacity-80 leading-relaxed mb-8 font-medium">
                업종별로 필요한 주방 설비, IT 기기 등을 실시간 쇼핑 데이터와 연동하여 최저가 견적을 산출합니다.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[var(--nexus-surface-container)] rounded-full text-[10px] font-bold">REAL-TIME</span>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[32px] border border-[var(--nexus-outline-variant)]/30 hover:border-[var(--nexus-tertiary-fixed)]/30 transition-all duration-500 group">
              <div className="w-14 h-14 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[var(--nexus-primary)] group-hover:text-white transition-colors">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-4 text-[var(--nexus-primary)]">통합 비용 리포트</h3>
              <p className="text-sm text-[var(--nexus-on-bg)] opacity-80 leading-relaxed mb-8 font-medium">
                부동산 매물과 설비 비용을 합산하여 최종 창업 예상 비용을 시각화된 리포트로 제공합니다.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-[var(--nexus-surface-container)] rounded-full text-[10px] font-bold">AI REPORT</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
