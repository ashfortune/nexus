"use client";

import Link from "next/link";
import {
  Search,
  LineChart,
  Paintbrush,
  Users,
  MapPin,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  FileText,
  LayoutDashboard,
  TrendingUp,
  Archive,
  Layers,
  CheckCircle2,
  PieChart,
  MessageSquare
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-on-bg)] font-inter selection:bg-[var(--nexus-primary-container)] selection:text-[var(--nexus-on-primary-container)] overflow-x-hidden">

      {/* 01. 히어로 섹션: 비전 영역 */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--nexus-primary)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-12">
          <div className="flex flex-col items-center gap-10">
            <div className="flex items-center gap-3 px-4 py-2 bg-[var(--nexus-surface-container)] rounded-full text-[var(--nexus-primary)] text-[10px] font-black tracking-[0.3em] uppercase">
              <Sparkles size={14} className="animate-pulse" />
              AI 공동 창업자 넥서스 영역
            </div>
            
            <div className="space-y-6">
              <h1 className="font-manrope text-5xl md:text-8xl font-extrabold leading-[1.1] tracking-[-0.04em] text-[var(--nexus-primary)] break-keep">
                아이디어에서 운영까지, <br />
                당신의 <span className="text-[var(--nexus-secondary)]">AI 공동 창업자</span>.
              </h1>
              <div className="w-32 h-1.5 bg-[var(--nexus-tertiary-fixed)] rounded-full mx-auto" />
            </div>

            <p className="text-xl md:text-2xl text-[var(--nexus-on-bg)] opacity-70 leading-[1.6] max-w-3xl font-light">
              LLM과 생성형 AI가 설계하는 올인원 창업 생태계. <br />
              브랜드 구축부터 데이터 기반 상권 분석, 스마트 노무 가이드까지 <br />
              창업의 막막함을 성공의 확신으로 바꿉니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto justify-center">
              <Link href="/branding" className="flex items-center justify-center gap-3 bg-[var(--nexus-primary)] text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-[var(--nexus-primary-container)] transition-all duration-300 shadow-[0_20px_40px_-15px_rgba(11,26,125,0.3)] group">
                브랜딩 시작
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <button className="flex items-center justify-center gap-3 bg-white border border-[var(--nexus-outline-variant)] text-[var(--nexus-primary)] px-10 py-5 rounded-2xl text-xl font-bold hover:bg-[var(--nexus-surface-low)] transition-all duration-300">
                서비스 가이드 영역
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 02. 핵심 모듈: 5대 핵심 기능 영역 */}
      <section className="py-32 bg-[var(--nexus-surface-low)] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-24">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 bg-[var(--nexus-surface-container-high)] rounded-lg text-[var(--nexus-primary)] text-[10px] font-black uppercase tracking-[0.3em]">
                통합 창업 생태계 영역
              </div>
              <h2 className="font-manrope text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
                지능형 엔진이 제공하는 <br />
                <span className="text-[var(--nexus-secondary)]">창업의 모든 도구</span>
              </h2>
            </div>
            <p className="text-xl text-[var(--nexus-on-bg)] opacity-60 max-w-sm font-light leading-relaxed">
              분산된 창업 정보를 하나의 아카이브로 통합하여 <br />
              당신의 성장을 24시간 가이드합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* ① AI 브랜딩 모듈 */}
            <div className="nexus-card p-10 flex flex-col gap-8 min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--nexus-surface-low)] flex items-center justify-center">
                <Paintbrush className="w-8 h-8 text-[var(--nexus-primary)]" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold font-manrope">AI 브랜드 & 비주얼</h3>
                <p className="text-base opacity-60 leading-relaxed">
                  사용자의 사업 철학을 인터뷰하여 브랜드 네이밍부터 로고, 인스타그램 홍보물 시안까지 AI가 자동으로 제작합니다.
                </p>
              </div>
              <div className="mt-auto flex gap-2">
                <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">BI 생성 영역</span>
                <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">로고 디자인 영역</span>
              </div>
            </div>

            {/* ② 창업 시뮬레이션 모듈 */}
            <div className="nexus-card p-10 flex flex-col gap-8 min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--nexus-surface-low)] flex items-center justify-center">
                <MapPin className="w-8 h-8 text-[var(--nexus-secondary)]" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold font-manrope">창업 시뮬레이션</h3>
                <p className="text-base opacity-60 leading-relaxed">
                  국토교통부 실거래 데이터를 분석하여 특정 지역의 예상 보증금, 월세 및 업종별 초기 창업 비용을 정확히 산출합니다.
                </p>
              </div>
              <div className="mt-auto flex gap-2">
                <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">상권 분석 영역</span>
                <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">비용 예측 영역</span>
              </div>
            </div>

            {/* ③ 행정 & 노무 가이드 모듈 */}
            <div className="nexus-card p-10 flex flex-col gap-8 min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--nexus-surface-container)] flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-[var(--nexus-tertiary)]" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold font-manrope">행정 & 스마트 노무</h3>
                <p className="text-base opacity-60 leading-relaxed">
                  업종별 영업신고 절차는 물론, 주휴수당 계산 및 근로계약서 자동 생성 등 스마트한 노무 가이드를 제공합니다.
                </p>
              </div>
              <div className="mt-auto flex gap-2">
                <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">노무 가이드 영역</span>
                <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">지원 정책 영역</span>
              </div>
            </div>

            {/* ④ 커뮤니티 모듈 */}
            <div className="nexus-card p-10 flex flex-col gap-8 min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--nexus-surface-low)] flex items-center justify-center">
                <Users className="w-8 h-8 text-[var(--nexus-primary)]" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold font-manrope">하이퍼 로컬 커뮤니티</h3>
                <p className="text-base opacity-60 leading-relaxed">
                  지역/업종별 인증된 사장님 네트워크를 통해 원자재 공동 구매를 매칭하고 검증된 전문가 1:1 상담을 지원합니다.
                </p>
              </div>
              <div className="mt-auto flex gap-2">
                <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">공동 구매 영역</span>
                <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">전문가 매칭 영역</span>
              </div>
            </div>

            {/* ⑤ 운영 분석 모듈 */}
            <div className="nexus-card p-10 lg:col-span-2 flex flex-col md:flex-row gap-12 min-h-[420px]">
              <div className="flex flex-col gap-8 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-[var(--nexus-surface-low)] flex items-center justify-center">
                  <LayoutDashboard className="w-8 h-8 text-[var(--nexus-on-bg)]" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold font-manrope">통합 운영 분석 대시보드</h3>
                  <p className="text-base opacity-60 leading-relaxed">
                    POS 및 배달 앱 데이터를 연동하여 AI 기반의 주간 매출 예측 및 고객 리뷰 감성 분석 보고서를 매주 월요일 제공합니다.
                  </p>
                </div>
                <div className="mt-auto flex gap-2">
                  <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">매출 예측 데이터</span>
                  <span className="px-3 py-1 rounded-full border border-current text-[10px] font-bold opacity-40">리뷰 분석 정보</span>
                </div>
              </div>
              <div className="flex-1 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col gap-6 justify-center">
                <div className="text-[10px] font-bold opacity-40">대시보드 시각화 데이터 영역</div>
                <div className="h-2 w-[60%] bg-white/20 rounded-full" />
                <div className="h-2 w-[80%] bg-[var(--nexus-tertiary-fixed)] rounded-full" />
                <div className="h-2 w-[40%] bg-white/20 rounded-full" />
                <div className="h-2 w-[70%] bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03. 창업 여정: 창업 여정 스테퍼 영역 */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="font-manrope text-4xl md:text-5xl font-bold tracking-tight">당신의 창업 여정, 넥서스가 설계합니다.</h2>
            <p className="text-lg opacity-60">아이디어 구상부터 안정적 운영까지, 단계별 마스터 플랜 가이드 영역</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-10 left-0 w-full h-[2px] bg-[var(--nexus-outline-variant)] opacity-20 -z-10" />

            {[
              { icon: Sparkles, title: "01. 브랜드 설계 영역", desc: "AI 브랜드 정체성 및 로고 구축" },
              { icon: Search, title: "02. 정밀 분석 영역", desc: "상권 데이터 및 창업 비용 산출" },
              { icon: ShieldCheck, title: "03. 인허가 & 노무 영역", desc: "행정 절차 및 근로계약 완료" },
              { icon: TrendingUp, title: "04. 스마트 운영 영역", desc: "매출 예측 및 대시보드 관리" }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-6 p-8 group">
                <div className="w-20 h-20 bg-white rounded-full border-4 border-[var(--nexus-bg)] shadow-xl flex items-center justify-center text-[var(--nexus-primary)] group-hover:bg-[var(--nexus-primary)] group-hover:text-white transition-all duration-500">
                  <step.icon size={32} />
                </div>
                <div className="space-y-2">
                  <div className="font-manrope font-bold text-xl">{step.title}</div>
                  <p className="text-sm opacity-50">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04. 데이터 신뢰성: 기술 스택 영역 */}
      <section className="py-24 bg-[var(--nexus-primary)] text-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="font-manrope text-4xl md:text-5xl font-bold leading-tight">
              감(感)이 아닌 <br /> <span className="text-[var(--nexus-tertiary-fixed)]">데이터의 힘</span>으로.
            </h2>
            <p className="text-xl opacity-70 font-light leading-relaxed">
              국토교통부 실거래 데이터, 법령 RAG 엔진, 시계열 예측 모델 등
              넥서스만의 기술 아카이브가 당신의 창업 리스크를 최소화합니다.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="text-3xl font-black font-manrope">누적 데이터 영역</div>
                <div className="text-xs font-bold uppercase opacity-50">실거래가 데이터 연동 상태</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-black font-manrope">기술 명칭 영역</div>
                <div className="text-xs font-bold uppercase opacity-50">지능형 법령 검색 엔진</div>
              </div>
            </div>
          </div>
          <div className="nexus-glass bg-white/10 p-10 rounded-[40px] border border-white/20">
            <div className="space-y-6">
              {[
                { label: "실거래 데이터 연동 상태 영역", status: "활성 상태" },
                { label: "법령 검색 엔진 가동 영역", status: "안정 상태" },
                { label: "매출 예측 모델 준비 영역", status: "준비 상태" },
                { label: "이미지 생성 파이프라인 영역", status: "활성 상태" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[var(--nexus-tertiary-fixed)]" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-black opacity-40">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 최종 CTA 영역 */}
      <section className="py-48 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="font-manrope text-5xl md:text-7xl font-extrabold tracking-tight text-[var(--nexus-primary)]">
            당신의 AI 공동 창업자, <br /> 지금 넥서스에서 만나보세요.
          </h2>
          <p className="text-xl opacity-60 max-w-2xl mx-auto">
            막연한 창업 준비는 이제 끝났습니다. <br />
            데이터와 지능형 에이전트가 함께하는 스마트한 창업을 시작하세요.
          </p>
          <div className="flex justify-center">
            <button className="px-16 py-6 bg-[var(--nexus-primary)] text-white rounded-2xl text-2xl font-black hover:scale-105 transition-all shadow-2xl">
              서비스 시작하기 영역
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
