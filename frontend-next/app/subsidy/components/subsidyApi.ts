import type {
    SubsidyDetail,
    SubsidyFilterRequest,
    SubsidyListResponse,
} from "./subsidyTypes";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

export async function fetchSubsidies(payload: SubsidyFilterRequest) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai/subsidy/recommend`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
    });

    if (!res.ok) throw new Error("지원금 목록을 불러오지 못했습니다.");

    return res.json();
}

export async function fetchSubsidyDetail(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai/subsidy/detail/${id}`, {
        cache: "no-store",
    });

    if (!res.ok) throw new Error("지원금 상세 정보를 불러오지 못했습니다.");

    return res.json();
}