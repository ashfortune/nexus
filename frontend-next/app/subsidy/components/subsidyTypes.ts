export type LifeCycle = "창업" | "성장" | "폐업재기" | "기타";

export interface SubsidyCard {
    id: string;
    name: string;
    organization: string;
    region?: string | null;
    life_cycle?: string | null;
    max_amount?: number | null;
    deadline?: string | null;
    description?: string | null;
    apply_url?: string | null;
}

export interface SubsidyDetail extends SubsidyCard {
    start_date?: string | null;
    support_content?: string | null;
    target?: string | null;
    how_to_apply?: string | null;
    contact?: string | null;
}

export interface SubsidyListResponse {
    total: number;
    page: number;
    size: number;
    data: SubsidyCard[];
}

export interface SubsidyFilterRequest {
    region?: string | null;
    life_cycle?: string | null;
    query?: string | null;
    page: number;
    size: number;
}