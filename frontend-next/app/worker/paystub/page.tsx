"use client";

import { useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    Building2,
    FileText,
    Phone,
    Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type PaystubForm = {
    employerName: string;
    workerName: string;
    workerIdentifier: string;
    payDate: string;
    periodStart: string;
    periodEnd: string;

    hourlyWage: string;
    regularHours: string;
    weeklyAllowanceHours: string;
    overtimeHours: string;
    nightHours: string;
    holidayHours: string;
    extraAllowance: string;
    bonus: string;

    nationalPension: string;
    healthInsurance: string;
    employmentInsurance: string;
    incomeTax: string;
    localIncomeTax: string;
    otherDeduction: string;
};

type PaystubCalculated = {
    basePay: number;
    weeklyAllowancePay: number;
    overtimePay: number;
    nightPay: number;
    holidayPay: number;
    extraAllowance: number;
    bonus: number;
    grossPay: number;

    nationalPension: number;
    healthInsurance: number;
    employmentInsurance: number;
    incomeTax: number;
    localIncomeTax: number;
    otherDeduction: number;
    totalDeduction: number;
    netPay: number;
};

const initialForm: PaystubForm = {
    employerName: "",
    workerName: "",
    workerIdentifier: "",
    payDate: "",
    periodStart: "",
    periodEnd: "",

    hourlyWage: "",
    regularHours: "",
    weeklyAllowanceHours: "",
    overtimeHours: "",
    nightHours: "",
    holidayHours: "",
    extraAllowance: "",
    bonus: "",

    nationalPension: "",
    healthInsurance: "",
    employmentInsurance: "",
    incomeTax: "",
    localIncomeTax: "",
    otherDeduction: "",
};

const numericKeys: (keyof PaystubForm)[] = [
    "hourlyWage",
    "regularHours",
    "weeklyAllowanceHours",
    "overtimeHours",
    "nightHours",
    "holidayHours",
    "extraAllowance",
    "bonus",
    "nationalPension",
    "healthInsurance",
    "employmentInsurance",
    "incomeTax",
    "localIncomeTax",
    "otherDeduction",
];

const toNumber = (value: string) => {
    const normalized = value.replaceAll(",", "");
    const number = Number(normalized);
    return Number.isNaN(number) ? 0 : number;
};

const formatWon = (value: number) => `${Math.round(value).toLocaleString()}원`;

export default function PaystubPage() {
    const [form, setForm] = useState<PaystubForm>(initialForm);
    const printRef = useRef<HTMLDivElement>(null);

    const updateField = (key: keyof PaystubForm, value: string) => {
        if (numericKeys.includes(key)) {
            if (value !== "" && Number(value) < 0) return;
        }

        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const calculated = useMemo<PaystubCalculated>(() => {
        const hourlyWage = toNumber(form.hourlyWage);
        const regularHours = toNumber(form.regularHours);
        const weeklyAllowanceHours = toNumber(form.weeklyAllowanceHours);
        const overtimeHours = toNumber(form.overtimeHours);
        const nightHours = toNumber(form.nightHours);
        const holidayHours = toNumber(form.holidayHours);

        const basePay = hourlyWage * regularHours;
        const weeklyAllowancePay = hourlyWage * weeklyAllowanceHours;
        const overtimePay = hourlyWage * overtimeHours * 1.5;
        const nightPay = hourlyWage * nightHours * 0.5;
        const holidayPay = hourlyWage * holidayHours * 1.5;
        const extraAllowance = toNumber(form.extraAllowance);
        const bonus = toNumber(form.bonus);

        const grossPay =
            basePay +
            weeklyAllowancePay +
            overtimePay +
            nightPay +
            holidayPay +
            extraAllowance +
            bonus;

        const nationalPension = toNumber(form.nationalPension);
        const healthInsurance = toNumber(form.healthInsurance);
        const employmentInsurance = toNumber(form.employmentInsurance);
        const incomeTax = toNumber(form.incomeTax);
        const localIncomeTax = toNumber(form.localIncomeTax);
        const otherDeduction = toNumber(form.otherDeduction);

        const totalDeduction =
            nationalPension +
            healthInsurance +
            employmentInsurance +
            incomeTax +
            localIncomeTax +
            otherDeduction;

        return {
            basePay,
            weeklyAllowancePay,
            overtimePay,
            nightPay,
            holidayPay,
            extraAllowance,
            bonus,
            grossPay,
            nationalPension,
            healthInsurance,
            employmentInsurance,
            incomeTax,
            localIncomeTax,
            otherDeduction,
            totalDeduction,
            netPay: grossPay - totalDeduction,
        };
    }, [form]);

    const handlePrint = () => {
        if (!printRef.current) return;

        const printWindow = window.open("", "_blank", "width=900,height=1000");
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>급여명세서</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #071e27;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th, td {
              border: 1px solid #c6c5d4;
              padding: 8px;
              font-size: 13px;
            }
            th {
              background: #dbf1fe;
              color: #0b1a7d;
              text-align: left;
            }
            h1, h2, h3 {
              color: #0b1a7d;
            }
            .summary {
              margin-top: 16px;
              padding: 12px;
              background: #e6f6ff;
              border-radius: 12px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 6px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <main className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)]">
            <section className="mx-auto w-full max-w-[1120px] px-6 py-14">
                <div className="mb-10">
                    <p className="text-sm font-black text-[var(--nexus-secondary)]">
                        고용 가이드
                    </p>

                    <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--nexus-primary)]">
                        급여명세서 간편작성
                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--nexus-outline)]">
                        임금 지급 시 필요한 급여명세서를 작성하고 출력할 수 있습니다.
                        1차 버전에서는 4대보험과 세금 공제액을 직접 입력합니다.
                    </p>
                </div>

                <Card className="mb-8 border-[var(--nexus-error)] bg-[var(--nexus-surface-lowest)]">
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--nexus-error)] text-[var(--nexus-on-primary)]">
                                <AlertTriangle className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-sm font-black text-[var(--nexus-error)]">
                                    하루 알바도 급여명세서 교부 대상입니다
                                </p>

                                <h2 className="mt-2 text-2xl font-black text-[var(--nexus-primary)]">
                                    임금을 지급할 때는 급여명세서를 함께 제공해야 합니다
                                </h2>

                                <p className="mt-3 text-sm leading-relaxed text-[var(--nexus-outline)]">
                                    급여명세서에는 지급항목, 계산방법, 공제내역이 들어가야
                                    합니다. 공제 금액이 정확하지 않으면 분쟁이 생길 수 있으므로
                                    실제 보험료와 세금은 공단 또는 홈택스에서 확인하는 것을
                                    권장합니다.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                    <div className="space-y-8">
                        <FormSection title="기본 정보">
                            <TextField
                                label="사업장명"
                                value={form.employerName}
                                onChange={(v) => updateField("employerName", v)}
                            />
                            <TextField
                                label="근로자명"
                                value={form.workerName}
                                onChange={(v) => updateField("workerName", v)}
                            />
                            <TextField
                                label="생년월일 또는 사원번호"
                                value={form.workerIdentifier}
                                onChange={(v) => updateField("workerIdentifier", v)}
                            />
                            <TextField
                                label="임금지급일"
                                type="date"
                                value={form.payDate}
                                onChange={(v) => updateField("payDate", v)}
                            />
                            <TextField
                                label="산정 시작일"
                                type="date"
                                value={form.periodStart}
                                onChange={(v) => updateField("periodStart", v)}
                            />
                            <TextField
                                label="산정 종료일"
                                type="date"
                                value={form.periodEnd}
                                onChange={(v) => updateField("periodEnd", v)}
                            />
                        </FormSection>

                        <FormSection title="근무 및 지급 항목">
                            <TextField
                                label="시급"
                                type="number"
                                value={form.hourlyWage}
                                placeholder="예: 10320"
                                onChange={(v) => updateField("hourlyWage", v)}
                            />
                            <TextField
                                label="기본 근로시간"
                                type="number"
                                value={form.regularHours}
                                placeholder="예: 80"
                                onChange={(v) => updateField("regularHours", v)}
                            />
                            <TextField
                                label="주휴시간"
                                type="number"
                                value={form.weeklyAllowanceHours}
                                placeholder="예: 8"
                                onChange={(v) => updateField("weeklyAllowanceHours", v)}
                            />
                            <TextField
                                label="연장근로시간"
                                type="number"
                                value={form.overtimeHours}
                                placeholder="예: 0"
                                onChange={(v) => updateField("overtimeHours", v)}
                            />
                            <TextField
                                label="야간근로시간"
                                type="number"
                                value={form.nightHours}
                                placeholder="예: 0"
                                onChange={(v) => updateField("nightHours", v)}
                            />
                            <TextField
                                label="휴일근로시간"
                                type="number"
                                value={form.holidayHours}
                                placeholder="예: 0"
                                onChange={(v) => updateField("holidayHours", v)}
                            />
                            <TextField
                                label="기타수당"
                                type="number"
                                value={form.extraAllowance}
                                placeholder="예: 0"
                                onChange={(v) => updateField("extraAllowance", v)}
                            />
                            <TextField
                                label="상여금"
                                type="number"
                                value={form.bonus}
                                placeholder="예: 0"
                                onChange={(v) => updateField("bonus", v)}
                            />
                        </FormSection>

                        <FormSection title="공제 항목">
                            <TextField
                                label="국민연금"
                                type="number"
                                value={form.nationalPension}
                                placeholder="직접 입력"
                                onChange={(v) => updateField("nationalPension", v)}
                            />
                            <TextField
                                label="건강보험"
                                type="number"
                                value={form.healthInsurance}
                                placeholder="직접 입력"
                                onChange={(v) => updateField("healthInsurance", v)}
                            />
                            <TextField
                                label="고용보험"
                                type="number"
                                value={form.employmentInsurance}
                                placeholder="직접 입력"
                                onChange={(v) => updateField("employmentInsurance", v)}
                            />
                            <TextField
                                label="소득세"
                                type="number"
                                value={form.incomeTax}
                                placeholder="직접 입력"
                                onChange={(v) => updateField("incomeTax", v)}
                            />
                            <TextField
                                label="지방소득세"
                                type="number"
                                value={form.localIncomeTax}
                                placeholder="직접 입력"
                                onChange={(v) => updateField("localIncomeTax", v)}
                            />
                            <TextField
                                label="기타공제"
                                type="number"
                                value={form.otherDeduction}
                                placeholder="직접 입력"
                                onChange={(v) => updateField("otherDeduction", v)}
                            />
                        </FormSection>

                        <GuideCard />
                    </div>

                    <aside className="h-fit space-y-6">
                        <Card className="border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-container)]">
                            <CardHeader>
                                <p className="text-sm font-black text-[var(--nexus-secondary)]">
                                    계산 결과
                                </p>
                                <h2 className="text-2xl font-black text-[var(--nexus-primary)]">
                                    지급 요약
                                </h2>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <Summary
                                        label="총 지급액"
                                        value={formatWon(calculated.grossPay)}
                                        strong
                                    />
                                    <Summary
                                        label="총 공제액"
                                        value={formatWon(calculated.totalDeduction)}
                                    />
                                    <Separator className="my-4 bg-[var(--nexus-outline-variant)]" />
                                    <Summary
                                        label="실지급액"
                                        value={formatWon(calculated.netPay)}
                                        strong
                                    />
                                </div>

                                <Button
                                    type="button"
                                    onClick={handlePrint}
                                    className="mt-6 h-12 w-full rounded-xl bg-[var(--nexus-primary)] text-base font-black text-[var(--nexus-on-primary)] hover:opacity-90"
                                >
                                    <Printer className="mr-2 h-5 w-5" />
                                    급여명세서 출력
                                </Button>

                                <p className="mt-3 text-xs leading-relaxed text-[var(--nexus-outline)]">
                                    출력 전 입력값과 공제액을 다시 확인해주세요.
                                </p>
                            </CardContent>
                        </Card>

                        <PaystubPreview
                            refTarget={printRef}
                            form={form}
                            calculated={calculated}
                        />
                    </aside>
                </div>
            </section>
        </main>
    );
}

function FormSection({
                         title,
                         children,
                     }: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <Card className="border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)]">
            <CardHeader>
                <h2 className="text-xl font-black text-[var(--nexus-primary)]">
                    {title}
                </h2>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
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
                   }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
}) {
    return (
        <div className="flex flex-col gap-2">
            <Label className="font-bold text-[var(--nexus-primary)]">{label}</Label>
            <Input
                type={type}
                min={type === "number" ? 0 : undefined}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)]"
            />
        </div>
    );
}

function Summary({
                     label,
                     value,
                     strong = false,
                 }: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div className="flex justify-between gap-4">
            <span className="font-bold text-[var(--nexus-primary)]">{label}</span>
            <span
                className={`text-right ${
                    strong
                        ? "text-lg font-black text-[var(--nexus-primary)]"
                        : "text-[var(--nexus-outline)]"
                }`}
            >
        {value}
      </span>
        </div>
    );
}

function PaystubPreview({
                            refTarget,
                            form,
                            calculated,
                        }: {
    refTarget: React.RefObject<HTMLDivElement | null>;
    form: PaystubForm;
    calculated: PaystubCalculated;
}) {
    return (
        <Card className="border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)]">
            <CardContent className="p-6" ref={refTarget}>
                <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[var(--nexus-primary)]" />
                    <h2 className="text-xl font-black text-[var(--nexus-primary)]">
                        급여명세서
                    </h2>
                </div>

                <div className="mt-5 grid gap-2 text-sm">
                    <PreviewRow label="사업장명" value={form.employerName || "-"} />
                    <PreviewRow label="근로자" value={form.workerName || "-"} />
                    <PreviewRow label="식별정보" value={form.workerIdentifier || "-"} />
                    <PreviewRow label="임금지급일" value={form.payDate || "-"} />
                    <PreviewRow
                        label="산정기간"
                        value={`${form.periodStart || "-"} ~ ${form.periodEnd || "-"}`}
                    />
                </div>

                <Separator className="my-4 bg-[var(--nexus-outline-variant)]" />

                <PreviewTable
                    title="지급 항목"
                    rows={[
                        [
                            "기본급",
                            `${form.hourlyWage || 0} × ${form.regularHours || 0}시간`,
                            formatWon(calculated.basePay),
                        ],
                        [
                            "주휴수당",
                            `${form.hourlyWage || 0} × ${
                                form.weeklyAllowanceHours || 0
                            }시간`,
                            formatWon(calculated.weeklyAllowancePay),
                        ],
                        [
                            "연장근로수당",
                            `${form.hourlyWage || 0} × ${form.overtimeHours || 0}시간 × 1.5`,
                            formatWon(calculated.overtimePay),
                        ],
                        [
                            "야간근로수당",
                            `${form.hourlyWage || 0} × ${form.nightHours || 0}시간 × 0.5`,
                            formatWon(calculated.nightPay),
                        ],
                        [
                            "휴일근로수당",
                            `${form.hourlyWage || 0} × ${form.holidayHours || 0}시간 × 1.5`,
                            formatWon(calculated.holidayPay),
                        ],
                        ["기타수당", "직접 입력", formatWon(calculated.extraAllowance)],
                        ["상여금", "직접 입력", formatWon(calculated.bonus)],
                    ]}
                />

                <PreviewTable
                    title="공제 항목"
                    rows={[
                        ["국민연금", "직접 입력", formatWon(calculated.nationalPension)],
                        ["건강보험", "직접 입력", formatWon(calculated.healthInsurance)],
                        ["고용보험", "직접 입력", formatWon(calculated.employmentInsurance)],
                        ["소득세", "직접 입력", formatWon(calculated.incomeTax)],
                        ["지방소득세", "직접 입력", formatWon(calculated.localIncomeTax)],
                        ["기타공제", "직접 입력", formatWon(calculated.otherDeduction)],
                    ]}
                />

                <div className="mt-5 rounded-xl bg-[var(--nexus-surface-container)] p-4">
                    <PreviewRow
                        label="총 지급액"
                        value={formatWon(calculated.grossPay)}
                    />
                    <PreviewRow
                        label="총 공제액"
                        value={formatWon(calculated.totalDeduction)}
                    />
                    <PreviewRow
                        label="실지급액"
                        value={formatWon(calculated.netPay)}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="font-bold text-[var(--nexus-primary)]">{label}</span>
            <span className="text-right text-[var(--nexus-on-bg)]">{value}</span>
        </div>
    );
}

function PreviewTable({
                          title,
                          rows,
                      }: {
    title: string;
    rows: string[][];
}) {
    return (
        <div className="mt-5">
            <h3 className="mb-2 font-black text-[var(--nexus-primary)]">{title}</h3>

            <div className="overflow-hidden rounded-xl border border-[var(--nexus-outline-variant)] text-sm">
                <div className="grid grid-cols-[1fr_1.5fr_1fr] bg-[var(--nexus-surface-container)] font-bold text-[var(--nexus-primary)]">
                    <div className="p-2">항목</div>
                    <div className="p-2">계산방법</div>
                    <div className="p-2 text-right">금액</div>
                </div>

                {rows.map(([name, method, amount]) => (
                    <div
                        key={name}
                        className="grid grid-cols-[1fr_1.5fr_1fr] border-t border-[var(--nexus-outline-variant)]"
                    >
                        <div className="p-2">{name}</div>
                        <div className="p-2 text-[var(--nexus-outline)]">{method}</div>
                        <div className="p-2 text-right">{amount}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GuideCard() {
    return (
        <Card className="border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-container)]">
            <CardContent className="p-6">
                <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-[var(--nexus-primary)]" />
                    <h2 className="text-xl font-black text-[var(--nexus-primary)]">
                        정확한 공제 금액 확인 방법
                    </h2>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[var(--nexus-outline)]">
                    4대보험과 세금은 근로자 상황에 따라 달라질 수 있습니다. 정확한
                    금액은 아래 기관에서 확인한 뒤 입력하세요.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <GuideItem
                        title="소득세 확인"
                        desc="홈택스 또는 손택스에서 ‘근로소득 간이세액표’를 확인하세요."
                    />
                    <GuideItem
                        title="4대보험 확인"
                        desc="국민연금공단, 건강보험공단, 근로복지공단에서 보험료를 확인하세요."
                    />
                    <GuideItem
                        title="방문 상담"
                        desc="인터넷 사용이 어려우면 가까운 세무서, 국민연금공단 지사, 건강보험공단 지사, 근로복지공단 지사를 방문하세요."
                    />
                    <GuideItem
                        title="전화 상담"
                        desc="국세청 126 / 국민연금 1355 / 건강보험 1577-1000 / 근로복지공단 1588-0075"
                        icon
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function GuideItem({
                       title,
                       desc,
                       icon = false,
                   }: {
    title: string;
    desc: string;
    icon?: boolean;
}) {
    return (
        <div className="rounded-xl bg-[var(--nexus-surface-lowest)] p-4">
            <div className="flex items-center gap-2">
                {icon && <Phone className="h-4 w-4 text-[var(--nexus-primary)]" />}
                <p className="font-black text-[var(--nexus-primary)]">{title}</p>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-[var(--nexus-outline)]">
                {desc}
            </p>
        </div>
    );
}