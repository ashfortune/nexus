'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ChevronLeft } from 'lucide-react';

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] flex items-center justify-center p-8">
      <div className="max-w-md w-full nexus-card p-12 shadow-2xl text-center space-y-10 border-2 border-white">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-[var(--nexus-primary)] tracking-tight">결제에 실패했습니다</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            {message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          {code && (
            <div className="inline-block px-5 py-2 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">에러 코드: {code}</p>
            </div>
          )}
        </div>

        <div className="pt-6 space-y-4">
          <button 
            onClick={() => window.history.back()}
            className="w-full py-6 bg-[var(--nexus-primary)] text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-indigo-900/20 hover:bg-[#081363] active:scale-95 transition-all tracking-widest"
          >
            다시 시도하기
          </button>
          <button 
            onClick={() => router.push('/group-purchases')}
            className="w-full py-5 bg-white border-2 border-slate-50 text-slate-400 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> 목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
