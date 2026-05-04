import { BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkerCalculateResponse } from "./workerTypes";

export function WorkerResultCard({
                                     result,
                                 }: {
    result: WorkerCalculateResponse | null;
}) {
    return (
        <Card className="h-fit border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] shadow-sm">
            <CardHeader>
                <h2 className="text-xl font-black text-[var(--nexus-primary)]">
                    계산 결과
                </h2>
                <p className="text-sm text-[var(--nexus-outline)]">
                    결과는 입력값 기준 참고용입니다.
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {!result ? (
                    <div className="rounded-2xl bg-[var(--nexus-surface-container)] p-6 text-base leading-7 text-[var(--nexus-on-bg)]/70">
                        근로 조건을 입력한 뒤 계산하기를 누르면 결과가 표시됩니다.
                    </div>
                ) : (
                    <>
                        <ResultItem
                            icon={<BadgeCheck className="h-5 w-5" />}
                            title="주휴수당"
                            badge={result.weeklyAllowance.applicable ? "적용" : "미적용"}
                            value={
                                result.weeklyAllowance.applicable
                                    ? `${result.weeklyAllowance.amount.toLocaleString()}원`
                                    : "0원"
                            }
                            reason={result.weeklyAllowance.reason}
                        />

                        <ResultItem
                            icon={<Clock className="h-5 w-5" />}
                            title="휴게시간"
                            badge={result.breakTime.required ? "필요" : "불필요"}
                            value={result.breakTime.duration}
                            reason={result.breakTime.reason}
                        />

                        <ResultItem
                            icon={<ShieldCheck className="h-5 w-5" />}
                            title="보험 적용"
                            badge={result.insurance.required ? "필요" : "불필요"}
                            value={result.insurance.types.join(", ")}
                            reason={result.insurance.reason}
                        />
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function ResultItem({
                        icon,
                        title,
                        badge,
                        value,
                        reason,
                    }: {
    icon: React.ReactNode;
    title: string;
    badge: string;
    value: string;
    reason: string;
}) {
    return (
        <div className="rounded-2xl bg-[var(--nexus-surface-lowest)] p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="text-[var(--nexus-primary)]">{icon}</div>
                    <p className="font-black text-[var(--nexus-primary)]">{title}</p>
                </div>

                <Badge className="bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)]">
                    {badge}
                </Badge>
            </div>

            <p className="mt-4 text-2xl font-black text-[var(--nexus-on-bg)]">
                {value}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--nexus-outline)]">
                {reason}
            </p>
        </div>
    );
}