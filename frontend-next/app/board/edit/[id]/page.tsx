"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  CheckCircle2,
  Lock,
  Unlock,
  Loader2,
  Save,
  Plus,
  Image as ImageIcon,
  Edit3,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function BoardEditPage() {
  const params = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPostDetail();
    }
  }, [params.id]);

  const fetchPostDetail = async () => {
    try {
      const response = await api.get(`/api/v1/board/${params.id}`);
      const result = await response.json();
      if (result.status === "success") {
        setTitle(result.data.title);
        setContent(result.data.content);
        setIsAnonymous(result.data.author === "익명");
        setImageUrls(result.data.imageUrls || []);
      }
    } catch (error) {
      console.error("Failed to fetch post detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewImages(prev => [...prev, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeExistingImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) {
        alert("로그인이 필요합니다.");
        router.push("/auth/login");
        return;
      }

      let finalImageUrls = [...imageUrls];
      if (newImages.length > 0) {
        const formData = new FormData();
        newImages.forEach(file => formData.append("files", file));
        
        const uploadResponse = await api.post("/api/v1/upload/free", formData);
        const uploadResult = await uploadResponse.json();
        if (uploadResult.status === "success") {
          finalImageUrls = [...finalImageUrls, ...uploadResult.urls];
        }
      }

      const response = await api.put(`/api/v1/board/${params.id}`, {
        title,
        content,
        isAnonymous,
        imageUrls: finalImageUrls,
        regionName: null,
        categoryName: "FREE"
      });

      const result = await response.json();
      if (result.status === "success") {
        router.push(`/board/detail/${params.id}`);
      }
    } catch (error) {
      console.error("Failed to update post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[var(--nexus-primary)] animate-spin" />
        <p className="text-zinc-400 font-black text-[10px] tracking-widest uppercase">Fetching Details</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] py-12 px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        <header className="mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--nexus-tertiary-container)] text-[var(--nexus-tertiary)] text-[10px] font-black uppercase tracking-widest rounded-full">
            <Edit3 className="w-3.5 h-3.5" />
            Revision Mode
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 leading-tight">게시글 수정하기</h1>
          <p className="text-lg text-zinc-400 font-medium max-w-xl">
            작성하신 내용을 다듬어 보세요. 더 정확하고 유익한 정보로 커뮤니티에 기여할 수 있습니다.
          </p>
        </header>

        <div className="nexus-card bg-white overflow-hidden shadow-2xl shadow-black/5">
          <form onSubmit={handleSubmit} className="divide-y divide-zinc-50">
            <div className="p-8 md:p-12 space-y-12">
              {/* Title Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 ml-1">
                  <div className="w-1 h-4 bg-[var(--nexus-tertiary)] rounded-full" />
                  <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Subject Title</h2>
                </div>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-3xl font-black tracking-tight text-zinc-900 border-b-2 border-transparent focus:border-[var(--nexus-tertiary)]/10 outline-none pb-4 transition-all"
                />
              </section>

              {/* Media Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between ml-1">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-[var(--nexus-tertiary)] rounded-full" />
                    <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Media Assets</h2>
                  </div>
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{imageUrls.length + newImages.length} Files</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Existing */}
                  {imageUrls.map((url, index) => (
                    <div key={`ex-${index}`} className="relative aspect-square rounded-3xl overflow-hidden group shadow-lg shadow-black/5 border border-zinc-50">
                      <img 
                        src={url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${url}`} 
                        alt={`Existing ${index}`} 
                        className="w-full h-full object-cover" 
                      />
                      <button 
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white rounded-xl transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 active:scale-90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* New */}
                  {newImagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative aspect-square rounded-3xl overflow-hidden group shadow-lg shadow-black/5 border-2 border-dashed border-[var(--nexus-tertiary)]/20">
                      <img src={preview} alt={`New ${index}`} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Plus className="w-6 h-6 text-[var(--nexus-tertiary)] opacity-30" />
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white rounded-xl transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 active:scale-90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {imageUrls.length + newImages.length < 10 && (
                    <label className="flex flex-col items-center justify-center aspect-square bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-3xl cursor-pointer hover:bg-white hover:border-[var(--nexus-tertiary)]/20 transition-all group">
                      <div className="p-4 bg-white rounded-2xl shadow-xl shadow-black/[0.03] mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-[var(--nexus-tertiary)]" />
                      </div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Add More</p>
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleNewImageChange} />
                    </label>
                  )}
                </div>
              </section>

              {/* Content Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 ml-1">
                  <div className="w-1 h-4 bg-[var(--nexus-tertiary)] rounded-full" />
                  <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Description</h2>
                </div>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[400px] p-8 bg-zinc-50 rounded-[2.5rem] border-2 border-transparent focus:bg-white focus:border-[var(--nexus-tertiary)]/10 outline-none transition-all font-medium text-lg leading-relaxed text-zinc-800 resize-none"
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
                  익명 상태 유지
                  {isAnonymous && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--nexus-tertiary)]" />}
                </button>
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
                  disabled={isSubmitting}
                  className="flex items-center gap-3 bg-black text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:translate-y-[-2px] active:scale-95 shadow-2xl shadow-black/20 disabled:grayscale disabled:opacity-20"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isSubmitting ? "Saving..." : "Commit Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
