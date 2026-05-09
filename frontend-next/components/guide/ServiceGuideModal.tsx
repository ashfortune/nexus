'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, 
  CircleDollarSign, 
  FileCheck, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  X,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  serviceName: string;
  href: string;
  color: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: '아이디어 & 브랜딩',
    description: '창업의 시작은 브랜드의 얼굴을 만드는 것부터입니다. AI를 통해 업종에 맞는 브랜드 네임과 로고를 생성하세요.',
    icon: <Rocket className="w-6 h-6" />,
    serviceName: 'AI 브랜딩 바로가기',
    href: '/branding',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 2,
    title: '자금 계획 수립',
    description: '준비된 아이디어가 현실 가능한지 점검하세요. 위치와 업종에 따른 예상 창업 비용과 수익을 시뮬레이션합니다.',
    icon: <CircleDollarSign className="w-6 h-6" />,
    serviceName: '비용 시뮬레이션 바로가기',
    href: '/simulation',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 3,
    title: '인허가 준비',
    description: '놓치기 쉬운 법적 절차를 확인하세요. 내 업종에 필요한 인허가 서류와 관련 법규를 한눈에 정리해 드립니다.',
    icon: <FileCheck className="w-6 h-6" />,
    serviceName: '인허가 가이드 바로가기',
    href: '/license',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 4,
    title: '운영 및 전문가 매칭',
    description: '적절한 직원 채용 가이드와 법률/세무/인테리어 등 각 분야 전문가를 연결하여 창업 준비를 마무리하세요.',
    icon: <Users className="w-6 h-6" />,
    serviceName: '전문가 매칭 바로가기',
    href: '/expert',
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 5,
    title: '안정 운영 & 네트워킹',
    description: '창업 후에도 함께합니다. 공동구매를 통해 운영비를 절감하고, 커뮤니티에서 대표님들과 노하우를 나누세요.',
    icon: <TrendingUp className="w-6 h-6" />,
    serviceName: '커뮤니티 입장하기',
    href: '/board',
    color: 'from-rose-500 to-pink-600',
  },
];

interface ServiceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceGuideModal({ isOpen, onClose }: ServiceGuideModalProps) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Side: Roadmap Sidebar */}
          <div className="w-full md:w-80 bg-gray-50 border-r border-gray-100 p-6 flex flex-col gap-4">
            <div className="mb-4">
              <h2 className="text-xl font-black text-gray-900 tracking-tighter">SUCCESS ROADMAP</h2>
              <p className="text-sm text-gray-500 font-medium">성공 창업을 위한 5단계 가이드</p>
            </div>

            <div className="flex flex-col gap-2 flex-grow relative">
              {/* Progress Line */}
              <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gray-200" />
              <div 
                className="absolute left-[27px] top-6 w-0.5 bg-blue-500 transition-all duration-500 ease-in-out"
                style={{ height: `${(activeStep / (GUIDE_STEPS.length - 1)) * 88}%` }}
              />

              {GUIDE_STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(index)}
                  className={`relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 text-left group ${
                    activeStep === index 
                      ? 'bg-white shadow-md' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className={`z-10 w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                    activeStep === index 
                      ? 'bg-blue-500 border-blue-100 text-white scale-110' 
                      : index < activeStep
                      ? 'bg-blue-100 border-white text-blue-500'
                      : 'bg-white border-gray-100 text-gray-400'
                  }`}>
                    {index < activeStep ? <CheckCircle2 className="w-6 h-6" /> : step.icon}
                  </div>
                  <div>
                    <div className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${
                      activeStep === index ? 'text-blue-500' : 'text-gray-400'
                    }`}>
                      STEP {step.id}
                    </div>
                    <div className={`text-sm font-black whitespace-nowrap ${
                      activeStep === index ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="mt-4 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
            >
              가이드 종료
            </button>
          </div>

          {/* Right Side: Step Details */}
          <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${GUIDE_STEPS[activeStep].color} flex items-center justify-center text-white shadow-lg`}>
                  {GUIDE_STEPS[activeStep].icon}
                </div>
                
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">
                    {GUIDE_STEPS[activeStep].title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed break-keep">
                    {GUIDE_STEPS[activeStep].description}
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-4">
                  <Link
                    href={GUIDE_STEPS[activeStep].href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-8 py-4 bg-gradient-to-r ${GUIDE_STEPS[activeStep].color} text-white rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all group`}
                  >
                    {GUIDE_STEPS[activeStep].serviceName}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {activeStep < GUIDE_STEPS.length - 1 && (
                    <button
                      onClick={() => setActiveStep(prev => prev + 1)}
                      className="flex items-center gap-2 px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
                    >
                      다음 단계 보기
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Close Button (Absolute) */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900 md:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
