"use client";

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "var(--nexus-on-bg)" }}>
          선택된 설비
        </p>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: "var(--nexus-primary-container)",
            color: "var(--nexus-on-primary-container)",
          }}
        >
          {selected.length}개
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <span
            key={item.equipment_id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{
              background: "var(--nexus-surface-container)",
              color: "var(--nexus-on-bg)",
              border: "1.5px solid var(--nexus-outline-variant)",
            }}
          >
            {item.equipment_name}
            <button
              onClick={() => onRemove(item.equipment_id)}
              className="flex items-center justify-center w-4 h-4 rounded-full transition-opacity hover:opacity-60"
              style={{ color: "var(--nexus-outline)" }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
