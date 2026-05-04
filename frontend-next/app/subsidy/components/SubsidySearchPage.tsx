"use client";

import { useEffect, useState } from "react";
import { fetchSubsidies } from "./subsidyApi";
import type { SubsidyCard } from "./subsidyTypes";
import SubsidyCardItem from "./SubsidyCard";
import SubsidyFilters from "./SubsidyFilters";

const regionKeywords = [
    "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
    "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

export default function SubsidySearchPage() {
    const [query, setQuery] = useState("");
    const [region, setRegion] = useState("");
    const [lifeCycle, setLifeCycle] = useState("");
    const [items, setItems] = useState<SubsidyCard[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const size = 10;

    const loadSubsidies = async (nextPage = 1) => {
        setLoading(true);

        try {
            let extractedRegion: string | null = null;
            let cleanedQuery = query.trim();

            for (const keyword of regionKeywords) {
                if (cleanedQuery.includes(keyword)) {
                    extractedRegion = keyword;
                    cleanedQuery = cleanedQuery.replace(keyword, "").trim();
                    break;
                }
            }

            const finalRegion = region || extractedRegion;

            const result = await fetchSubsidies({
                query: cleanedQuery || null,
                region: finalRegion || null,
                life_cycle: lifeCycle || null,
                page: nextPage,
                size,
            });

            setItems(result.data);
            setTotal(result.total);
            setPage(result.page);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubsidies(1);
    }, []);

    const totalPage = Math.ceil(total / size);

    return (
        <main className="min-h-screen bg-[var(--nexus-bg)] px-5 py-10 text-[var(--nexus-on-bg)]">
            <section className="mx-auto flex max-w-6xl flex-col gap-7">
                <div className="relative overflow-hidden rounded-[32px] border border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] p-8 shadow-sm">
                    <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--nexus-secondary-container)] opacity-30 blur-3xl" />
                    <div className="absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-[var(--nexus-primary)] opacity-10 blur-3xl" />

                    <div className="relative">
            <span className="inline-flex rounded-full bg-[var(--nexus-surface-low)] px-4 py-1.5 text-sm font-bold text-[var(--nexus-secondary)]">
              맞춤 지원금 찾기
            </span>

                        <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight text-[var(--nexus-primary)]">
                            지금 받을 수 있는 지원금을 찾아보세요
                        </h1>

                        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--nexus-outline)]">
                            지역, 성장단계, 검색어를 조합해 조건에 맞는 지원사업을 추천해드려요.
                        </p>

                        <SubsidyFilters
                            query={query}
                            region={region}
                            lifeCycle={lifeCycle}
                            onQueryChange={setQuery}
                            onRegionChange={setRegion}
                            onLifeCycleChange={setLifeCycle}
                            onSearch={() => loadSubsidies(1)}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-[var(--nexus-outline)]">
                        총{" "}
                        <span className="text-lg font-black text-[var(--nexus-primary)]">
              {total.toLocaleString()}
            </span>
                        개
                    </p>

                    {loading && (
                        <span className="rounded-full bg-[var(--nexus-surface-low)] px-4 py-2 text-sm font-semibold text-[var(--nexus-secondary)]">
              검색 중...
            </span>
                    )}
                </div>

                <div className="grid gap-4">
                    {items.map((item) => (
                        <SubsidyCardItem key={item.id} item={item} />
                    ))}

                    {!loading && items.length === 0 && (
                        <div className="rounded-[28px] border border-[var(--nexus-outline-variant)] bg-[var(--nexus-surface-lowest)] p-12 text-center shadow-sm">
                            <p className="text-lg font-bold">검색 결과가 없어요</p>
                            <p className="mt-2 text-sm text-[var(--nexus-outline)]">
                                검색어나 필터를 조금 넓혀보세요.
                            </p>
                        </div>
                    )}
                </div>

                {totalPage > 1 && (
                    <div className="flex justify-center gap-3 pt-4">
                        <button
                            disabled={page <= 1}
                            onClick={() => loadSubsidies(page - 1)}
                            className="rounded-full border border-[var(--nexus-outline-variant)] bg-white px-5 py-2 text-sm font-semibold disabled:opacity-40"
                        >
                            이전
                        </button>

                        <span className="rounded-full bg-white px-5 py-2 text-sm font-bold shadow-sm">
              {page} / {totalPage}
            </span>

                        <button
                            disabled={page >= totalPage}
                            onClick={() => loadSubsidies(page + 1)}
                            className="rounded-full bg-[var(--nexus-primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        >
                            다음
                        </button>
                    </div>
                )}
            </section>
        </main>
    );
}