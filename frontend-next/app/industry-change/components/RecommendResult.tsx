"use client";

import { useState } from "react";
import { RestaurantTypeResult } from "../industryChangeTypes";
import { Separator } from "@/components/ui/separator";

interface Props {
  results: RestaurantTypeResult[];
}

const TOOLTIPS = {
  유사도: "Jaccard·Cosine·KNN 3가지 방식을 앙상블한 종합 설비 유사도입니다.",
  Jaccard: "보유 설비의 겹치는 비율로 유사도를 계산합니다. (교집합 ÷ 합집합)",
  Cosine: "설비 벡터의 방향 유사도를 계산합니다. 설비 중요도(가중치)가 반영됩니다.",
  폐업률: "KOSIS 영세 자영업 신생기업 생존율 (2019~2021년 3개년 평균) 기준입니다.\n100% - 3년 생존율 = 3년 내 폐업률",
  최종점수: "설비 유사도 80% + 3년 생존율 20%를 합산한 점수입니다.\n생존율 제외 시 설비 유사도만으로 순위를 산정합니다.",
};

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow((v) => !v)}
        className="w-4 h-4 rounded-full text-xs flex items-center justify-center ml-1 shrink-0"
        style={{ background: "var(--nexus-outline-variant)", color: "var(--nexus-outline)" }}
      >
        ?
      </button>
      {show && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl text-xs w-56 z-50 whitespace-pre-line"
          style={{
            background: "var(--nexus-on-bg)",
            color: "var(--nexus-surface-lowest)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function RecommendResult({ results }: Props) {
  const [excludeSurvival, setExcludeSurvival] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (results.length === 0) return null;

  const sorted = excludeSurvival
    ? [...results].sort((a, b) => b.similarity - a.similarity)
    : results;

  const displayResults = excludeSurvival ? sorted.slice(0, 10) : sorted.slice(0, 3);

  const rankStyle = (idx: number) => {
    if (idx === 0) return { bg: "var(--nexus-primary)", text: "var(--nexus-on-primary)" };
    if (idx === 1) return { bg: "var(--nexus-secondary)", text: "var(--nexus-on-secondary)" };
    return { bg: "var(--nexus-surface-container-high)", text: "var(--nexus-primary)" };
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold" style={{ color: "var(--nexus-on-bg)" }}>
            {excludeSurvival ? "설비 유사도 Top 10" : "업종 전환 추천 Top 3"}
          </p>
          <Tooltip text={TOOLTIPS["최종점수"]} />
        </div>
        <button
          onClick={() => setExcludeSurvival((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: excludeSurvival ? "var(--nexus-primary)" : "var(--nexus-surface-container)",
            color: excludeSurvival ? "var(--nexus-on-primary)" : "var(--nexus-outline)",
            border: "1.5px solid var(--nexus-outline-variant)",
          }}
        >
          <span
            className="w-3 h-3 rounded-full border"
            style={{
              background: excludeSurvival ? "var(--nexus-on-primary)" : "transparent",
              borderColor: excludeSurvival ? "var(--nexus-on-primary)" : "var(--nexus-outline)",
            }}
          />
          폐업률 제외
        </button>
      </div>

      {displayResults.map((item, idx) => {
        const style = rankStyle(idx);
        const closureRate = item.survival_rate_3y ? 100 - item.survival_rate_3y : null;
        const displayScore = excludeSurvival ? item.similarity : item.final_score;
        const isExpanded = expandedId === item.restaurant_type_id;

        return (
          <div
            key={item.restaurant_type_id}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1.5px solid var(--nexus-outline-variant)" }}
          >
            <div
              className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
              style={{ background: "var(--nexus-surface-lowest)" }}
              onClick={() =>
                setExpandedId(isExpanded ? null : item.restaurant_type_id)
              }
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: style.bg, color: style.text }}
              >
                {idx + 1}
              </div>
              <div className="flex flex-col flex-1 gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-base" style={{ color: "var(--nexus-on-bg)" }}>
                    {item.restaurant_type_name}
                  </p>
                  <span className="text-xs" style={{ color: "var(--nexus-outline)" }}>
                    {isExpanded ? "▲ 닫기" : "▼ 설비 보기"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full overflow-hidden flex-1"
                    style={{ background: "var(--nexus-outline-variant)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(displayScore * 100).toFixed(0)}%`,
                        background: style.bg,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: "var(--nexus-outline)" }}>
                    {(displayScore * 100).toFixed(1)}점
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div
              className="grid divide-x"
              style={{
                gridTemplateColumns: excludeSurvival ? "repeat(3, 1fr)" : "repeat(4, 1fr)",
                background: "var(--nexus-surface-low)",
                borderColor: "var(--nexus-outline-variant)",
              }}
            >
              <ScoreCell label="유사도" tooltip={TOOLTIPS["유사도"]} value={item.similarity} />
              <ScoreCell label="Jaccard" tooltip={TOOLTIPS["Jaccard"]} value={item.jaccard} />
              <ScoreCell label="Cosine" tooltip={TOOLTIPS["Cosine"]} value={item.cosine} />
              {!excludeSurvival && (
                <ScoreCell
                  label="3년 폐업률"
                  tooltip={TOOLTIPS["폐업률"]}
                  value={closureRate !== null ? closureRate / 100 : null}
                  warning={closureRate !== null && closureRate >= 50}
                />
              )}
            </div>

            {isExpanded && (
              <>
                <Separator />
                <div
                  className="px-5 py-4 flex flex-col gap-3"
                  style={{ background: "var(--nexus-surface-lowest)" }}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--nexus-on-bg)" }}>
                      보유 설비 중 일치하는 항목
                    </p>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--nexus-primary-container)",
                        color: "var(--nexus-on-primary-container)",
                      }}
                    >
                      {item.matched_equipment.length}개
                    </span>
                  </div>
                  {item.matched_equipment.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.matched_equipment.map((eq) => (
                        <span
                          key={eq.equipment_id}
                          className="flex flex-col px-3 py-1.5 rounded-xl text-xs"
                          style={{
                            background: "var(--nexus-surface-container)",
                            border: "1.5px solid var(--nexus-secondary)",
                            color: "var(--nexus-on-bg)",
                          }}
                        >
                          <span className="font-semibold">{eq.equipment_name}</span>
                          <span style={{ color: "var(--nexus-outline)" }}>{eq.category}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--nexus-outline)" }}>
                      일치하는 설비가 없습니다.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      <p className="text-xs text-right" style={{ color: "var(--nexus-outline)" }}>
        폐업률 출처: KOSIS 영세 자영업 신생기업 생존율 (2019~2021년 평균)
      </p>
    </div>
  );
}

function ScoreCell({
  label,
  tooltip,
  value,
  warning,
}: {
  label: string;
  tooltip: string;
  value: number | null;
  warning?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-2">
      <div className="flex items-center">
        <span className="text-xs" style={{ color: "var(--nexus-outline)" }}>{label}</span>
        <Tooltip text={tooltip} />
      </div>
      <span
        className="text-sm font-bold"
        style={{ color: warning ? "var(--nexus-error)" : "var(--nexus-on-bg)" }}
      >
        {value !== null ? `${(value * 100).toFixed(1)}%` : "N/A"}
      </span>
    </div>
  );
}
