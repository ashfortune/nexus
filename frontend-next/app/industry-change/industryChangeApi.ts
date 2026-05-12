import {
    RestaurantType,
    Equipment,
    EquipmentSearchResult,
    RecommendRequest,
    RecommendResponse,
} from "./industryChangeTypes";

const BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000";
const PREFIX = `${BASE_URL}/api/v1/ai/industry-change`;

export async function getRestaurantTypes(): Promise<RestaurantType[]> {
    const res = await fetch(`${PREFIX}/restaurant-types`);
    if (!res.ok) throw new Error("업종 목록 조회 실패");
    return res.json();
}

export async function getEquipmentByType(restaurantTypeId: string): Promise<Equipment[]> {
    const res = await fetch(`${PREFIX}/equipment?restaurant_type_id=${restaurantTypeId}`);
    if (!res.ok) throw new Error("설비 목록 조회 실패");
    return res.json();
}

export async function searchEquipment(q: string): Promise<EquipmentSearchResult[]> {
    if (!q.trim()) return [];
    const res = await fetch(`${PREFIX}/equipment/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error("설비 검색 실패");
    return res.json();
}

export async function recommendIndustry(body: RecommendRequest): Promise<RecommendResponse> {
    const res = await fetch(`${PREFIX}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("추천 실패");
    return res.json();
}