"use client";

import { RestaurantType } from "../industryChangeTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
  restaurantTypes: RestaurantType[];
  selected: RestaurantType | null;
  onChange: (rt: RestaurantType) => void;
}

export default function RestaurantTypeSelect({ restaurantTypes, selected, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="restaurant-type" className="text-sm font-semibold" style={{ color: "var(--nexus-on-bg)" }}>
        현재 운영 중인 업종
      </Label>
      <Select
        value={selected?.restaurant_type_id ?? ""}
        onValueChange={(val) => {
          const found = restaurantTypes.find((rt) => rt.restaurant_type_id === val);
          if (found) onChange(found);
        }}
      >
        <SelectTrigger
          id="restaurant-type"
          className="w-full h-11 rounded-xl px-4 text-sm"
          style={{
            background: "var(--nexus-surface-lowest)",
            border: "1.5px solid var(--nexus-outline-variant)",
            color: "var(--nexus-on-bg)",
          }}
        >
          <SelectValue placeholder="업종을 선택하세요" />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="z-50 max-h-64 overflow-y-auto rounded-xl"
          style={{
            background: "var(--nexus-surface-lowest)",
            border: "1.5px solid var(--nexus-outline-variant)",
          }}
        >
          {restaurantTypes.map((rt) => (
            <SelectItem
              key={rt.restaurant_type_id}
              value={rt.restaurant_type_id}
              className="text-sm cursor-pointer"
              style={{ color: "var(--nexus-on-bg)" }}
            >
              {rt.restaurant_type_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
