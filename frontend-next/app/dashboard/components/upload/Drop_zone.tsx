"use client";

import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle2, FileSpreadsheet } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected?: (files: File[]) => void;
  isLoading?: boolean;
}

/**
 * 매출 내역 CSV 파일을 드래그 앤 드롭으로 업로드하는 컴포넌트입니다.
 */
const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, isLoading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    // CSV 형식 체크 (확장자 기반)
    if (!file.name.endsWith('.csv')) {
      setErrorMsg("CSV 형식만 지원합니다.");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("파일 용량은 10MB 이하이어야 합니다.");
      return;
    }

    setFile(file);
    setErrorMsg(null);
    
    if (onFilesSelected) {
      onFilesSelected([file]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setErrorMsg(null);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative min-h-[320px] flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-2 border-dashed transition-all duration-500 ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]' 
            : 'border-white/10 bg-white/5 hover:border-white/20'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {!file ? (
          <>
            <input
              type="file"
              id="fileInput"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept=".csv"
            />
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 text-indigo-400 transform group-hover:rotate-12 transition-transform">
                <Upload size={32} />
              </div>
              <h4 className="text-2xl font-bold text-white mb-3">CSV 파일을 드래그하거나 클릭</h4>
              <p className="text-white/40 font-medium">매출 데이터 분석을 위해 CSV 파일을 업로드해주세요.</p>
              <div className="mt-6 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Only CSV Supported</p>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
            <div className="relative flex items-center justify-between p-6 rounded-3xl bg-indigo-600/10 border border-indigo-500/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                  <FileSpreadsheet size={28} />
                </div>
                <div>
                  <p className="text-white font-bold truncate max-w-[180px]">{file.name}</p>
                  <p className="text-white/40 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                onClick={clearFile}
                className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-green-400 text-sm font-bold">
              <CheckCircle2 size={18} />
              선택됨: 분석 준비 완료
            </div>
          </div>
        )}
      </div>
      
      {errorMsg && (
        <p className="mt-4 text-red-400 text-sm text-center font-medium animate-bounce">{errorMsg}</p>
      )}
    </div>
  );
};

export default DropZone;
