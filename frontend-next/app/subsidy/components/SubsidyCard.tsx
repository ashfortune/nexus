import Link from "next/link";
import type { SubsidyCard } from "./subsidyTypes";

interface Props {
    item: SubsidyCard;
}

export default function SubsidyCardItem({ item }: Props) {
    return (
        <Link
            href={`/subsidy/${item.id}`}
            className="group relative overflow-hidden rounded-[28px] border border-transparent bg-[var(--nexus-surface-lowest)] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[var(--nexus-secondary-container)] hover:shadow-md"
        >
            <div className="absolute right-0 top-0 h-full w-1.5 bg-[var(--nexus-secondary-container)] opacity-0 transition group-hover:opacity-100" />

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                    <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--nexus-surface-low)] px-3 py-1 text-xs font-bold text-[var(--nexus-secondary)]">
              {item.region || "전국/제한 없음"}
            </span>

                        <span className="rounded-full bg-[var(--nexus-surface-container)] px-3 py-1 text-xs font-bold text-[var(--nexus-primary)]">
              {item.life_cycle || "기타"}
            </span>
                    </div>

                    <h2 className="text-xl font-black leading-snug text-[var(--nexus-on-bg)] group-hover:text-[var(--nexus-primary)]">
                        {item.name}
                    </h2>

                    <p className="mt-2 text-sm font-medium text-[var(--nexus-outline)]">
                        {item.organization || "기관 정보 없음"}
                    </p>

                    {item.description && (
                        <p className="mt-4 line-clamp-2 text-sm leading-7 text-[var(--nexus-on-bg)]">
                            {item.description}
                        </p>
                    )}
                </div>

                <div className="shrink-0 rounded-2xl bg-[var(--nexus-surface-low)] px-5 py-4 text-left md:text-left">
                    <p className="text-1xl font-semibold text-[var(--nexus-outline)]">
                        마감일
                    </p>

                    <p className="mt-1 whitespace-nowrap text-lg font-black text-[var(--nexus-primary)]">
                        {item.deadline || "상시/미정"}
                    </p>

                    {item.max_amount && (
                        <p className="mt-2 text-sm font-bold text-[var(--nexus-secondary)]">
                            최대 {item.max_amount.toLocaleString()}원
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}