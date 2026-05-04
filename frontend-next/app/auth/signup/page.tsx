"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  User, 
  Briefcase, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Lock, 
  Mail, 
  UserCircle,
  AlertCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import DaumPostcode from "react-daum-postcode";

import { cn } from "@/lib/utils";
import { POLICIES } from "@/constants/policies";

// --- Validation Schemas ---
const signupSchema = z.object({
  email: z.string().email("유효한 이메일 형식이 아닙니다."),
  password: z.string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "특수문자를 최소 하나 포함해야 합니다."),
  confirmPassword: z.string(),
  nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다."),
  address: z.string().min(1, "주소를 입력해주세요."),
  userType: z.number(), // 0: 일반, 1: 사업가
  bizNo: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.userType === 1 && (!data.bizNo || data.bizNo.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "사업자 등록 번호는 필수입니다.",
  path: ["bizNo"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

// --- Main Signup Page Component ---
export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Terms, 2: Type, 3: Form
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [agreedPolicies, setAgreedPolicies] = useState<number[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      userType: 0,
      address: "",
    },
  });

  const watchUserType = watch("userType");
  const watchPassword = watch("password");
  const watchConfirmPassword = watch("confirmPassword");

  const isPasswordMatch = watchPassword && watchConfirmPassword && watchPassword === watchConfirmPassword;
  const isPasswordMismatch = watchPassword && watchConfirmPassword && watchPassword !== watchConfirmPassword;

  // --- Handlers ---
  const handleTogglePolicy = (id: number) => {
    if (agreedPolicies.includes(id)) {
      setAgreedPolicies(agreedPolicies.filter((p) => p !== id));
    } else {
      setAgreedPolicies([...agreedPolicies, id]);
    }
  };

  const handleAllAgree = () => {
    if (agreedPolicies.length === POLICIES.length) {
      setAgreedPolicies([]);
    } else {
      setAgreedPolicies(POLICIES.map((p) => p.id));
    }
  };

  const handleCompleteAddress = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname !== "") extraAddress += data.bname;
      if (data.buildingName !== "") extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }

    setValue("address", fullAddress);
    setIsAddressModalOpen(false);
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          nickname: data.nickname,
          address: data.address,
          userType: data.userType,
          bizNo: data.bizNo,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        alert("회원가입에 성공했습니다! 로그인 페이지로 이동합니다.");
        router.push("/auth/login");
      } else {
        const msg = result.message || "회원가입 도중 오류가 발생했습니다.";
        alert(msg);
      }
    } catch (error: any) {
      alert("서버와 통신 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.");
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 sm:p-12 font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden border border-zinc-100 flex flex-col">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-zinc-100 flex">
          <div 
            className={cn(
              "h-full bg-black transition-all duration-500",
              step === 1 ? "w-1/3" : step === 2 ? "w-2/3" : "w-full"
            )} 
          />
        </div>

        {/* Step Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <h2 className="text-2xl font-bold text-zinc-900">
            {step === 1 && "이용약관 동의"}
            {step === 2 && "회원 유형 선택"}
            {step === 3 && "회원 정보 입력"}
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            {step === 1 && "서비스 이용을 위한 약관에 동의해 주세요."}
            {step === 2 && "본인에게 맞는 회원 유형을 선택해 주세요."}
            {step === 3 && "필수 정보를 입력하여 가입을 완료하세요."}
          </p>
        </div>

        {/* Content Area */}
        <div className="px-8 pb-10 flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
          
          {/* Step 1: Terms Agreement */}
          {step === 1 && (
            <div className="space-y-6">
              <div 
                className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors"
                onClick={handleAllAgree}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  agreedPolicies.length === POLICIES.length ? "bg-black border-black" : "border-zinc-300"
                )}>
                  {agreedPolicies.length === POLICIES.length && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className="font-semibold text-zinc-900">전체 약관에 동의합니다.</span>
              </div>

              <div className="space-y-4">
                {POLICIES.map((policy) => (
                  <div 
                    key={policy.id} 
                    className="p-4 border border-zinc-100 rounded-xl space-y-2 hover:border-zinc-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all",
                          agreedPolicies.includes(policy.id) ? "bg-black border-black" : "border-zinc-300"
                        )}
                        onClick={() => handleTogglePolicy(policy.id)}
                      >
                        {agreedPolicies.includes(policy.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-sm font-medium text-zinc-800">{policy.id}. {policy.title} (필수)</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed pl-8">
                      {policy.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: User Type Selection */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-4 py-8">
              <button
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 transition-all group",
                  selectedType === 0 ? "border-black bg-black text-white shadow-lg" : "border-zinc-100 hover:border-zinc-300 text-zinc-600"
                )}
                onClick={() => {
                  setSelectedType(0);
                  setValue("userType", 0);
                }}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                  selectedType === 0 ? "bg-white/20" : "bg-zinc-100 group-hover:bg-zinc-200"
                )}>
                  <User className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">일반 회원</div>
                  <div className={cn("text-xs mt-1 opacity-70", selectedType === 0 ? "text-zinc-100" : "text-zinc-500")}>
                    창업 정보 탐색 및 커뮤니티 활동을 원하시는 분
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={cn(
                  "flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 transition-all group",
                  selectedType === 1 ? "border-black bg-black text-white shadow-lg" : "border-zinc-100 hover:border-zinc-300 text-zinc-600"
                )}
                onClick={() => {
                  setSelectedType(1);
                  setValue("userType", 1);
                }}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                  selectedType === 1 ? "bg-white/20" : "bg-zinc-100 group-hover:bg-zinc-200"
                )}>
                  <Briefcase className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">사업가 회원</div>
                  <div className={cn("text-xs mt-1 opacity-70", selectedType === 1 ? "text-zinc-100" : "text-zinc-500")}>
                    브랜딩 관리 및 정책/지원금 매칭이 필요하신 분
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 3: Registration Form */}
          {step === 3 && (
            <form id="signup-form" onSubmit={handleSubmit(onSignupSubmit)} className="space-y-5 py-4">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700 ml-1">이메일 (ID)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="example@email.com"
                    className="w-full h-12 pl-11 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700 ml-1">비밀번호</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                    <input
                      {...register("password")}
                      type="password"
                      placeholder="8자 이상 + 특수기호"
                      className="w-full h-12 pl-11 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                    />
                  </div>
                  {errors.password && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700 ml-1 flex justify-between items-center">
                    비밀번호 확인
                    {watchConfirmPassword && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        isPasswordMatch ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {isPasswordMatch ? "일치" : "불일치"}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <CheckCircle2 className={cn(
                      "absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors",
                      isPasswordMatch ? "text-green-500" : isPasswordMismatch ? "text-red-500" : "text-zinc-400"
                    )} />
                    <input
                      {...register("confirmPassword")}
                      type="password"
                      placeholder="비밀번호 재입력"
                      className={cn(
                        "w-full h-12 pl-11 pr-4 bg-zinc-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 transition-all",
                        isPasswordMatch ? "border-green-200" : isPasswordMismatch ? "border-red-200" : "border-zinc-200 focus:border-black"
                      )}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.confirmPassword.message}</p>}
                </div>
              </div>

              {/* Nickname */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700 ml-1">닉네임</label>
                <div className="relative">
                  <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                  <input
                    {...register("nickname")}
                    type="text"
                    placeholder="사용하실 닉네임을 입력하세요"
                    className="w-full h-12 pl-11 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                </div>
                {errors.nickname && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.nickname.message}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-700 ml-1">주소</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                    <input
                      {...register("address")}
                      type="text"
                      readOnly
                      placeholder="주소를 검색해주세요"
                      className="w-full h-12 pl-11 pr-4 bg-zinc-100 border border-zinc-200 rounded-xl cursor-default focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="h-12 px-5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-black transition-colors"
                  >
                    검색
                  </button>
                </div>
                {errors.address && <p className="text-xs text-red-500 mt-1 ml-1">{errors.address.message}</p>}
              </div>

              {/* Business Number (Conditionally visible) */}
              {watchUserType === 1 && (
                <div className="space-y-1.5 p-5 bg-black/[0.02] border border-black/10 rounded-2xl">
                  <label className="text-sm font-bold text-zinc-900 ml-1 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> 사업자 등록 번호
                  </label>
                  <input
                    {...register("bizNo")}
                    type="text"
                    placeholder="000-00-00000"
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      let formatted = val;
                      if (val.length > 3 && val.length <= 5) formatted = val.slice(0, 3) + "-" + val.slice(3);
                      if (val.length > 5) formatted = val.slice(0, 3) + "-" + val.slice(3, 5) + "-" + val.slice(5, 10);
                      e.target.value = formatted;
                      setValue("bizNo", formatted);
                    }}
                    className="w-full h-12 px-4 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                  />
                  <p className="text-[10px] text-zinc-400 ml-1 mt-1">* 하이픈(-)은 자동으로 입력됩니다.</p>
                  {errors.bizNo && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 ml-1"><AlertCircle className="w-3 h-3"/> {errors.bizNo.message}</p>}
                </div>
              )}
            </form>
          )}

        </div>

        {/* Action Buttons */}
        <div className="p-8 bg-zinc-50/50 border-t border-zinc-100 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="h-12 px-6 flex items-center gap-2 text-zinc-500 font-medium hover:text-black transition-colors"
            >
              <ChevronLeft className="w-5 h-5" /> 이전
            </button>
          )}
          <button
            onClick={() => {
              if (step === 1) {
                if (agreedPolicies.length !== POLICIES.length) {
                  alert("모든 필수 이용약관에 동의하셔야 가입이 가능합니다.");
                  return;
                }
                setStep(2);
              } else if (step === 2) {
                if (selectedType === null) {
                  alert("회원 유형을 선택해 주세요.");
                  return;
                }
                setStep(3);
              } else {
                // Form submission is handled by the submit button in step 3
                const form = document.getElementById("signup-form") as HTMLFormElement;
                if (form) form.requestSubmit();
              }
            }}
            className={cn(
              "h-12 flex-1 rounded-xl bg-black text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98]",
              step === 3 && "bg-black hover:bg-black"
            )}
          >
            {step === 3 ? "가입 완료" : "다음 단계"}
            {step < 3 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900">주소 검색</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-zinc-400 hover:text-black">닫기</button>
            </div>
            <div className="h-[450px]">
              <DaumPostcode onComplete={handleCompleteAddress} style={{ height: "100%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d4d4d8;
        }
      `}</style>
    </div>
  );
}
