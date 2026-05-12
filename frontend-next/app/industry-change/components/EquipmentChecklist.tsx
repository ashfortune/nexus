"use client";

import { Equipment } from "../industryChangeTypes";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  equipment: Equipment[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function EquipmentChecklist({ equipment, checkedIds, onToggle }: Props) {
  const required = equipment.filter((e) => e.is_required);
  const optional = equipment.filter((e) => !e.is_required);

  const renderGroup = (list: Equipment[], label: string) => (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: "var(--nexus-outline)" }}>
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {list.map((eq) => {
          const checked = checkedIds.has(eq.equipment_id);
          return (
            <div
              key={eq.equipment_id}
              onClick={() => onToggle(eq.equipment_id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
              style={{
                background: checked ? "var(--nexus-surface-container)" : "var(--nexus-surface-low)",
                border: checked
                  ? "1.5px solid var(--nexus-secondary)"
                  : "1.5px solid var(--nexus-outline-variant)",
              }}
            >
              <Checkbox
                id={eq.equipment_id}
                checked={checked}
                onCheckedChange={() => onToggle(eq.equipment_id)}
                className="shrink-0"
              />
              <Label
                htmlFor={eq.equipment_id}
                className="text-sm cursor-pointer leading-tight"
                style={{ color: "var(--nexus-on-bg)" }}
              >
                {eq.equipment_name}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {required.length > 0 && renderGroup(required, "기본 설비")}
      {optional.length > 0 && renderGroup(optional, "선택 설비")}
    </div>
  );
}
