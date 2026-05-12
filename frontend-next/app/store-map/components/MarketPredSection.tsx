'use client';

import { api } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Store,
  Info,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  BrainCircuit,
} from 'lucide-react';


const INDUSTRIES = [
  '관광숙박업',
  '노래연습장업',
  '동물병원',
  '목욕장업',
  '병원',
  '세탁업',
  '숙박업',
  '약국',
  '유흥주점영업',
  '의원',
  '인터넷컴퓨터게임시설제공업',
  '제과점영업',
  '종합체육시설업',
  '체력단련장업',
];

interface PredictionResult {
  risk_score: number;
  label: 'stable' | 'caution';
  label_kor: string;
  industry: string;
  dong: string;
  gu: string;
  open_date: string;
  message: string;
  threshold: number;
  factors?: string[];
}

interface DeepPredictionResult {
  risk_score: number;
  label: 'stable' | 'caution';
  label_kor: string;
  industry: string;
  dong: string;
  gu: string;
  open_date: string;
  message: string;
  threshold: number;
  factors?: string[];
  trdar_count?: number;
  trdar_area_sum?: number;
  trdar_area_mean?: number;
  dist_to_trdar?: number;
  type_diversity?: number;
  trdar_type?: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  direction = 'down'
}: {
  options: { label: string, value: string }[],
  value: string,
  onChange: (val: string) => void,
  placeholder: string,
  disabled?: boolean,
  direction?: 'up' | 'down'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-[14px] font-black outline-none flex items-center justify-between transition-all ${disabled ? 'opacity-50 cursor-not-allowed text-slate-400' : 'cursor-pointer hover:border-indigo-300 text-slate-950'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400 font-bold' : 'text-slate-950'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronRight size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : 'rotate-90'}`} />
      </div>

      {isOpen && !disabled && (
        <div className={`absolute z-[100] w-full bg-white border border-slate-200 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-in fade-in duration-200 max-h-80 flex flex-col overflow-hidden ${direction === 'up' ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'
          }`}>
          <div className="p-2 border-b border-slate-100 shrink-0">
            <input
              type="text"
              className="w-full bg-slate-50 px-3 py-2 rounded-lg text-[13px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder={`${placeholder} 검색...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-1 py-1">
            {filteredOptions.length > 0 ? filteredOptions.map(o => (
              <div
                key={o.value}
                className={`px-4 py-2.5 text-[13px] font-bold cursor-pointer transition-colors ${o.value === value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                onClick={() => {
                  onChange(o.value);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                {o.label}
              </div>
            )) : (
              <div className="px-4 py-3 text-[13px] font-bold text-slate-400 text-center">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketPredSection({ storesData }: { storesData: any }) {
  const [analysisMode, setAnalysisMode] = useState<'basic' | 'deep'>('basic');
  const [industry, setIndustry] = useState('');
  const [admCd, setAdmCd] = useState('');
  const [openYear, setOpenYear] = useState('2026');
  const [openMonth, setOpenMonth] = useState('5');
  const [openDay, setOpenDay] = useState('1');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deepResult, setDeepResult] = useState<DeepPredictionResult | null>(null);
  const [isDeepLoading, setIsDeepLoading] = useState(false);
  const [deepError, setDeepError] = useState<string | null>(null);
  const [deepIndustries, setDeepIndustries] = useState<string[]>([]);
  const [deepMajor, setDeepMajor] = useState('');
  const [deepMinor, setDeepMinor] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const dongs = storesData?.storeByRegionDtoList ?? [];
  const isSeoulRegion = dongs.length > 0 && String(dongs[0].adongCd).startsWith('11');
  const isActive = storesData && isSeoulRegion;
  const canSubmit = industry && admCd && openYear && openMonth && !isLoading && isActive;

  const { majorOptions, minorOptions } = React.useMemo(() => {
    const map = new Map<string, string[]>();
    deepIndustries.forEach(ind => {
      const parts = ind.split('_');
      if (parts.length > 1) {
        const major = parts[0];
        const minor = parts.slice(1).join('_');
        if (!map.has(major)) map.set(major, []);
        map.get(major)!.push(minor);
      } else {
        const major = '기타';
        if (!map.has(major)) map.set(major, []);
        map.get(major)!.push(ind);
      }
    });

    const majors = Array.from(map.keys()).sort().map(k => ({ label: k, value: k }));
    const minors = deepMajor && map.has(deepMajor)
      ? map.get(deepMajor)!.sort().map(m => ({ label: m, value: m }))
      : [];

    return { majorOptions: majors, minorOptions: minors };
  }, [deepIndustries, deepMajor]);

  const currentDeepIndustry = deepMajor && deepMinor
    ? (deepIndustries.includes(`${deepMajor}_${deepMinor}`) ? `${deepMajor}_${deepMinor}` : deepMinor)
    : '';

  useEffect(() => {
    if (!isActive || deepIndustries.length > 0) return;
    api.get('/api/v1/ai/simulation/deep-prediction-list', {
      baseUrl: process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'
    })
      .then(r => r.json())
      .then(data => setDeepIndustries(data.industry_list ?? []))
      .catch(() => { });
  }, [isActive]);


  const handlePredict = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    const openDate = `${openYear}-${openMonth.padStart(2, '0')}-${openDay.padStart(2, '0')}`;

    try {
      const res = await api.post('/api/v1/ai/simulation/market-prediction', {
        industry,
        adm_cd: admCd,
        open_date: openDate,
      }, {
        baseUrl: process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? '예측 오류');
      }

      const data = await res.json();
      setResult(data);
      setDeepResult(null);
      setDeepError(null);
    } catch (e: any) {
      const errMsg = e.data?.detail || e.message || '서버 오류가 발생했습니다.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeepPredict = async () => {
    if (!isActive || !currentDeepIndustry || !admCd) return;
    setIsDeepLoading(true);
    setDeepError(null);
    setDeepResult(null);

    const openDate = `${openYear}-${openMonth.padStart(2, '0')}-${openDay.padStart(2, '0')}`;
    try {
      const res = await api.post('/api/v1/ai/simulation/deep-prediction', {
        industry: currentDeepIndustry,
        adm_cd: admCd,
        open_date: openDate,
      }, {
        baseUrl: process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? '심층 예측 오류');
      }
      const data = await res.json();
      setDeepResult(data);
      setResult(null);
      setError(null);
    } catch (e: any) {
      const errMsg = e.data?.detail || e.message || '서버 오류가 발생했습니다.';
      setDeepError(errMsg);
    } finally {
      setIsDeepLoading(false);
    }
  };

  return (
    <section className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 md:px-8 py-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-900 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
              AI 창업 생존 예측
            </h2>
            <p className="text-[11px] font-bold text-indigo-600 italic">
              * 서울시 행정동 선택 시 분석이 활성화됩니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Info size={12} className="text-indigo-600" />
            분석 모델 정보
          </button>
          {!isSeoulRegion && storesData && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              서울 지역에 최적화된 모델입니다 (현재 지역 예측 불가)
            </span>
          )}
          {!storesData && (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-pulse">
              먼저 상권을 분석해주세요
            </span>
          )}
        </div>
      </div>

      {showInfo && (
        <div className="mb-6 p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-[14px] font-black text-indigo-950 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-indigo-600" /> Nexus Intelligence 예측 모델 상세 안내
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-[13px] leading-relaxed font-bold">
            <div className="space-y-4 p-5 bg-white/70 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="text-indigo-900 font-black flex items-center gap-2 text-[15px]">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" /> 기본 분석 모델 (XGBoost v14)
              </div>
              <p className="text-slate-600">
                서울시 10개년 인허가 빅데이터를 기반으로 한 <strong>31개의 핵심 피처</strong>(계절 소비 성향, 인구 통계 등)를 분석합니다.
                <span className="block mt-2 text-indigo-700">✓ 임계치(Threshold) 0.3961 기준의 정밀 최적화</span>
                <span className="block text-indigo-700">✓ 지역별·업종별 거시적 생존 트렌드 반영</span>
              </p>
            </div>
            <div className="space-y-4 p-5 bg-white/70 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="text-indigo-900 font-black flex items-center gap-2 text-[15px]">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" /> 심층 분석 모델 (CatBoost v10)
              </div>
              <p className="text-slate-600">
                기본 분석에 <strong>서울시 상권분석 서비스(trdar)</strong> 메타데이터를 결합한 고도화 모델입니다.
                <span className="block mt-2 text-indigo-700">✓ 상권 밀집도, 총 면적, 입지 근접성 정밀 연산</span>
                <span className="block text-indigo-700">✓ 업종 다양성(Diversity Index) 기반의 상권 성숙도 분석</span>
                <span className="block text-indigo-700">✓ 초국소적 입지 특성에 따른 미시적 리스크 산출</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-6 transition-all relative items-stretch ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}
      >
        {!isActive && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/20 backdrop-blur-[1px] rounded-3xl">
            <div className="bg-white/90 border border-slate-200 px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                <MapPin size={20} className="text-indigo-600" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-black text-slate-950">분석 대기 중</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">
                  지도에서 <span className="text-indigo-600">서울 지역 상권 분석</span>을 먼저 완료해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-4 h-full">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full overflow-visible relative z-30">
            <div className="flex p-1 bg-slate-100 rounded-2xl shrink-0">
              <button
                onClick={() => setAnalysisMode('basic')}
                className={`flex-1 py-2.5 text-[12px] font-black rounded-xl transition-all ${analysisMode === 'basic' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}
              >
                기본 분석 (XGBoost)
              </button>
              <button
                onClick={() => setAnalysisMode('deep')}
                className={`flex-1 py-2.5 text-[12px] font-black rounded-xl transition-all ${analysisMode === 'deep' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}
              >
                심층 분석 (CatBoost)
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-visible pr-1 mt-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin size={12} className="text-indigo-600" /> 대상 행정동
                </label>
                <SearchableSelect
                  options={dongs.map((d: any) => ({ label: d.adongNm, value: d.adongCd }))}
                  value={admCd}
                  onChange={setAdmCd}
                  placeholder="행정동을 검색하거나 선택하세요"
                />
              </div>

              {analysisMode === 'basic' ? (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Store size={12} className="text-indigo-600" /> 창업 업종 (기본 분석)
                  </label>
                  <SearchableSelect
                    options={INDUSTRIES.map(i => ({ label: i, value: i }))}
                    value={industry}
                    onChange={setIndustry}
                    placeholder="업종을 검색하거나 선택하세요"
                    direction="up"
                  />
                </div>
              ) : (
                <div className="animate-in fade-in duration-300 space-y-4">
                  <label className="block text-[11px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={12} className="text-indigo-600" /> 창업 업종 (심층 분석)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 pl-1">대분류</p>
                      <SearchableSelect
                        options={majorOptions}
                        value={deepMajor}
                        onChange={(v) => { setDeepMajor(v); setDeepMinor(''); }}
                        placeholder="대분류 선택"
                        direction="up"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 pl-1">소분류</p>
                      <SearchableSelect
                        options={minorOptions}
                        value={deepMinor}
                        onChange={setDeepMinor}
                        placeholder="소분류 선택"
                        disabled={!deepMajor}
                        direction="up"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Calendar size={12} className="text-indigo-600" /> 오픈 예정일
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={openYear}
                    onChange={(e) => setOpenYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3.5 text-[13px] font-black text-slate-950 outline-none focus:border-indigo-900 transition-all text-center"
                  >
                    {Array.from({ length: 5 }, (_, i) => 2026 + i).map((year) => (
                      <option key={year} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>
                  <select
                    value={openMonth}
                    onChange={(e) => setOpenMonth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3.5 text-[13px] font-black text-slate-950 outline-none focus:border-indigo-900 transition-all text-center"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {m}월
                      </option>
                    ))}
                  </select>
                  <select
                    value={openDay}
                    onChange={(e) => setOpenDay(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-3.5 text-[13px] font-black text-slate-950 outline-none focus:border-indigo-900 transition-all text-center"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}일
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={analysisMode === 'basic' ? handlePredict : handleDeepPredict}
              disabled={
                analysisMode === 'basic'
                  ? !canSubmit
                  : (isDeepLoading || !currentDeepIndustry || !admCd)
              }
              className="w-full h-12 rounded-2xl text-[14px] font-black bg-indigo-900 text-white hover:bg-indigo-950 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 shrink-0 mt-4"
            >
              {isLoading || isDeepLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI 모델 연산 중...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {analysisMode === 'basic' ? '기본 생존 예측 시작' : '심층 생존 예측 시작'}
                </>
              )}
            </button>
            {(error || deepError) && (
              <p className="mt-3 text-[11px] font-bold text-red-500 text-center bg-red-50 py-3 rounded-lg border border-red-100 whitespace-pre-wrap">
                {error || deepError}
              </p>
            )}
          </div>
        </div>

        {/* 결과 영역 (L:8) */}
        <div className="lg:col-span-8 h-full flex flex-col">
          {result ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-full space-y-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* 도넛 차트 */}
                  <div className="relative w-40 h-40 shrink-0 flex flex-col items-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="80" cy="80" r="64" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                      <circle
                        cx="80" cy="80" r="64" fill="transparent"
                        stroke={result.label === 'caution' ? '#ea580c' : '#0d9488'}
                        strokeWidth="12"
                        strokeDasharray={402}
                        strokeDashoffset={402 - (402 * result.risk_score) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-black leading-none ${result.label === 'caution' ? 'text-orange-600' : 'text-teal-600'}`}>
                        {Math.round(result.risk_score)}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Risk %</span>
                    </div>
                  </div>

                  {/* 분석 내용 */}
                  <div className="flex-1 space-y-4 text-center md:text-left w-full">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2.5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${result.label === 'caution' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                          기본 분석: {result.label_kor} 상태
                        </span>
                        <div className="px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                          임계치 {Math.round(result.threshold * 100)}% 기준
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-slate-950 leading-tight tracking-tight break-keep">{result.message}</h3>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2.5 text-left">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-1.5">
                        <Sparkles size={12} /> 주요 분석 근거
                      </p>
                      <ul className="space-y-1.5">
                        {result.factors?.map((factor, i) => (
                          <li key={i} className="text-[13px] font-bold text-slate-700 flex items-start gap-2 leading-relaxed">
                            <ChevronRight size={16} className="shrink-0 mt-0.5 text-indigo-500" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 하단 요약 정보 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">District</p>
                    <p className="text-[14px] font-black text-slate-900 truncate">{result.gu}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">Region</p>
                    <p className="text-[14px] font-black text-slate-900 truncate">{result.dong}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">Industry</p>
                    <p className="text-[14px] font-black text-slate-900 truncate">{result.industry}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">Open Date</p>
                    <p className="text-[14px] font-black text-slate-900 truncate">{result.open_date}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : deepResult ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-full space-y-4">
                <div className="flex flex-col md:flex-row items-start gap-5">
                  {/* 도넛 차트 (기본 분석과 완전히 동일) */}
                  <div className="relative w-40 h-40 shrink-0 flex flex-col items-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="80" cy="80" r="64" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                      <circle
                        cx="80" cy="80" r="64" fill="transparent"
                        stroke={deepResult.label === 'caution' ? '#ea580c' : '#0d9488'}
                        strokeWidth="12"
                        strokeDasharray={402}
                        strokeDashoffset={402 - (402 * deepResult.risk_score) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-black leading-none ${deepResult.label === 'caution' ? 'text-orange-600' : 'text-teal-600'}`}>
                        {Math.round(deepResult.risk_score)}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Risk %</span>
                    </div>
                  </div>

                  {/* 분석 내용 */}
                  <div className="flex-1 space-y-4 text-center md:text-left w-full">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${deepResult.label === 'caution' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                          심층 분석: {deepResult.label_kor} 상태
                        </span>
                        <div className="px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-bold text-slate-500">
                          임계치 {Math.round(deepResult.threshold * 100)}% 기준
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-950 leading-tight tracking-tight break-keep">{deepResult.message}</h3>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-left">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-1">
                        <Sparkles size={12} /> 상권 지표 기반 정밀 분석 근거
                      </p>
                      <ul className="space-y-1">
                        {deepResult.factors?.map((factor, i) => (
                          <li key={i} className="text-[12px] font-bold text-slate-700 flex items-start gap-2 leading-relaxed">
                            <ChevronRight size={14} className="shrink-0 mt-0.5 text-indigo-500" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 상권 지표 카드 — dist_to_trdar 제외 (좌표계 불일치로 신뢰 불가) */}
                    <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50 mt-3 text-left">
                      <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <TrendingUp size={12} /> 상권 분석 지표
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/80 p-3 rounded-xl border border-indigo-50 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">상권 구역 수</p>
                          <p className="text-[14px] font-black text-indigo-900">
                            {deepResult.trdar_count != null ? `${deepResult.trdar_count}개` : '–'}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{deepResult.dong} 인근</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-indigo-50 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">주요 상권 유형</p>
                          <p className="text-[14px] font-black text-indigo-900">
                            {deepResult.trdar_type || '일반상권'}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">해당 지역 상권 분류</p>
                        </div>
                        <div className="bg-white/80 p-3 rounded-xl border border-indigo-50 shadow-sm">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">상권 총 면적</p>
                          <p className="text-[14px] font-black text-indigo-900">
                            {deepResult.trdar_area_sum != null && deepResult.trdar_area_sum > 0
                              ? `${Math.round(deepResult.trdar_area_sum).toLocaleString()}㎡`
                              : '–'}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">구역 합산 면적</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단 요약 정보 (기본 분석과 동일한 크기 및 스타일) */}
                <div className="grid grid-cols-4 gap-2 w-full">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 mb-0.5 uppercase">District</p>
                    <p className="text-[12px] font-black text-slate-900 truncate">{deepResult.gu}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 mb-0.5 uppercase">Region</p>
                    <p className="text-[12px] font-black text-slate-900 truncate">{deepResult.dong}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 mb-0.5 uppercase">Industry</p>
                    <p className="text-[12px] font-black text-slate-900 truncate">{deepResult.industry}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 mb-0.5 uppercase">Open Date</p>
                    <p className="text-[12px] font-black text-slate-900 truncate">{deepResult.open_date}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-center p-12 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <BrainCircuit size={48} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">분석 준비가 되었습니다</h3>
              <p className="text-slate-500 font-bold max-w-sm leading-relaxed text-[13px]">
                왼쪽에서 행정동과 업종을 선택한 후<br />
                <span className="text-indigo-600">생존 예측 시작</span> 버튼을 눌러주세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
