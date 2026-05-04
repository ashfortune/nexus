"use client";

import { useState } from "react";
import { ContractTypeSelector } from "../components/ContractTypeSelector";
import { WorkerContractForm } from "../components/WorkerContractForm";
import { WorkerContractActions } from "../components/WorkerContractActions";
import type {
    WorkerContractRequest,
    WorkerContractType,
} from "../components/workerTypes";

const initialForm: WorkerContractRequest = {
    contractType: "NO_PERIOD",

    employerName: "",
    employerPhone: "",
    employerAddress: "",
    representativeName: "",

    workerName: "",
    workerAddress: "",
    workerPhone: "",

    startDate: "",
    endDate: "",

    workplace: "",
    jobDescription: "",

    workStartTime: "",
    workEndTime: "",
    breakStartTime: "",
    breakEndTime: "",

    dailyWorkHours: "",
    weeklyWorkHours: "",
    weeklyWorkDays: "",
    weeklyHoliday: "",

    wage: "",
    wageType: "시간급",
    hasBonus: false,
    bonusAmount: "",
    hasExtraAllowance: false,

    paymentDay: "",
    paymentMethod: "계좌이체",
    contractDate: "",
};

export default function WorkerContractPage() {
    const [form, setForm] = useState<WorkerContractRequest>(initialForm);

    const updateField = <K extends keyof WorkerContractRequest>(
        key: K,
        value: WorkerContractRequest[K]
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateContractType = (contractType: WorkerContractType) => {
        setForm((prev) => ({
            ...prev,
            contractType,
            endDate: contractType === "PERIOD" ? prev.endDate : "",
        }));
    };

    return (
        <main className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)]">
            {/* max-w-7xl(1280px)로 넓히고 px도 여유있게 */}
            <section className="mx-auto w-full max-w-7xl px-8 py-14">

                {/* 헤더 — 한 줄 */}
                <div className="mb-10">
                    <p className="text-sm font-black text-[var(--nexus-secondary)]">
                        고용 가이드
                    </p>
                    <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--nexus-primary)]">
                        근로계약서 간편작성
                    </h1>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--nexus-outline)]">
                        계약서 유형을 선택하고 필요한 정보를 입력하면 근로계약서 PDF를 생성할 수 있습니다.
                    </p>
                </div>

                {/*
                  왼쪽: 유형 선택 + 폼  |  오른쪽: 액션 패널
                  - 오른쪽을 360px → 420px로 키워 텍스트 잘림 해소
                  - 왼쪽은 1fr이라 나머지 공간 전부 사용
                */}
                <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
                    <div className="space-y-8">
                        <ContractTypeSelector
                            value={form.contractType}
                            onChange={updateContractType}
                        />
                        <WorkerContractForm form={form} updateField={updateField} />
                    </div>

                    {/* sticky: 스크롤해도 오른쪽 패널이 화면에 고정 */}
                    <div className="self-start lg:sticky lg:top-8">
                        <WorkerContractActions form={form} />
                    </div>
                </div>
            </section>
        </main>
    );
}