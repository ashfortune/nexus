interface Props {
    query: string;
    region: string;
    lifeCycle: string;
    onQueryChange: (value: string) => void;
    onRegionChange: (value: string) => void;
    onLifeCycleChange: (value: string) => void;
    onSearch: () => void;
}

const regions = [
    "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
    "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const lifeCycles = ["창업", "성장", "폐업재기", "기타"];

export default function SubsidyFilters({
                                           query,
                                           region,
                                           lifeCycle,
                                           onQueryChange,
                                           onRegionChange,
                                           onLifeCycleChange,
                                           onSearch,
                                       }: Props) {
    return (
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_160px_160px_100px]">
            <input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                }}
                placeholder="예: 청년 창업, 인턴 지원, 소상공인"
                className="rounded-2xl border border-[var(--nexus-outline-variant)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--nexus-secondary)]"
            />

            <select
                value={region}
                onChange={(e) => onRegionChange(e.target.value)}
                className="rounded-2xl border border-[var(--nexus-outline-variant)] bg-white px-4 py-3 text-sm outline-none"
            >
                <option value="">전체 지역</option>
                {regions.map((item) => (
                    <option key={item} value={item}>{item}</option>
                ))}
            </select>

            <select
                value={lifeCycle}
                onChange={(e) => onLifeCycleChange(e.target.value)}
                className="rounded-2xl border border-[var(--nexus-outline-variant)] bg-white px-4 py-3 text-sm outline-none"
            >
                <option value="">전체 단계</option>
                {lifeCycles.map((item) => (
                    <option key={item} value={item}>{item}</option>
                ))}
            </select>

            <button
                onClick={onSearch}
                className="rounded-2xl bg-[var(--nexus-primary)] px-5 py-3 text-sm font-semibold text-white"
            >
                검색
            </button>
        </div>
    );
}