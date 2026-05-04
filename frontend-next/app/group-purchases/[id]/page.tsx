'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, ChevronLeft } from 'lucide-react';

declare global {
  interface Window {
    TossPayments: any;
  }
}

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
  description: string;
  creatorId: string;
}

export default function GroupBuyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [gb, setGb] = useState<GroupBuy | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'd38bc69d-9660-4e11-a50d-9ee90ff38673' : '';

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/group-purchases/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setGb(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching group purchase detail:', err);
        setIsLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (!gb) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const targetDate = new Date(gb.endDate).getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft(prev => ({ ...prev, isExpired: true }));
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        isExpired: false
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gb]);

  const handlePayment = async (provider: string) => {
    if (!gb || timeLeft.isExpired) return;

    try {
      const checkRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/group-purchases/${params.id}/check-participation?userId=${currentUserId}`);
      const isParticipated = await checkRes.json();
      
      if (isParticipated) {
        alert("이미 참여하신 공동구매입니다. 한 명당 한 번만 참여 가능합니다.");
        return;
      }
    } catch (error) {
      console.error("Participation check error:", error);
      alert("참여 여부 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    if (provider === 'TOSS') {
      try {
        const configRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/config');
        const configData = await configRes.json();
        const clientKey = configData.tossClientKey;
        
        if (typeof window !== 'undefined' && window.TossPayments) {
          const tossPayments = window.TossPayments(clientKey);
          
          await tossPayments.requestPayment('카드', {
            amount: gb.itemPrice,
            orderId: `ORDER_${Date.now()}`,
            orderName: gb.itemName,
            successUrl: `${window.location.origin}/group-purchases/${gb.id}/success`,
            failUrl: `${window.location.origin}/group-purchases/${gb.id}/fail`,
          });
        } else {
          alert('토스 결제 모듈이 아직 로드되지 않았습니다.');
        }
      } catch (error: any) {
        if (error.code !== 'USER_CANCEL') {
          console.error('Toss payment error:', error);
          alert('결제창을 띄우는 중 오류가 발생했습니다.');
        }
      }
    }
  };

  const handleDelete = async () => {
    if (!gb) return;
    
    if (!confirm('정말로 이 공동구매를 취소하시겠습니까? 참여자들의 결제 내역이 모두 환불 처리됩니다.')) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/group-purchases/${gb.id}?userId=${currentUserId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('공동구매가 취소되었습니다.');
        router.push('/group-purchases');
      } else {
        alert('취소 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('오류가 발생했습니다.');
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[var(--nexus-bg)] flex justify-center items-center font-black text-[var(--nexus-primary)]">로딩 중...</div>;
  if (!gb) return <div className="min-h-screen bg-[var(--nexus-bg)] flex justify-center items-center font-bold">항목을 찾을 수 없습니다.</div>;

  const progress = (gb.currentCount / gb.targetCount) * 100;
  const isOwner = gb.creatorId === currentUserId;

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] p-8 pb-32">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => router.push('/group-purchases')}
          className="mb-10 flex items-center gap-2 text-slate-400 hover:text-[var(--nexus-primary)] font-black transition-colors uppercase tracking-widest text-xs"
        >
          <ChevronLeft className="w-5 h-5" /> Back to list
        </button>

        <div className="flex flex-col lg:flex-row gap-16">
          <div className="lg:w-3/5 space-y-12">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src={gb.imageUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop'} 
                alt={gb.itemName}
                className="w-full h-auto object-cover aspect-video"
              />
              <div className="absolute top-8 left-8 flex gap-3">
                <span className={`px-6 py-2.5 rounded-full text-[10px] font-black shadow-2xl tracking-widest ${timeLeft.isExpired ? 'bg-slate-900 text-white' : 'bg-[var(--nexus-primary)] text-white'}`}>
                  {timeLeft.isExpired ? '모집 마감' : '실시간 진행 중'}
                </span>
                <span className="bg-white/90 backdrop-blur-md text-slate-800 px-6 py-2.5 rounded-full text-[10px] font-black border border-white/50 shadow-xl tracking-widest uppercase">
                  📍 {gb.region}
                </span>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-[var(--nexus-primary)] font-black tracking-[0.3em] text-[10px] uppercase opacity-60">Story & Details</span>
                <h2 className="text-3xl font-black text-[var(--nexus-primary)]">제품 상세 정보</h2>
                <div className="h-1.5 w-16 bg-[var(--nexus-primary)] rounded-full"></div>
              </div>
              <div className="bg-white/60 backdrop-blur-md p-12 rounded-[3rem] border border-white shadow-xl min-h-[400px]">
                <p className="text-slate-600 leading-relaxed text-xl font-medium whitespace-pre-line">
                  {gb.description}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:w-2/5">
            <div className="sticky top-12 nexus-card p-12 border-2 border-white shadow-2xl space-y-12">
              <div className="space-y-4">
                <span className="text-[var(--nexus-primary)] font-black text-[10px] tracking-[0.4em] uppercase opacity-50 block">Nexus Collection</span>
                <h1 className="text-4xl font-black text-[var(--nexus-primary)] leading-tight">{gb.title}</h1>
                <p className="text-slate-400 font-bold text-xl tracking-tight">{gb.itemName}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">단독 할인가</p>
                <p className="text-6xl font-black text-[var(--nexus-primary)] tracking-tighter">
                  {gb.itemPrice.toLocaleString()}<span className="text-2xl ml-1 font-bold opacity-30">원</span>
                </p>
              </div>

              <div className={`rounded-[2.5rem] p-10 border text-center transition-all ${timeLeft.isExpired ? 'bg-slate-50 border-slate-100' : 'bg-[var(--nexus-bg)] border-white shadow-inner'}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">
                  {timeLeft.isExpired ? '모집 기간 종료' : '남은 시간'}
                </p>
                <div className="grid grid-cols-4 gap-6">
                  {[
                    { label: '일', value: timeLeft.days },
                    { label: '시', value: timeLeft.hours },
                    { label: '분', value: timeLeft.minutes },
                    { label: '초', value: timeLeft.seconds }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-2">
                      <span className={`text-3xl font-black tabular-nums ${timeLeft.isExpired ? 'text-slate-300' : 'text-[var(--nexus-primary)]'}`}>
                        {String(item.value).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 opacity-60 uppercase">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[var(--nexus-primary)] uppercase tracking-widest">{progress.toFixed(0)}% 달성 완료</p>
                    <p className="text-slate-500 font-black text-lg">{gb.currentCount}명 참여</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">목표 인원</p>
                    <p className="text-slate-800 font-black text-xl">{gb.targetCount}명</p>
                  </div>
                </div>
                <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--nexus-primary)] via-indigo-500 to-[var(--nexus-secondary)] rounded-full transition-all duration-1000 shadow-xl"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-5 pt-6">
                <button 
                  disabled={timeLeft.isExpired}
                  onClick={() => handlePayment('TOSS')}
                  className={`w-full py-7 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all shadow-2xl transform active:scale-95 ${
                    timeLeft.isExpired ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[var(--nexus-primary)] text-white shadow-indigo-900/30 hover:bg-[#081363] hover:scale-[1.02]'
                  }`}
                >
                  <ShoppingBag className="w-6 h-6" />
                  {timeLeft.isExpired ? '모집 마감' : '공동구매 참여하기'}
                </button>

                {isOwner && (
                  <button 
                    onClick={handleDelete}
                    className="w-full py-5 rounded-[1.5rem] font-black text-sm text-red-500 bg-white border-2 border-red-50 hover:bg-red-50 transition-all active:scale-95 tracking-widest"
                  >
                    공동구매 취소하기 (방장 전용)
                  </button>
                )}
                
                <p className="text-center text-[10px] text-slate-300 font-black tracking-widest uppercase opacity-60">
                  {isOwner ? 'Creator Control Panel' : 'Secured by Toss Payments'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
