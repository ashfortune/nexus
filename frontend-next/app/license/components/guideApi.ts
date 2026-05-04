const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function getCategories(parentId?: string) {
    const url = parentId
        ? `${API}/api/v1/industry/categories/${parentId}`
        : `${API}/api/v1/industry/categories`;

    const res = await fetch(url);
    return res.json();
}

export async function getSurveys(industryId: string) {
    const res = await fetch(`${API}/api/v1/industry/${industryId}/surveys`);
    if (!res.ok) {
        return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function createChecklist(payload: any) {
    const res = await fetch(`${API}/api/v1/checklist/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    return res.json();
}

export async function updateStep(progressId: string, payload: any) {
    await fetch(`${API}/api/v1/checklist/${progressId}/step`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}