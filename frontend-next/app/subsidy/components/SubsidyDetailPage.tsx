import Link from "next/link";
import { fetchSubsidyDetail } from "./subsidyApi";

interface Props {
    id: string;
}

export default async function SubsidyDetailPage({ id }: Props) {
    const item = await fetchSubsidyDetail(id);

    return (
        <main className="min-h-screen bg-[var(--nexus-bg)] px-5 py-8 text-[var(--nexus-on-bg)]">
            <section className="mx-auto max-w-4xl">
                <Link
                    href="/subsidy"
                    className="text-sm font-medium text-[var(--nexus-secondary)]"
                >
                    ← 목록으로 돌아가기
                </Link>

                <div className="mt-5 rounded-[28px] bg-[var(--nexus-surface-lowest)] p-7 shadow-sm">
                    <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--nexus-surface-low)] px-3 py-1 text-xs text-[var(--nexus-secondary)]">
              {item.region || "전국/제한 없음"}
            </span>

                        <span className="rounded-full bg-[var(--nexus-surface-container)] px-3 py-1 text-xs">
              {item.life_cycle || "기타"}
            </span>
                    </div>

                    <h1 className="text-3xl font-bold leading-tight">{item.name}</h1>

                    <p className="mt-3 text-sm text-[var(--nexus-outline)]">
                        {item.organization || "기관 정보 없음"}
                    </p>

                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                        <Info label="신청 시작" value={item.start_date || "미정"} />
                        <Info label="마감일" value={item.deadline || "상시/미정"} />
                        <Info
                            label="지원금"
                            value={
                                item.max_amount
                                    ? `최대 ${item.max_amount.toLocaleString()}원`
                                    : "별도 확인"
                            }
                        />
                    </div>

                    <DetailSection title="사업 설명" value={item.description} />
                    <DetailSection title="지원 내용" value={item.support_content} />
                    <DetailSection title="지원 대상" value={item.target} />
                    <DetailSection title="신청 방법" value={item.how_to_apply} />
                    <DetailSection title="문의처" value={item.contact} />

                    {item.apply_url && (
                        <a
                            href={item.apply_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-8 inline-flex rounded-2xl bg-[var(--nexus-primary)] px-6 py-3 text-sm font-semibold text-white"
                        >
                            신청 페이지로 이동
                        </a>
                    )}
                </div>
            </section>
        </main>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-[var(--nexus-surface-low)] p-4">
            <p className="text-xs text-[var(--nexus-outline)]">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}

function DetailSection({
                           title,
                           value,
                       }: {
    title: string;
    value?: string | null;
}) {
    if (!value) return null;

    return (
        <section className="mt-8">
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--nexus-on-bg)]">
                {value}
            </p>
        </section>
    );
}