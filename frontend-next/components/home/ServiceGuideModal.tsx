'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Paintbrush, 
  MapPin, 
  TrendingUp, 
  ArrowRight,
  CheckCircle2,
  Users,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface ServiceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: <Sparkles className="w-8 h-8 text-[var(--nexus-primary)]" />,
    title: '01. AI 브랜드 빌더',
    subtitle: '전략부터 비주얼까지 한번에',
    desc: 'LLM 기반 인터뷰로 브랜드 DNA를 추출하고, 생성형 AI가 로고부터 마케팅 에셋까지 즉시 생성합니다. 당신의 아이디어가 단 1분 만에 실체화된 브랜드로 탄생합니다.',
    howItHelps: '전문 컨설팅과 디자인 외주에 소요되는 수백만 원의 비용과 시간을 획기적으로 절감합니다.',
    link: '/branding',
    btnText: '브랜드 빌딩 시작하기',
  },
  {
    icon: <MapPin className="w-8 h-8 text-[var(--nexus-tertiary-fixed)]" />,
    title: '02. 정밀 시뮬레이션',
    subtitle: '데이터 기반 리스크 관리',
    desc: '국토교통부의 120만 건 실거래가 데이터와 카카오 맵 API를 연동하여, 선택한 지역의 예상 보증금과 업종별 초기 투자 비용을 소수점 단위까지 정밀하게 산출합니다.',
    howItHelps: '감(感)이 아닌 실제 통계 데이터로 창업 실패 확률을 80% 이상 낮춥니다.',
    link: '/simulation',
    btnText: '시뮬레이션 가기',
  },
  {
    icon: <FileText className="w-8 h-8 text-[var(--nexus-primary-container)]" />,
    title: '03. 스마트 창업 가이드',
    subtitle: '행정 및 노무의 완벽 해결',
    desc: '최신 노동법 RAG 엔진이 근로계약서를 자동 생성하고, 복잡한 영업 신고 절차와 정부 지원 정책을 맞춤형으로 안내합니다. 법적 리스크 없는 안전한 창업을 보장합니다.',
    howItHelps: '복잡한 서류 작업과 법률 검토를 AI 가이드가 대신하여 창업자의 행정 부담을 제로화합니다.',
    link: '/license',
    btnText: '창업 가이드 확인하기',
  },
  {
    icon: <Users className="w-8 h-8 text-[var(--nexus-secondary)]" />,
    title: '04. 상생 커뮤니티',
    subtitle: '현장의 지혜와 공동 구매',
    desc: '지역 및 업종별 인증된 사장님 네트워크를 통해 실전 노하우를 공유하고, 원자재 공동 구매를 통해 운영비를 절감합니다. 검증된 전문가와의 1:1 상담도 지원합니다.',
    howItHelps: '고립된 창업이 아닌, 든든한 사장님 네트워크와 전문가 그룹이 당신의 뒤를 지킵니다.',
    link: '/board',
    btnText: '커뮤니티 입장하기',
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-[var(--nexus-primary)]" />,
    title: '05. 통합 운영 관리',
    subtitle: '데이터로 예측하는 성공',
    desc: '사용자가 직접 업로드한 매출 데이터를 바탕으로 AI가 다음 주 매출을 정밀하게 예측합니다. 과거 매출 추이와 시장 트렌드를 분석하여 효율적인 재고 관리와 인력 배치를 돕습니다.',
    howItHelps: '정확한 매출 예측을 통해 불필요한 지출을 줄이고 매장 운영의 효율성을 극대화할 수 있습니다.',
    link: '/dashboard',
    btnText: '대시보드 바로가기',
  },
];

export default function ServiceGuideModal({ isOpen, onClose }: ServiceGuideModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--nexus-on-bg)]/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-7xl max-h-[90vh] bg-[var(--nexus-bg)] rounded-[40px] shadow-2xl overflow-y-auto border border-white/20 custom-scrollbar"
          >
            {/* Header */}
            <div className="p-8 sm:p-12 flex justify-between items-start">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-surface-container)] rounded-full text-[var(--nexus-primary)] text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 size={12} />
                  Service Journey Guide
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold font-manrope tracking-tight text-[var(--nexus-primary)]">
                  창업의 시작부터 성공까지, <br />
                  <span className="text-[var(--nexus-secondary)] font-black text-6xl">NEXUS Journey</span>
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-white rounded-full hover:bg-[var(--nexus-surface-container)] transition-colors shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            {/* Steps Grid */}
            <div className="px-8 sm:px-12 pb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="nexus-card group p-8 flex flex-col gap-8 hover:bg-white transition-all duration-500 border border-transparent hover:border-[var(--nexus-outline-variant)] hover:shadow-xl"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[var(--nexus-surface-low)] flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      {step.icon}
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-[var(--nexus-primary)] opacity-60 uppercase tracking-tighter italic">
                          {step.title}
                        </div>
                        <h3 className="text-xl font-bold font-manrope">{step.subtitle}</h3>
                      </div>
                      <p className="text-sm opacity-60 leading-relaxed break-keep">
                        {step.desc}
                      </p>
                      
                      {/* 어떻게 도움을 주나요? 섹션 */}
                      <div className="mt-4 p-4 bg-[var(--nexus-surface-low)] rounded-xl border border-[var(--nexus-outline-variant)]/30 group-hover:bg-white transition-colors duration-500">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 size={12} className="text-[var(--nexus-primary)]" />
                          <span className="text-[10px] font-black text-[var(--nexus-primary)] uppercase tracking-widest">How it helps</span>
                        </div>
                        <p className="text-xs font-medium text-[var(--nexus-on-bg)] opacity-80 leading-snug break-keep">
                          {step.howItHelps}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={step.link}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[var(--nexus-primary)] group-hover:translate-x-1 transition-transform"
                    >
                      {step.btnText}
                      <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-[var(--nexus-surface-container)] p-6 text-center">
              <p className="text-sm font-medium opacity-60">
                넥서스는 당신의 꿈이 현실이 될 때까지 24시간 멈추지 않고 분석합니다.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
