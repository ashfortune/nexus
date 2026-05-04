"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  Key,
  Copy,
  CheckCircle2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { cn } from "@/lib/utils";
import Link from "next/link";

// --- Validation Schema ---
const findPasswordSchema = z.object({
  email: z.string().email("유효한 이메일 형식이 아닙니다."),
});

type FindPasswordFormValues = z.infer<typeof findPasswordSchema>;

export default function FindPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FindPasswordFormValues>({
    resolver: zodResolver(findPasswordSchema),
  });

  const onSubmit = async (data: FindPasswordFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/v1/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        setTempPassword(result.data.temporaryPassword);
      } else {
        const msg = result.message || "비밀번호 재설정 중 오류가 발생했습니다. 이메일을 다시 확인해 주세요.";
        setErrorMessage(msg);
      }
    } catch (error: any) {
      setErrorMessage("서버와 통신 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Logo/Name */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter text-black mb-2">NEXUS</h1>
          <p className="text-zinc-500 text-sm font-medium">비즈니스의 시작, 넥서스와 함께하세요</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-zinc-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Link href="/auth/login" className="p-2 hover:bg-zinc-50 rounded-full transition-colors text-zinc-400 hover:text-black">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h2 className="text-xl font-bold text-zinc-900">비밀번호 찾기</h2>
            </div>

            {!tempPassword ? (
              <>
                <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
                  가입하신 이메일 주소를 입력하시면<br />
                  로그인에 필요한 <strong>임시 비밀번호</strong>를 발급해 드립니다.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">이메일 주소</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="example@email.com"
                        className={cn(
                          "w-full h-12 pl-12 pr-4 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all",
                          errors.email ? "border-red-200" : "border-zinc-200 focus:border-black"
                        )}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1 ml-1">
                        <AlertCircle className="w-3 h-3" /> {errors.email.message}
                      </p>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-13 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-black/5"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        임시 비밀번호 발급
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">임시 비밀번호 발급 완료</h3>
                    <p className="text-sm text-zinc-500 mt-1">아래의 비밀번호로 로그인해 주세요.</p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="w-full h-16 pl-12 pr-12 flex items-center bg-zinc-50 border border-zinc-200 rounded-2xl text-xl font-mono font-bold tracking-wider text-black">
                    {tempPassword}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-white rounded-xl transition-all text-zinc-400 hover:text-black border border-transparent hover:border-zinc-100 shadow-sm"
                    title="비밀번호 복사"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <span className="font-bold">주의:</span> 발급된 비밀번호는 보안을 위해 로그인 후 즉시 회원정보 수정 페이지에서 변경하시는 것을 권장합니다.
                  </p>
                </div>

                <Link
                  href="/auth/login"
                  className="w-full h-13 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-black/5"
                >
                  로그인하러 가기
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>

          <div className="bg-zinc-50/80 p-6 border-t border-zinc-100 text-center">
            <p className="text-sm text-zinc-500">
              도움이 필요하신가요?{" "}
              <Link href="/support" className="text-zinc-900 font-semibold hover:underline">
                고객센터 문의
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center mt-8 text-xs text-zinc-400">
          © 2026 NEXUS Team. All rights reserved.
        </p>
      </div>
    </div>
  );
}
