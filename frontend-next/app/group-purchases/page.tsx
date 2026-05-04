'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface GroupBuy {
  id: string;
  title: string;
  itemName: string;
  itemPrice: number;
  targetCount: number;
  currentCount: number;
  endDate: string;
  status: string;
  imageUrl: string;
  region: string;
}

export default function GroupBuyListPage() {
  const router = useRouter();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date().getTime());
  
  // 검색 및 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체');

  // 현재 시간 업데이트 (1분마다)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date().getTime()), 60000);
    return () => clearInterval(timer);
  }, []);

  // API 호출
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchKeyword) params.append('itemName', searchKeyword);
    if (selectedRegion && selectedRegion !== '전체') params.append('region', selectedRegion);

    const url = params.toString() 
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/group-purchases/search?${params.toString()}`
      : process.env.NEXT_PUBLIC_API_URL + '/api/v1/group-purchases';

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setGroupBuys(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching group purchases:', err);
        setIsLoading(false);
      });
  }, [searchKeyword, selectedRegion]);

  const regions = [
    "전체", "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
  ];

  const filteredGroupBuys = groupBuys;

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] p-8 pb-24 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <span className="text-[var(--nexus-primary)] font-black tracking-[0.3em] text-xs uppercase mb-3 block opacity-60">Premium Marketplace</span>
            <h1 className="text-5xl font-black text-[var(--nexus-primary)] tracking-tight">
              Nexus <span className="opacity-30">공동구매</span>
            </h1>
            <p className="text-slate-500 mt-4 text-lg font-medium">함께할수록 가격은 가벼워지고, 가치는 더해집니다.</p>
          </div>
          <Link href="/group-purchases/create">
            <button className="px-10 py-5 bg-[var(--nexus-primary)] hover:bg-[#081363] text-white rounded-2xl font-black text-xl transition-all shadow-2xl shadow-indigo-900/20 active:scale-95">
              공동구매 등록하기
            </button>
          </Link>
        </header>

        {/* 검색 및 필터 섹션 - 가운데 정렬 유지하며 너비 복구 (디자인 토큰 적용) */}
        <div className="flex flex-col md:flex-row gap-4 mb-16 justify-center items-center max-w-5xl mx-auto">
          <div className="flex-1 relative w-full group">
            <input 
              type="text" 
              placeholder="찾으시는 물품명을 입력해 주세요..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white shadow-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-[var(--nexus-primary)] outline-none text-xl font-bold transition-all placeholder:text-slate-300"
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[var(--nexus-primary)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
          </div>
          <div className="md:w-64 relative">
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-8 py-6 bg-[var(--nexus-primary)] text-white rounded-[2rem] border-none outline-none text-lg font-black appearance-none cursor-pointer shadow-2xl hover:bg-[#081363] transition-all"
            >
              {regions.map(r => (
                <option key={r} value={r} className="bg-white text-slate-800">{r === '전체' ? '지역 전체' : r}</option>
              ))}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--nexus-primary)]"></div>
          </div>
        ) : filteredGroupBuys.length === 0 ? (
          <div className="text-center py-32 bg-white/40 backdrop-blur-sm rounded-[4rem] border-4 border-dashed border-white/60">
            <p className="text-slate-400 font-black text-xl mb-4">진행 중인 공동구매가 없습니다.</p>
            <Link href="/group-purchases/create">
              <span className="text-[var(--nexus-primary)] font-black hover:underline cursor-pointer">첫 번째 공동구매를 등록해 보세요!</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredGroupBuys.map((gb) => {
              const progress = (gb.currentCount / gb.targetCount) * 100;
              const isExpired = new Date(gb.endDate).getTime() <= now;
              const isCompleted = gb.status === 'COMPLETED' || progress >= 100;

              return (
                <div 
                  key={gb.id} 
                  onClick={() => router.push(`/group-purchases/${gb.id}`)}
                  className="group nexus-card overflow-hidden cursor-pointer shadow-lg hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] transition-all duration-700 transform hover:-translate-y-3 border border-white"
                >
                  <div className="relative h-56">
                    <img 
                      src={gb.imageUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop'} 
                      alt={gb.itemName} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black shadow-2xl ${
                        isCompleted || isExpired ? 'bg-slate-900 text-white' : 'bg-[var(--nexus-primary)] text-white'
                      }`}>
                        {isCompleted ? '마감' : isExpired ? '만료' : '모집 중'}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 space-y-7 bg-white">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black text-[#0f172a] line-clamp-1 group-hover:text-[var(--nexus-primary)] transition-colors flex-1">{gb.title}</h3>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                          📍 {gb.region.split(' ')[1] || gb.region}
                        </span>
                      </div>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{gb.itemName}</p>
                    </div>

                    <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">가격</p>
                        <p className="text-2xl font-black text-[var(--nexus-primary)] tracking-tighter">{gb.itemPrice.toLocaleString()}원</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-600 font-black">{gb.currentCount} <span className="text-slate-200">/</span> {gb.targetCount}명</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100 shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 rounded-full ${
                            isCompleted ? 'bg-slate-300' : 'bg-gradient-to-r from-[var(--nexus-primary)] via-indigo-500 to-[var(--nexus-secondary)]'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className={`text-[10px] font-black tracking-[0.2em] uppercase ${isCompleted ? 'text-slate-400' : 'text-[var(--nexus-primary)]'}`}>
                        {progress.toFixed(0)}% 달성
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
