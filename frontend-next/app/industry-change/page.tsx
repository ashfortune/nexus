"use client";

import { useEffect, useState } from "react";
import {
  RestaurantType,
  Equipment,
  EquipmentSearchResult,
  RestaurantTypeResult,
} from "./industryChangeTypes";
import {
  getRestaurantTypes,
  getEquipmentByType,
  recommendIndustry,
} from "./industryChangeApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RestaurantTypeSelect from "./components/RestaurantTypeSelect";
import EquipmentChecklist from "./components/EquipmentChecklist";
import EquipmentSearch from "./components/EquipmentSearch";
import SelectedEquipment from "./components/SelectedEquipment";
import RecommendResult from "./components/RecommendResult";

export default function IndustryChangePage() {
  const [restaurantTypes, setRestaurantTypes] = useState<RestaurantType[]>([]);
  const [selectedType, setSelectedType] = useState<RestaurantType | null>(null);
  const [baseEquipment, setBaseEquipment] = useState<Equipment[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [extraEquipment, setExtraEquipment] = useState<EquipmentSearchResult[]>([]);
  const [results, setResults] = useState<RestaurantTypeResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRestaurantTypes().then(setRestaurantTypes).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedType) return;
    setCheckedIds(new Set());
    setExtraEquipment([]);
    setResults([]);
    getEquipmentByType(selectedType.restaurant_type_id)
      .then((eq) => {
        setBaseEquipment(eq);
        const requiredIds = eq.filter((e) => e.is_required).map((e) => e.equipment_id);
        setCheckedIds(new Set(requiredIds));
      })
      .catch(console.error);
  }, [selectedType]);

  const handleToggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSearchSelect = (eq: EquipmentSearchResult) => {
    setExtraEquipment((prev) => {
      if (prev.find((e) => e.equipment_id === eq.equipment_id)) return prev;
      return [...prev, eq];
    });
    setCheckedIds((prev) => new Set(prev).add(eq.equipment_id));
  };

  const handleRemove = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setExtraEquipment((prev) => prev.filter((e) => e.equipment_id !== id));
  };

  const handleRecommend = async () => {
    if (checkedIds.size === 0) return;
    setLoading(true);
    try {
      const res = await recommendIndustry({
        equipment_ids: Array.from(checkedIds),
        top_n: 10,
      });
      setResults(res.top_n);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedItems = [
    ...baseEquipment
      .filter((e) => checkedIds.has(e.equipment_id))
      .map((e) => ({ equipment_id: e.equipment_id, equipment_name: e.equipment_name })),
    ...extraEquipment
      .filter((e) => checkedIds.has(e.equipment_id))
      .map((e) => ({ equipment_id: e.equipment_id, equipment_name: e.equipment_name })),
  ];

  const excludeIds = new Set([
    ...baseEquipment.map((e) => e.equipment_id),
    ...extraEquipment.map((e) => e.equipment_id),
  ]);

  return (
    <main className="min-h-screen py-10 px-4" style={{ background: "var(--nexus-bg)" }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--nexus-primary)" }}>
            업종 전환 추천
          </h1>
          <p className="text-sm" style={{ color: "var(--nexus-outline)" }}>
            현재 보유한 설비를 기반으로 전환 가능한 업종을 추천해드립니다
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">업종 및 설비 선택</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="flex flex-col gap-6 pt-5">
            <RestaurantTypeSelect
              restaurantTypes={restaurantTypes}
              selected={selectedType}
              onChange={setSelectedType}
            />
            {baseEquipment.length > 0 && (
              <EquipmentChecklist
                equipment={baseEquipment}
                checkedIds={checkedIds}
                onToggle={handleToggle}
              />
            )}
            {selectedType && (
              <EquipmentSearch onSelect={handleSearchSelect} excludeIds={excludeIds} />
            )}
          </CardContent>
        </Card>

        {selectedItems.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <SelectedEquipment selected={selectedItems} onRemove={handleRemove} />
            </CardContent>
          </Card>
        )}

        {checkedIds.size > 0 && (
          <Button
            onClick={handleRecommend}
            disabled={loading}
            className="w-full py-6 text-base font-bold"
            style={{ background: "var(--nexus-primary)", color: "var(--nexus-on-primary)" }}
          >
            {loading ? "분석 중..." : "업종 전환 추천 받기"}
          </Button>
        )}

        {results.length > 0 && <RecommendResult results={results} />}
      </div>
    </main>
  );
}
