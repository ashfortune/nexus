"use client";

import Link from "next/link";
import { useState } from "react";
import {
    ArrowRight,
    ArrowUpRightIcon,
    FileText,
    ReceiptText,
    ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { WorkerCalculator } from "./components/WorkerCalculator";
import { WorkerResultCard } from "./components/WorkerResultCard";
import type { WorkerCalculateResponse } from "./components/workerTypes";

export default function WorkerPage() {
    const [result, setResult] = useState<WorkerCalculateResponse | null>(null);

    return (
        <main className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)]">
            <section className="mx-auto w-full max-w-[1160px] px-6 py-20">
                <div className="mb-12">
                    <Badge className="mb-5 rounded-full bg-[var(--nexus-surface-container)] px-5 py-2.5 text-base font-black text-[var(--nexus-primary)]">
                        고용 가이드
                    </Badge>

                    <h1 className="max-w-4xl text-5xl font-black leading-[1.12] tracking-tight text-[var(--nexus-primary)]">
                        사장님이 놓치기 쉬운 고용 의무,
                        <br />
                        넥서스가 쉽게 정리해드려요.
                    </h1>

                    <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--nexus-on-bg)]/75">
                        근로시간과 시급을 입력하면 주휴수당, 휴게시간, 4대보험 적용 여부를
                        확인하고, 근로계약서와 급여명세서까지 바로 준비할 수 있습니다.
                    </p>
                </div>

                <Card className="mb-12 border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] shadow-sm">
                    <CardContent className="p-8">
                        <div className="flex flex-col gap-5 md:flex-row md:items-start">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)]">
                                <ShieldAlert className="h-7 w-7" />
                            </div>

                            <div className="flex-1">
                                <p className="mb-4 text-base font-black text-[var(--nexus-error)]">
                                    하루 알바도 놓치면 안 되는 고용 의무
                                </p>

                                <h2 className="text-3xl font-black leading-snug text-[var(--nexus-primary)]">
                                    근로계약서와 급여명세서는 단기 근로자에게도 필요합니다
                                </h2>

                                <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--nexus-on-bg)]/75">
                                    단 하루 근무하더라도 근로조건은 서면으로 명시하고 교부해야
                                    하며, 임금을 지급할 때는 임금명세서도 함께 제공해야 합니다.
                                    많은 사장님들이 놓치기 쉬운 부분이지만, 미작성 또는 미교부 시
                                    과태료 대상이 될 수 있습니다.
                                </p>

                                <div className="mt-7 grid gap-4 md:grid-cols-2">
                                    <ActionInfoCard
                                        icon={<FileText className="h-12 w-12" />}
                                        title="근로계약서"
                                        description="근로조건을 명시하고 근로자에게 교부해야 합니다."
                                        href="/worker/contract"
                                        buttonText="계약서 작성 바로가기"
                                    />

                                    <ActionInfoCard
                                        icon={<ReceiptText className="h-12 w-12" />}
                                        title="급여명세서"
                                        description="임금 구성항목, 계산방법, 공제내역을 포함해야 합니다."
                                        href="/worker/paystub"
                                        buttonText="명세서 작성 바로가기"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <section className="mb-12">
                    <SectionTitle
                        badge="계산 도구"
                        title="근로 조건 계산"
                        description="주휴수당, 휴게시간, 보험 적용 여부를 입력값 기준으로 확인합니다."
                    />

                    <div className="mt-6">
                        <WorkerCalculator onResult={setResult} />
                    </div>

                    <div className="mt-8">
                        <WorkerResultCard result={result} />
                    </div>
                </section>

                <section className="mt-16">
                    <SectionTitle
                        badge="문서 작성"
                        title="필요한 문서를 바로 준비하세요"
                        description="계약서와 급여명세서를 작성하고 출력할 수 있습니다."
                    />

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <DocumentCard
                            icon={<FileText className="h-14 w-14" />}
                            category="근로계약서"
                            title="표준근로계약서 PDF 생성"
                            description="기간 없음, 기간 있음, 연소근로자, 단시간근로자, 건설일용근로자 양식을 지원합니다."
                            href="/worker/contract"
                            buttonText="간편작성 시작"
                        />

                        <DocumentCard
                            icon={<ReceiptText className="h-14 w-14" />}
                            category="급여명세서"
                            title="급여명세서 간편작성"
                            description="임금 지급 시 필요한 급여명세서를 작성하고 출력할 수 있습니다."
                            href="/worker/paystub"
                            buttonText="명세서 작성 시작"
                        />
                    </div>
                </section>
            </section>
        </main>
    );
}

function SectionTitle({
                          badge,
                          title,
                          description,
                      }: {
    badge: string;
    title: string;
    description: string;
}) {
    return (
        <div>
            <Badge className="mb-4 rounded-full bg-[var(--nexus-surface-container)] px-5 py-2.5 text-base font-black text-[var(--nexus-primary)]">
                {badge}
            </Badge>

            <h2 className="text-4xl font-black leading-tight text-[var(--nexus-primary)]">
                {title}
            </h2>

            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--nexus-on-bg)]/75">
                {description}
            </p>
        </div>
    );
}

function ActionInfoCard({
                            icon,
                            title,
                            description,
                            href,
                            buttonText,
                        }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    buttonText: string;
}) {
    return (
        <div className="rounded-2xl border border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center text-[var(--nexus-primary)]">
                    {icon}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black text-[var(--nexus-primary)]">
                        {title}
                    </h3>
                    <p className="mt-2 text-base leading-7 text-[var(--nexus-on-bg)]/70">
                        {description}
                    </p>
                </div>
            </div>

            <Badge
                asChild
                className="mt-6 rounded-full bg-[var(--nexus-primary)] px-6 py-3.5 text-base font-black text-[var(--nexus-on-primary)] hover:opacity-90"
            >
                <Link href={href}>
                    {buttonText}
                    <ArrowUpRightIcon className="ml-2 h-5 w-5" />
                </Link>
            </Badge>
        </div>
    );
}

function DocumentCard({
                          icon,
                          category,
                          title,
                          description,
                          href,
                          buttonText,
                      }: {
    icon: React.ReactNode;
    category: string;
    title: string;
    description: string;
    href: string;
    buttonText: string;
}) {
    return (
        <Card className="border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex h-full flex-col justify-between p-8">
                <div>
                    <div className="mb-6 flex h-16 w-16 items-center justify-center text-[var(--nexus-primary)]">
                        {icon}
                    </div>

                    <p className="text-sm font-black text-[var(--nexus-secondary)]">
                        {category}
                    </p>

                    <h3 className="mt-2 text-2xl font-black leading-snug text-[var(--nexus-primary)]">
                        {title}
                    </h3>

                    <p className="mt-4 text-base leading-7 text-[var(--nexus-on-bg)]/70">
                        {description}
                    </p>
                </div>

                <Button
                    asChild
                    className="mt-8 h-14 w-full rounded-xl bg-[var(--nexus-primary)] text-base font-black text-[var(--nexus-on-primary)] hover:opacity-90"
                >
                    <Link href={href}>
                        {buttonText}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}