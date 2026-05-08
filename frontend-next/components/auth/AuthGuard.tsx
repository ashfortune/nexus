'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: number[]; // 0: GENERAL, 1: BIZ, 2: ADMIN
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 하이드레이션 완료 전까지는 체크를 유보함
    if (!_hasHydrated) return;

    // 1. 로그인 여부 확인
    if (!isAuthenticated) {
      alert('로그인이 필요한 서비스입니다.');
      router.push('/auth/login');
      return;
    }

    // 2. 권한 확인 (allowedRoles가 설정된 경우)
    if (allowedRoles !== undefined && allowedRoles.length > 0) {
      if (!user || !allowedRoles.includes(user.userType)) {
        alert('해당 페이지에 접근할 권한이 없습니다.');
        router.push('/');
        return;
      }
    }

    setIsAuthorized(true);
  }, [isAuthenticated, user, allowedRoles, router, _hasHydrated]);

  // 권한 확인 중이거나 권한이 없는 경우 아무것도 렌더링하지 않음
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--nexus-bg)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--nexus-primary)]"></div>
      </div>
    );
  }

  return <>{children}</>;
}
