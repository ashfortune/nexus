"use client";

import { useState, useRef, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL + "/api/v1/ai/branding";

interface Message {
  id: number;
  role: "assistant" | "user";
  content: string;
}

export default function InterviewSection({
  onComplete,
  initialProjectId,
  initialMessages,
  initialKeywords,
  initialIsFinished
}: {
  onComplete: (data: any) => void,
  initialProjectId?: string | null,
  initialMessages?: Message[],
  initialKeywords?: string[],
  initialIsFinished?: boolean
}) {
  const [projectId, setProjectId] = useState<string | null>(initialProjectId || null);
  const [messages, setMessages] = useState<Message[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : [
        {
          id: 1,
          role: "assistant",
          content: "안녕하세요 대표님! 어떤 비즈니스를 준비 중이신가요? 생각하고 계신 산업군이나 핵심 서비스를 간단히 설명해 주세요.",
        },
      ]
  );
  const [inputValue, setInputValue] = useState("");
  const [keywords, setKeywords] = useState<string[]>(initialKeywords || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(initialIsFinished || false); // 인터뷰 완료 상태
  const [isGeneratingBranding, setIsGeneratingBranding] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 컴포넌트 마운트 시 브랜딩 프로젝트 생성
  useEffect(() => {
    if (initialProjectId) return; // 이미 프로젝트가 있으면 생성 건너뜀

    const initProject = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industryId: "550e8400-e29b-41d4-a716-446655440000", // 초기 기본값
            title: "새로운 창업 프로젝트",
            userId: localStorage.getItem("userId")
          }),
        });
        const result = await response.json();
        if (result.success) {
          setProjectId(result.data.projectId);
        }
      } catch (error) {
        console.error("Failed to start branding project:", error);
      }
    };
    initProject();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !projectId || isLoading) return;

    const userContent = inputValue;
    const userMsg: Message = { id: Date.now(), role: "user", content: userContent };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userContent,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMsg: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: result.aiResponse,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsFinished(result.isFinished); // AI가 인터뷰가 충분하다고 판단했는지 저장

        if (result.extractedData?.keywords) {
          setKeywords(result.extractedData.keywords);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
      // 입력창 높이 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // 인터뷰 완료 시 브랜드 추천 목록 생성
  const handleCompleteInterview = async () => {
    if (!projectId || isGeneratingBranding) return;

    setIsGeneratingBranding(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${projectId}/naming`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        // 성공적으로 생성된 3가지 브랜딩 목록을 상위로 전달
        onComplete(result.data);
      } else {
        alert("브랜드 추천 생성 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Naming error:", error);
    } finally {
      setIsGeneratingBranding(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Left: Chat Interface */}
      <div className="flex-1 flex flex-col border border-[var(--nexus-outline-variant)]/30 rounded-[2.5rem] overflow-hidden bg-white shadow-[0_20px_50px_-12px_rgba(7,30,39,0.05)]">
        <div className="px-8 py-5 border-b border-[var(--nexus-outline-variant)]/20 bg-[var(--nexus-surface-low)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? "bg-blue-400 animate-pulse" : "bg-[var(--nexus-tertiary-fixed)] shadow-[0_0_8px_var(--nexus-tertiary-fixed)]"}`}></div>
            <h2 className="font-black text-[var(--nexus-on-bg)] text-xs uppercase tracking-widest">Nexus AI Agent</h2>
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
            {projectId ? `REFERENCE: ${projectId.slice(0, 8)}` : "ANALYZING CONTEXT..."}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 bg-[var(--nexus-bg)]/30"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-6 py-4 rounded-[2rem] text-sm leading-relaxed font-medium shadow-sm transition-all hover:shadow-md ${msg.role === "user"
                  ? "bg-[var(--nexus-primary)] text-white rounded-tr-none"
                  : "bg-white text-[var(--nexus-on-bg)] rounded-tl-none border border-[var(--nexus-outline-variant)]/20"
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-5 py-3 rounded-[1.5rem] border border-[var(--nexus-outline-variant)]/20 flex gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 bg-[var(--nexus-primary)] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[var(--nexus-primary)] rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-[var(--nexus-primary)] rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--nexus-outline-variant)]/20 bg-white">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isFinished ? "추가로 필요한 사항이 있으신가요?" : "비즈니스에 대해 설명해 주세요..."}
              disabled={isLoading || !projectId}
              className="flex-1 border border-[var(--nexus-outline-variant)]/30 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[var(--nexus-primary)]/5 focus:border-[var(--nexus-primary)] transition-all disabled:bg-[var(--nexus-surface-low)] resize-none max-h-32 overflow-y-auto"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !projectId}
              className="bg-[var(--nexus-primary)] text-white px-8 h-[56px] rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[var(--nexus-primary-container)] transition-all shadow-lg shadow-[var(--nexus-primary)]/20 disabled:opacity-50 active:scale-95"
            >
              SEND
            </button>
          </div>
        </div>
      </div>

      {/* Right: Insight Dashboard */}
      <div className="w-full md:w-80 flex flex-col gap-6">
        <div className="flex-1 border border-[var(--nexus-outline-variant)]/30 rounded-[2.5rem] p-8 bg-white shadow-[0_20px_50px_-12px_rgba(7,30,39,0.05)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--nexus-tertiary-fixed)]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

          <div className="mb-10 relative">
            <h3 className="text-xs font-black text-[var(--nexus-on-bg)] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[var(--nexus-primary)] rounded-full" />
              Real-time Insights
            </h3>
            <p className="text-[11px] text-gray-400 font-bold">인공지능이 분석한 핵심 전략 키워드입니다.</p>
          </div>

          <div className="flex-1 overflow-y-auto relative">
            <div className="flex flex-wrap gap-2.5">
              {keywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-[var(--nexus-surface-low)] border border-[var(--nexus-outline-variant)]/20 text-[var(--nexus-primary)] rounded-xl text-[10px] font-black uppercase tracking-wider animate-in zoom-in duration-500 hover:bg-[var(--nexus-primary-container)] hover:text-white transition-all cursor-default"
                >
                  #{kw}
                </span>
              ))}
              {keywords.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 w-full opacity-20">
                  <div className="w-12 h-12 border-2 border-dashed border-gray-400 rounded-xl mb-4" />
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Waiting for input...</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[var(--nexus-outline-variant)]/10">
            <div className="p-6 bg-[var(--nexus-bg)] rounded-[1.5rem] border border-[var(--nexus-outline-variant)]/20 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--nexus-tertiary-fixed)]" />
              <h4 className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-[0.2em]">Strategy Summary</h4>
              <p className="text-xs text-[var(--nexus-on-bg)] leading-relaxed font-bold">
                {isFinished
                  ? "비즈니스 모델 분석이 완료되었습니다. 최적화된 브랜드 정체성을 확인하세요."
                  : keywords.length > 0
                    ? `대표님의 아이디어는 '${keywords[keywords.length - 1]}' 가치를 중심으로 강력한 차별점을 확보하고 있습니다.`
                    : "인터뷰를 진행하면서 브랜딩 전략이 구체화됩니다."
                }
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleCompleteInterview}
          disabled={!isFinished || isGeneratingBranding}
          className={`w-full py-6 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-4 group ${isFinished
            ? "bg-[var(--nexus-secondary)] text-white hover:bg-[var(--nexus-secondary-container)] shadow-[var(--nexus-secondary)]/30 hover:-translate-y-1 active:scale-95"
            : "bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed shadow-none"
            }`}
        >
          {isGeneratingBranding ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Generate Brand Report
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}



