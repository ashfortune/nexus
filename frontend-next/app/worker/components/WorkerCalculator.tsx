"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateWorkerGuide } from "./workerApi";
import type {
    WorkerCalculateForm,
    WorkerCalculateResponse,
} from "./workerTypes";

const initialForm: WorkerCalculateForm = {
    workerCount: "1",
    dailyWorkHours: "",
    weeklyWorkDays: "",
    hourlyWage: "",
    workerType: "PART_TIME",
};

export function WorkerCalculator({
                                     onResult,
                                 }: {
    onResult: (result: WorkerCalculateResponse) => void;
}) {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);

    const updateNumberField = (
        key: keyof Pick<
            WorkerCalculateForm,
            "workerCount" | "dailyWorkHours" | "weeklyWorkDays" | "hourlyWage"
        >,
        value: string
    ) => {
        if (value === "") {
            setForm((prev) => ({ ...prev, [key]: value }));
            return;
        }

        const num = Number(value);

        if (Number.isNaN(num)) return;
        if (num < 0) return;

        if (key === "workerCount" && num > 999) return;
        if (key === "dailyWorkHours" && num > 24) return;
        if (key === "weeklyWorkDays" && num > 7) return;

        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const updateField = (key: keyof WorkerCalculateForm, value: string) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const validate = () => {
        if (!form.workerCount) return "근로자 수를 입력해주세요.";
        if (!form.dailyWorkHours) return "1일 근로시간을 입력해주세요.";
        if (!form.weeklyWorkDays) return "주 근무일수를 입력해주세요.";
        if (!form.hourlyWage) return "시급을 입력해주세요.";

        const workerCount = Number(form.workerCount);
        const dailyWorkHours = Number(form.dailyWorkHours);
        const weeklyWorkDays = Number(form.weeklyWorkDays);
        const hourlyWage = Number(form.hourlyWage);

        if (workerCount <= 0) return "근로자 수는 1명 이상이어야 합니다.";
        if (workerCount > 999) return "근로자 수는 최대 999명까지 입력할 수 있습니다.";

        if (dailyWorkHours <= 0) return "1일 근로시간은 0보다 커야 합니다.";
        if (dailyWorkHours > 24) return "1일 근로시간은 최대 24시간입니다.";

        if (weeklyWorkDays <= 0) return "주 근무일수는 0보다 커야 합니다.";
        if (weeklyWorkDays > 7) return "주 근무일수는 최대 7일입니다.";

        if (hourlyWage <= 0) return "시급은 0보다 커야 합니다.";

        return null;
    };

    const handleCalculate = async () => {
        const message = validate();

        if (message) {
            alert(message);
            return;
        }

        try {
            setLoading(true);
            const result = await calculateWorkerGuide(form);
            onResult(result);
        } catch (error) {
            console.error(error);
            alert("계산 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)]">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)]">
                        <Calculator className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-black text-[var(--nexus-primary)]">
                            근로 조건 계산
                        </h2>
                        <p className="text-sm text-[var(--nexus-outline)]">
                            입력값 기준으로 근로 관련 기준을 계산합니다.
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="근로자 수">
                        <Input
                            type="number"
                            min={1}
                            max={999}
                            value={form.workerCount}
                            onChange={(e) =>
                                updateNumberField("workerCount", e.target.value)
                            }
                            className="h-11 border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)]"
                        />
                    </Field>

                    <Field label="근로자 유형">
                        <select
                            value={form.workerType}
                            onChange={(e) => updateField("workerType", e.target.value)}
                            className="h-11 w-full rounded-md border border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] px-3 text-sm outline-none focus:border-[var(--nexus-primary)]"
                        >
                            <option value="PART_TIME">단시간 근로자</option>
                            <option value="FULL_TIME">상용 근로자</option>
                            <option value="DAILY">일용 근로자</option>
                        </select>
                    </Field>

                    <Field label="1일 근로시간">
                        <Input
                            type="number"
                            min={0}
                            max={24}
                            step="0.5"
                            placeholder="예: 8"
                            value={form.dailyWorkHours}
                            onChange={(e) =>
                                updateNumberField("dailyWorkHours", e.target.value)
                            }
                            className="h-11 border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)]"
                        />
                    </Field>

                    <Field label="주 근무일수">
                        <Input
                            type="number"
                            min={0}
                            max={7}
                            placeholder="예: 5"
                            value={form.weeklyWorkDays}
                            onChange={(e) =>
                                updateNumberField("weeklyWorkDays", e.target.value)
                            }
                            className="h-11 border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)]"
                        />
                    </Field>

                    <Field label="시급">
                        <Input
                            type="number"
                            min={0}
                            placeholder="예: 10320"
                            value={form.hourlyWage}
                            onChange={(e) =>
                                updateNumberField("hourlyWage", e.target.value)
                            }
                            className="h-11 border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)]"
                        />
                    </Field>

                    <div className="flex items-end xl:col-span-3">
                        <Button
                            type="button"
                            onClick={handleCalculate}
                            disabled={loading}
                            className="h-11 w-full rounded-lg bg-[var(--nexus-primary)] text-sm font-black text-[var(--nexus-on-primary)] hover:opacity-90"
                        >
                            {loading ? "계산 중..." : "계산하기"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function Field({
                   label,
                   children,
               }: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-2">
            <Label className="font-bold text-[var(--nexus-primary)]">{label}</Label>
            {children}
        </div>
    );
}