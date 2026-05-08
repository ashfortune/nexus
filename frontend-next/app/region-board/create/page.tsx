"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  CheckCircle2,
  Lock,
  Unlock,
  Loader2,
  Plus,
  Send,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

function BoardCreateContent() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [regionName, setRegionName] = useState<string>("");

  const regions = [
    { id: 'gyeonggi', name: '경기도' },
    { id: 'gangwon', name: '강원도' },
    { id: 'chungbuk', name: '충청북도' },
    { id: 'chungnam', name: '충청남도' },
    { id: 'jeonbuk', name: '전라북도' },
    { id: 'jeonnam', name: '전라남도' },
    { id: 'gyeongbuk', name: '경상북도' },
    { id: 'gyeongnam', name: '경상남도' },
    { id: 'jeju', name: '제주도' }
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImages(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }

    if (!regionName) {
      alert("지역을 선택해 주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) {
        alert("로그인이 필요합니다.");
        router.push("/auth/login");
        return;
      }

      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(file => formData.append("files", file));
        const uploadResponse = await api.post("/api/v1/upload/region", formData);
        const uploadResult = await uploadResponse.json();
        if (uploadResult.status === "success") imageUrls = uploadResult.urls;
      }

      const response = await api.post("/api/v1/board", {
        title,
        content,
        isAnonymous,
        regionName,
        categoryName: "REGION",
        imageUrls
      });

      const result = await response.json();
      if (result.status === "success") {
        alert("지역 게시글이 성공적으로 작성되었습니다.");
        router.push("/region-board?region=" + regionName);
      } else {
        alert(result.message || "작성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] py-12 px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-black transition-all mb-10 group font-black text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Go Back
        </button>

        <header className="mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-surface-container)] text-[var(--nexus-primary)] rounded-full text-[10px] font-black tracking-widest uppercase">
            <Plus className="w-3.5 h-3.5" />
            New Discussion
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 leading-tight">지역 사회와 소통하기</h1>
          <p className="text-zinc-400 font-medium text-lg max-w-xl">사장님의 소중한 경험과 지역 정보를 공유해 주세요. 따뜻한 한마디가 큰 힘이 됩니다.</p>
        </header>

        <div className="nexus-card bg-white overflow-hidden shadow-2xl shadow-black/5">
          <form onSubmit={handleSubmit} className="divide-y divide-zinc-50">
            <div className="p-8 md:p-12 space-y-12">
              {/* Region Selection */}
              <section className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-[var(--nexus-primary)] rounded-full" />
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Location Selection</h2>
                  </div>
                  {!regionName && <span className="text-red-500 animate-pulse text-[10px] font-black uppercase tracking-widest">* Required</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => setRegionName(region.name)}
                      className={cn(
                        "px-6 py-3 rounded-full font-black text-[13px] transition-all active:scale-95",
                        regionName === region.name 
                          ? "bg-black text-white shadow-xl shadow-black/20" 
                          : "nexus-glass text-zinc-500 hover:bg-white hover:text-black hover:border-zinc-300"
                      )}
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* Title Input */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 ml-1">
                  <div className="w-1 h-4 bg-[var(--nexus-primary)] rounded-full" />
                  <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Post Title</h2>
                </div>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력해 주세요"
                  className="w-full text-3xl font-black tracking-tight text-zinc-900 border-b-2 border-transparent focus:border-[var(--nexus-primary)]/10 outline-none pb-4 transition-all placeholder:text-zinc-200"
                />
              </section>

              {/* Image Upload Area */}
              <section className="space-y-6">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-[var(--nexus-primary)] rounded-full" />
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Media Gallery</h2>
                  </div>
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{images.length} / 10 Files</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-3xl overflow-hidden group shadow-lg shadow-black/5 border border-zinc-50">
                      <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white rounded-xl transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 active:scale-90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 10 && (
                    <label className="flex flex-col items-center justify-center aspect-square bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-3xl cursor-pointer hover:bg-white hover:border-[var(--nexus-primary)]/20 transition-all group">
                      <div className="p-4 bg-white rounded-2xl shadow-xl shadow-black/[0.03] mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-[var(--nexus-primary)]" />
                      </div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Add Media</p>
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </section>

              {/* Content Textarea */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 ml-1">
                  <div className="w-1 h-4 bg-[var(--nexus-primary)] rounded-full" />
                  <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Content Body</h2>
                </div>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="사장님들과 공유하고 싶은 소중한 이야기를 들려주세요."
                  className="w-full min-h-[400px] p-8 bg-zinc-50 rounded-[2.5rem] border-2 border-transparent focus:bg-white focus:border-[var(--nexus-primary)]/10 outline-none transition-all font-medium text-lg leading-relaxed text-zinc-800 resize-none"
                />
              </section>
            </div>

            {/* Bottom Actions */}
            <div className="p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-zinc-50/30">
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
                  disabled={isLoading || !title.trim() || !content.trim() || !regionName}
                  className="flex items-center gap-3 bg-[var(--nexus-primary)] text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:translate-y-[-2px] active:scale-95 shadow-2xl shadow-[var(--nexus-primary)]/30 disabled:grayscale disabled:opacity-20"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {isLoading ? "Publishing..." : "Post Now"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BoardCreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--nexus-bg)] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--nexus-primary)] animate-spin" />
      </div>
    }>
      <BoardCreateContent />
    </Suspense>
  );
}
