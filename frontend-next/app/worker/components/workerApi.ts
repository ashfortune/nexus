import type {
    WorkerCalculateForm,
    WorkerCalculateResponse,
    WorkerContractRequest,
} from "./workerTypes";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function calculateWorkerGuide(
    form: WorkerCalculateForm
): Promise<WorkerCalculateResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/worker/calculate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            employeeCount: Number(form.workerCount),
            dailyWorkHours: Number(form.dailyWorkHours),
            weeklyWorkDays: Number(form.weeklyWorkDays),
            hourlyWage: Number(form.hourlyWage),
            employeeType: form.workerType,
        }),
    });

    if (!response.ok) {
        throw new Error("고용가이드 계산에 실패했습니다.");
    }

    return response.json();
}

export async function createWorkerContractPdf(
    payload: WorkerContractRequest
): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/v1/worker/contract/pdf`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("근로계약서 PDF 생성에 실패했습니다.");
    }

    return response.blob();
}