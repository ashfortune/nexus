"use client";

import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle2, Loader2 } from 'lucide-react';

interface DropZoneProps {
    onUploadComplete?: (data: any) => void;
}

/**
 * 영수증 이미지를 드래그 앤 드롭으로 업로드하는 컴포넌트입니다.
 */
const DropZone: React.FC<DropZoneProps> = ({ onUploadComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
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
        const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            setErrorMsg("PNG, JPG, PDF 형식만 지원합니다.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setErrorMsg("파일 용량은 10MB 이하이어야 합니다.");
            return;
        }

        setFile(file);
        setErrorMsg(null);
        setStatus('idle');

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreview(null);
        setStatus('idle');
        setErrorMsg(null);
    };

    const uploadReceipt = async () => {
        if (!file) return;

        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_FASTAPI_URL + '/api/v1/ai/dashboard/upload-receipt', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('업로드 중 오류가 발생했습니다.');
            }

            const result = await response.json();
            setStatus('success');
            if (onUploadComplete) onUploadComplete(result.data);
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setErrorMsg(err.message || '업로드 실패');
        }
    };

    return (
        <div className="w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative min-h-[300px] flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-300 ${isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
            >
                {!file ? (
                    <>
                        <input
                            type="file"
                            id="fileInput"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            accept=".png,.jpg,.jpeg,.pdf"
                        />
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 text-blue-400">
                                <Upload size={32} />
                            </div>
                            <h4 className="text-xl font-medium text-white mb-2">영수증 파일 드래그 또는 클릭</h4>
                            <p className="text-gray-400 text-sm">PNG, JPG, PDF 지원 (최대 10MB)</p>
                        </div>
                    </>
                ) : (
                    <div className="w-full space-y-4">
                        <div className="relative flex items-center justify-between p-4 rounded-xl bg-white/10 border border-white/20">
                            <div className="flex items-center gap-3">
                                {preview ? (
                                    <img src={preview} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center text-gray-400">
                                        <FileText size={24} />
                                    </div>
                                )}
                                <div>
                                    <p className="text-white font-medium truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={clearFile}
                                className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {status === 'idle' && (
                            <button
                                onClick={uploadReceipt}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                            >
                                영수증 분석 시작
                            </button>
                        )}

                        {status === 'uploading' && (
                            <div className="w-full py-4 rounded-xl bg-white/10 flex items-center justify-center gap-3 text-white font-semibold">
                                <Loader2 className="animate-spin" size={24} />
                                <span>AI가 영수증 분석 중...</span>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="w-full py-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center gap-3 text-green-400 font-semibold">
                                <CheckCircle2 size={24} />
                                <span>분석 완료!</span>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="text-red-400 text-sm text-center font-medium">
                                {errorMsg}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {errorMsg && status === 'idle' && (
                <p className="mt-3 text-red-400 text-sm text-center">{errorMsg}</p>
            )}
        </div>
    );
};

export default DropZone;