import { api } from "@/lib/api";
import {
    RestaurantType,
    Equipment,
    EquipmentSearchResult,
    RecommendRequest,
    RecommendResponse,
} from "./industryChangeTypes";

const BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://localhost:8000";

export async function getRestaurantTypes(): Promise<RestaurantType[]> {
    const res = await api.get(`/api/v1/ai/industry-change/restaurant-types`, { baseUrl: BASE_URL });
    return res.json();
}

export async function getEquipmentByType(restaurantTypeId: string): Promise<Equipment[]> {
    const res = await api.get(`/api/v1/ai/industry-change/equipment`, {
        params: { restaurant_type_id: restaurantTypeId },
        baseUrl: BASE_URL
    });
    return res.json();
}

export async function searchEquipment(q: string): Promise<EquipmentSearchResult[]> {
    if (!q.trim()) return [];
    const res = await api.get(`/api/v1/ai/industry-change/equipment/search`, {
        params: { q },
        baseUrl: BASE_URL
    });
    return res.json();
}

export async function recommendIndustry(body: RecommendRequest): Promise<RecommendResponse> {
    const res = await api.post(`/api/v1/ai/industry-change/recommend`, body, { baseUrl: BASE_URL });
    return res.json();
}