"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Clock, 
  Eye, 
  MessageSquare,
  ThumbsUp,
  Share2,
  Loader2,
  AlertCircle,
  ChevronDown,
  Info,
  ChevronLeft,
  ChevronRight,
  Plus,
  CornerDownRight,
  Trash2,
  Edit2,
  Send,
  MoreVertical,
  Flag,
  Lock,
  Unlock,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Post {
  id: string;
  title: string;
  author: string;
  authorId: string;
  imageUrls?: string[];
  createdAt: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  categoryName?: string;
}

interface PostDetail extends Post {
  content: string;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  reportCount: number;
  children: Comment[];
}

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const lastFetchedId = React.useRef<string | null>(null);

  useEffect(() => {
    if (params.id) {
      if (lastFetchedId.current !== params.id) {
        lastFetchedId.current = params.id as string;
        fetchPostDetail(params.id as string);
        fetchComments(params.id as string);
        fetchLikeStatus(params.id as string);
      }
      fetchPosts(currentPage);
    }
  }, [params.id, currentPage]);

  const fetchPostDetail = async (id: string, silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await api.get(`/api/v1/board/${id}${silent ? "?silent=true" : ""}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const result = await response.json();
      
      if (result.status === "success") {
        setPost(result.data);
        setEditTitle(result.data.title);
        setEditContent(result.data.content);
      }
    } catch (error) {
      console.error("Failed to fetch post detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPosts = async (page: number) => {
    try {
      const response = await api.get(`/api/v1/board`, { params: { page: String(page), size: "10" } });
      const result = await response.json();
      if (result.status === "success") {
        setPosts(result.data);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const fetchComments = async (id: string = params.id as string) => {
    try {
      const response = await api.get(`/api/v1/comments/${id}`);
      if (!response.ok) return;
      const result = await response.json();
      if (result.status === "success") {
        setComments(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };
  
  const fetchLikeStatus = async (id: string) => {
    try {
      const response = await api.get(`/api/v1/board/like/${id}/status`);
      if (!response.ok) return;
      const result = await response.json();
      if (result.status === "success") setIsLiked(result.isLiked);
    } catch (error) {
      console.error("Failed to fetch like status:", error);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/auth/login");
      return;
    }
    if (isLikeLoading) return;
    setIsLikeLoading(true);
    try {
      const response = await api.post(`/api/v1/board/like/${params.id}`);
      const result = await response.json();
      if (result.status === "success") {
        setIsLiked(result.isLiked);
        fetchPostDetail(params.id as string, true);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleCommentSubmit = async (parentId: string | null = null) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      router.push("/auth/login");
      return;
    }
    const content = parentId ? replyContent : commentContent;
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await api.post(`/api/v1/comments/${params.id}`, { content, parentId });
      const result = await response.json();
      if (result.status === "success") {
        setCommentContent("");
        setReplyContent("");
        setReplyTargetId(null);
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;
    try {
      const response = await api.put(`/api/v1/comments/${commentId}`, { content: editCommentContent });
      const result = await response.json();
      if (result.status === "success") {
        setEditingCommentId(null);
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("정말 댓글을 삭제하시겠습니까?")) return;
    try {
      const response = await api.delete(`/api/v1/comments/${commentId}`);
      const result = await response.json();
      if (result.status === "success") fetchComments();
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!confirm("이 댓글을 신고하시겠습니까?")) return;
    try {
      const response = await api.post(`/api/v1/comments/report/${commentId}`);
      const result = await response.json();
      if (result.status === "success") alert("신고가 접수되었습니다.");
    } catch (error) {
      console.error("Failed to report comment:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("정말 게시글을 삭제하시겠습니까?")) return;
    try {
      const response = await api.delete(`/api/v1/board/${params.id}`);
      if (response.ok) {
        alert("게시글이 삭제되었습니다.");
        router.push("/board");
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleUpdatePost = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await api.put(`/api/v1/board/${params.id}`, {
        title: editTitle,
        content: editContent,
        categoryName: "FREE",
        isAnonymous: post?.author === "익명",
        imageUrls: post?.imageUrls
      });
      const result = await response.json();
      if (result.status === "success") {
        setPost(result.data);
        setIsEditing(false);
      }
    } catch (error) {
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[var(--nexus-primary)] animate-spin" />
        <p className="text-zinc-400 font-black text-[10px] tracking-widest uppercase">Initializing Content</p>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] py-12 px-6 pb-32">
      <div className="max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-10">
          <button 
            onClick={() => router.push("/board")}
            className="flex items-center gap-2 text-zinc-500 hover:text-black transition-all group font-black text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Back to Community
          </button>
          
          <div className="flex items-center gap-3">
            <button className="nexus-glass p-3 rounded-2xl text-zinc-400 hover:text-black transition-all active:scale-90">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="nexus-glass p-3 rounded-2xl text-zinc-400 hover:text-black transition-all active:scale-90">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Post Container */}
        <article className="nexus-card bg-white overflow-hidden shadow-2xl shadow-black/5 mb-14">
          <div className="p-8 md:p-14">
            <header className="mb-14 pb-14 border-b border-zinc-50">
              <div className="flex items-center gap-3 mb-8">
                <span className="px-3 py-1 bg-[var(--nexus-primary-container)] text-[var(--nexus-primary)] text-[10px] font-black uppercase tracking-widest rounded-full">
                  {post.categoryName || "Community"}
                </span>
                <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">General Feed</span>
              </div>

              {isEditing ? (
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 border-b-2 border-zinc-100 focus:border-[var(--nexus-primary)] outline-none pb-4 transition-colors mb-8"
                />
              ) : (
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 leading-[1.1] mb-8">
                  {post.title}
                </h1>
              )}

              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-50 group-hover:bg-[var(--nexus-primary-container)] transition-colors">
                    <User className="w-6 h-6 text-[var(--nexus-primary)]" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-zinc-900">{post.author}</div>
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(post.createdAt)}
                      </div>
                      <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {post.viewCount} views
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleLike}
                    className={cn(
                      "flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl",
                      isLiked 
                        ? "bg-black text-white shadow-black/20" 
                        : "nexus-glass text-zinc-500 hover:bg-zinc-50"
                    )}
                  >
                    <ThumbsUp className={cn("w-5 h-5", isLiked && "fill-white")} />
                    {isLiked ? "LIKED" : "LIKE"}
                    <span className={cn("ml-1 opacity-50", isLiked ? "text-white" : "text-zinc-400")}>{post.likeCount}</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Content Body */}
            <div className="prose prose-zinc max-w-none">
              {isEditing ? (
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[400px] p-8 bg-zinc-50 rounded-[2.5rem] border-2 border-zinc-50 focus:bg-white focus:border-[var(--nexus-primary)]/10 outline-none transition-all font-medium text-lg leading-relaxed text-zinc-800 resize-none"
                />
              ) : (
                <div className="text-xl font-medium leading-[1.8] text-zinc-700 whitespace-pre-wrap mb-16">
                  {post.content}
                </div>
              )}

              {!isEditing && post.imageUrls && post.imageUrls.length > 0 && (
                <div className="space-y-8 mb-16">
                  {post.imageUrls.map((url, idx) => (
                    <div key={idx} className="rounded-[3rem] overflow-hidden shadow-2xl shadow-black/5 ring-8 ring-zinc-50">
                      <img 
                        src={url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${url}`} 
                        alt={`Post ${idx}`} 
                        className="w-full h-auto object-cover" 
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-10 border-t border-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-zinc-300" />
                <p className="text-xs font-bold text-zinc-400">서로를 배려하는 따뜻한 댓글 문화를 만들어주세요.</p>
              </div>

              {typeof window !== "undefined" && post.authorId && localStorage.getItem("userId")?.toLowerCase() === post.authorId.toLowerCase() && (
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <button onClick={() => setIsEditing(false)} className="px-6 py-3 font-black text-sm text-zinc-400 hover:text-black">CANCEL</button>
                      <button 
                        onClick={handleUpdatePost}
                        disabled={isSubmitting}
                        className="px-10 py-4 bg-black text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl shadow-black/20"
                      >
                        {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="p-4 rounded-2xl nexus-glass text-zinc-400 hover:text-black transition-all hover:bg-white active:scale-90"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleDeletePost}
                        className="p-4 rounded-2xl nexus-glass text-zinc-400 hover:text-red-500 transition-all hover:bg-white active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Comment Section */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-10 ml-4">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-xl shadow-black/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 leading-none mb-1.5">REPLIES</h2>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{comments.length} total discussions</p>
            </div>
          </div>

          <div className="nexus-card bg-white p-6 md:p-10 mb-10 shadow-2xl shadow-black/5">
            <div className="relative group">
              <textarea 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="어떤 생각을 가지고 계신가요? 사장님의 의견을 들려주세요."
                className="w-full min-h-[160px] p-8 bg-zinc-50 rounded-[2.5rem] border-2 border-transparent focus:bg-white focus:border-[var(--nexus-primary)]/10 outline-none transition-all font-medium text-lg leading-relaxed text-zinc-800 resize-none"
              />
              <button 
                onClick={() => handleCommentSubmit()}
                disabled={isSubmitting || !commentContent.trim()}
                className="absolute right-6 bottom-6 flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-20 disabled:grayscale"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                POST COMMENT
              </button>
            </div>
          </div>

          <div className="nexus-card bg-white overflow-hidden shadow-2xl shadow-black/5">
            <div className="divide-y divide-zinc-50">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem 
                    key={comment.id}
                    comment={comment}
                    onReport={handleReportComment}
                    onReply={setReplyTargetId}
                    replyTargetId={replyTargetId}
                    replyContent={replyContent}
                    onReplyContentChange={setReplyContent}
                    onReplySubmit={handleCommentSubmit}
                    onDelete={handleDeleteComment}
                    isSubmitting={isSubmitting}
                    formatDate={formatDate}
                    editingCommentId={editingCommentId}
                    onSetEditingCommentId={setEditingCommentId}
                    editCommentContent={editCommentContent}
                    onSetEditCommentContent={setEditCommentContent}
                    onUpdate={handleUpdateComment}
                  />
                ))
              ) : (
                <div className="p-20 text-center bg-zinc-50/30">
                  <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-black/[0.03] mx-auto mb-6 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-zinc-200" />
                  </div>
                  <p className="text-zinc-400 font-black text-sm tracking-tighter italic">가장 먼저 대화를 시작해 보세요!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Other Posts List */}
        <section className="space-y-10">
          <div className="flex items-center justify-between ml-4">
            <h3 className="text-2xl font-black text-zinc-900 tracking-tighter">MORE DISCUSSIONS</h3>
            <button 
              onClick={() => router.push("/board")}
              className="text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-[0.2em] transition-colors"
            >
              View Full List
            </button>
          </div>

          <div className="nexus-card bg-white overflow-hidden shadow-2xl shadow-black/5">
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
                {posts.map((p, index) => (
                  <tr 
                    key={p.id} 
                    onClick={() => {
                      if (p.id !== post.id) {
                        router.push(`/board/detail/${p.id}`);
                      }
                    }}
                    className={cn(
                      "group hover:bg-zinc-50 transition-all cursor-pointer",
                      p.id === post.id ? "bg-zinc-50/80" : ""
                    )}
                  >
                    <td className="py-5 px-6 text-center">
                      <span className={cn(
                        "text-xs font-black",
                        p.id === post.id ? "text-[var(--nexus-primary)]" : "text-zinc-300 group-hover:text-zinc-500"
                      )}>
                        {totalElements - (currentPage * 10 + index)}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-sm font-bold truncate max-w-md",
                          p.id === post.id ? "text-[var(--nexus-primary)]" : "text-zinc-600 group-hover:text-black"
                        )}>
                          {p.title}
                          {p.commentCount > 0 && (
                            <span className="ml-2 text-[10px] font-black opacity-50">[{p.commentCount}]</span>
                          )}
                        </span>
                        {p.id === post.id && (
                          <span className="px-2 py-0.5 bg-[var(--nexus-primary)] text-white text-[8px] font-black uppercase rounded-full">Reading</span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center text-xs font-black text-zinc-400 group-hover:text-zinc-600">{p.author}</td>
                    <td className="py-5 px-6 text-center text-xs font-black text-zinc-300 group-hover:text-zinc-500">{formatDate(p.createdAt).split(' ')[0]}</td>
                    <td className="py-5 px-6 text-center text-xs font-black text-zinc-300 group-hover:text-zinc-500">{p.viewCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="w-12 h-12 flex items-center justify-center nexus-glass rounded-2xl text-zinc-400 hover:text-black hover:bg-white transition-all disabled:opacity-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-6 h-12 bg-white border border-zinc-100 rounded-2xl shadow-sm">
              <span className="text-sm font-black text-zinc-900">{posts.length > 0 ? currentPage + 1 : 0}</span>
              <span className="text-zinc-200 text-xs font-black">/</span>
              <span className="text-sm font-medium text-zinc-400">{posts.length > 0 ? totalPages : 0}</span>
            </div>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="w-12 h-12 flex items-center justify-center nexus-glass rounded-2xl text-zinc-400 hover:text-black hover:bg-white transition-all disabled:opacity-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function CommentItem({ 
  comment, 
  onReport, 
  onReply, 
  replyTargetId, 
  replyContent, 
  onReplyContentChange, 
  onReplySubmit, 
  onDelete, 
  isSubmitting,
  formatDate,
  isChild = false,
  editingCommentId,
  onSetEditingCommentId,
  editCommentContent,
  onSetEditCommentContent,
  onUpdate
}: any) {
  const isDeleted = comment.content === "삭제된 댓글입니다.";
  const myUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const isMine = comment.authorId?.toLowerCase() === myUserId?.toLowerCase();

  return (
    <div className={cn(
      "transition-all",
      isChild ? "mt-3" : "bg-white overflow-hidden"
    )}>
      <div className={cn(
        "relative p-6 md:p-10 transition-all",
        isChild ? "bg-zinc-50/50 rounded-[2rem] border border-zinc-100/50 mx-6 md:mx-10 mb-4" : "",
        comment.reportCount > 0 && "bg-red-50/50 border-red-100 ring-1 ring-red-100"
      )}>
        {/* Reported Status Header */}
        {comment.reportCount > 0 && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-red-50 border border-red-100 rounded-xl w-fit">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
              신고가 {comment.reportCount}회 누적된 댓글입니다
            </span>
          </div>
        )}

        {/* Connector Line - Adjusted for integrated layout */}
        {isChild && (
          <div className="absolute -left-3 md:-left-5 top-0 bottom-0 flex flex-col items-center">
            <div className="w-[2px] h-full border-l-2 border-zinc-100/60" />
          </div>
        )}

        <div className="flex gap-4 md:gap-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white flex items-center justify-center border border-zinc-100 shrink-0 shadow-sm">
            <User className="w-5 h-5 md:w-6 md:h-6 text-zinc-400" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] md:text-[15px] font-black text-zinc-900 flex items-center gap-2">
                  {comment.author}
                  {isChild && <CornerDownRight className="w-3.5 h-3.5 text-[var(--nexus-primary)]/40" />}
                  {comment.reportCount > 0 && <span className="text-[8px] bg-red-50 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Flagged</span>}
                </div>
                <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{formatDate(comment.createdAt)}</div>
              </div>
              
              <div className="flex items-center gap-4">
                {!isDeleted && !isMine && (
                  <button 
                    onClick={() => onReport(comment.id)} 
                    className="flex items-center gap-1.5 text-[10px] font-black text-zinc-300 hover:text-red-500 transition-all uppercase tracking-widest group/report"
                  >
                    <Flag className="w-3.5 h-3.5 transition-transform group-hover/report:scale-110" />
                    Report
                  </button>
                )}
                {isMine && !isDeleted && (
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        onSetEditingCommentId(comment.id);
                        onSetEditCommentContent(comment.content);
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-black text-zinc-300 hover:text-black transition-colors uppercase tracking-widest"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button 
                      onClick={() => onDelete(comment.id)} 
                      className="flex items-center gap-1.5 text-[10px] font-black text-zinc-300 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {editingCommentId === comment.id ? (
              <div className="space-y-4">
                <textarea 
                  value={editCommentContent}
                  onChange={(e) => onSetEditCommentContent(e.target.value)}
                  className="w-full p-6 bg-white rounded-2xl border-2 border-zinc-100 focus:border-[var(--nexus-primary)]/10 outline-none transition-all font-medium text-base text-zinc-800 resize-none shadow-inner"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => onSetEditingCommentId(null)} className="px-4 py-2 font-black text-[10px] text-zinc-400 uppercase tracking-widest">Cancel</button>
                  <button onClick={() => onUpdate(comment.id)} className="bg-black text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/10">Save Changes</button>
                </div>
              </div>
            ) : (
              <p className={cn(
                "text-[15px] md:text-[16px] font-medium leading-relaxed whitespace-pre-wrap", 
                isDeleted ? "text-zinc-300 italic" : "text-zinc-700"
              )}>
                {comment.content}
              </p>
            )}

            {!isDeleted && (
              <div className="flex items-center gap-6 pt-2">
                <button 
                  onClick={() => onReply(replyTargetId === comment.id ? null : comment.id)}
                  className="flex items-center gap-2 text-[10px] font-black text-[var(--nexus-primary)] uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {replyTargetId === comment.id ? "Cancel Reply" : "Reply"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reply Input Area */}
        {replyTargetId === comment.id && (
          <div className="mt-8 pl-12 md:pl-16">
            <div className="relative group">
              <textarea 
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                placeholder="따뜻한 답글을 남겨주세요..."
                className="w-full min-h-[120px] p-6 bg-white rounded-[2rem] border-2 border-zinc-100 focus:border-[var(--nexus-primary)]/10 outline-none transition-all font-medium text-base text-zinc-800 resize-none shadow-xl shadow-black/[0.02]"
              />
              <button 
                onClick={() => onReplySubmit(comment.id)}
                disabled={isSubmitting || !replyContent.trim()}
                className="absolute right-4 bottom-4 bg-black text-white px-6 py-3 rounded-xl font-black text-xs active:scale-95 transition-all shadow-xl shadow-black/10 disabled:opacity-20"
              >
                POST REPLY
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies Rendering - Unified indentation */}
      {comment.children && comment.children.length > 0 && (
        <div className={cn("pb-2", !isChild && "ml-8 md:ml-16")}>
          {comment.children.map((child: any) => (
            <CommentItem 
              key={child.id}
              comment={child}
              onReport={onReport}
              onReply={onReply}
              replyTargetId={replyTargetId}
              replyContent={replyContent}
              onReplyContentChange={onReplyContentChange}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
              isSubmitting={isSubmitting}
              formatDate={formatDate}
              isChild={true}
              editingCommentId={editingCommentId}
              onSetEditingCommentId={onSetEditingCommentId}
              editCommentContent={editCommentContent}
              onSetEditCommentContent={onSetEditCommentContent}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
