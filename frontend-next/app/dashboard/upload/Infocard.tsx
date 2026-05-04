"use client";

import React from 'react';
import { Info } from 'lucide-react';

interface InfocardProps {
    className?: string;
}

/**
 * 영수증 업로드 안내 정보를 표시하는 컴포넌트입니다.
 */
const Infocard: React.FC<InfocardProps> = ({ className }) => {
    return (
        <div className={`p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl ${className}`}>
            <div className="flex items-center gap-3 mb-4 text-blue-400">
                <Info size={24} />
                <h3 className="text-xl font-semibold text-white">업로드 안내</h3>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-4">
                정확한 데이터 추출을 위해 영수증 이미지를 선명하게 촬영하여 업로드해주세요.
                AI 모델이 품목명, 단가, 수량을 자동으로 인식하여 분석합니다.
            </p>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-gray-400 text-xs">지원 형식</span>
                    <span className="text-white font-medium text-sm">PNG, JPG, PDF</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-gray-400 text-xs">최대 용량</span>
                    <span className="text-white font-medium text-sm">10MB</span>
                </div>
            </div>
        </div>
    );
};

export default Infocard;