"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Map, Polygon, CustomOverlayMap } from "react-kakao-maps-sdk";
import { Search, MapPin, Sparkles, ChevronRight, BarChart3, MousePointer2 } from "lucide-react";
import { fetchStoresData } from "./actions";

// ── 상수 ──
const SEOUL_FIXED = { lat: 37.5665, lng: 126.978 };

const convertToWgs84 = (c: any): { lat: number; lng: number } | null => {
  if (!Array.isArray(c) || c.length < 2) return null;
  const X = Number(c[0]);  // Easting (동향)
  const Y = Number(c[1]);  // Northing (북향)
  if (isNaN(X) || isNaN(Y)) return null;

  if (X >= 120 && X <= 135 && Y >= 30 && Y <= 45) {
    return { lat: Y, lng: X };
  }
  if (X > 1000) {
    const a = 6378137.0;          // 장반경(m)
    const f = 1 / 298.257222101;  // 편평률
    const b = a * (1 - f);        // 단반경
    const e2 = 2 * f - f * f;     // 이심률 제곱
    const k0 = 1.0;               // 축척계수
    const lat0 = 38.0 * Math.PI / 180; // 원점 위도 (38°N)
    const lng0 = 127.0 * Math.PI / 180; // 원점 경도 (127°E)
    const FE = 200000.0;          // False Easting
    const FN = 600000.0;          // False Northing

    const x = X - FE;
    const y = Y - FN;

    const calcM = (lat: number) => {
      const e2_ = e2;
      return a * (
        (1 - e2_ / 4 - 3 * e2_ * e2_ / 64 - 5 * e2_ * e2_ * e2_ / 256) * lat
        - (3 * e2_ / 8 + 3 * e2_ * e2_ / 32 + 45 * e2_ * e2_ * e2_ / 1024) * Math.sin(2 * lat)
        + (15 * e2_ * e2_ / 256 + 45 * e2_ * e2_ * e2_ / 1024) * Math.sin(4 * lat)
        - (35 * e2_ * e2_ * e2_ / 3072) * Math.sin(6 * lat)
      );
    };
    const M0 = calcM(lat0);
    const M = M0 + y / k0;

    // foot point latitude (φ1) 계산 (반복법)
    const n = (a - b) / (a + b);
    const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
    const phi1 = mu
      + (3 * n / 2 - 27 * n * n * n / 32) * Math.sin(2 * mu)
      + (21 * n * n / 16 - 55 * n * n * n * n / 32) * Math.sin(4 * mu)
      + (151 * n * n * n / 96) * Math.sin(6 * mu)
      + (1097 * n * n * n * n / 512) * Math.sin(8 * mu);

    const sinPhi1 = Math.sin(phi1);
    const cosPhi1 = Math.cos(phi1);
    const tanPhi1 = sinPhi1 / cosPhi1;

    const e2p = e2 / (1 - e2); // 제2이심률 제곱
    const N1 = a / Math.sqrt(1 - e2 * sinPhi1 * sinPhi1); // 묘유선곡률반경
    const T1 = tanPhi1 * tanPhi1;
    const C1 = e2p * cosPhi1 * cosPhi1;
    const R1 = a * (1 - e2) / Math.pow(1 - e2 * sinPhi1 * sinPhi1, 1.5); // 자오선곡률반경
    const D = x / (N1 * k0);

    // 위도 계산
    const lat_rad = phi1
      - (N1 * tanPhi1 / R1) * (
        D * D / 2
        - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e2p) * D * D * D * D / 24
        + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e2p - 3 * C1 * C1) * D * D * D * D * D * D / 720
      );

    // 경도 계산
    const lng_rad = lng0 + (
      D
      - (1 + 2 * T1 + C1) * D * D * D / 6
      + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e2p + 24 * T1 * T1) * D * D * D * D * D / 120
    ) / cosPhi1;

    const lat = lat_rad * 180 / Math.PI;
    const lng = lng_rad * 180 / Math.PI;

    // 한국 유효 범위 체크
    return (lat > 33 && lat < 39 && lng > 124 && lng < 132) ? { lat, lng } : null;
  }

  return null;
};

export default function StoreMapClient({ kakaoApiKey, initialIndustries, initialRegions }: any) {
  const [isMounted, setIsMounted] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [mapInstance, setMapInstance] = useState<kakao.maps.Map | null>(null);
  const [storesData, setStoresData] = useState<any | null>(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined" || !kakaoApiKey) return;
    const checkReady = () => {
      if (window.kakao?.maps?.LatLng && window.kakao?.maps?.LatLngBounds) {
        setSdkReady(true);
        return true;
      }
      return false;
    };
    if (checkReady()) return;
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        const timer = setInterval(() => { if (checkReady()) clearInterval(timer); }, 100);
      });
    };
    document.head.appendChild(script);
  }, [kakaoApiKey]);

  // 검색 상태
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<number | "">("");
  const [regionSearch, setRegionSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [isIndustryOpen, setIsIndustryOpen] = useState(false);
  const industryInputRef = useRef<HTMLInputElement>(null);
  const [activeRegionIndex, setActiveRegionIndex] = useState(-1);
  const [activeIndustryIndex, setActiveIndustryIndex] = useState(-1);

  const filteredRegions = useMemo(() => {
    if (!initialRegions) return [];
    return initialRegions.filter((r: any) =>
      `${r.cityName} ${r.countyName}`.toLowerCase().includes(regionFilter.toLowerCase())
    );
  }, [initialRegions, regionFilter]);

  const filteredIndustries = useMemo(() => {
    if (!initialIndustries) return [];
    return initialIndustries.filter((ind: any) =>
      ind.industryName.toLowerCase().includes(industryFilter.toLowerCase())
    );
  }, [initialIndustries, industryFilter]);

  const avg = useMemo(() => {
    if (!storesData || !storesData.storeByRegionDtoList || storesData.storeByRegionDtoList.length === 0) return 0;
    return Math.ceil(storesData.totalCount / storesData.storeByRegionDtoList.length);
  }, [storesData]);

  const memoizedPolygons = useMemo(() => {
    if (!storesData || !storesData.storeByRegionDtoList || !sdkReady) return [];
    const results: any[] = [];

    storesData.storeByRegionDtoList.forEach((region: any) => {
      if (!region?.geometry?.coordinates) return;
      const rCode = region.adongCd || region.region_code;
      const rName = region.adongNm || region.region_name;
      const rCount = region.count || 0;
      const polygons = region.geometry.type === "MultiPolygon" ? region.geometry.coordinates : [region.geometry.coordinates];

      polygons.forEach((poly: any, pIdx: number) => {
        const ring = poly[0];
        if (!Array.isArray(ring)) return;
        const path = ring.map(convertToWgs84).filter((p: any) => p !== null) as { lat: number, lng: number }[];
        if (path.length >= 3) {
          // 폴리곤 중심점 계산
          let pLatSum = 0, pLngSum = 0;
          path.forEach((pt: any) => { pLatSum += pt.lat; pLngSum += pt.lng; });
          const center = { lat: pLatSum / path.length, lng: pLngSum / path.length };
          results.push({ id: `${rCode}-${pIdx}`, region_code: rCode, region_name: rName, count: rCount, path, center, isHigh: rCount >= avg, isFirst: pIdx === 0 });
        }
      });
    });

    return results;
  }, [storesData, avg, sdkReady]);

  useEffect(() => {
    if (!sdkReady || !mapInstance || memoizedPolygons.length === 0) return;

    const performFocus = () => {
      try {
        const bounds = new window.kakao.maps.LatLngBounds();
        memoizedPolygons.forEach(p => {
          if (p.path) p.path.forEach(pt => bounds.extend(new window.kakao.maps.LatLng(pt.lat, pt.lng)));
        });

        mapInstance.relayout();
        // 전체 폴리곤이 화면에 맞게 자동 줌 조정 (level 수동 조작 금지)
        mapInstance.setBounds(bounds, 30);
      } catch (e) { console.error("Focus Error:", e); }
    };

    const tid = setTimeout(performFocus, 300);
    return () => clearTimeout(tid);
  }, [storesData, sdkReady, mapInstance, analysisCount]);


  const handleStartAnalysis = async () => {
    if (selectedRegion == "" || !selectedIndustry) return;
    // console.log("요청 파라미터:", selectedRegion, selectedIndustry);
    setIsLoading(true);
    try {
      const data = await fetchStoresData(selectedRegion.toString(), selectedIndustry);
      if (data) {
        setStoresData(data);
        setAnalysisCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Analysis Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return <div className="h-[600px] bg-white flex items-center justify-center font-black">초기화 중...</div>;

  return (
    <div className="h-[600px] flex flex-col bg-white overflow-hidden font-inter border-b border-slate-200" suppressHydrationWarning>
      <header className="shrink-0 bg-white border-b border-slate-100 px-8 h-[60px] flex items-center justify-between gap-12 z-40">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">소상공인시장진흥공단</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">상권정보</span>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 max-w-2xl px-12">
          <div className="relative flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3">
            <MapPin size={14} className="text-slate-400" />
            <input
              className="w-full bg-transparent text-[12px] font-black text-slate-950 outline-none"
              placeholder="지역 선택"
              value={regionSearch}
              onChange={(e) => {
                setRegionSearch(e.target.value);
                setRegionFilter(e.target.value);
                setIsRegionOpen(true);
                setActiveRegionIndex(-1);
              }}
              onFocus={() => setIsRegionOpen(true)}
              onBlur={() => setTimeout(() => { setIsRegionOpen(false); setActiveRegionIndex(-1); }, 200)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveRegionIndex(prev => Math.min(prev + 1, filteredRegions.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveRegionIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === "Enter" && activeRegionIndex >= 0) {
                  const r = filteredRegions[activeRegionIndex];
                  setSelectedRegion(r.regionCode);
                  setRegionSearch(`${r.cityName}${r.countyName ? ' ' + r.countyName : ''}`);
                  setIsRegionOpen(false);
                  setTimeout(() => industryInputRef.current?.focus(), 0);
                }
              }}
            />
            {isRegionOpen && filteredRegions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                {filteredRegions.map((r: any, idx: number) => (
                  <div
                    key={r.regionCode}
                    className={`px-4 py-2 text-[11px] font-bold text-slate-950 rounded-lg cursor-pointer ${idx === activeRegionIndex ? "bg-indigo-50" : "hover:bg-indigo-50"}`}
                    onMouseDown={() => {
                      setSelectedRegion(r.regionCode);
                      setRegionSearch(`${r.cityName}${r.countyName ? ' ' + r.countyName : ''}`);
                      setIsRegionOpen(false);
                      setTimeout(() => industryInputRef.current?.focus(), 0);
                    }}
                    onMouseEnter={() => setActiveRegionIndex(idx)}
                  >
                    {r.cityName}{r.countyName ? ' ' + r.countyName : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
          <ChevronRight size={14} className="text-slate-300" />
          <div className={`relative flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 ${!selectedRegion ? "opacity-40" : ""}`}>
            <Search size={14} className="text-slate-400" />
            <input
              ref={industryInputRef}
              className="w-full bg-transparent text-[12px] font-black text-slate-950 outline-none"
              placeholder="업종 입력"
              value={industrySearch}
              onChange={(e) => {
                setIndustrySearch(e.target.value);
                setIndustryFilter(e.target.value);
                setIsIndustryOpen(true);
                setActiveIndustryIndex(-1);
              }}
              onFocus={() => setIsIndustryOpen(true)}
              onBlur={() => setTimeout(() => { setIsIndustryOpen(false); setActiveIndustryIndex(-1); }, 200)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndustryIndex(prev => Math.min(prev + 1, filteredIndustries.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndustryIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === "Enter" && activeIndustryIndex >= 0) {
                  const ind = filteredIndustries[activeIndustryIndex];
                  setSelectedIndustry(ind.ksicCode);
                  setIndustrySearch(ind.industryName);
                  setIsIndustryOpen(false);
                }
              }}
            />
            {isIndustryOpen && filteredIndustries.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 max-h-48 overflow-y-auto p-1 scrollbar-hide">
                {filteredIndustries.map((ind: any, idx: number) => (
                  <div
                    key={ind.ksicCode}
                    className={`px-4 py-2 text-[11px] font-bold text-slate-950 rounded-lg cursor-pointer ${idx === activeIndustryIndex ? "bg-indigo-50" : "hover:bg-indigo-50"}`}
                    onMouseDown={() => {
                      setSelectedIndustry(ind.ksicCode);
                      setIndustrySearch(ind.industryName);
                      setIsIndustryOpen(false);
                    }}
                    onMouseEnter={() => setActiveIndustryIndex(idx)}
                  >
                    {ind.industryName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={handleStartAnalysis} disabled={selectedRegion == "" || !selectedIndustry || isLoading} className="shrink-0 h-10 px-8 rounded-xl text-[12px] font-black bg-[#0b1a7d] text-white hover:opacity-90 disabled:bg-slate-100 shadow-md transition-all">{isLoading ? "중..." : "분석"}</button>
      </header>

      <main className="flex-1 flex gap-6 p-6 bg-slate-50 overflow-hidden items-stretch h-[calc(600px-60px)]">
        <section className="flex-1 rounded-[24px] overflow-hidden border border-slate-200 shadow-xl relative bg-white h-full">
          {sdkReady && (
            <Map onCreate={setMapInstance} center={SEOUL_FIXED} level={7} style={{ width: "100%", height: "100%" }}>
              {memoizedPolygons.map((p: any) => (
                <React.Fragment key={p.id}>
                  <Polygon path={p.path} strokeWeight={3} strokeColor="#0f172a" strokeOpacity={0.8} fillColor={p.isHigh ? "#dc2626" : "#2563eb"} fillOpacity={hoveredRegion === p.region_code ? 0.7 : 0.4} onMouseover={() => setHoveredRegion(p.region_code)} onMouseout={() => setHoveredRegion(null)} />
                  {p.isFirst && p.center && (
                    <CustomOverlayMap position={p.center} zIndex={100}>
                      <div className="px-2.5 py-1.5 bg-white border-2 border-slate-950 rounded-lg shadow-2xl pointer-events-none transition-all flex flex-col items-center" style={{ transform: hoveredRegion === p.region_code ? "scale(1.1) translateY(-10px)" : "scale(1)" }}>
                        <span className="text-[10px] font-black text-slate-950 leading-tight whitespace-nowrap">{p.region_name}</span>
                        <span className={`text-[9px] font-black ${p.isHigh ? "text-red-700" : "text-blue-700"} mt-0.5`}>{p.count}개</span>
                      </div>
                    </CustomOverlayMap>
                  )}
                </React.Fragment>
              ))}
            </Map>
          )}
          {!sdkReady && <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 font-black">로드 중...</div>}
        </section>

        <aside className="w-[340px] shrink-0 flex flex-col gap-4 h-full scrollbar-hide overflow-y-auto">
          {storesData ? (
            <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-lg space-y-5">
              <div className="flex items-center gap-2 text-slate-950 font-black text-[11px] uppercase tracking-wider"><BarChart3 size={16} /> 분석 데이터</div>

              {storesData.totalCount === 0 ? (
                <div className="py-8 px-4 bg-indigo-50 rounded-[20px] border border-indigo-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles size={32} className="text-indigo-600 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-indigo-950 leading-tight">축하합니다!<br />완벽한 블루오션입니다</h4>
                    <p className="text-[11px] font-bold text-indigo-600 leading-relaxed">
                      분석하신 지역에 해당 업종이 <span className="underline underline-offset-4 decoration-2">하나도 없습니다.</span><br />
                      이 상권의 주인공이 될 기회입니다!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-end">
                      <div><p className="text-[9px] font-black text-slate-500 mb-1 uppercase">총 업소</p><p className="text-2xl font-black text-slate-950">{storesData.totalCount.toLocaleString()}</p></div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-end">
                      <div><p className="text-[9px] font-black text-slate-500 mb-1 uppercase">동별 평균</p><p className="text-2xl font-black text-slate-950">{avg}개</p></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    {storesData.mostRegion && (
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                        <div className="flex items-center gap-2 text-red-700 font-black text-sm">밀집 최고</div>
                        <span className="text-sm font-black text-slate-950">
                          {(storesData.mostRegion.adongNm || storesData.mostRegion.region_name) || "상권"} ({storesData.mostRegion.count}개)
                        </span>
                      </div>
                    )}
                    {storesData.leastRegion && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 font-black text-sm">밀집 최저</div>
                        <span className="text-sm font-black text-slate-950">
                          {(storesData.leastRegion.adongNm || storesData.leastRegion.region_name) || "상권"} ({storesData.leastRegion.count}개)
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-[24px] border border-slate-200 p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse"><MousePointer2 size={28} className="text-indigo-600" /></div>
              <h3 className="text-sm font-black text-slate-950 mb-2">분석 시작</h3>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed">지역과 업종을 선택하여<br />실시간 밀집도를 확인하세요.</p>
            </div>
          )}
        </aside>
      </main>
      <style jsx global>{`.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}