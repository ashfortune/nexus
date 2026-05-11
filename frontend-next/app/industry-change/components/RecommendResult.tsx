"use client";

import { RestaurantTypeResult } from "../industryChangeTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  results: RestaurantTypeResult[];
}

export default function RecommendResult({ results }: Props) {
  if (results.length === 0) return null;

  const top3 = results.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base font-bold" style={{ color: "var(--nexus-on-bg)" }}>
        업종 전환 추천 Top 3
      </p>
      {top3.map((item, idx) => (
        <Card key={item.restaurant_type_id}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: idx === 0 ? "var(--nexus-primary)" : "var(--nexus-surface-container)",
                  color: idx === 0 ? "var(--nexus-on-primary)" : "var(--nexus-on-bg)",
                }}
              >
                {idx + 1}
              </span>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-base">{item.restaurant_type_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={idx === 0 ? "default" : "secondary"}>
                    최종 {(item.final_score * 100).toFixed(1)}점
                  </Badge>
                  {item.survival_rate_3y && (
                    <Badge variant="outline">
                      3년 생존율 {item.survival_rate_3y.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-3">
            <div className="grid grid-cols-3 gap-3">
              <ScoreItem label="유사도" value={item.similarity} />
              <ScoreItem label="Jaccard" value={item.jaccard} />
              <ScoreItem label="Cosine" value={item.cosine} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg p-3"
      style={{ background: "var(--nexus-surface-low)" }}
    >
      <span className="text-xs" style={{ color: "var(--nexus-outline)" }}>
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color: "var(--nexus-on-bg)" }}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}
