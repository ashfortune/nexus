'use client';

import AuthGuard from '@/components/auth/AuthGuard';

/**
 * 대시보드 레이아웃
 * - 권한 매트릭스에 따라 사업자(1)와 관리자(2)만 접근 가능하도록 제한합니다.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={[1, 2]}>
      <div className="min-h-screen bg-[var(--nexus-bg)]">
        {children}
      </div>
    </AuthGuard>
  );
}
