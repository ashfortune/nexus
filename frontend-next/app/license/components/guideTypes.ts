export interface IndustryCategory {
    id: string;
    name: string;
    level: number;
}

export interface Survey {
    id: string;
    question: string;
    orderNum: number;
}

export interface SurveyAnswer {
    surveyId: string;
    answer: boolean;
}

export interface ChecklistStep {
    orderNum: number;
    place: string;
    task: string;
    estimatedDays?: string;
    documents: string[];
}

export interface ChecklistResponse {
    progressId?: string; // 🔥 백엔드 추가 추천
    industryName: string;
    licenseType: string;
    steps: ChecklistStep[];
    documentSummary: string[];
}