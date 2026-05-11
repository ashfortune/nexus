"use client";

import { Badge } from "@/components/ui/badge";

interface SelectedItem {
  equipment_id: string;
  equipment_name: string;
}

interface Props {
  selected: SelectedItem[];
  onRemove: (id: string) => void;
}

export default function SelectedEquipment({ selected, onRemove }: Props) {
  if (selected.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold" style={{ color: "var(--nexus-on-bg)" }}>
        선택된 설비{" "}
        <span style={{ color: "var(--nexus-secondary)" }}>{selected.length}개</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <Badge
            key={item.equipment_id}
            variant="secondary"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            {item.equipment_name}
            <button
              onClick={() => onRemove(item.equipment_id)}
              className="ml-1 hover:opacity-60 transition-opacity font-bold"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
