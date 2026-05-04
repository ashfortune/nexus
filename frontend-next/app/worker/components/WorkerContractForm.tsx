import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkerContractRequest } from "./workerTypes";

type Props = {
    form: WorkerContractRequest;
    updateField: <K extends keyof WorkerContractRequest>(
        key: K,
        value: WorkerContractRequest[K]
    ) => void;
};

const phonePrefixes = [
    "010",
    "011",
    "016",
    "017",
    "018",
    "019",
    "02",
    "031",
    "032",
    "033",
    "041",
    "042",
    "043",
    "044",
    "051",
    "052",
    "053",
    "054",
    "055",
    "061",
    "062",
    "063",
    "064",
];

export function WorkerContractForm({ form, updateField }: Props) {
    return (
        <div className="space-y-8">
            <FormSection title="사업주 정보">
                <TextField
                    label="사업주명"
                    value={form.employerName}
                    onChange={(v) => updateField("employerName", v)}
                />

                <TextField
                    label="대표자명"
                    value={form.representativeName}
                    onChange={(v) => updateField("representativeName", v)}
                />

                <PhoneField
                    label="사업주 전화"
                    value={form.employerPhone}
                    onChange={(v) => updateField("employerPhone", v)}
                />

                <TextField
                    label="사업주 주소"
                    value={form.employerAddress}
                    onChange={(v) => updateField("employerAddress", v)}
                />
            </FormSection>

            <FormSection title="근로자 정보">
                <TextField
                    label="근로자명"
                    value={form.workerName}
                    onChange={(v) => updateField("workerName", v)}
                />

                <PhoneField
                    label="근로자 연락처"
                    value={form.workerPhone}
                    onChange={(v) => updateField("workerPhone", v)}
                />

                <TextField
                    label="근로자 주소"
                    value={form.workerAddress}
                    onChange={(v) => updateField("workerAddress", v)}
                    className="md:col-span-2"
                />
            </FormSection>

            <FormSection title="근로 조건">
                <TextField
                    label="근로개시일"
                    type="date"
                    value={form.startDate}
                    onChange={(v) => updateField("startDate", v)}
                />

                {form.contractType === "PERIOD" && (
                    <TextField
                        label="종료일"
                        type="date"
                        value={form.endDate}
                        onChange={(v) => updateField("endDate", v)}
                    />
                )}

                <TextField
                    label="근무장소"
                    value={form.workplace}
                    onChange={(v) => updateField("workplace", v)}
                />

                <TextField
                    label="업무내용"
                    value={form.jobDescription}
                    onChange={(v) => updateField("jobDescription", v)}
                />

                <TextField
                    label="업무 시작시간"
                    type="time"
                    value={form.workStartTime}
                    onChange={(v) => updateField("workStartTime", v)}
                />

                <TextField
                    label="업무 종료시간"
                    type="time"
                    value={form.workEndTime}
                    onChange={(v) => updateField("workEndTime", v)}
                />

                <TextField
                    label="휴게 시작시간"
                    type="time"
                    value={form.breakStartTime}
                    onChange={(v) => updateField("breakStartTime", v)}
                />

                <TextField
                    label="휴게 종료시간"
                    type="time"
                    value={form.breakEndTime}
                    onChange={(v) => updateField("breakEndTime", v)}
                />

                <TextField
                    label="1일 근로시간"
                    value={form.dailyWorkHours}
                    placeholder="예: 8시간"
                    onChange={(v) => updateField("dailyWorkHours", v)}
                />

                <TextField
                    label="1주 근로시간"
                    value={form.weeklyWorkHours}
                    placeholder="예: 40시간"
                    onChange={(v) => updateField("weeklyWorkHours", v)}
                />

                <TextField
                    label="주 근무일수"
                    value={form.weeklyWorkDays}
                    placeholder="예: 5일"
                    onChange={(v) => updateField("weeklyWorkDays", v)}
                />

                <TextField
                    label="주휴일"
                    value={form.weeklyHoliday}
                    placeholder="예: 일요일"
                    onChange={(v) => updateField("weeklyHoliday", v)}
                />
            </FormSection>

            {form.contractType === "MINOR" && (
                <NoticeCard title="연소근로자 추가 안내">
                    <CheckField label="가족관계증명서 제출 필요 안내" checked />
                    <CheckField label="친권자 또는 후견인 동의서 함께 출력" checked />

                    <p className="text-base leading-7 text-[var(--nexus-on-bg)]/70">
                        친권자 동의서는 PDF에 함께 출력됩니다. 사업주는 출력 후 근로자에게
                        작성본을 받아 보관하면 됩니다.
                    </p>
                </NoticeCard>
            )}

            {form.contractType === "PART_TIME" && (
                <NoticeCard title="단시간근로자 작성 안내">
                    <p className="text-base leading-7 text-[var(--nexus-on-bg)]/70">
                        단시간근로자의 요일별 근로시간 표는 빈칸으로 출력됩니다. 출력 후
                        실제 근무 요일과 시간은 직접 작성하세요.
                    </p>
                </NoticeCard>
            )}

            <FormSection title="임금 정보">
                <NativeSelect
                    label="임금 유형"
                    value={form.wageType}
                    onChange={(v) => updateField("wageType", v)}
                    options={["월급", "일급", "시간급"]}
                />

                <TextField
                    label="임금"
                    value={form.wage}
                    placeholder="예: 10,320원"
                    onChange={(v) => updateField("wage", v)}
                />

                <TextField
                    label="상여금 금액"
                    value={form.bonusAmount}
                    placeholder="없으면 빈칸"
                    onChange={(v) => updateField("bonusAmount", v)}
                />

                <TextField
                    label="임금지급일"
                    value={form.paymentDay}
                    placeholder="예: 매월 10일"
                    onChange={(v) => updateField("paymentDay", v)}
                />

                <NativeSelect
                    label="지급방법"
                    value={form.paymentMethod}
                    onChange={(v) => updateField("paymentMethod", v)}
                    options={["계좌이체", "현금지급"]}
                />

                <TextField
                    label="작성일"
                    type="date"
                    value={form.contractDate}
                    onChange={(v) => updateField("contractDate", v)}
                />

                <CheckField
                    label="상여금 있음"
                    checked={form.hasBonus}
                    onChange={(v) => updateField("hasBonus", v)}
                />

                <CheckField
                    label="기타수당 있음"
                    checked={form.hasExtraAllowance}
                    onChange={(v) => updateField("hasExtraAllowance", v)}
                />
            </FormSection>
        </div>
    );
}

function FormSection({
                         title,
                         children,
                     }: {
    title: string;
    children: ReactNode;
}) {
    return (
        <Card className="border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] shadow-sm">
            <CardHeader>
                <h2 className="text-2xl font-black text-[var(--nexus-primary)]">
                    {title}
                </h2>
            </CardHeader>

            <CardContent className="grid gap-5 md:grid-cols-2">
                {children}
            </CardContent>
        </Card>
    );
}

function TextField({
                       label,
                       value,
                       onChange,
                       type = "text",
                       placeholder,
                       className = "",
                   }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <Label className="text-base font-black text-[var(--nexus-primary)]">
                {label}
            </Label>

            <Input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="h-12 border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] text-base"
            />
        </div>
    );
}

function PhoneField({
                        label,
                        value,
                        onChange,
                    }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [first = "010", second = "", third = ""] = value
        ? value.split("-")
        : ["010", "", ""];

    const update = (nextFirst: string, nextSecond: string, nextThird: string) => {
        onChange(`${nextFirst}-${nextSecond}-${nextThird}`);
    };

    return (
        <div className="flex flex-col gap-2">
            <Label className="text-base font-black text-[var(--nexus-primary)]">
                {label}
            </Label>

            <div className="grid grid-cols-[110px_1fr_1fr] gap-2">
                <select
                    value={first}
                    onChange={(e) => update(e.target.value, second, third)}
                    className="h-12 rounded-md border border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] px-3 text-base outline-none focus:border-[var(--nexus-primary)]"
                >
                    {phonePrefixes.map((prefix) => (
                        <option key={prefix} value={prefix}>
                            {prefix}
                        </option>
                    ))}
                </select>

                <Input
                    value={second}
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="1234"
                    onChange={(e) =>
                        update(first, e.target.value.replace(/\D/g, ""), third)
                    }
                    className="h-12 border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] text-base"
                />

                <Input
                    value={third}
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="5678"
                    onChange={(e) =>
                        update(first, second, e.target.value.replace(/\D/g, ""))
                    }
                    className="h-12 border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] text-base"
                />
            </div>
        </div>
    );
}

function NativeSelect({
                          label,
                          value,
                          options,
                          onChange,
                      }: {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="text-base font-black text-[var(--nexus-primary)]">
                {label}
            </Label>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-12 rounded-md border border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] px-3 text-base outline-none focus:border-[var(--nexus-primary)]"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}

function CheckField({
                        label,
                        checked,
                        onChange,
                    }: {
    label: string;
    checked: boolean;
    onChange?: (value: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-3 text-base font-semibold text-[var(--nexus-on-bg)]">
            <Checkbox
                checked={checked}
                onCheckedChange={(value) => onChange?.(Boolean(value))}
            />
            {label}
        </label>
    );
}

function NoticeCard({
                        title,
                        children,
                    }: {
    title: string;
    children: ReactNode;
}) {
    return (
        <Card className="border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] shadow-sm">
            <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2 text-[var(--nexus-primary)]">
                    <Info className="h-6 w-6" />
                    <h2 className="text-xl font-black">{title}</h2>
                </div>

                {children}
            </CardContent>
        </Card>
    );
}