import { Card, CardContent } from "@/components/ui/card";
import type { WorkerContractType } from "./workerTypes";

const contractTypes: {
    value: WorkerContractType;
    title: string;
    description: string;
}[] = [
    {
        value: "NO_PERIOD",
        title: "정해진 종료일 없이 고용하시나요?",
        description: "상시 근로자 또는 종료일이 없는 일반 근로계약서입니다.",
    },
    {
        value: "PERIOD",
        title: "근무 종료일이 정해져 있나요?",
        description: "계약 시작일과 종료일이 있는 근로계약서입니다.",
    },
    {
        value: "MINOR",
        title: "18세 미만 근로자를 고용하시나요?",
        description: "연소근로자 계약서와 친권자 동의서가 함께 출력됩니다.",
    },
    {
        value: "PART_TIME",
        title: "요일별 근무시간이 다른가요?",
        description: "단시간근로자용 계약서입니다. 요일별 표는 빈칸으로 출력됩니다.",
    },
    {
        value: "CONSTRUCTION",
        title: "건설 일용직 근로자인가요?",
        description: "건설일용근로자용 표준근로계약서입니다.",
    },
];

export function ContractTypeSelector({
                                         value,
                                         onChange,
                                     }: {
    value: WorkerContractType;
    onChange: (value: WorkerContractType) => void;
}) {
    return (
        <Card className="border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] shadow-sm">
            <CardContent className="p-8">
                <h2 className="text-2xl font-black text-[var(--nexus-primary)]">
                    계약서 유형 선택
                </h2>
                <p className="mt-2 text-sm text-[var(--nexus-on-bg)]/60">
                    고용하려는 근로 형태에 맞는 계약서를 선택해주세요.
                </p>

                {/* 2열 고정. 5번째는 왼쪽 정렬, 오른쪽은 빈 div */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    {contractTypes.map((type) => {
                        const active = value === type.value;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => onChange(type.value)}
                                className={[
                                    "flex flex-col rounded-2xl border p-6 text-left transition",
                                    "hover:-translate-y-0.5 hover:shadow-md",
                                    active
                                        ? "border-[var(--nexus-primary)] bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)]"
                                        : "border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] text-[var(--nexus-on-bg)]",
                                ].join(" ")}
                            >
                                <p className="text-base font-black leading-snug break-keep">
                                    {type.title}
                                </p>
                                <p
                                    className={`mt-3 text-sm leading-6 break-keep ${
                                        active
                                            ? "text-[var(--nexus-on-primary)]/80"
                                            : "text-[var(--nexus-on-bg)]/55"
                                    }`}
                                >
                                    {type.description}
                                </p>
                            </button>
                        );
                    })}

                    {/* 카드가 홀수개면 마지막 오른쪽 칸을 빈 div로 채움 */}
                    {contractTypes.length % 2 !== 0 && (
                        <div aria-hidden="true" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}