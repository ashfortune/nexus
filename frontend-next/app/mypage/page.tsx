'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import AuthGuard from '@/components/auth/AuthGuard';

interface MyPageData {
  email: string;
  nickname: string;
  userType: number; // 0: 일반, 1: 사업가
  bizNo: string | null;
  provider: string | null;
  profileImage: string | null;
  posts: Array<{ id: string; title: string; boardType: string; createdAt: string }>;
  comments: Array<{ id: string; content: string; boardId: string; boardTitle: string; boardType: string; createdAt: string }>;
  purchases: Array<{ id: string; title: string; status: string; createdAt: string }>;
}

export default function MyPage() {
  const router = useRouter();
  const [data, setData] = useState<MyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'purchases'>('posts');
  const [bizNo, setBizNo] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userId = user?.id;
    const formData = new FormData();
    formData.append('files', file);

    try {
      // 1단계: 실제 파일 업로드 (Supabase Storage)
      const uploadResponse = await api.post('/api/v1/upload/profiles', formData);
      const uploadResult = await uploadResponse.json();
      
      if (uploadResult.status === 'success' && uploadResult.urls && uploadResult.urls.length > 0) {
        const imageUrl = uploadResult.urls[0];
        
        // 2단계: DB의 프로필 이미지 경로 업데이트
        const response = await api.patch(`/api/v1/mypage/profile-image/${userId}`, { imageUrl });
        const result = await response.json();
        
        if (result.status === 'success') {
          alert('프로필 이미지가 변경되었습니다.');
          fetchData(userId!);
        } else {
          alert(result.message || '업로드에 실패했습니다.');
        }
      } else {
        alert('이미지 서버 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Profile upload error:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const formatBizNo = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
  };

  const handleBizNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBizNo(e.target.value);
    setBizNo(formatted);
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      return alert('모든 필드를 입력해주세요.');
    }
    if (passwords.next !== passwords.confirm) {
      return alert('새 비밀번호가 일치하지 않습니다.');
    }

    const userId = user?.id;
    try {
      const response = await api.patch(`/api/v1/mypage/change-password/${userId}`, {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert('비밀번호가 변경되었습니다.');
        setIsChangingPassword(false);
        setPasswords({ current: '', next: '', confirm: '' });
      } else {
        alert(result.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated || !user?.id) return;
    fetchData(user.id);
  }, [isAuthenticated, user, _hasHydrated]);

  const fetchData = async (userId: string) => {
    try {
      const response = await api.get(`/api/v1/mypage/me/${userId}`);
      const result = await response.json();
      if (result.status === 'success') {
        setData(result.data);
        // 전역 상태 및 로컬 스토리지 업데이트
        useAuthStore.getState().updateUser({ profileImage: result.data.profileImage || '' });
        localStorage.setItem('profileImage', result.data.profileImage || '');
        window.dispatchEvent(new Event('login-status-change'));
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!bizNo) return alert('사업자 등록번호를 입력해주세요.');
    const userId = user?.id;
    try {
      const response = await api.patch(`/api/v1/mypage/upgrade/${userId}`, { bizNo });
      const result = await response.json();
      if (result.status === 'success') {
        alert('사업자 회원으로 전환되었습니다.');
        // 전역 상태 업데이트 추가
        useAuthStore.getState().updateUser({ userType: 1, bizNo });
        window.location.reload();
      } else {
        alert(result.message || '전환 처리에 실패했습니다.');
      }
    } catch (error) {
      alert('전환 처리 중 오류가 발생했습니다.');
    }
  };

  const handleUnregister = async () => {
    if (!confirm('정말로 탈퇴하시겠습니까? 탈퇴 후 7일간은 데이터 복구가 불가능합니다.')) return;
    const userId = user?.id;
    try {
      const response = await api.delete(`/api/v1/mypage/unregister/${userId}`);
      const result = await response.json();
      if (result.status === 'success') {
        alert('탈퇴 처리가 완료되었습니다. 이용해주셔서 감사합니다.');
        useAuthStore.getState().clearAuth();
        router.push('/');
      }
    } catch (error) {
      alert('탈퇴 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <AuthGuard allowedRoles={[0, 1, 2]}>
      <div className="min-h-screen bg-[var(--nexus-bg)] pt-20">
        {loading ? (
          <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
        ) : !data ? (
          <div className="min-h-screen flex items-center justify-center text-[var(--nexus-outline)]">데이터를 불러오지 못했습니다.</div>
        ) : (
          <main className="max-w-5xl mx-auto py-12 px-6">
            <h1 className="text-4xl font-black text-[var(--nexus-on-bg)] mb-10 tracking-tighter">
              마이페이지
            </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽: 프로필 카드 */}
          <div className="lg:col-span-1">
            <div className="nexus-card border border-[var(--nexus-outline-variant)]/30 p-8 sticky top-24 shadow-xl shadow-[var(--nexus-primary)]/5">
              <div className="relative group w-24 h-24 mb-6">
                <div className="w-full h-full bg-[var(--nexus-surface-container)] rounded-3xl flex items-center justify-center overflow-hidden shadow-inner border-2 border-white">
                  {data.profileImage ? (
                    <img
                      src={data.profileImage.startsWith('http') ? data.profileImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${data.profileImage}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-[var(--nexus-primary)] font-black">
                      {data.nickname[0]}
                    </span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer">
                  <span className="text-xl">📷</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <h2 className="text-2xl font-black text-[var(--nexus-on-bg)] mb-1 tracking-tight">
                {data.nickname}
              </h2>
              <p className="text-[var(--nexus-outline)] text-sm mb-6 font-medium">{data.email}</p>

                  <div className="space-y-4 pt-6 border-t border-[var(--nexus-outline-variant)]/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[var(--nexus-outline)] uppercase tracking-wider">
                        회원 등급
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black ${data.userType === 2
                          ? 'bg-[var(--nexus-error)]/10 text-[var(--nexus-error)]'
                          : data.userType === 1
                            ? 'bg-[var(--nexus-tertiary-fixed)]/20 text-[var(--nexus-tertiary-container)]'
                            : 'bg-[var(--nexus-primary)]/10 text-[var(--nexus-primary)]'
                          }`}
                      >
                        {data.userType === 2
                          ? '관리자'
                          : data.userType === 1
                            ? '사업가 회원'
                            : '일반 회원'}
                      </span>
                    </div>
                    {data.bizNo && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--nexus-outline)] uppercase tracking-wider">
                          사업자 번호
                        </span>
                        <span className="text-sm font-bold text-[var(--nexus-on-bg)]">
                          {data.bizNo}
                        </span>
                      </div>
                    )}
                  </div>

                  {data.userType === 0 && (
                    <div className="mt-8">
                      <button
                        onClick={() => setIsUpgrading(!isUpgrading)}
                        className="w-full py-3.5 bg-[var(--nexus-on-bg)] text-white rounded-xl text-sm font-bold hover:bg-black transition-all mb-4 shadow-lg shadow-black/10 active:scale-[0.98]"
                      >
                        사업가 회원으로 전환
                      </button>
                      {isUpgrading && (
                        <div className="p-4 bg-[var(--nexus-surface-low)] rounded-xl space-y-3 border border-[var(--nexus-outline-variant)]/30">
                          <input
                            type="text"
                            placeholder="사업자 번호 (000-00-00000)"
                            value={bizNo}
                            onChange={handleBizNoChange}
                            maxLength={12}
                            className="w-full px-4 py-2.5 bg-white border border-[var(--nexus-outline-variant)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--nexus-primary)]/10 outline-none transition-all"
                          />
                          <button
                            onClick={handleUpgrade}
                            className="w-full py-2.5 bg-[var(--nexus-primary)] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all"
                          >
                            전환 신청하기
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(!data.provider || data.provider === 'local') && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-[var(--nexus-outline-variant)]/30">
                      <button
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                        className="w-full py-3.5 border border-[var(--nexus-outline-variant)] text-[var(--nexus-on-bg)] rounded-xl text-sm font-bold hover:bg-[var(--nexus-surface-low)] transition-all active:scale-[0.98]"
                      >
                        비밀번호 변경
                      </button>

                      {isChangingPassword && (
                        <div className="p-4 bg-[var(--nexus-surface-low)] rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 border border-[var(--nexus-outline-variant)]/30">
                          <input
                            type="password"
                            placeholder="현재 비밀번호"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-[var(--nexus-outline-variant)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--nexus-primary)]/10 outline-none"
                          />
                          <input
                            type="password"
                            placeholder="새 비밀번호"
                            value={passwords.next}
                            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-[var(--nexus-outline-variant)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--nexus-primary)]/10 outline-none"
                          />
                          <input
                            type="password"
                            placeholder="새 비밀번호 확인"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-[var(--nexus-outline-variant)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--nexus-primary)]/10 outline-none"
                          />
                          <button
                            onClick={handleChangePassword}
                            className="w-full py-2.5 bg-[var(--nexus-primary)] text-white rounded-xl text-xs font-bold hover:brightness-110 transition-all"
                          >
                            변경 완료
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => router.push('/mypage/report')}
                    className="w-full mt-6 py-3.5 bg-gradient-to-r from-[var(--nexus-primary)] to-[var(--nexus-secondary)] text-white rounded-xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-[var(--nexus-primary)]/20 active:scale-[0.95] flex items-center justify-center gap-2"
                  >
                    <span>📊</span> 사후보고서
                  </button>

                  <button
                    onClick={handleUnregister}
                    className="w-full mt-8 text-xs text-[var(--nexus-outline)] hover:text-[var(--nexus-error)] underline transition-colors"
                  >
                    회원 탈퇴하기
                  </button>
                </div>
              </div>

              <div className="p-8 min-h-[400px]">
                {activeTab === 'posts' && (
                  <div className="space-y-3">
                    {data.posts.length > 0 ? (
                      data.posts.map((post, idx) => (
                        <div
                          key={`${post.id}-${idx}`}
                          onClick={() => router.push(`/${post.boardType || 'board'}/detail/${post.id}`)}
                          className="flex justify-between items-center p-5 bg-[var(--nexus-surface-low)]/30 hover:bg-[var(--nexus-surface-low)] rounded-2xl transition-all border border-[var(--nexus-outline-variant)]/20 hover:border-[var(--nexus-outline-variant)] cursor-pointer group"
                        >
                          <span className="font-bold text-[var(--nexus-on-bg)] group-hover:text-[var(--nexus-primary)] transition-colors">{post.title}</span>
                          <span className="text-[10px] font-bold text-[var(--nexus-outline)] uppercase">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center text-[var(--nexus-outline)] font-medium">
                        작성한 게시글이 없습니다.
                      </div>
                    )}

                {activeTab === 'comments' && (
                  <div className="space-y-3">
                    {data.comments.length > 0 ? (
                      data.comments.map((comment, idx) => (
                        <div
                          key={`${comment.id}-${idx}`}
                          onClick={() => router.push(`/${comment.boardType || 'board'}/detail/${comment.boardId}`)}
                          className="p-5 bg-[var(--nexus-surface-low)]/30 hover:bg-[var(--nexus-surface-low)] rounded-2xl transition-all border border-[var(--nexus-outline-variant)]/20 hover:border-[var(--nexus-outline-variant)] cursor-pointer group"
                        >
                          <p className="text-[var(--nexus-on-bg)] font-bold mb-2 group-hover:text-[var(--nexus-primary)] transition-colors">
                            {comment.content}
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-[var(--nexus-secondary)] bg-[var(--nexus-secondary)]/5 px-2 py-1 rounded-lg">
                              원문: {comment.boardTitle}
                            </span>
                            <span className="text-[10px] font-bold text-[var(--nexus-outline)]">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                {activeTab === 'purchases' && (
                  <div className="space-y-3">
                    {data.purchases.length > 0 ? (
                      data.purchases.map((purchase, idx) => (
                        <div
                          key={`${purchase.id}-${idx}`}
                          onClick={() => router.push(`/group-purchases/${purchase.id}`)}
                          className="flex justify-between items-center p-5 bg-[var(--nexus-surface-low)]/30 hover:bg-[var(--nexus-surface-low)] rounded-2xl transition-all border border-[var(--nexus-outline-variant)]/20 hover:border-[var(--nexus-outline-variant)] cursor-pointer group"
                        >
                          <div>
                            <span className="font-bold text-[var(--nexus-on-bg)] block mb-1 group-hover:text-[var(--nexus-primary)] transition-colors">
                              {purchase.title}
                            </span>
                            <span className="text-[9px] bg-[var(--nexus-tertiary-fixed)] text-[var(--nexus-tertiary-container)] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                              {purchase.status}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </AuthGuard>
  );
}
