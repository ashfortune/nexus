"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { cn } from "@/lib/utils";
import Link from "next/link";

// --- Validation Schema ---
const loginSchema = z.object({
  email: z.string().email("유효한 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("Login Result:", result);

      if (response.ok && result.status === "success") {
        const data = result.data;
        const accessToken = data.accessToken;
        const nickname = data.nickname;
        const userId = data.userId || data.id; // fallback to 'id' if 'userId' is missing
        
        if (!userId) {
          console.error("User ID is missing in the response:", data);
        }

        // 로컬 스토리지에 토큰 저장
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("nickname", nickname);
        if (userId) localStorage.setItem("userId", userId);
        
        // 헤더에 로그인 상태 변경 이벤트 알림 (수정된 Header.tsx 반영)
        window.dispatchEvent(new Event('login-status-change'));
        
        // 페이지 이동
        router.push("/");
        router.refresh(); // 최신 상태 반영을 위해 권장
      } else {
        // 서버 응답이 에러인 경우 (4xx, 5xx)
        const msg = result.message || "로그인 중 오류가 발생했습니다. 이메일과 비밀번호를 확인해 주세요.";
        setErrorMessage(msg);
      }
    } catch (error: any) {
      // 네트워크 오류 또는 기타 예외 상황
      setErrorMessage("서버와 통신 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.");
    } finally {
      setIsLoading(false);
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
            <h2 className="text-xl font-bold text-zinc-900 mb-6">로그인</h2>

            <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700 ml-1">이메일</label>
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

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-semibold text-zinc-700">비밀번호</label>
                  <Link href="/auth/find-password" title="비밀번호 찾기" className="text-xs text-zinc-400 hover:text-black transition-colors">
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    className={cn(
                      "w-full h-12 pl-12 pr-12 bg-zinc-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all",
                      errors.password ? "border-red-200" : "border-zinc-200 focus:border-black"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1 ml-1">
                    <AlertCircle className="w-3 h-3" /> {errors.password.message}
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
                className="w-full h-13 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-2 shadow-lg shadow-black/5"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    로그인
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 relative text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <span className="relative px-4 bg-white text-zinc-400 text-xs font-medium">SNS 계정으로 로그인</span>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <a
                href={process.env.NEXT_PUBLIC_API_URL + "/oauth2/authorization/google"}
                className="h-12 flex items-center justify-center gap-2 border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-all active:scale-[0.98] group"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                <span className="text-sm font-bold text-zinc-700 group-hover:text-black">Google</span>
              </a>
              <a
                href={process.env.NEXT_PUBLIC_API_URL + "/oauth2/authorization/kakao"}
                className="h-12 flex items-center justify-center gap-2 bg-[#FEE500] rounded-2xl hover:bg-[#FDD835] transition-all active:scale-[0.98] group"
              >
                <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-[#FEE500] font-black">K</span>
                </div>
                <span className="text-sm font-bold text-[#191919]">카카오톡</span>
              </a>
            </div>
          </div>

          <div className="bg-zinc-50/80 p-6 border-t border-zinc-100 text-center">
            <p className="text-sm text-zinc-500">
              아직 회원이 아니신가요?{" "}
              <Link href="/auth/signup" className="text-black font-bold hover:underline underline-offset-4 decoration-2">
                회원가입
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
