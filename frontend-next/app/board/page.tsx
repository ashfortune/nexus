"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  MessageSquare,
  Eye,
  Clock,
  User,
  AlertCircle,
  ThumbsUp,
  TrendingUp,
  Hash,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  author: string;
  imageUrls?: string[];
  createdAt: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  regionName?: string;
  categoryName?: string;
}

export default function BoardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'popular'>('all');
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");

  useEffect(() => {
    fetchPosts(currentPage, activeTab, searchQuery, searchType);
  }, [currentPage, activeTab, searchQuery, searchType]);

  const fetchPosts = async (page: number, tab: 'all' | 'popular' = 'all', keyword: string = "", type: string = "all") => {
    setIsLoading(true);
    try {
      const baseUrl = "http://localhost:8080/api/v1/board";
      let url = tab === "popular" ? `${baseUrl}/popular` : baseUrl;
      
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("size", "10");
      if (keyword) {
        params.append("keyword", keyword);
        params.append("type", type);
      }
      const response = await fetch(`${url}?${params.toString()}`);
      const result = await response.json();
      
      if (result.status === "success") {
        setPosts(result.data);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setPosts([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('all');
    setSearchQuery(searchKeyword);
    setCurrentPage(0);
  };

  const handleCreatePost = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.");
      router.push("/auth/login");
      return;
    }
    router.push("/board/create");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleReset = () => {
    setSearchKeyword("");
    setSearchQuery("");
    setSearchType("all");
    setActiveTab("all");
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--nexus-primary-container)] text-[var(--nexus-primary)] rounded-full text-xs font-black tracking-widest uppercase">
              <TrendingUp className="w-4 h-4" />
              Nexus Community
            </div>
            <h1 
              onClick={handleReset}
              className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900 cursor-pointer hover:opacity-70 transition-opacity active:scale-95"
            >
              자유게시판
            </h1>
            <p className="text-zinc-500 font-medium text-lg max-w-2xl">
              넥서스 사용자들과 자유롭게 일상과 창업 정보를 공유하는 소통 공간입니다.
            </p>
          </div>
          
          <button 
            onClick={handleCreatePost}
            className="group flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-black transition-all hover:bg-zinc-800 active:scale-95 shadow-xl shadow-black/10"
          >
            <Plus className="w-6 h-6 transition-transform group-hover:rotate-90" />
            NEW POST
          </button>
        </div>

        {/* Search & Filter Section */}
        <div className="space-y-6 mb-10">
          <form onSubmit={handleSearch} className="relative group">
            <div className="flex gap-3">
              <div className="relative min-w-[120px]">
                <select 
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full h-16 pl-6 pr-10 bg-white border border-zinc-200 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-[var(--nexus-primary)]/5 focus:border-[var(--nexus-primary)]/20 transition-all font-black text-zinc-700 shadow-sm text-sm appearance-none cursor-pointer"
                >
                  <option value="all">전체</option>
                  <option value="title">제목</option>
                  <option value="author">작성자</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="궁금한 내용을 검색해 보세요..."
                  className="w-full h-16 pl-14 pr-6 bg-white border border-zinc-200 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-[var(--nexus-primary)]/5 focus:border-[var(--nexus-primary)]/20 transition-all font-medium text-zinc-900 shadow-sm group-hover:border-zinc-300"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400 group-focus-within:text-[var(--nexus-primary)] transition-colors" />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={handleReset}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 hover:text-black transition-colors bg-zinc-100 px-3 py-1.5 rounded-full uppercase tracking-tighter"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-8 mb-8 px-4 border-b border-zinc-100">
          <button 
            onClick={() => { setActiveTab('all'); setCurrentPage(0); }}
            className={cn(
              "pb-4 text-sm font-black transition-all relative group",
              activeTab === 'all' ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            LATEST POSTS
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-full" />
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('popular'); setCurrentPage(0); }}
            className={cn(
              "pb-4 text-sm font-black transition-all relative group flex items-center gap-2",
              activeTab === 'popular' ? "text-[var(--nexus-primary)]" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            TRENDING
            {activeTab === 'popular' && (
              <>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--nexus-primary)] rounded-full" />
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* Board List Card */}
        <div className="nexus-card bg-white overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="py-6 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-24 text-center">No.</th>
                  <th className="py-6 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Post Title</th>
                  <th className="py-6 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-44 text-center">Author</th>
                  <th className="py-6 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-32 text-center">Date</th>
                  <th className="py-6 px-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-24 text-center">Stats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="py-8 px-6"><div className="h-3 bg-zinc-100 rounded-full w-8 mx-auto" /></td>
                      <td className="py-8 px-6"><div className="h-4 bg-zinc-100 rounded-full w-2/3" /></td>
                      <td className="py-8 px-6"><div className="h-3 bg-zinc-100 rounded-full w-16 mx-auto" /></td>
                      <td className="py-8 px-6"><div className="h-3 bg-zinc-100 rounded-full w-20 mx-auto" /></td>
                      <td className="py-8 px-6"><div className="h-3 bg-zinc-100 rounded-full w-12 mx-auto" /></td>
                    </tr>
                  ))
                ) : posts.length > 0 ? (
                  posts.map((post, index) => (
                    <tr 
                      key={post.id} 
                      className="group hover:bg-zinc-50/80 transition-all cursor-pointer"
                      onClick={() => router.push(`/board/detail/${post.id}`)}
                    >
                      <td className="py-7 px-6 text-center">
                        <span className="text-sm font-black text-zinc-300 group-hover:text-[var(--nexus-primary)] transition-colors">
                          {totalElements - (currentPage * 10 + index)}
                        </span>
                      </td>
                      <td className="py-7 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              {post.likeCount >= 10 && (
                                <span className="bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded-md border border-red-100 font-black flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  POPULAR
                                </span>
                              )}
                              <span className="text-[17px] font-bold text-zinc-800 group-hover:text-black transition-colors truncate">
                                {post.title}
                              </span>
                              {post.commentCount > 0 && (
                                <span className="flex items-center gap-1 text-[var(--nexus-primary)] text-xs font-black bg-[var(--nexus-primary-container)] px-2 py-0.5 rounded-full">
                                  <MessageSquare className="w-3 h-3" />
                                  {post.commentCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-7 px-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-zinc-600 font-black text-sm">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-[var(--nexus-primary)] group-hover:bg-[var(--nexus-primary-container)] transition-colors">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          {post.author}
                        </div>
                      </td>
                      <td className="py-7 px-6 text-center">
                        <span className="text-sm text-zinc-400 font-bold group-hover:text-zinc-600 transition-colors">
                          {formatDate(post.createdAt)}
                        </span>
                      </td>
                      <td className="py-7 px-6 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-black">
                            <Eye className="w-3.5 h-3.5" />
                            {post.viewCount}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--nexus-primary)] font-black">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            {post.likeCount || 0}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-4 text-zinc-300">
                        <div className="p-6 rounded-[2rem] nexus-glass">
                          <AlertCircle className="w-12 h-12 stroke-[1.5]" />
                        </div>
                        <p className="font-black text-lg text-zinc-400">등록된 게시글이 없습니다.</p>
                        <button onClick={handleReset} className="text-[var(--nexus-primary)] font-black text-sm hover:underline">목록 초기화</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Section */}
        <div className="flex items-center justify-center gap-6">
          <button 
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="w-14 h-14 flex items-center justify-center rounded-2xl nexus-glass text-zinc-400 transition-all hover:text-black hover:bg-white hover:border-zinc-300 active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 px-8 h-14 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <span className="text-lg font-black text-zinc-900">{posts.length > 0 ? currentPage + 1 : 0}</span>
            <span className="text-zinc-200 text-xs font-black">/</span>
            <span className="text-lg font-medium text-zinc-400">{posts.length > 0 ? totalPages : 0}</span>
          </div>

          <button 
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="w-14 h-14 flex items-center justify-center rounded-2xl nexus-glass text-zinc-400 transition-all hover:text-black hover:bg-white hover:border-zinc-300 active:scale-95 disabled:opacity-20 disabled:pointer-events-none"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
