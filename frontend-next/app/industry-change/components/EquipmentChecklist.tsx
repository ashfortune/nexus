"use client";

import { Equipment } from "../industryChangeTypes";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Props {
  equipment: Equipment[];
  checkedIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function EquipmentChecklist({ equipment, checkedIds, onToggle }: Props) {
  const required = equipment.filter((e) => e.is_required);
  const optional = equipment.filter((e) => !e.is_required);

  const renderGroup = (list: Equipment[], label: string, isRequired: boolean) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold" style={{ color: "var(--nexus-outline)" }}>
          {label}
        </span>
        <Badge variant={isRequired ? "default" : "secondary"} className="text-xs px-1.5 py-0">
          {list.length}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {list.map((eq) => (
          <div
            key={eq.equipment_id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
            style={{
              background: checkedIds.has(eq.equipment_id)
                ? "var(--nexus-surface-container)"
                : "var(--nexus-surface-low)",
              border: checkedIds.has(eq.equipment_id)
                ? "1.5px solid var(--nexus-secondary)"
                : "1.5px solid var(--nexus-outline-variant)",
            }}
            onClick={() => onToggle(eq.equipment_id)}
          >
            <Checkbox
              id={eq.equipment_id}
              checked={checkedIds.has(eq.equipment_id)}
              onCheckedChange={() => onToggle(eq.equipment_id)}
            />
            <Label
              htmlFor={eq.equipment_id}
              className="text-sm cursor-pointer"
              style={{ color: "var(--nexus-on-bg)" }}
            >
              {eq.equipment_name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {required.length > 0 && renderGroup(required, "기본 설비", true)}
      {optional.length > 0 && renderGroup(optional, "선택 설비", false)}
    </div>
  );
}
