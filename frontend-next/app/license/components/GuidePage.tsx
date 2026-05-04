"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createChecklist, getCategories, getSurveys } from "./guideApi";
import type { ChecklistResponse, IndustryCategory, Survey } from "./guideTypes";

export default function GuidePage() {
    const [lv1, setLv1] = useState<IndustryCategory[]>([]);
    const [lv2, setLv2] = useState<IndustryCategory[]>([]);
    const [lv3, setLv3] = useState<IndustryCategory[]>([]);

    const [v1, setV1] = useState("");
    const [v2, setV2] = useState("");
    const [v3, setV3] = useState("");

    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [answers, setAnswers] = useState<Record<string, boolean>>({});
    const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [stepPage, setStepPage] = useState(0);

    const visibleCount = 3;

    useEffect(() => {
        getCategories().then(setLv1);
    }, []);

    const selectLv1 = async (id: string) => {
        setV1(id);
        setV2("");
        setV3("");
        setLv2([]);
        setLv3([]);
        setSurveys([]);
        setAnswers({});
        setChecklist(null);
        setStepPage(0);

        if (!id) return;
        setLv2(await getCategories(id));
    };

    const selectLv2 = async (id: string) => {
        setV2(id);
        setV3("");
        setLv3([]);
        setSurveys([]);
        setAnswers({});
        setChecklist(null);
        setStepPage(0);

        if (!id) return;
        setLv3(await getCategories(id));
    };

    const selectLv3 = async (id: string) => {
        setV3(id);
        setAnswers({});
        setChecklist(null);
        setStepPage(0);

        if (!id) {
            setSurveys([]);
            return;
        }

        const data = await getSurveys(id);
        setSurveys(Array.isArray(data) ? data : []);
    };

    const generate = async () => {
        if (!v3) return;

        const res = await createChecklist({
            industryId: v3,
            answers: surveys.map((s) => ({
                surveyId: s.id,
                answer: answers[s.id] ?? false,
            })),
        });

        setChecklist(res);
        setCurrentStep(1);
        setStepPage(0);
    };

    const uniqueDocs = checklist
        ? Array.from(new Set(checklist.documentSummary))
        : [];

    const allDone = checklist !== null && currentStep > checklist.steps.length;

    const visibleSteps = useMemo(() => {
        if (!checklist) return [];
        const start = stepPage * visibleCount;
        return checklist.steps.slice(start, start + visibleCount);
    }, [checklist, stepPage]);

    const maxStepPage = checklist
        ? Math.max(0, Math.ceil(checklist.steps.length / visibleCount) - 1)
        : 0;

    const goPrevSteps = () => setStepPage((prev) => Math.max(0, prev - 1));
    const goNextSteps = () => setStepPage((prev) => Math.min(maxStepPage, prev + 1));

    return (
        <main className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)]">
            <section className="relative overflow-hidden px-8 py-16">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--nexus-secondary-container)] opacity-40 blur-3xl" />
                <div className="absolute left-20 top-32 h-44 w-44 rounded-full bg-[var(--nexus-primary)] opacity-10 blur-3xl" />

                <div className="relative mx-auto max-w-6xl">
          <span className="inline-flex rounded-full bg-[var(--nexus-surface-low)] px-5 py-2 text-sm font-black text-[var(--nexus-secondary)]">
            창업 서류 가이드
          </span>

                    <h1 className="mt-6 max-w-5xl text-5xl font-black leading-tight tracking-tight text-[var(--nexus-primary)]">
                        업종별 <span className="text-[var(--nexus-secondary)]">인허가 절차</span>와{" "}
                        <span className="text-[var(--nexus-secondary)]">준비 서류</span>를 한 번에 확인하세요.
                    </h1>

                    <div className="mt-5 h-1.5 w-36 rounded-full bg-[#68fadd]" />

                    <p className="mt-6 max-w-5xl whitespace-nowrap text-2xl leading-8 text-[var(--nexus-outline)]">
                        업종과 조건을 선택하면 필요한 신고·등록 절차, 방문 기관, 준비 서류를 단계별로 정리해드립니다.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-6xl space-y-7 px-8 pb-14">
                <NoticeBox />

                <StepBlock
                    step="STEP 1"
                    title="업종 선택"
                    description="한국표준산업분류 기반으로 창업하려는 업종을 선택해주세요."
                >
                    <div className="grid gap-4 md:grid-cols-3">
                        <SelectBox value={v1} onChange={selectLv1} placeholder="대분류 선택" items={lv1} />
                        <SelectBox value={v2} onChange={selectLv2} placeholder="중분류 선택" items={lv2} />
                        <SelectBox value={v3} onChange={selectLv3} placeholder="업종 선택" items={lv3} />
                    </div>
                </StepBlock>

                <StepBlock
                    step="STEP 2"
                    title="추가 조건 선택"
                    description="선택한 업종과 영업 방식에 따라 필요한 서류가 달라집니다."
                >
                    {!v3 ? (
                        <EmptyBox text="업종을 선택하면 추가 조건 질문이 표시됩니다." />
                    ) : surveys.length === 0 ? (
                        <NoLicenseBox />
                    ) : (
                        <div className="space-y-4">
                            {surveys.map((q) => {
                                const selected = answers[q.id];

                                return (
                                    <div
                                        key={q.id}
                                        className={`flex flex-col gap-4 rounded-2xl border px-6 py-5 transition md:flex-row md:items-center md:justify-between ${
                                            selected === true
                                                ? "border-[var(--nexus-primary)] bg-[var(--nexus-surface-low)]"
                                                : "border-[var(--nexus-outline-variant)] bg-white"
                                        }`}
                                    >
                                        <p
                                            className={`text-lg font-black ${
                                                selected === true ? "text-[var(--nexus-primary)]" : ""
                                            }`}
                                        >
                                            {q.question}
                                        </p>

                                        <div className="flex gap-8 text-base font-bold">
                                            <label className="flex cursor-pointer items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    className="h-5 w-5"
                                                    checked={answers[q.id] === true}
                                                    onChange={() =>
                                                        setAnswers((prev) => ({ ...prev, [q.id]: true }))
                                                    }
                                                />
                                                예
                                            </label>

                                            <label className="flex cursor-pointer items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    className="h-5 w-5"
                                                    checked={(answers[q.id] ?? false) === false}
                                                    onChange={() =>
                                                        setAnswers((prev) => ({ ...prev, [q.id]: false }))
                                                    }
                                                />
                                                아니요
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="flex justify-center pt-5">
                                <button
                                    onClick={generate}
                                    className="rounded-2xl bg-[var(--nexus-primary)] px-12 py-4 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                                >
                                    체크리스트 생성
                                </button>
                            </div>
                        </div>
                    )}
                </StepBlock>

                <StepBlock
                    step="STEP 3"
                    title="인허가 체크리스트"
                    description="방문 순서와 예상 처리일을 확인하고 단계별로 진행하세요."
                >
                    {!checklist ? (
                        <EmptyBox text="조건 선택 후 체크리스트를 생성하면 인허가 절차가 표시됩니다." />
                    ) : (
                        <div>
                            <div className="mb-10 text-center">
                                <p className="text-base font-black text-[var(--nexus-secondary)]">
                                    {checklist.industryName}
                                </p>
                                <h2 className="mt-3 text-3xl font-black text-[var(--nexus-primary)]">
                                    필요한 인허가 절차를 순서대로 확인하세요
                                </h2>
                                <div className="mx-auto mt-4 h-1.5 w-32 rounded-full bg-[#68fadd]" />
                            </div>

                            <div className="group relative">
                                {checklist.steps.length > visibleCount && (
                                    <>
                                        <button
                                            onClick={goPrevSteps}
                                            disabled={stepPage === 0}
                                            className="absolute -left-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 rounded-full bg-[var(--nexus-primary)] text-2xl font-black text-white opacity-0 shadow-lg transition group-hover:opacity-100 disabled:opacity-20 md:block"
                                        >
                                            ‹
                                        </button>

                                        <button
                                            onClick={goNextSteps}
                                            disabled={stepPage === maxStepPage}
                                            className="absolute -right-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 rounded-full bg-[var(--nexus-primary)] text-2xl font-black text-white opacity-0 shadow-lg transition group-hover:opacity-100 disabled:opacity-20 md:block"
                                        >
                                            ›
                                        </button>
                                    </>
                                )}

                                <div className="relative mx-auto grid gap-7 md:grid-cols-3">
                                    <div className="absolute left-[13%] right-[13%] top-5 hidden h-[2px] bg-[var(--nexus-outline-variant)] md:block" />

                                    {visibleSteps.map((step) => {
                                        const active = step.orderNum === currentStep;
                                        const done = step.orderNum < currentStep;

                                        return (
                                            <div key={step.orderNum} className="relative z-10 flex flex-col items-center">
                                                <button
                                                    onClick={() => setCurrentStep(step.orderNum)}
                                                    className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full border-2 text-base font-black transition ${
                                                        done
                                                            ? "border-[var(--nexus-primary)] bg-[var(--nexus-primary)] text-white"
                                                            : active
                                                                ? "border-[var(--nexus-primary)] bg-white text-[var(--nexus-primary)]"
                                                                : "border-[var(--nexus-outline-variant)] bg-white text-[var(--nexus-outline)]"
                                                    }`}
                                                >
                                                    {done ? "✓" : step.orderNum}
                                                </button>

                                                <div
                                                    className={`flex min-h-[280px] w-full flex-col rounded-3xl border bg-white p-7 text-center shadow-sm transition ${
                                                        active
                                                            ? "border-[var(--nexus-primary)] ring-4 ring-[var(--nexus-surface-low)]"
                                                            : "border-[var(--nexus-outline-variant)]"
                                                    }`}
                                                >
                                                    <h3 className="whitespace-nowrap text-xl font-black">
                                                        {step.place}
                                                    </h3>

                                                    <p className="mt-4 min-h-[52px] text-base leading-7 text-[var(--nexus-outline)]">
                                                        {step.task}
                                                    </p>

                                                    <div className="mx-auto mt-5 w-40 rounded-2xl bg-[var(--nexus-surface-low)] px-4 py-3">
                                                        <p className="text-xs font-bold text-[var(--nexus-outline)]">
                                                            예상 처리일
                                                        </p>
                                                        <p className="mt-1 text-lg font-black text-[var(--nexus-primary)]">
                                                            {step.estimatedDays || "기간 미정"}
                                                        </p>
                                                    </div>

                                                    {active && (
                                                        <button
                                                            onClick={() => {
                                                                const next = step.orderNum + 1;
                                                                setCurrentStep(next);

                                                                const nextPage = Math.floor((next - 1) / visibleCount);
                                                                setStepPage(Math.min(nextPage, maxStepPage));
                                                            }}
                                                            className="mt-6 rounded-xl bg-[var(--nexus-primary)] px-5 py-3 text-base font-black text-white"
                                                        >
                                                            {step.orderNum === checklist.steps.length
                                                                ? "완료하기"
                                                                : "다음 단계"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-8 rounded-3xl border border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-low)] p-6">
                                <h3 className="text-lg font-black">준비 서류 목록</h3>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {uniqueDocs.map((doc) => (
                                        <span
                                            key={doc}
                                            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[var(--nexus-on-bg)] shadow-sm"
                                        >
                      {doc}
                    </span>
                                    ))}
                                </div>
                            </div>

                            {allDone && <CompleteCard />}
                        </div>
                    )}
                </StepBlock>
            </section>
        </main>
    );
}

function StepBlock({
                       step,
                       title,
                       description,
                       children,
                   }: {
    step: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-[28px] border border-[var(--nexus-outline-variant)] bg-white shadow-sm">
            <div className="flex flex-col gap-2 bg-[var(--nexus-surface-container-highest)] px-7 py-5 md:flex-row md:items-end md:justify-between">
                <div>
          <span className="text-sm font-black text-[var(--nexus-secondary)]">
            {step}
          </span>
                    <h2 className="mt-1 text-2xl font-black text-[var(--nexus-primary)]">
                        {title}
                    </h2>
                </div>
                <p className="max-w-xl text-sm font-medium text-[var(--nexus-outline)]">
                    {description}
                </p>
            </div>

            <div className="p-7">{children}</div>
        </section>
    );
}

function SelectBox({
                       value,
                       onChange,
                       placeholder,
                       items,
                   }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    items: IndustryCategory[];
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-14 rounded-2xl border border-[var(--nexus-outline-variant)] bg-white px-5 text-base font-bold outline-none focus:border-[var(--nexus-primary)]"
        >
            <option value="">{placeholder}</option>
            {items.map((item) => (
                <option key={item.id} value={item.id}>
                    {item.name}
                </option>
            ))}
        </select>
    );
}

function EmptyBox({ text }: { text: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] p-10 text-center text-base font-bold text-[var(--nexus-outline)]">
            {text}
        </div>
    );
}

function NoLicenseBox() {
    return (
        <div className="rounded-3xl border border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-low)] p-8 text-center">
            <p className="text-2xl font-black text-[var(--nexus-primary)]">
                별도 인허가 절차가 없는 업종이에요
            </p>
            <p className="mt-4 text-base leading-7 text-[var(--nexus-outline)]">
                해당 업종은 일반적으로 사업자등록 중심으로 진행할 수 있습니다. 단, 지역·시설·판매 품목에 따라 추가 신고가 필요할 수 있으니 관할 기관 확인을 권장합니다.
            </p>
            <div className="mt-6 flex justify-center gap-3">
                <Link
                    href="/subsidy"
                    className="rounded-2xl bg-[var(--nexus-primary)] px-6 py-3 text-sm font-black text-white"
                >
                    지원금 확인하기
                </Link>
                <Link
                    href="/"
                    className="rounded-2xl border border-[var(--nexus-outline-variant)] bg-white px-6 py-3 text-sm font-black"
                >
                    홈으로 가기
                </Link>
            </div>
        </div>
    );
}

function NoticeBox() {
    return (
        <div className="flex gap-5 rounded-3xl border border-[var(--nexus-outline-variant)] bg-white p-7 shadow-sm">
            <div className="flex h-7 w-12 shrink-0 items-center justify-center text-3xl">
                ⚠️
            </div>
            <div>
                <p className="mt-2 text-base leading-8 text-3xs text-[var(--nexus-outline)]">
                    본 가이드는 창업 준비를 돕기 위한 참고용 정보입니다.<br />
                    실제 신고·등록 요건과 제출 서류는 지역, 점포 구조, 담당 기관 해석에 따라 달라질 수 있으므로 최종 제출 전 관할 기관에 확인해주세요.

                </p>
            </div>
        </div>
    );
}

function CompleteCard() {
    return (
        <div className="relative mt-10 overflow-hidden rounded-[32px] border border-[var(--nexus-secondary-container)] bg-[var(--nexus-surface-low)] p-10 text-center shadow-sm">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[12%] top-6 animate-bounce text-4xl">🎉</div>
                <div className="absolute right-[14%] top-10 animate-bounce text-3xl">✨</div>
                <div className="absolute bottom-8 left-[28%] animate-bounce text-3xl">🎊</div>
                <div className="absolute bottom-10 right-[30%] animate-bounce text-3xl">🌟</div>
            </div>

            <p className="text-base font-black text-[var(--nexus-secondary)]">
                모든 단계 완료
            </p>

            <h2 className="mt-4 text-4xl font-black text-[var(--nexus-primary)]">
                모든 준비가 완료되었어요!
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--nexus-outline)]">
                인허가 준비를 마쳤다면 받을 수 있는 지원금도 함께 확인해보세요.
            </p>

            <div className="mt-8 flex justify-center gap-4">
                <Link
                    href="/subsidy"
                    className="rounded-2xl bg-[var(--nexus-primary)] px-7 py-4 text-base font-black text-white"
                >
                    지원금 확인하기
                </Link>

                <Link
                    href="/"
                    className="rounded-2xl border border-[var(--nexus-outline-variant)] bg-white px-7 py-4 text-base font-black"
                >
                    홈으로 가기
                </Link>
            </div>
        </div>
    );
}