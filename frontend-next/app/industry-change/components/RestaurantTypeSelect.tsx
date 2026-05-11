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
      <Label htmlFor="restaurant-type">현재 운영 중인 업종</Label>
      <Select
        value={selected?.restaurant_type_id ?? ""}
        onValueChange={(val) => {
          const found = restaurantTypes.find((rt) => rt.restaurant_type_id === val);
          if (found) onChange(found);
        }}
      >
        <SelectTrigger id="restaurant-type" className="w-full">
          <SelectValue placeholder="업종을 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          {restaurantTypes.map((rt) => (
            <SelectItem key={rt.restaurant_type_id} value={rt.restaurant_type_id}>
              {rt.restaurant_type_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
