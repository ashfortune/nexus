'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const userId = searchParams.get('userId');
    const nickname = searchParams.get('nickname');
    const email = searchParams.get('email');
    const profileImage = searchParams.get('profileImage');
    const userType = searchParams.get('userType');

    if (token) {
      // Zustand 스토어 상태 업데이트 (로그인 유지 핵심)
      setAuth({
        id: userId || '',
        nickname: nickname || '',
        email: email || '',
        userType: Number(userType) || 1,
        profileImage: profileImage || ''
      }, token);

      // 로컬 스토리지에 정보 저장 (백업용)
      localStorage.setItem('accessToken', token);
      if (userId) localStorage.setItem('userId', userId);
      if (nickname) localStorage.setItem('nickname', nickname);

      const providerName =
        provider === 'google' ? '구글' : provider === 'kakao' ? '카카오' : '소셜';
      alert(`${providerName} 로그인에 성공했습니다!`);

      // 헤더에 로그인 상태 변경 이벤트 알림 (수정된 Header.tsx 반영)
      window.dispatchEvent(new Event('login-status-change'));

      router.push('/');
      router.refresh();
    } else {
      alert('로그인 정보를 가져오지 못했습니다.');
      window.location.href = '/auth/login';
    }
  }, [router, searchParams]);

  return (
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-zinc-500 font-medium">로그인 처리 중입니다...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-500 font-medium">로그인 처리 중입니다...</p>
          </div>
        }
      >
        <OAuthCallbackContent />
      </Suspense>
    </div>
  );
}