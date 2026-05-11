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
    <div className="relative flex flex-col gap-2">
      <Label htmlFor="equipment-search">추가 설비 검색</Label>
      <Input
        id="equipment-search"
        type="text"
        placeholder="설비명을 입력하세요 (예: 육절기)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {open && (
        <ul
          className="absolute top-full mt-1 w-full rounded-xl overflow-hidden shadow-md z-10 animate-in fade-in slide-in-from-top-2"
          style={{
            background: "var(--nexus-surface-lowest)",
            border: "1px solid var(--nexus-outline-variant)",
          }}
        >
          {results.map((eq) => (
            <li
              key={eq.equipment_id}
              onClick={() => handleSelect(eq)}
              className="flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: "var(--nexus-on-bg)" }}
            >
              <span>{eq.equipment_name}</span>
              <span className="text-xs" style={{ color: "var(--nexus-outline)" }}>
                {eq.category}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
