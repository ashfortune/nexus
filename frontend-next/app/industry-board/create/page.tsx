"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Send,
  Briefcase,
  ChevronDown,
  User,
  Lock,
  Unlock,
  CheckCircle2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface Category {
  id: string;
  name: string;
}

function IndustryBoardCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/v1/industry-categories/main");
      const result = await response.json();
      if (result.status === "success") {
        setCategories(result.data);
        const urlCategoryId = searchParams.get("categoryId");
        if (urlCategoryId) {
          setSelectedCategoryId(urlCategoryId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 5) {
      alert("이미지는 최대 5장까지 업로드 가능합니다.");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !selectedCategoryId) {
      alert("업종을 포함한 모든 필드를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) {
        alert("로그인이 필요합니다.");
        router.push("/auth/login");
        return;
      }

      let uploadedUrls: string[] = [];

      // 1. Image Upload to Spring Boot
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(file => formData.append("files", file));
        
        const uploadResponse = await api.post("/api/v1/upload/industry", formData);
        const uploadData = await uploadResponse.json();
        if (uploadData.status === "success") {
          uploadedUrls = uploadData.urls;
        }
      }

      // 2. Create Post in Spring Boot
      const response = await api.post("/api/v1/board", {
        title,
        content,
        categoryName: "INDUSTRY",
        industryCategoryId: selectedCategoryId,
        isAnonymous,
        imageUrls: uploadedUrls
      });

      const result = await response.json();
      if (result.status === "success") {
        alert("게시글이 성공적으로 작성되었습니다.");
        router.push("/industry-board");
      } else {
        alert(result.message || "게시글 작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[var(--nexus-primary)] animate-spin" />
        <p className="text-zinc-400 font-black text-[10px] tracking-widest uppercase">Preparing Industry Board</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-black transition-all mb-10 group font-black text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Go Back
        </button>

        <div className="nexus-card bg-white p-8 md:p-14 shadow-2xl shadow-black/5">
          <header className="mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-surface-container)] text-[var(--nexus-primary)] rounded-full text-[10px] font-black uppercase tracking-widest">
              <Briefcase className="w-3.5 h-3.5" />
              Industry Insight
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 leading-tight">업종별 정보 공유</h1>
            <p className="text-zinc-500 font-medium text-lg">사장님의 전문적인 지식과 경험을 나누어 주세요.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Industry Selection - Button Group Style like Region Board */}
            <div className="space-y-6">
              <div className="flex items-center justify-between ml-1">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-[var(--nexus-primary)] rounded-full" />
                  <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Industry Selection</h2>
                </div>
                {!selectedCategoryId && <span className="text-red-500 animate-pulse text-[10px] font-black uppercase tracking-widest">* Required</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={cn(
                      "px-6 py-3 rounded-full font-black text-[13px] transition-all active:scale-95 border-2",
                      selectedCategoryId === cat.id 
                        ? "bg-black border-black text-white shadow-xl shadow-black/20" 
                        : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-white hover:text-black hover:border-zinc-200"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1 h-4 bg-[var(--nexus-primary)] rounded-full" />
                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Post Title</h2>
              </div>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력해 주세요"
                className="w-full h-20 px-8 text-2xl font-black tracking-tighter bg-zinc-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-[var(--nexus-primary)]/10 outline-none transition-all placeholder:text-zinc-300"
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1 h-4 bg-[var(--nexus-primary)] rounded-full" />
                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Media Gallery (Max 5)</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-3xl overflow-hidden group border-2 border-zinc-100">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {previews.length < 5 && (
                  <label className="aspect-square flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 rounded-3xl cursor-pointer hover:bg-zinc-50 hover:border-[var(--nexus-primary)] transition-all group">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-zinc-400 group-hover:text-[var(--nexus-primary)] transition-colors">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Add Photo</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1 h-4 bg-[var(--nexus-primary)] rounded-full" />
                <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Description</h2>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="전문적인 지식이나 궁금한 점을 자유롭게 적어주세요..."
                className="w-full min-h-[400px] p-8 bg-zinc-50 border-2 border-transparent rounded-[2.5rem] focus:bg-white focus:border-[var(--nexus-primary)]/10 outline-none transition-all font-medium text-lg leading-relaxed text-zinc-800 resize-none placeholder:text-zinc-300"
              />
            </div>

            {/* Bottom Actions - Refactored to match other boards */}
            <div className="p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-zinc-50/30 -mx-8 md:-mx-14 -mb-8 md:-mb-14 mt-12 border-t border-zinc-100">
              <div className="flex items-center gap-6">
                <button 
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95",
                    isAnonymous 
                      ? "bg-black text-white shadow-xl shadow-black/20" 
                      : "bg-white text-zinc-400 hover:text-black border border-zinc-100"
                  )}
                >
                  {isAnonymous ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  익명으로 작성
                  {isAnonymous && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--nexus-primary)]" />}
                </button>
                <div className="hidden md:flex items-center gap-2 text-zinc-300">
                  <Info className="w-4 h-4" />
                  <span className="text-[10px] font-bold">작성 가이드라인을 준수해 주세요.</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-4 text-xs font-black text-zinc-400 hover:text-black uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !content.trim() || !selectedCategoryId}
                  className="flex items-center gap-3 bg-[var(--nexus-primary)] text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:translate-y-[-2px] active:scale-95 shadow-2xl shadow-[var(--nexus-primary)]/30 disabled:grayscale disabled:opacity-20"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {isSubmitting ? "Publishing..." : "Post Now"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function IndustryBoardCreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[var(--nexus-primary)] animate-spin" />
        <p className="text-zinc-400 font-black text-[10px] tracking-widest uppercase">Loading...</p>
      </div>
    }>
      <IndustryBoardCreateContent />
    </Suspense>
  );
}
