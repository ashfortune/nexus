'use client';

import React from 'react';
import { Info, FileSpreadsheet, Calendar, TrendingUp } from 'lucide-react';

interface InfocardProps {
  className?: string;
}

/**
 * 매출 데이터 CSV 업로드 안내 정보를 표시하는 컴포넌트입니다.
 */
const Infocard: React.FC<InfocardProps> = ({ className }) => {
  return (
    <div
      className={`p-6 rounded-3xl nexus-card border border-[var(--nexus-outline-variant)] shadow-xl ${className}`}
    >
      <div className="flex items-center gap-3 mb-6 text-[var(--nexus-primary)]">
        <Info size={24} />
        <h3 className="text-xl font-bold text-[var(--nexus-on-bg)]">매출 데이터 업로드 안내</h3>
      </div>

      <p className="text-[var(--nexus-outline)] text-sm leading-relaxed mb-8">
        AI 분석을 위해 과거 매출 내역이 포함된 CSV 파일을 업로드해주세요. 데이터가 정확할수록 더
        정밀한 예측 결과를 얻을 수 있습니다.
      </p>

      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--nexus-surface-container)] border border-[var(--nexus-outline-variant)]">
          <Calendar className="text-[var(--nexus-primary)] shrink-0" size={20} />
          <div>
            <p className="text-[var(--nexus-on-bg)] font-semibold text-sm">날짜 형식</p>
            <p className="text-[var(--nexus-outline)] text-xs mt-1">YYYY-MM-DD (예: 2024-04-30)</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--nexus-surface-container)] border border-[var(--nexus-outline-variant)]">
          <TrendingUp className="text-[var(--nexus-primary)] shrink-0" size={20} />
          <div>
            <p className="text-[var(--nexus-on-bg)] font-semibold text-sm">매출 데이터</p>
            <p className="text-[var(--nexus-outline)] text-xs mt-1">숫자 형식만 가능 (예: 500000)</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--nexus-surface-container)] border border-[var(--nexus-outline-variant)]">
          <FileSpreadsheet className="text-[var(--nexus-primary)] shrink-0" size={20} />
          <div>
            <p className="text-[var(--nexus-on-bg)] font-semibold text-sm">지원 형식</p>
            <p className="text-[var(--nexus-outline)] text-xs mt-1">CSV 파일 (최대 10MB)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Infocard;
