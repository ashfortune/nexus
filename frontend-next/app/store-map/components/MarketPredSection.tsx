"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Calendar, MapPin, Store, Info, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

const INDUSTRIES = ["노래연습장업", "세탁업", "유흥주점영업", "의원", "인터넷컴퓨터게임시설제공업", "제과점영업", "체력단련장업"];

interface PredictionResult {
  risk_score: number;
  label: "stable" | "caution";
  label_kor: string;
  industry: string;
  dong: string;
  gu: string;
  open_date: string;
  message: string;
  threshold: number;
  factors?: string[];
}

export default function MarketPredSection({ storesData }: { storesData: any }) {
  const [industry, setIndustry] = useState("");
  const [admCd, setAdmCd] = useState("");
  const openYear = "2024";
  const [openMonth, setOpenMonth] = useState("5");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const dongs = storesData?.storeByRegionDtoList ?? [];
  const isSeoul = admCd ? admCd.startsWith("11") : true;
  const canSubmit = industry && admCd && openYear && openMonth && !isLoading && isSeoul;

  const handlePredict = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    // API용 날짜 문자열 생성 (YYYY-MM-01)
    const openDate = `${openYear}-${openMonth.padStart(2, "0")}-01`;

    try {
      const res = await fetch(`${FASTAPI_BASE_URL}/api/v1/ai/simulation/market-prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          adm_cd: admCd,
          open_date: openDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "예측 오류");
      }
      // MarketPredSection.tsx handlePredict 안에 임시로 추가
      console.log("adm_cd:", admCd);
      console.log("dongs:", dongs);

      setResult(await res.json());
    } catch (e: any) {
      setError(e.message ?? "서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 md:px-8 py-8">
      {/* 헤더 및 안내 버튼 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-900 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-black text-slate-950 uppercase tracking-tight">AI 창업 생존 예측</h2>
            <p className="text-[10px] font-bold text-indigo-600 italic">* 서울시 선택 시 AI 창업 생존 예측 가능</p>
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
          {!isSeoul && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              서울 지역에 최적화된 모델입니다
            </span>
          )}
          {!storesData && (
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-pulse">
              먼저 상권을 분석해주세요
            </span>
          )}
        </div>
      </div>

      {/* 모델 정보 섹션 (토글) */}
      {showInfo && (
        <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
          <h3 className="text-[11px] font-black text-indigo-950 mb-2 flex items-center gap-1.5">
            <AlertCircle size={13} /> Nexus Intelligence 예측 모델 안내
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px] leading-relaxed text-indigo-900/80 font-medium">
            <div className="space-y-2">
              <p>
                • <strong className="text-indigo-950">데이터 출처:</strong> 서울시 공공데이터 및 인허가 정보(CSV) 10년치 데이터를
                학습했습니다.
              </p>
              <p>
                • <strong className="text-indigo-950">분석 기술:</strong> XGBoost 머신러닝 알고리즘을 사용하여 업종별/지역별 생존 패턴을
                분석합니다.
              </p>
            </div>
            <div className="space-y-2">
              <p>
                • <strong className="text-indigo-950">예측 범위:</strong> 서울시 내 7대 주요 업종에 대해 최적화되어 있으며, 3년 이내 폐업
                가능성을 예측합니다.
              </p>
              <p>
                • <strong className="text-indigo-950">참고 사항:</strong> 본 결과는 통계적 예측치이며, 실제 경영 성과는 개별 운영 역량에
                따라 다를 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 transition-all ${!storesData ? "opacity-40 pointer-events-none" : ""}`}>
        {/* 입력 폼 (L:4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {/* 동 선택 */}
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <MapPin size={10} className="text-indigo-600" /> 대상 행정동
              </label>
              <select
                value={admCd}
                onChange={(e) => setAdmCd(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-900 transition-all"
              >
                <option value="">분석할 동 선택</option>
                {dongs.map((d: any) => (
                  <option key={d.adongCd} value={d.adongCd}>
                    {d.adongNm}
                  </option>
                ))}
              </select>
            </div>

            {/* 업종 선택 */}
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Store size={10} className="text-indigo-600" /> 창업 업종
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-900 transition-all"
              >
                <option value="">업종 선택</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* 창업 예정일 (월 선택) */}
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Calendar size={10} className="text-indigo-600" /> 오픈 예정 월
              </label>
              <select
                value={openMonth}
                onChange={(e) => setOpenMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-950 outline-none focus:border-indigo-900 transition-all"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePredict}
              disabled={!canSubmit}
              className="w-full h-12 rounded-xl text-[12px] font-black bg-indigo-900 text-white hover:bg-indigo-950 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI 분석 중...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  생존 예측 시뮬레이션 시작
                </>
              )}
            </button>

            {error && (
              <p className="text-[10px] font-bold text-red-500 text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>
            )}
          </div>
        </div>

        {/* 결과 영역 (L:8) */}
        <div className="lg:col-span-8 min-h-[300px]">
          {!result && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 text-slate-400 p-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp size={24} className="opacity-20" />
              </div>
              <h3 className="text-[13px] font-black text-slate-400 mb-1">예측 대기 중</h3>
              <p className="text-[11px] font-bold opacity-60 text-center max-w-[240px]">
                왼쪽 폼을 입력하고 시뮬레이션을 시작하면 AI 분석 결과가 이곳에 표시됩니다.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center border border-slate-200 rounded-3xl bg-white p-8">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-indigo-900 rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={24} className="text-indigo-900 animate-pulse" />
                </div>
              </div>
              <h3 className="text-[15px] font-black text-slate-950 mb-2">데이터 분석 모델 가동 중</h3>
              <p className="text-[11px] font-bold text-slate-500 text-center animate-pulse">
                서울시 인허가 데이터와 현재 상권 지표를 결합하여
                <br />
                미래 생존 가능성을 연산하고 있습니다.
              </p>
            </div>
          )}

          {result && (
            <div
              className={`h-full border animate-in zoom-in-95 duration-500 rounded-3xl overflow-hidden bg-white shadow-xl shadow-slate-200/50 ${result.label === "caution" ? "border-red-100" : "border-emerald-100"
                }`}
            >
              {/* 상단 컬러 바 */}
              <div className={`h-2 w-full ${result.label === "caution" ? "bg-red-500" : "bg-emerald-500"}`} />

              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* 점수 게이지 */}
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="64" cy="64" r="58" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        fill="none"
                        stroke={result.label === "caution" ? "#ef4444" : "#10b981"}
                        strokeWidth="10"
                        strokeDasharray={364}
                        strokeDashoffset={364 - (364 * result.risk_score) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={`text-3xl font-black leading-none ${result.label === "caution" ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {Math.round(result.risk_score)}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 mt-1 uppercase">Risk %</span>
                    </div>
                  </div>

                  {/* 결과 메시지 */}
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${result.label === "caution" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                        >
                          {result.label_kor} 상태
                        </span>
                        <div className="group relative">
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 cursor-help underline decoration-dotted underline-offset-4">
                            위험 임계치: {Math.round(result.threshold * 100)}%
                            <Info size={10} />
                          </span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                            <p className="font-black mb-1">위험 임계치란?</p>
                            AI가 폐업 위험이 높다고 판단하는 기준점입니다. 예측 점수가 이 수치를 넘으면 '주의' 상태가 됩니다.
                          </div>
                        </div>
                      </div>
                      <h3 className="text-[18px] font-black text-slate-950 leading-tight">{result.message}</h3>
                      <p className="text-[12px] font-bold text-indigo-600 mt-2">
                        {result.label === "caution"
                          ? "⚠️ 통계적 폐업 위험군에 속하므로 입지 선정에 신중한 검토가 필요합니다."
                          : "✅ 현재 조건에서 창업 시 타 사례 대비 높은 생존 확률이 예상됩니다."}
                      </p>
                    </div>

                    {/* 분석 요인 (Why) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <AlertCircle size={12} className="text-indigo-600" /> 예측 분석 근거
                      </p>
                      <ul className="space-y-1.5">
                        {result.factors?.map((factor, i) => (
                          <li key={i} className="text-[11px] font-bold text-slate-600 flex items-start gap-2">
                            <ChevronRight size={12} className="shrink-0 mt-0.5 text-indigo-400" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 임계치 비교 바 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>안정</span>
                        <span>임계치 ({Math.round(result.threshold * 100)}%)</span>
                        <span>주의</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
                        <div
                          className={`h-full transition-all duration-1000 ease-out ${result.label === "caution" ? "bg-red-500" : "bg-emerald-500"}`}
                          style={{ width: `${result.risk_score}%` }}
                        />
                        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-950/20" style={{ left: `${result.threshold * 100}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                        <p className="text-[9px] font-black text-slate-400 mb-1">행정구</p>
                        <p className="text-[11px] font-black text-slate-900">{result.gu}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                        <p className="text-[9px] font-black text-slate-400 mb-1">행정동</p>
                        <p className="text-[11px] font-black text-slate-900">{result.dong}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                        <p className="text-[9px] font-black text-slate-400 mb-1">업종</p>
                        <p className="text-[11px] font-black text-slate-900">{result.industry}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                        <p className="text-[9px] font-black text-slate-400 mb-1">오픈 예정 월</p>
                        <p className="text-[11px] font-black text-slate-900">{parseInt(result.open_date.split("-")[1])}월</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
