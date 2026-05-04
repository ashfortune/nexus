"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminData {
  users: Array<{ id: string; email: string; nickname: string; userType: number; loginType: number; bizNo: string; createdAt: string; isSuspended: boolean }>;
  boards: Array<{ id: string; title: string; authorNickname: string; createdAt: string }>;
  comments: Array<{ id: string; content: string; authorNickname: string; boardTitle: string; createdAt: string }>;
  purchases: Array<{ id: string; title: string; status: string; currentCount: number; createdAt: string }>;
  chatRooms: Array<{ id: string; title: string; creatorNickname: string; createdAt: string }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'boards' | 'comments' | 'purchases' | 'chats'>('users');

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType !== '2') {
      alert('관리자만 접근 가능한 페이지입니다.');
      router.push('/');
      return;
    }
    fetchAdminData();
  }, [router]);

  const fetchAdminData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/v1/mypage/admin/dashboard');
      const result = await response.json();
      if (result.status === 'success') {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async (id: string) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/mypage/admin/boards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('삭제되었습니다.');
        fetchAdminData();
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/mypage/admin/comments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('삭제되었습니다.');
        fetchAdminData();
      }
    } catch (err) {
      alert('삭제 실패');
    }
  };

  const handleToggleSuspension = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? '해제' : '정지';
    if (!confirm(`정말 이 회원을 ${action}하시겠습니까?`)) return;
    try {
      const res = await fetch(`http://localhost:8080/api/v1/mypage/admin/users/${id}/suspend`, { method: 'PATCH' });
      if (res.ok) {
        alert(`${action}되었습니다.`);
        fetchAdminData();
      }
    } catch (err) {
      alert('처리 실패');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">관리자 데이터를 불러오는 중...</div>;
  if (!data) return null;

  const tabs = [
    { id: 'users', label: '👤 계정 관리', count: data.users.length },
    { id: 'boards', label: '📝 전체 게시글', count: data.boards.length },
    { id: 'comments', label: '💬 전체 댓글', count: data.comments.length },
    { id: 'purchases', label: '🛒 전체 공동구매', count: data.purchases.length },
    { id: 'chats', label: '📢 전체 채팅방', count: data.chatRooms.length },
  ];

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] flex font-sans">
      {/* 사이드바 */}
      <aside className="w-72 bg-[var(--nexus-surface-lowest)] border-r border-[var(--nexus-outline-variant)]/30 flex flex-col sticky top-0 h-screen shadow-2xl shadow-[var(--nexus-primary)]/5">
        <div className="p-10 border-b border-[var(--nexus-outline-variant)]/20">
          <h1 className="text-3xl font-black tracking-tighter text-[var(--nexus-primary)]">NEXUS</h1>
          <p className="text-[10px] font-black text-[var(--nexus-outline)] mt-2 uppercase tracking-[0.2em]">Administration</p>
        </div>
        
        <nav className="flex-1 py-8 px-6 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-[var(--nexus-primary)] text-white shadow-xl shadow-[var(--nexus-primary)]/20 active:scale-[0.98]' 
                  : 'text-[var(--nexus-outline)] hover:text-[var(--nexus-on-bg)] hover:bg-[var(--nexus-surface-low)]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--nexus-surface-container)] text-[var(--nexus-primary)]'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-[var(--nexus-outline-variant)]/20">
          <button 
            onClick={() => router.push('/')} 
            className="w-full py-4 bg-[var(--nexus-surface-low)] text-[var(--nexus-on-bg)] rounded-2xl text-xs font-black hover:bg-[var(--nexus-surface-container)] transition-all active:scale-[0.98] border border-[var(--nexus-outline-variant)]/30"
          >
            메인으로 돌아가기
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 p-16 overflow-auto">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-4xl font-black text-[var(--nexus-on-bg)] tracking-tighter">{tabs.find(t => t.id === activeTab)?.label}</h2>
            <p className="text-[var(--nexus-outline)] mt-3 font-bold">시스템 내 총 {tabs.find(t => t.id === activeTab)?.count}개의 데이터가 등록되어 있습니다.</p>
          </div>
          <button 
            onClick={fetchAdminData}
            className="px-8 py-4 bg-[var(--nexus-primary)]/5 text-[var(--nexus-primary)] border border-[var(--nexus-primary)]/20 rounded-2xl text-sm font-black hover:bg-[var(--nexus-primary)]/10 transition-all active:rotate-180 duration-500"
          >
            REFRESH 🔄
          </button>
        </header>

        <div className="nexus-card border border-[var(--nexus-outline-variant)]/30 shadow-2xl shadow-[var(--nexus-primary)]/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-[var(--nexus-surface-low)]/50 border-b border-[var(--nexus-outline-variant)]/30">
                {activeTab === 'users' && (
                  <tr>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">이메일</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">닉네임</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">구분</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">상태</th>
                    <th className="px-8 pr-12 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap text-center">작업</th>
                  </tr>
                )}
                {activeTab === 'boards' && (
                  <tr>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">제목</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">작성자</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">작성일</th>
                    <th className="px-8 pr-12 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap text-center">작업</th>
                  </tr>
                )}
                {activeTab === 'comments' && (
                  <tr>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">내용</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">작성자</th>
                    <th className="px-8 pr-12 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap text-center">작업</th>
                  </tr>
                )}
                {activeTab === 'purchases' && (
                  <tr>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">제목</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">상태</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">참여자 수</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">등록일</th>
                  </tr>
                )}
                {activeTab === 'chats' && (
                  <tr>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">방 이름</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">방장</th>
                    <th className="px-8 py-6 text-[11px] font-black text-[var(--nexus-outline)] uppercase tracking-widest whitespace-nowrap">생성일</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-[var(--nexus-outline-variant)]/20">
                {activeTab === 'users' && data.users.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--nexus-surface-low)]/50 transition-colors">
                    <td className="px-8 py-6 text-sm font-medium text-[var(--nexus-on-bg)] whitespace-nowrap">{u.email}</td>
                    <td className="px-8 py-6 text-sm font-black text-[var(--nexus-on-bg)] whitespace-nowrap">{u.nickname}</td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-tighter ${u.userType === 2 ? 'bg-[var(--nexus-error)]/10 text-[var(--nexus-error)]' : u.userType === 1 ? 'bg-[var(--nexus-tertiary-fixed)]/20 text-[var(--nexus-tertiary-container)]' : 'bg-[var(--nexus-primary)]/10 text-[var(--nexus-primary)]'}`}>
                        {u.userType === 2 ? 'ADMIN' : u.userType === 1 ? 'BIZ' : 'GENERAL'}
                      </span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${u.isSuspended ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                        {u.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-8 pr-12 py-6 text-center whitespace-nowrap">
                      <button 
                        onClick={() => handleToggleSuspension(u.id, u.isSuspended)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${u.isSuspended ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
                      >
                        {u.isSuspended ? '해제' : '정지'}
                      </button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'boards' && data.boards.map(b => (
                  <tr key={b.id} className="hover:bg-[var(--nexus-surface-low)]/50 transition-colors">
                    <td className="px-8 py-6 text-sm font-black text-[var(--nexus-on-bg)] whitespace-nowrap">{b.title}</td>
                    <td className="px-8 py-6 text-sm font-bold text-[var(--nexus-secondary)] whitespace-nowrap">{b.authorNickname}</td>
                    <td className="px-8 py-6 text-[11px] font-bold text-[var(--nexus-outline)] whitespace-nowrap">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="px-8 pr-12 py-6 text-center whitespace-nowrap">
                      <button 
                        onClick={() => handleDeleteBoard(b.id)}
                        className="px-4 py-2 bg-[var(--nexus-error)] text-white rounded-xl text-[10px] font-black hover:opacity-80"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'comments' && data.comments.map(c => (
                  <tr key={c.id} className="hover:bg-[var(--nexus-surface-low)]/50 transition-colors">
                    <td className="px-8 py-6 text-sm font-bold text-[var(--nexus-on-bg)] whitespace-nowrap">{c.content}</td>
                    <td className="px-8 py-6 text-sm font-bold text-[var(--nexus-secondary)] whitespace-nowrap">{c.authorNickname}</td>
                    <td className="px-8 pr-12 py-6 text-center whitespace-nowrap">
                      <button 
                        onClick={() => handleDeleteComment(c.id)}
                        className="px-4 py-2 bg-[var(--nexus-error)] text-white rounded-xl text-[10px] font-black hover:opacity-80"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'purchases' && data.purchases.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--nexus-surface-low)]/50 transition-colors">
                    <td className="px-8 py-6 text-sm font-black text-[var(--nexus-on-bg)] whitespace-nowrap">{p.title}</td>
                    <td className="px-8 py-6 text-sm whitespace-nowrap">
                      <span className="bg-[var(--nexus-tertiary-fixed)] text-[var(--nexus-tertiary-container)] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">{p.status}</span>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-[var(--nexus-secondary)] whitespace-nowrap">{p.currentCount}명 참여 중</td>
                    <td className="px-8 py-6 text-[11px] font-bold text-[var(--nexus-outline)] whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {activeTab === 'chats' && data.chatRooms.map(cr => (
                  <tr key={cr.id} className="hover:bg-[var(--nexus-surface-low)]/50 transition-colors">
                    <td className="px-8 py-6 text-sm font-black text-[var(--nexus-on-bg)] whitespace-nowrap">{cr.title}</td>
                    <td className="px-8 py-6 text-sm font-bold text-[var(--nexus-tertiary-container)] whitespace-nowrap">{cr.creatorNickname}</td>
                    <td className="px-8 py-6 text-[11px] font-bold text-[var(--nexus-outline)] whitespace-nowrap">{new Date(cr.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
