"use client";

import { useState, useRef, useEffect } from "react";
import { EquipmentSearchResult } from "../industryChangeTypes";
import { searchEquipment } from "../industryChangeApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onSelect: (eq: EquipmentSearchResult) => void;
  excludeIds: Set<string>;
}

export default function EquipmentSearch({ onSelect, excludeIds }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EquipmentSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchEquipment(query);
        const filtered = data.filter((d) => !excludeIds.has(d.equipment_id));
        setResults(filtered);
        setOpen(filtered.length > 0);
      } catch {
        setResults([]);
      }
    }, 200);
  }, [query, excludeIds]);

  const handleSelect = (eq: EquipmentSearchResult) => {
    onSelect(eq);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <Label className="text-sm font-semibold" style={{ color: "var(--nexus-on-bg)" }}>
        추가 설비 검색
      </Label>
      <Input
        type="text"
        placeholder="설비명을 입력하세요 (예: 육절기)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        className="h-11 rounded-xl text-sm"
        style={{
          background: "var(--nexus-surface-lowest)",
          border: "1.5px solid var(--nexus-outline-variant)",
          color: "var(--nexus-on-bg)",
        }}
      />
      {open && (
        <ul
          className="absolute top-full mt-1 w-full rounded-xl overflow-hidden shadow-lg z-50"
          style={{
            background: "var(--nexus-surface-lowest)",
            border: "1.5px solid var(--nexus-outline-variant)",
          }}
        >
          {results.map((eq) => (
            <li
              key={eq.equipment_id}
              onMouseDown={() => handleSelect(eq)}
              className="flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-opacity-80"
              style={{
                color: "var(--nexus-on-bg)",
                borderBottom: "0.5px solid var(--nexus-outline-variant)",
              }}
            >
              <span className="font-medium">{eq.equipment_name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--nexus-surface-container)",
                  color: "var(--nexus-outline)",
                }}
              >
                {eq.category}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
