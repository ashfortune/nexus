"use client";

import { useState } from "react";
import { Download, Printer, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createWorkerContractPdf } from "./workerApi";
import type { WorkerContractRequest } from "./workerTypes";

const CONTRACT_TYPE_LABEL: Record<string, string> = {
    NO_PERIOD: "기간의 정함이 없는 근로계약서",
    PERIOD: "기간의 정함이 있는 근로계약서",
    MINOR: "연소근로자 근로계약서",
    PART_TIME: "단시간근로자 근로계약서",
    CONSTRUCTION: "건설일용근로자 근로계약서",
};

export function WorkerContractActions({
                                          form,
                                      }: {
    form: WorkerContractRequest;
}) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const validate = () => {
        if (!form.employerName) return "사업주명을 입력해주세요.";
        if (!form.workerName) return "근로자명을 입력해주세요.";
        if (!form.startDate) return "근로개시일을 입력해주세요.";

        if (form.contractType === "PERIOD" && !form.endDate) {
            return "기간 있음 계약서는 종료일을 입력해주세요.";
        }

        if (!form.workplace) return "근무장소를 입력해주세요.";
        if (!form.jobDescription) return "업무내용을 입력해주세요.";
        if (!form.wage) return "임금을 입력해주세요.";

        return null;
    };

    const handleCreatePdf = async () => {
        const message = validate();

        if (message) {
            alert(message);
            return;
        }

        try {
            setLoading(true);

            const blob = await createWorkerContractPdf(form);
            const url = URL.createObjectURL(blob);

            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }

            setPdfUrl(url);
        } catch (error) {
            console.error(error);
            alert("PDF 생성에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;

        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `${CONTRACT_TYPE_LABEL[form.contractType]}.pdf`;
        link.click();
    };

    const handlePrint = () => {
        if (!pdfUrl) return;

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = pdfUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        };
    };

    return (
        <Card className="h-fit border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] shadow-sm">
            <CardHeader>
                <p className="text-base font-black text-[var(--nexus-secondary)]">
                    PDF 생성
                </p>

                <h2 className="text-3xl font-black text-[var(--nexus-primary)]">
                    계약서 준비하기
                </h2>

                <p className="text-base leading-7 text-[var(--nexus-on-bg)]/70">
                    입력한 정보를 기준으로 근로계약서 PDF를 생성합니다.
                </p>
            </CardHeader>

            <CardContent>
                <div className="space-y-4 text-base">
                    <Summary
                        label="계약서 유형"
                        value={CONTRACT_TYPE_LABEL[form.contractType]}
                    />
                    <Summary label="사업주" value={form.employerName || "-"} />
                    <Summary label="근로자" value={form.workerName || "-"} />
                    <Summary label="근무장소" value={form.workplace || "-"} />
                    <Summary
                        label="임금"
                        value={form.wage ? `${form.wageType} ${form.wage}` : "-"}
                    />
                </div>

                <Separator className="my-6 bg-[var(--nexus-outline-variant)]" />

                <Button
                    type="button"
                    onClick={handleCreatePdf}
                    disabled={loading}
                    className="h-13 w-full rounded-xl bg-[var(--nexus-primary)] text-base font-black text-[var(--nexus-on-primary)] hover:opacity-90"
                >
                    <Send className="mr-2 h-5 w-5" />
                    {loading ? "PDF 생성 중..." : "PDF 생성하기"}
                </Button>

                {pdfUrl && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownload}
                            className="h-12 border-[var(--nexus-primary)] text-base font-black text-[var(--nexus-primary)]"
                        >
                            <Download className="mr-2 h-5 w-5" />
                            저장
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handlePrint}
                            className="h-12 border-[var(--nexus-primary)] text-base font-black text-[var(--nexus-primary)]"
                        >
                            <Printer className="mr-2 h-5 w-5" />
                            출력
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-4">
            <span className="font-black text-[var(--nexus-primary)]">{label}</span>
            <span className="text-right text-[var(--nexus-on-bg)]/75">{value}</span>
        </div>
    );
}