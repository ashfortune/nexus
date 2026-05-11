export interface RestaurantType {
    restaurant_type_id: string;
    restaurant_type_name: string;
    building_use_code: string;
}

export interface Equipment {
    equipment_id: string;
    equipment_name: string;
    category: string;
    is_required: boolean;
    weight: number;
}

export interface EquipmentSearchResult {
    equipment_id: string;
    equipment_name: string;
    category: string;
}

export interface RecommendRequest {
    equipment_ids: string[];
    top_n?: number;
}

export interface RestaurantTypeResult {
    restaurant_type_id: string;
    restaurant_type_name: string;
    survival_rate_3y: number | null;
    jaccard: number;
    cosine: number;
    knn: number;
    similarity: number;
    final_score: number;
}

export interface RecommendResponse {
    top_n: RestaurantTypeResult[];
    total: number;
}