"use client";

import React, { useEffect, useState } from "react";
import SimSearchStep from "./SimSearchStep";
import SimResultStep from "./SimResultStep";
import {
  fetchSearchList,
  fetchRealEstate,
  fetchEquipPrice,
} from "./api";
import {
  SimSearchListDto,
  SimIndustCatsDto,
  SimRegCodesDto,
  ProcessedRealEstateDto,
  EquipPriceResponseDto,
} from "./types";
import { Sparkles, Info } from "lucide-react";

type Step = "search" | "result";

export default function SimulationPage() {
  const [mounted, setMounted] = useState(false);
  const [searchList, setSearchList] = useState<SimSearchListDto | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [realEstateList, setRealEstateList] = useState<ProcessedRealEstateDto[]>([]);
  const [equipData, setEquipData] = useState<EquipPriceResponseDto | null>(null);
  const [selectedIndust, setSelectedIndust] = useState<SimIndustCatsDto | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SimRegCodesDto | null>(null);
  const [step, setStep] = useState<Step>("search");

  useEffect(() => {
    setMounted(true);
    fetchSearchList()
      .then(setSearchList)
      .catch((err) => setListError(err.message))
      .finally(() => setListLoading(false));
  }, []);

  const handleSubmit = async (
    industry: SimIndustCatsDto,
    region: SimRegCodesDto
  ) => {
    setSelectedIndust(industry);
    setSelectedRegion(region);
    setSimLoading(true);
    setSimError(null);

    try {
      const [reList, eq] = await Promise.all([
        fetchRealEstate(region.regionCode),
        fetchEquipPrice(industry.ksicCode),
      ]);
      setRealEstateList(reList);
      setEquipData(eq);
      setStep("result");
    } catch (err: unknown) {
      setSimError(err instanceof Error ? err.message : "시뮬레이션 요청 실패");
    } finally {
      setSimLoading(false);
    }
  };

  const handleBack = () => {
    setStep("search");
    setSimError(null);
  };

  // Hydration Mismatch 방지: 서버에서는 null 또는 기본 배경만 렌더링
  if (!mounted) {
    return <div className="min-h-screen bg-[var(--nexus-bg)]" />;
  }

  if (listLoading) {
    return (
      <div className="min-h-screen bg-[var(--nexus-bg)] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--nexus-primary)]/10 border-t-[var(--nexus-primary)] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={16} className="text-[var(--nexus-primary)] animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-bold text-[var(--nexus-primary)] tracking-widest uppercase opacity-40">Initializing Nexus Engine</p>
          <p className="text-lg font-light opacity-60">업종·지역 목록을 분석하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="min-h-screen bg-[var(--nexus-bg)] flex flex-col items-center justify-center px-6 text-center gap-8">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center shadow-sm">
          <Info size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[var(--nexus-primary)]">데이터 로드 실패</h2>
          <p className="opacity-60 max-w-xs">{listError}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-[var(--nexus-primary)] text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--nexus-bg)]">
      {simError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] bg-red-900/90 border border-red-500/50 text-red-100 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-md">
          <span className="text-lg">⚠️</span>
          <span className="text-sm font-medium">{simError}</span>
          <button className="ml-2 text-xl leading-none opacity-60 hover:opacity-100" onClick={() => setSimError(null)}>×</button>
        </div>
      )}

      {step === "search" && (
        <SimSearchStep
          industList={searchList?.indust_cats ?? []}
          regionList={searchList?.reg_codes ?? []}
          onSubmit={handleSubmit}
          loading={simLoading}
        />
      )}

      {step === "result" && equipData && selectedIndust && selectedRegion && (
        <SimResultStep
          industName={selectedIndust.industryName}
          regionLabel={`${selectedRegion.cityName} ${selectedRegion.countyName}`}
          realEstateList={realEstateList}
          equipData={equipData}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
