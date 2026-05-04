"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Settings,
  Calculator,
  TrendingUp,
  Layers,
  Clock,
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  Sparkles
} from "lucide-react";
import {
  ProcessedRealEstateDto,
  EquipPriceItem,
  EquipPriceResponseDto,
  EquipPriceItemWithQty,
} from "./types";

type PriceTab = "under" | "over";

interface Props {
  industName: string;
  regionLabel: string;
  realEstateList: ProcessedRealEstateDto[];
  equipData: EquipPriceResponseDto;
  onBack: () => void;
}

export default function SimResultStep({
  industName,
  regionLabel,
  realEstateList,
  equipData,
  onBack,
}: Props) {
  const [equips, setEquips] = useState<EquipPriceItemWithQty[]>(() =>
    (equipData.equip_prices ?? []).map((e: EquipPriceItem) => ({ ...e, qty: 1 }))
  );

  const [selectedRE, setSelectedRE] = useState<ProcessedRealEstateDto | null>(null);

  const changeQty = (idx: number, delta: number) => {
    setEquips((prev) =>
      prev.map((e, i) =>
        i === idx ? { ...e, qty: Math.max(0, e.qty + delta) } : e
      )
    );
  };

  const removeEquip = (idx: number) => {
    setEquips((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalEquipCost = useMemo(
    () => equips.reduce((sum, e) => sum + (e.product_price ?? 0) * e.qty, 0),
    [equips]
  );

  const selectedREAmount = selectedRE?.dealAmount ?? 0;
  const grandTotal = (selectedREAmount as number) + totalEquipCost;

  const reStats = useMemo(() => {
    const validDeal = realEstateList
      .map((r) => r.dealAmount)
      .filter((v): v is number => v !== null && v > 0);
    const validPyeong = realEstateList
      .map((r) => r.pricePerPyeong)
      .filter((v): v is number => v !== null && v > 0);
    const validAr = realEstateList
      .map((r) => parseFloat(r.buildingAr ?? "0"))
      .filter((v) => v > 0);
    const validAge = realEstateList
      .map((r) => r.buildAge)
      .filter((v): v is number => v !== null && v >= 0);

    const avg = (arr: number[]) =>
      arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

    return {
      avgDeal: avg(validDeal),
      avgPyeong: avg(validPyeong),
      avgAr: avg(validAr),
      avgAge: avg(validAge),
      totalCount: realEstateList.length,
    };
  }, [realEstateList]);

  const formatWon = (n: number) => {
    if (n <= 0) return "0원";
    const eok = Math.floor(n / 100_000_000);          // 억 단위
    const manwon = Math.floor((n % 100_000_000) / 10_000); // 나머지 만원 단위
    if (eok > 0 && manwon > 0) return `${eok}억 ${manwon.toLocaleString()}만원`;
    if (eok > 0) return `${eok}억원`;
    if (manwon > 0) return `${manwon.toLocaleString()}만원`;
    return `${n.toLocaleString()}원`;
  };

  const [priceTab, setPriceTab] = useState<PriceTab>("under");
  const under100M = useMemo(
    () => realEstateList.filter((r) => r.isWithin100M === true),
    [realEstateList]
  );
  const over100M = useMemo(
    () => realEstateList.filter((r) => r.isWithin100M === false),
    [realEstateList]
  );
  const activeList = priceTab === "under" ? under100M : over100M;

  const getSourceStyle = (src: string) => {
    switch (src?.toUpperCase()) {
      case 'NAVER': return 'bg-[#03C75A] text-white';
      case 'RAG': return 'bg-[var(--nexus-primary)] text-white';
      case 'LLM': return 'bg-[var(--nexus-secondary)] text-white';
      case 'HUMAN': return 'bg-[var(--nexus-tertiary-fixed)] text-[var(--nexus-primary)]';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] pb-48 font-inter">
      {/* ── 상단 헤더 ── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[var(--nexus-outline-variant)]/30 px-6 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-[var(--nexus-primary)] hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={18} /> 다시 검색
        </button>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-[var(--nexus-surface-container)] rounded-full text-[10px] font-black text-[var(--nexus-primary)] uppercase tracking-wider">{industName}</span>
          <span className="w-1 h-1 bg-[var(--nexus-outline-variant)] rounded-full" />
          <span className="px-3 py-1 bg-[var(--nexus-surface-container)] rounded-full text-[10px] font-black text-[var(--nexus-secondary)] uppercase tracking-wider">{regionLabel}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        <div className="space-y-4">
          <h1 className="font-manrope text-4xl font-black text-[var(--nexus-primary)] tracking-tight">창업 비용 시뮬레이션 결과</h1>
          <p className="text-lg text-[var(--nexus-on-bg)] font-semibold opacity-90">AI가 분석한 {regionLabel} {industName} 창업 가이드입니다.</p>
        </div>

        {/* ── Section 1: 부동산 ── */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--nexus-primary)] text-white rounded-xl flex items-center justify-center font-black">01</div>
            <div>
              <h2 className="text-2xl font-black font-manrope text-[var(--nexus-primary)]">상업용 부동산 최근 매매가 분석</h2>
              <p className="text-sm text-[var(--nexus-on-bg)] font-bold opacity-70">최근 실거래 {reStats.totalCount}건 · 1억 이하/초과 각 최대 5건씩 수집했습니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "평균 거래금액", val: formatWon(reStats.avgDeal), icon: TrendingUp, color: "text-blue-600" },
              { label: "평균 평당가격", val: formatWon(reStats.avgPyeong), icon: Calculator, color: "text-purple-600" },
              { label: "평균 건물면적", val: `${reStats.avgAr}㎡`, icon: Layers, color: "text-teal-600" },
              { label: "평균 건물연차", val: `${reStats.avgAge}년`, icon: Clock, color: "text-orange-600" },
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-[var(--nexus-outline-variant)]/20 shadow-sm flex flex-col gap-4">
                <div className={`w-8 h-8 rounded-lg bg-[var(--nexus-surface-low)] flex items-center justify-center ${s.color}`}>
                  <s.icon size={16} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-[var(--nexus-primary)] opacity-70 uppercase tracking-widest mb-1">{s.label}</div>
                  <div className="text-2xl font-black text-[var(--nexus-primary)]">{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 목록 및 탭 */}
          <div className="bg-white rounded-[32px] border border-[var(--nexus-outline-variant)]/20 overflow-hidden shadow-sm">
            <div className="flex border-b border-[var(--nexus-outline-variant)]/20">
              <button
                onClick={() => setPriceTab("under")}
                className={`flex-1 py-4 text-sm font-black transition-colors flex items-center justify-center gap-2 ${priceTab === 'under' ? 'bg-[var(--nexus-surface-low)] text-[var(--nexus-primary)]' : 'text-[var(--nexus-primary)] opacity-40 hover:opacity-100'}`}
              >
                <span className="px-1.5 py-0.5 bg-[var(--nexus-primary)]/10 text-[var(--nexus-primary)] text-[8px] font-black rounded uppercase tracking-wider">최근 매매가</span>
                1억 이하 <span className={`text-[10px] ${priceTab === 'under' ? 'text-[var(--nexus-primary)] opacity-70' : 'opacity-50'}`}>{under100M.length}건</span>
              </button>
              <button
                onClick={() => setPriceTab("over")}
                className={`flex-1 py-4 text-sm font-black transition-colors flex items-center justify-center gap-2 ${priceTab === 'over' ? 'bg-[var(--nexus-surface-low)] text-[var(--nexus-primary)]' : 'text-[var(--nexus-primary)] opacity-40 hover:opacity-100'}`}
              >
                <span className="px-1.5 py-0.5 bg-[var(--nexus-primary)]/10 text-[var(--nexus-primary)] text-[8px] font-black rounded uppercase tracking-wider">최근 매매가</span>
                1억 초과 <span className={`text-[10px] ${priceTab === 'over' ? 'text-[var(--nexus-primary)] opacity-70' : 'opacity-50'}`}>{over100M.length}건</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--nexus-surface-low)] text-[10px] font-black uppercase text-[var(--nexus-primary)]/70 tracking-widest">
                  <tr>
                    <th className="px-6 py-4">주소</th>
                    <th className="px-6 py-4 text-center">건물 용도</th>
                    <th className="px-6 py-4 text-right">면적(㎡)</th>
                    <th className="px-6 py-4 text-right">거래금액</th>
                    <th className="px-6 py-4 text-center">거래날짜</th>
                    <th className="px-6 py-4 text-center">선택</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--nexus-outline-variant)]/10">
                  {activeList.map((r, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[var(--nexus-surface-low)]/30 cursor-pointer transition-colors ${selectedRE === r ? 'bg-[var(--nexus-surface-container)]/50' : ''}`}
                      onClick={() => setSelectedRE(selectedRE === r ? null : r)}
                    >
                      <td className="px-6 py-5 font-bold text-[var(--nexus-on-bg)]">{r.address}</td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] font-black text-[var(--nexus-primary)]">{r.buildingUse}</span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-[var(--nexus-on-bg)] opacity-80">{r.buildingAr}</td>
                      <td className="px-6 py-5 text-right font-black text-[var(--nexus-primary)]">{formatWon(r.dealAmount ?? 0)}</td>
                      <td className="px-6 py-5 text-center text-[11px] font-bold text-[var(--nexus-on-bg)] opacity-60">{r.dealDate ?? '-'}</td>
                      <td className="px-6 py-5 text-center">
                        <div className={`w-5 h-5 rounded-full border-2 mx-auto flex items-center justify-center transition-colors ${selectedRE === r ? 'border-[var(--nexus-primary)] bg-[var(--nexus-primary)]' : 'border-[var(--nexus-outline-variant)]'}`}>
                          {selectedRE === r && <Plus size={12} className="text-white" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center opacity-40 italic">거래 데이터가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Section 2: 설비 ── */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--nexus-secondary)] text-white rounded-xl flex items-center justify-center font-black">02</div>
            <div>
              <h2 className="text-2xl font-black font-manrope text-[var(--nexus-secondary)]">필수 설비 비용 분석</h2>
              <p className="text-sm text-[var(--nexus-on-bg)] font-bold opacity-70">{industName} 창업에 필요한 핵심 설비 데이터입니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equips.map((eq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-[var(--nexus-outline-variant)]/20 shadow-sm flex gap-6 hover:border-[var(--nexus-secondary)]/30 transition-colors group">
                <div className="w-24 h-24 bg-[var(--nexus-surface-low)] rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {eq.imageUrl ? (
                    <img src={eq.imageUrl} alt={eq.equip_name_kr} className="w-full h-full object-cover" />
                  ) : (
                    <Settings className="w-8 h-8 opacity-20" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-black text-base text-[var(--nexus-primary)]">{eq.equip_name_kr}</h3>
                      <button onClick={() => removeEquip(idx)} className="opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {eq.detail && (
                      <p className="text-sm text-[var(--nexus-on-bg)] opacity-70 line-clamp-2 mb-3 leading-relaxed">{eq.detail}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getSourceStyle(eq.source)}`}>{eq.source}</span>
                      {eq.link && <a href={eq.link} target="_blank" rel="noopener noreferrer" className="text-[8px] font-bold text-[var(--nexus-secondary)] flex items-center gap-1">LINK <ExternalLink size={8} /></a>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="font-black text-[var(--nexus-primary)]">{formatWon(eq.product_price ?? 0)}</div>
                    <div className="flex items-center bg-[var(--nexus-surface-low)] rounded-lg p-1">
                      <button onClick={() => changeQty(idx, -1)} className="p-1 hover:bg-white rounded-md transition-colors"><Minus size={12} /></button>
                      <span className="w-8 text-center text-xs font-bold">{eq.qty}</span>
                      <button onClick={() => changeQty(idx, 1)} className="p-1 hover:bg-white rounded-md transition-colors"><Plus size={12} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--nexus-primary)] p-8 rounded-[32px] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="text-[var(--nexus-tertiary-fixed)]" />
              </div>
              <div>
                <div className="text-[10px] font-black opacity-50 uppercase tracking-widest">예상 설비 총액</div>
                <div className="text-sm opacity-70">{equips.reduce((s, e) => s + e.qty, 0)}개의 품목이 포함되었습니다.</div>
              </div>
            </div>
            <div className="text-4xl font-black">{formatWon(totalEquipCost)}</div>
          </div>
        </section>
      </div>

      {/* ── Sticky Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 w-full z-50 p-6">
        <div className="max-w-4xl mx-auto bg-[var(--nexus-primary)]/90 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(11,26,125,0.4)] border border-white/10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 grid grid-cols-2 md:grid-cols-2 gap-8 w-full">
            <div className="space-y-1">
              <div className="text-[10px] font-black opacity-50 uppercase tracking-widest flex items-center gap-2">
                <Building2 size={12} /> 부동산 (선택)
              </div>
              <div className="text-xl font-bold truncate">
                {selectedRE ? formatWon(selectedRE.dealAmount ?? 0) : <span className="opacity-30">미선택</span>}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-black opacity-50 uppercase tracking-widest flex items-center gap-2">
                <Settings size={12} /> 설비 합계
              </div>
              <div className="text-xl font-bold">{formatWon(totalEquipCost)}</div>
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-white/10" />

          <div className="flex-1 flex flex-col items-end w-full">
            <div className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Calculator size={12} /> 총 창업 예상 비용
            </div>
            <div className="text-4xl font-black text-[var(--nexus-tertiary-fixed)]">{formatWon(grandTotal)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
