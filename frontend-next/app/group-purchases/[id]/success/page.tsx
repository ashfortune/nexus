'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const confirmParticipation = async () => {
      const userId = localStorage.getItem('userId') || 'd38bc69d-9660-4e11-a50d-9ee90ff38673';
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/group-purchases/${params.id}/confirm-payment?userId=${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey: paymentKey,
            orderId: orderId,
            amount: Number(amount)
          }),
        });

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error confirming participation:', error);
        setStatus('error');
      }
    };

    if (orderId && paymentKey) {
      confirmParticipation();
    }
  }, [params.id, orderId, paymentKey]);

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full nexus-card p-16 shadow-2xl text-center space-y-12 border-2 border-white">
        {status === 'loading' && (
          <div className="space-y-8 py-10">
            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-[var(--nexus-primary)] mx-auto"></div>
            <div className="space-y-3">
              <h1 className="text-2xl font-black text-[var(--nexus-primary)] uppercase tracking-tighter">결제 확인 중...</h1>
              <p className="text-slate-400 font-bold tracking-widest text-[10px] uppercase">잠시만 기다려 주세요.</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--nexus-primary)] blur-3xl opacity-10 rounded-full animate-pulse"></div>
              <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl border border-slate-50">
                <span className="text-6xl">✨</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <span className="text-[var(--nexus-primary)] font-black tracking-[0.4em] text-[10px] uppercase block opacity-50">Payment Confirmed</span>
              <h1 className="text-4xl font-black text-[var(--nexus-primary)] tracking-tight">
                참여 <span className="opacity-30">성공!</span>
              </h1>
            </div>

            <div className="bg-[var(--nexus-bg)] rounded-[2.5rem] p-8 space-y-4 border border-white shadow-inner">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">주문 번호</span>
                <span className="text-slate-600 font-black text-sm">{orderId?.slice(0, 15)}...</span>
              </div>
              <div className="h-px bg-white/60"></div>
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">결제 금액</span>
                <span className="text-[var(--nexus-primary)] font-black text-xl">{Number(amount).toLocaleString()} 원</span>
              </div>
            </div>

            <p className="text-slate-400 font-medium text-sm leading-relaxed">
              함께해주셔서 감사합니다.<br/>
              <span className="text-[var(--nexus-primary)] font-black">목표 인원이 달성되면</span> 가장 먼저 알려드릴게요.
            </p>

            <button 
              onClick={() => router.push('/group-purchases')}
              className="w-full py-6 bg-[var(--nexus-primary)] text-white rounded-[1.5rem] font-black text-lg transition-all shadow-2xl shadow-indigo-900/20 hover:bg-[#081363] active:scale-95 tracking-widest"
            >
              목록으로 돌아가기
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <span className="text-6xl">⚠️</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-red-500 tracking-tight">처리 오류</h1>
              <p className="text-slate-500 font-medium leading-relaxed px-4">
                결제는 완료되었으나 참여 정보 저장 중 오류가 발생했습니다.<br/>
                <span className="font-black text-slate-800 underline decoration-red-200">고객센터로 즉시 문의해 주세요.</span>
              </p>
            </div>
            <button 
              onClick={() => router.push('/group-purchases')}
              className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-sm transition-all tracking-widest"
            >
              목록으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
