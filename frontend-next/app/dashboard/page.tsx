'use client';

import Link from 'next/link';
import { LineChart, Database, LayoutDashboard } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardPage() {
  return (
    <AuthGuard allowedRoles={[1, 2]}>
      <div className="min-h-screen p-8 animate-in fade-in duration-700 text-[var(--nexus-on-bg)]">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] rounded-2xl shadow-lg">
                <LayoutDashboard size={24} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">대시보드 홈</h1>
            </div>
            <p className="mt-4 text-[var(--nexus-outline)] max-w-2xl text-lg">
              Nexus 통합 대시보드 메인 화면입니다. 분석 데이터 업로드 및 AI 기반 매출 예측 등 주요 서비스를 이용하실 수 있습니다.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 데이터 업로드 카드 */}
            <Link href="/dashboard/upload" className="block">
              <div className="nexus-card p-6 shadow-md border border-[var(--nexus-outline-variant)] hover:shadow-xl hover:-translate-y-1 transition-all group h-full cursor-pointer">
                <div className="p-3 bg-[var(--nexus-surface-container)] rounded-xl inline-block mb-4 group-hover:bg-[var(--nexus-secondary-container)] transition-colors">
                  <Database size={24} className="text-[var(--nexus-primary)]" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--nexus-secondary)] transition-colors">데이터 업로드</h3>
                <p className="text-sm text-[var(--nexus-outline)] mb-6">
                  분석의 기준이 될 과거 매출 데이터(CSV)를 시스템에 적재합니다.
                </p>
                <div className="flex items-center text-sm font-semibold text-[var(--nexus-primary)] group-hover:text-[var(--nexus-secondary)] transition-colors">
                  업로드 페이지 이동 &rarr;
                </div>
              </div>
            </Link>
            
            {/* 예측 및 분석 카드 */}
            <Link href="/dashboard/predict" className="block">
              <div className="nexus-card p-6 shadow-md border border-[var(--nexus-outline-variant)] hover:shadow-xl hover:-translate-y-1 transition-all group h-full cursor-pointer">
                <div className="p-3 bg-[var(--nexus-surface-container)] rounded-xl inline-block mb-4 group-hover:bg-[var(--nexus-secondary-container)] transition-colors">
                  <LineChart size={24} className="text-[var(--nexus-primary)]" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--nexus-secondary)] transition-colors">매출 예측 및 분석</h3>
                <p className="text-sm text-[var(--nexus-outline)] mb-6">
                  데이터베이스에 적재된 매출 기록을 기반으로 AI 예측 리포트를 확인합니다.
                </p>
                <div className="flex items-center text-sm font-semibold text-[var(--nexus-primary)] group-hover:text-[var(--nexus-secondary)] transition-colors">
                  리포트 확인하기 &rarr;
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
