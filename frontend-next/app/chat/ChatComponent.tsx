"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  Hash, 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  ChevronLeft,
  Smile,
  Paperclip,
  Image as ImageIcon,
  MessageSquare,
  File,
  Download,
  LogOut,
  UserPlus
} from 'lucide-react';
import ChatService from '@/lib/chat/chatService';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  senderNickname: string;
  senderProfileImageUrl?: string;
  message: string;
  createdAt: string;
  type: 'TALK' | 'ENTER' | 'LEAVE' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  fileName?: string;
}

interface ChatRoomResponseDto {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  unreadCount?: number;
  participantCount?: number;
  type: 'GROUP' | 'PRIVATE';
  hasPassword?: boolean;
}

interface ChatRoom extends ChatRoomResponseDto {}

interface UserSummary {
  id: string;
  nickname: string;
  email: string;
}

const ChatComponent = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [allRooms, setAllRooms] = useState<ChatRoom[]>([]);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentNickname, setCurrentNickname] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomType, setNewRoomType] = useState<'GROUP' | 'PRIVATE'>('GROUP');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomImageUrl, setNewRoomImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<ChatRoomResponseDto | null>(null);
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  
  // 초대 관련 상태
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCandidates, setInviteCandidates] = useState<UserSummary[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [isMsgSearchOpen, setIsMsgSearchOpen] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  
  const chatServiceRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 초기화: 로컬 스토리지에서 사용자 정보 로드
  const router = useRouter();

  useEffect(() => {
    const initAuth = () => {
      const storedUserId = localStorage.getItem('userId');
      const storedNickname = localStorage.getItem('nickname');
      
      if (storedUserId) {
        setCurrentUserId(storedUserId);
        setCurrentNickname(storedNickname || '익명');
        fetchMyRooms(storedUserId);
      } else {
        // 로그인이 안 되어 있으면 로그인 페이지로 리다이렉트
        router.push('/auth/login');
      }
      setIsLoading(false);
    };

    initAuth();
    window.addEventListener('storage', initAuth);
    return () => window.removeEventListener('storage', initAuth);
  }, [router]);

  // 2. 초기 데이터 로드 (내 채팅방 목록)
  const fetchMyRooms = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/rooms/mine?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
        if (data.length > 0 && !activeRoomId) {
          setActiveRoomId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setRooms([]); // 서버 오류 시 목록을 비움
    }
  };

  const fetchAllRooms = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/rooms`);
      if (response.ok) {
        const data = await response.json();
        setAllRooms(data);
      }
    } catch (error) {
      console.error("Failed to fetch all rooms:", error);
    }
  };

  const handleJoinRoom = (room: ChatRoomResponseDto) => {
    setJoiningRoom(room);
    setConfirmModalOpen(true);
  };

  const confirmJoinRoom = async () => {
    if (!currentUserId || !joiningRoom) return;
    
    try {
      const passwordParam = joinPassword ? `&password=${joinPassword}` : '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/rooms/${joiningRoom.id}/join?userId=${currentUserId}${passwordParam}`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchMyRooms(currentUserId);
        setActiveRoomId(joiningRoom.id);
        setShowAllRooms(false);
        setConfirmModalOpen(false);
        setJoiningRoom(null);
        setJoinPassword('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "비밀번호가 틀렸거나 입장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to join room:", error);
    }
  };

  const handleLeaveRoom = () => {
    const activeRoom = rooms.find(r => r.id === activeRoomId);
    if (!activeRoom || activeRoom.type !== 'GROUP') return;
    setLeaveModalOpen(true);
  };

  const confirmLeaveRoom = async () => {
    if (!activeRoomId || !currentUserId) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/rooms/${activeRoomId}/leave?userId=${currentUserId}`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchMyRooms(currentUserId);
        setActiveRoomId(null);
        setLeaveModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  // 3. 채팅방 변경 시 메시지 내역 로드 및 구독
  useEffect(() => {
    if (!activeRoomId || !currentUserId) return;

    // 기존 연결 종료
    if (chatServiceRef.current) {
      chatServiceRef.current.disconnect();
    }

    // 메시지 내역 불러오기
    fetchMessages(activeRoomId);

    // 새 연결 시작
    const chatService = new ChatService();
    chatService.connect(
      (message: any) => {
        // 1. 현재 채팅창 메시지 추가
        setMessages(prev => [...prev, message]);
        scrollToBottom();

        // 2. 왼쪽 채팅방 목록 실시간 업데이트 (미리보기 및 정렬)
        setRooms(prevRooms => {
          const updatedRooms = prevRooms.map(room => {
            if (room.id === message.roomId) {
              return {
                ...room,
                lastMessage: message.type === 'IMAGE' ? '(사진)' : 
                             message.type === 'FILE' ? '(파일)' : message.message,
                lastMessageAt: message.createdAt
              };
            }
            return room;
          });
          // 최신 메시지 순으로 다시 정렬
          return [...updatedRooms].sort((a, b) => {
            const t1 = new Date(a.lastMessageAt || a.createdAt).getTime();
            const t2 = new Date(b.lastMessageAt || b.createdAt).getTime();
            return t2 - t1;
          });
        });
      },
      activeRoomId,
      () => setIsConnected(true)
    );
    chatServiceRef.current = chatService;

    return () => {
      chatService.disconnect();
      setIsConnected(false);
    };
  }, [activeRoomId, currentUserId]);

  const fetchMessages = async (roomId: string) => {
    if (!currentUserId) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/rooms/${roomId}/messages?userId=${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        scrollToBottom();
      }
    } catch (error) {
      setMessages([]); // Clear if error
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeRoomId || !currentUserId || !chatServiceRef.current) return;

    chatServiceRef.current.sendMessage(
      activeRoomId,
      currentUserId,
      inputValue,
      'TALK'
    );
    setInputValue('');
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !newRoomTitle.trim()) return;

    try {
      let finalImageUrl = newRoomImageUrl;

      // 만약 선택된 파일이 있다면 지금 업로드
      if (selectedFile) {
        const uploadedUrl = await uploadRoomImage(selectedFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          alert("이미지 업로드에 실패했습니다. 다시 시도해 주세요.");
          return;
        }
      }

      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRoomTitle,
          type: newRoomType,
          description: newRoomDescription,
          imageUrl: finalImageUrl,
          creatorId: currentUserId,
          password: newRoomPassword
        }),
      });

      if (response.ok) {
        const newRoom = await response.json();
        setRooms(prev => [newRoom, ...prev]);
        setActiveRoomId(newRoom.id);
        closeCreateModal();
      }
    } catch (error) {
      alert("방 생성에 실패했습니다.");
    }
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewRoomTitle('');
    setNewRoomDescription('');
    setNewRoomImageUrl('');
    setImagePreview(null);
    setSelectedFile(null);
    setNewRoomType('GROUP');
    setNewRoomPassword('');
  };

  const fetchInviteCandidates = async () => {
    if (!activeRoomId) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/rooms/${activeRoomId}/invite-candidates`);
      if (response.ok) {
        const data = await response.json();
        setInviteCandidates(data);
        setIsInviteModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch invite candidates:", error);
    }
  };

  const handleInviteUsers = async () => {
    if (!activeRoomId || selectedUserIds.length === 0) return;
    
    setIsInviting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat/rooms/${activeRoomId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedUserIds),
      });

      if (response.ok) {
        alert("성공적으로 초대되었습니다.");
        setIsInviteModalOpen(false);
        setSelectedUserIds([]);
        // 참가자 수 업데이트를 위해 내 방 목록 다시 불러오기
        if (currentUserId) fetchMyRooms(currentUserId);
      } else {
        alert("초대에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to invite users:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // 브라우저 미리보기 생성 (서버 업로드 X)
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadRoomImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/chat/files/upload?category=chat-rooms', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
    return null;
  };

  const handleFileMessageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
    if (!file || !activeRoomId || !currentUserId || !chatServiceRef.current) {
      console.log("Missing required data:", { file, activeRoomId, currentUserId, connected: !!chatServiceRef.current });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log("Uploading file...");
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/v1/chat/files/upload?category=chat-messages', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Upload success:", data);
        const fileUrl = data.url;
        const fileName = file.name;
        const isImage = file.type.startsWith('image/');
        
        console.log("Sending file message:", {
          activeRoomId,
          currentUserId,
          text: isImage ? '사진을 보냈습니다.' : `파일을 보냈습니다: ${fileName}`,
          type: isImage ? 'IMAGE' : 'FILE',
          fileUrl,
          fileName
        });

        chatServiceRef.current.sendMessage(
          activeRoomId,
          currentUserId,
          isImage ? '사진을 보냈습니다.' : `파일을 보냈습니다: ${fileName}`,
          isImage ? 'IMAGE' : 'FILE',
          fileUrl,
          fileName
        );
      } else {
        console.error("Upload failed with status:", response.status);
        alert("파일 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("File upload error:", error);
    } finally {
      // 같은 파일을 다시 선택해도 이벤트가 발생하도록 초기화
      e.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#F0F2F5]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#F8F9FA]">
        <div className="text-center p-12 bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-zinc-100 max-w-md w-full">
          <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-zinc-300" />
          </div>
          <h2 className="text-2xl font-black mb-3 tracking-tight">로그인이 필요합니다</h2>
          <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
            NEXUS 커뮤니티 채팅을 이용하시려면<br/>먼저 로그인해 주세요.
          </p>
          <button 
            onClick={() => window.location.href = '/auth/login'}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-black/10"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[var(--nexus-bg)] overflow-hidden font-inter text-[var(--nexus-on-bg)]">
      {/* 1. 사이드바 - 채팅방 목록 */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-[var(--nexus-surface-container)] flex flex-col bg-[var(--nexus-surface-low)]`}>
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black tracking-tighter text-[var(--nexus-primary)]">Messages</h1>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-8 h-8 bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] rounded-full flex items-center justify-center hover:scale-110 transition-all active:scale-90 shadow-lg shadow-[var(--nexus-primary)]/20"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex gap-2 mb-6 p-1 bg-[var(--nexus-surface-container)] rounded-xl">
            <button 
              onClick={() => setShowAllRooms(false)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!showAllRooms ? 'bg-[var(--nexus-surface-lowest)] shadow-sm text-[var(--nexus-primary)]' : 'text-[var(--nexus-outline)]'}`}
            >
              내 채팅
            </button>
            <button 
              onClick={() => {
                setShowAllRooms(true);
                fetchAllRooms();
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${showAllRooms ? 'bg-[var(--nexus-surface-lowest)] shadow-sm text-[var(--nexus-primary)]' : 'text-[var(--nexus-outline)]'}`}
            >
              전체 탐색
            </button>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--nexus-outline)] group-focus-within:text-[var(--nexus-primary)] transition-colors" size={16} />
            <input 
              type="text" 
              placeholder={showAllRooms ? "Search all rooms..." : "Search my chats..."}
              value={roomSearchQuery}
              onChange={(e) => setRoomSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--nexus-surface-lowest)] border-transparent focus:border-[var(--nexus-primary)] rounded-xl text-sm transition-all shadow-sm text-[var(--nexus-on-bg)] placeholder:text-[var(--nexus-outline)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {(showAllRooms ? allRooms : rooms)
            .filter(room => room.title.toLowerCase().includes(roomSearchQuery.toLowerCase()))
            .map(room => (
            <button
              key={room.id}
              onClick={() => {
                if (showAllRooms) {
                  const isJoined = rooms.some(r => r.id === room.id);
                  if (isJoined) {
                    setActiveRoomId(room.id);
                    setShowAllRooms(false);
                  } else {
                    handleJoinRoom(room);
                  }
                } else {
                  setActiveRoomId(room.id);
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                activeRoomId === room.id 
                ? 'bg-[var(--nexus-surface-lowest)] shadow-lg shadow-[var(--nexus-primary)]/5 border border-[var(--nexus-surface-container)]' 
                : 'hover:bg-[var(--nexus-surface-container)]/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg overflow-hidden ${
                room.imageUrl ? 'bg-transparent' : (room.type === 'GROUP' ? 'bg-[var(--nexus-primary)]' : 'bg-[var(--nexus-secondary)]')
              }`}>
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.title} className="w-full h-full object-cover" />
                ) : (
                  room.type === 'GROUP' ? <Hash size={20} /> : room.title[0]
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-sm truncate text-[var(--nexus-on-bg)]">{room.title}</span>
                    <span className="text-[10px] text-[var(--nexus-outline)] font-medium whitespace-nowrap">
                      {room.participantCount || 0}
                    </span>
                  </div>
                  {!showAllRooms && room.lastMessageAt && (
                    <span className="text-[10px] text-[var(--nexus-outline)] whitespace-nowrap">
                      {new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {showAllRooms && !rooms.some(r => r.id === room.id) && (
                    <span className="text-[9px] bg-[var(--nexus-secondary)]/10 text-[var(--nexus-secondary)] px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap uppercase">JOIN</span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--nexus-outline)] truncate mt-0.5 font-medium">
                  {showAllRooms 
                    ? (room.description || '상세 설명이 없는 채팅방입니다.') 
                    : (room.lastMessage || '새로운 대화를 시작해보세요!')}
                </p>
              </div>
            </button>
          ))}
          {(showAllRooms ? allRooms : rooms).filter(room => room.title.toLowerCase().includes(roomSearchQuery.toLowerCase())).length === 0 && (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-[var(--nexus-surface-container)] rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                <Search size={24} className="text-[var(--nexus-outline)]" />
              </div>
              <p className="text-sm font-black text-[var(--nexus-on-bg)] mb-1">
                {roomSearchQuery ? '검색 결과가 없습니다' : (showAllRooms ? '개설된 방이 없습니다' : '참여 중인 방이 없습니다')}
              </p>
              <p className="text-[11px] text-[var(--nexus-outline)] font-medium">
                {roomSearchQuery 
                  ? '검색어를 다시 확인하거나 다른 키워드로 검색해 보세요.' 
                  : (showAllRooms ? '새로운 채팅방을 직접 만들어보세요!' : "'전체 탐색' 탭에서 흥미로운 방을 찾아보세요!")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col bg-white">
        {activeRoom ? (
          <>
            {/* 채팅창 헤더 */}
            <div className="h-20 px-6 border-b border-[var(--nexus-surface-container)] flex items-center justify-between bg-[var(--nexus-surface-lowest)]/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-[var(--nexus-surface-low)] rounded-xl transition-colors md:hidden"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-10 h-10 bg-[var(--nexus-surface-low)] rounded-xl flex items-center justify-center font-bold text-[var(--nexus-primary)] overflow-hidden border border-[var(--nexus-surface-container)]">
                  {activeRoom.imageUrl ? (
                    <img src={activeRoom.imageUrl} alt={activeRoom.title} className="w-full h-full object-cover" />
                  ) : (
                    activeRoom.type === 'GROUP' ? <Hash size={20} /> : <Users size={20} />
                  )}
                </div>
                <div>
                  <h2 className="font-black text-base tracking-tight text-[var(--nexus-on-bg)]">{activeRoom.title}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-[var(--nexus-outline)]'}`}></div>
                    <span className="text-[10px] font-bold text-[var(--nexus-outline)] uppercase tracking-widest">
                      {isConnected ? 'Online' : 'Connecting...'}
                      {activeRoom.participantCount && ` • ${activeRoom.participantCount} Members`}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 메시지 검색 필드 */}
                {isMsgSearchOpen && (
                  <div className="relative animate-in slide-in-from-right-4 fade-in duration-200">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--nexus-outline)]" size={14} />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="대화 내용 검색..."
                      value={msgSearchQuery}
                      onChange={(e) => setMsgSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-[var(--nexus-surface-low)] border-transparent focus:border-[var(--nexus-primary)] rounded-xl text-xs transition-all w-40 sm:w-64 text-[var(--nexus-on-bg)] placeholder:text-[var(--nexus-outline)]"
                    />
                  </div>
                )}

                <button 
                  onClick={() => {
                    setIsMsgSearchOpen(!isMsgSearchOpen);
                    if (isMsgSearchOpen) setMsgSearchQuery('');
                  }}
                  className={`p-2.5 rounded-xl transition-all ${isMsgSearchOpen ? 'bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)]' : 'text-[var(--nexus-outline)] hover:bg-[var(--nexus-surface-low)]'}`}
                  title="메시지 검색"
                >
                  <Search size={20} />
                </button>

                {rooms.find(r => r.id === activeRoomId)?.type === 'GROUP' && (
                  <>
                    <button 
                      onClick={fetchInviteCandidates}
                      className="p-2.5 rounded-xl text-[var(--nexus-primary)] hover:bg-[var(--nexus-surface-low)] transition-all flex items-center gap-2 group"
                      title="멤버 초대하기"
                    >
                      <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold hidden sm:inline">초대</span>
                    </button>
                    <button 
                      onClick={() => setLeaveModalOpen(true)}
                      className="p-2.5 rounded-xl text-[var(--nexus-error)] hover:bg-red-50/10 transition-all flex items-center gap-2 group"
                      title="방 나가기"
                    >
                      <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                      <span className="text-xs font-bold hidden sm:inline">나가기</span>
                    </button>
                  </>
                )}
                <button className="p-2.5 rounded-xl text-[var(--nexus-outline)] hover:bg-[var(--nexus-surface-low)] transition-all">
                  <Info size={20} />
                </button>
              </div>
            </div>

            {/* 메시지 리스트 */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]/50 custom-scrollbar"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-30">
                  <MessageSquare size={48} className="mb-4" />
                  <p className="text-sm font-bold">이 채팅방의 첫 번째 메시지를 보내보세요</p>
                </div>
              )}
              {messages
                .filter(msg => 
                  msg.message.toLowerCase().includes(msgSearchQuery.toLowerCase()) || 
                  msg.senderNickname.toLowerCase().includes(msgSearchQuery.toLowerCase())
                )
                .map((msg, idx) => {
                const isMe = msg.senderId === currentUserId;
                const isSystem = msg.type === 'ENTER' || msg.type === 'LEAVE';
                
                // 이전 메시지가 없거나, 이전 메시지와 보낸 사람이 다르거나, 이전 메시지가 시스템 메시지인 경우 닉네임 표시
                const showNickname = idx === 0 || 
                                    messages[idx-1].senderId !== msg.senderId || 
                                    messages[idx-1].type === 'ENTER' || 
                                    messages[idx-1].type === 'LEAVE';

                if (isSystem) {
                  return (
                    <div key={msg.id || idx} className="flex justify-center my-4">
                      <div className="bg-zinc-100/50 text-zinc-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-zinc-100">
                        {msg.message}
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={msg.id || idx} 
                    className={`flex gap-3 mb-6 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* 프로필 이미지 (상대방일 때만) */}
                    {!isMe && (
                      <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm overflow-hidden ${
                        msg.senderProfileImageUrl ? 'bg-transparent' : 'bg-zinc-100 text-zinc-400'
                      } ${!showNickname ? 'opacity-0' : 'opacity-100'}`}>
                        {msg.senderProfileImageUrl ? (
                          <img src={msg.senderProfileImageUrl} alt={msg.senderNickname} className="w-full h-full object-cover" />
                        ) : (
                          msg.senderNickname[0]
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      {showNickname && (
                        <span className={`text-[11px] font-black text-zinc-900 mb-1.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
                          {msg.senderNickname}
                        </span>
                      )}
                      
                      <div className={`group relative rounded-2xl text-sm font-medium leading-relaxed overflow-hidden ${
                        isMe 
                        ? 'bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] rounded-tr-none shadow-xl shadow-[var(--nexus-primary)]/10' 
                        : 'bg-[var(--nexus-surface-lowest)] text-[var(--nexus-on-bg)] rounded-tl-none shadow-lg shadow-black/5 border border-[var(--nexus-surface-container)]'
                      }`}>
                        {msg.type === 'IMAGE' && msg.fileUrl ? (
                          <div className="flex flex-col">
                            <img 
                              src={msg.fileUrl} 
                              alt="Shared Image" 
                              className="w-full max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setSelectedImageUrl(msg.fileUrl!)}
                            />
                            <div className="px-4 py-2 text-[11px] opacity-70">
                              {msg.message}
                            </div>
                          </div>
                        ) : msg.type === 'FILE' && msg.fileUrl ? (
                          <div className="p-4 flex items-center gap-3 min-w-[200px]">
                            <div className="w-10 h-10 bg-[var(--nexus-surface-low)] rounded-xl flex items-center justify-center text-[var(--nexus-primary)]">
                              <File size={20} />
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-xs font-bold truncate">{msg.fileName}</p>
                              <a 
                                href={msg.fileUrl?.replace('/display/', '/download/')} 
                                download={msg.fileName}
                                className="text-[10px] text-[var(--nexus-secondary)] font-black hover:underline mt-1 flex items-center gap-1"
                              >
                                <Download size={10} /> 다운로드
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 py-3">
                            {msg.message}
                          </div>
                        )}
                      </div>
                      <span className={`mt-1.5 text-[9px] font-bold text-[var(--nexus-outline)] opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
 
            {/* 입력 영역 */}
            <div className="p-6 bg-[var(--nexus-surface-lowest)]">
              <form 
                onSubmit={handleSendMessage}
                className="relative bg-[var(--nexus-surface-container)] rounded-2xl border border-[var(--nexus-surface-container)] p-2 focus-within:bg-[var(--nexus-surface-lowest)] focus-within:border-[var(--nexus-primary)] transition-all flex items-end gap-2 shadow-sm"
              >
                <input 
                  type="file"
                  id="chat-image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileMessageUpload(e)}
                />
                <input 
                  type="file"
                  id="chat-file-upload"
                  className="hidden"
                  onChange={(e) => handleFileMessageUpload(e)}
                />
                <textarea 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  rows={1}
                  className="flex-1 py-3 px-4 bg-transparent border-none focus:ring-0 text-sm resize-none font-medium text-[var(--nexus-on-bg)] placeholder:text-[var(--nexus-outline)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim()}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    inputValue.trim() 
                    ? 'bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] hover:scale-105 active:scale-95 shadow-lg shadow-[var(--nexus-primary)]/20' 
                    : 'bg-[var(--nexus-surface-container-highest)] text-[var(--nexus-outline)]'
                  }`}
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="flex items-center gap-4 mt-3 ml-1">
                <button 
                  type="button"
                  onClick={() => document.getElementById('chat-file-upload')?.click()}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--nexus-outline)] hover:text-[var(--nexus-primary)] transition-colors"
                >
                  <Paperclip size={14} /> 파일 첨부
                </button>
                <button 
                  type="button"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--nexus-outline)] hover:text-[var(--nexus-primary)] transition-colors"
                >
                  <Smile size={14} /> 이모지
                </button>
                <button 
                  type="button"
                  onClick={() => document.getElementById('chat-image-upload')?.click()}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--nexus-outline)] hover:text-[var(--nexus-primary)] transition-colors"
                >
                  <ImageIcon size={14} /> 이미지
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--nexus-outline)] p-12 bg-[var(--nexus-bg)]">
            <div className="w-24 h-24 bg-[var(--nexus-surface-container)] rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
               <MessageSquare size={48} className="opacity-20 text-[var(--nexus-primary)]" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-[var(--nexus-on-bg)] mb-2">대화를 시작해보세요</h3>
            <p className="text-sm font-medium text-[var(--nexus-outline)] max-w-xs text-center leading-relaxed">
              사이드바에서 채팅방을 선택하거나 '+' 버튼을 눌러 새로운 그룹 대화를 시작할 수 있습니다.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--nexus-surface-container-highest);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--nexus-primary-container);
        }
      `}</style>
      {/* 3. 채팅방 생성 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[var(--nexus-on-bg)]/60 backdrop-blur-sm"
            onClick={closeCreateModal}
          />
          <div className="relative bg-[var(--nexus-surface-lowest)] w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-[var(--nexus-surface-container)] animate-in fade-in zoom-in duration-300">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tighter text-[var(--nexus-primary)]">새 채팅방 개설</h2>
              <button 
                onClick={closeCreateModal}
                className="w-10 h-10 rounded-full hover:bg-[var(--nexus-surface-low)] flex items-center justify-center transition-colors"
              >
                <Plus className="rotate-45 text-[var(--nexus-outline)]" size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-8 pt-4 space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-[var(--nexus-outline)] uppercase tracking-widest ml-1">방 이름</label>
                <input 
                  autoFocus
                  type="text"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="예: 마케팅 전략 회의실"
                  className="w-full px-6 py-4 bg-[var(--nexus-surface-low)] border-transparent focus:bg-[var(--nexus-surface-lowest)] focus:border-[var(--nexus-primary)] rounded-2xl text-base font-bold transition-all placeholder:text-[var(--nexus-outline)] text-[var(--nexus-on-bg)]"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-[var(--nexus-outline)] uppercase tracking-widest ml-1">채팅 유형</label>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setNewRoomType('GROUP')}
                    className={`flex-1 p-5 rounded-2xl border-2 transition-all text-left ${
                      newRoomType === 'GROUP' 
                      ? 'border-[var(--nexus-primary)] bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] shadow-xl shadow-[var(--nexus-primary)]/20' 
                      : 'border-[var(--nexus-surface-container)] bg-[var(--nexus-surface-low)] text-[var(--nexus-outline)] hover:border-[var(--nexus-primary)]/30'
                    }`}
                  >
                    <Users size={24} className={newRoomType === 'GROUP' ? 'text-[var(--nexus-on-primary)]' : 'text-[var(--nexus-outline)]'} />
                    <div className="mt-4 font-black text-sm">그룹 채팅</div>
                    <div className={`text-[10px] mt-1 font-bold ${newRoomType === 'GROUP' ? 'text-[var(--nexus-on-primary)]/70' : 'text-[var(--nexus-outline)]'}`}>여러 명과 대화</div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewRoomType('PRIVATE')}
                    className={`flex-1 p-5 rounded-2xl border-2 transition-all text-left ${
                      newRoomType === 'PRIVATE' 
                      ? 'border-[var(--nexus-secondary)] bg-[var(--nexus-secondary)] text-white shadow-xl shadow-[var(--nexus-secondary)]/20' 
                      : 'border-[var(--nexus-surface-container)] bg-[var(--nexus-surface-low)] text-[var(--nexus-outline)] hover:border-[var(--nexus-secondary)]/30'
                    }`}
                  >
                    <Plus size={24} className={newRoomType === 'PRIVATE' ? 'text-white' : 'text-[var(--nexus-outline)]'} />
                    <div className="mt-4 font-black text-sm">1:1 채팅</div>
                    <div className={`text-[10px] mt-1 font-bold ${newRoomType === 'PRIVATE' ? 'text-white/70' : 'text-[var(--nexus-outline)]'}`}>비공개 대화</div>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-[var(--nexus-outline)] uppercase tracking-widest ml-1">방 설명 (선택)</label>
                <textarea 
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="이 채팅방에서 나눌 대화에 대해 간단히 설명해주세요."
                  className="w-full px-6 py-4 bg-[var(--nexus-surface-low)] border-transparent focus:bg-[var(--nexus-surface-lowest)] focus:border-[var(--nexus-primary)] rounded-2xl text-sm font-medium transition-all placeholder:text-[var(--nexus-outline)] text-[var(--nexus-on-bg)] resize-none h-24"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-[var(--nexus-outline)] uppercase tracking-widest ml-1">비밀번호 (선택)</label>
                <input 
                  type="password"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  placeholder="비밀번호 설정 시 입장 시 확인합니다."
                  className="w-full px-6 py-4 bg-[var(--nexus-surface-low)] border-transparent focus:bg-[var(--nexus-surface-lowest)] focus:border-[var(--nexus-primary)] rounded-2xl text-base font-bold transition-all placeholder:text-[var(--nexus-outline)] text-[var(--nexus-on-bg)]"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-[var(--nexus-outline)] uppercase tracking-widest ml-1">프로필 이미지</label>
                <div className="flex items-center gap-6 p-6 bg-[var(--nexus-surface-low)] rounded-2xl border-2 border-dashed border-[var(--nexus-surface-container)] hover:border-[var(--nexus-primary)]/30 transition-all group">
                  <div className="w-20 h-20 rounded-2xl bg-[var(--nexus-surface-lowest)] shadow-sm flex items-center justify-center overflow-hidden border border-[var(--nexus-surface-container)] shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Plus size={24} className="text-[var(--nexus-outline)] group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[var(--nexus-outline)] mb-2">이미지를 선택해주세요</p>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="room-image-upload"
                    />
                    <label 
                      htmlFor="room-image-upload"
                      className="inline-block px-4 py-2 bg-[var(--nexus-surface-lowest)] border border-[var(--nexus-surface-container)] text-[var(--nexus-primary)] rounded-xl text-[11px] font-black hover:bg-[var(--nexus-primary)] hover:text-[var(--nexus-on-primary)] transition-all cursor-pointer shadow-sm"
                    >
                      {isUploading ? '업로드 중...' : '파일 선택'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 py-4 bg-[var(--nexus-surface-container)] text-[var(--nexus-outline)] rounded-2xl font-black text-sm hover:bg-[var(--nexus-surface-container-high)] transition-all active:scale-95"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  disabled={isUploading}
                  className="flex-2 py-4 bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] rounded-2xl font-black text-sm hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-[var(--nexus-primary)]/20 px-12 disabled:opacity-50"
                >
                  {isUploading ? '업로드 중...' : '채팅방 생성하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 4. 이미지 확대 모달 (Lightbox) */}
      {selectedImageUrl && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setSelectedImageUrl(null)}
        >
          <button 
            className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:rotate-90"
            onClick={() => setSelectedImageUrl(null)}
          >
            <Plus className="rotate-45" size={32} />
          </button>
          <div 
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedImageUrl} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
            />
          </div>
        </div>
      )}
      {/* 5. 입장 확인 커스텀 모달 */}
      {confirmModalOpen && joiningRoom && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[var(--nexus-on-bg)]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[var(--nexus-surface-lowest)] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-[var(--nexus-surface-container)]">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-[var(--nexus-surface-low)] rounded-3xl mx-auto mb-6 flex items-center justify-center text-[var(--nexus-primary)] overflow-hidden shadow-inner border border-[var(--nexus-surface-container)]">
                {joiningRoom.imageUrl ? (
                  <img src={joiningRoom.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users size={40} />
                )}
              </div>
              <h3 className="text-xl font-black tracking-tight text-[var(--nexus-primary)] mb-2">{joiningRoom.title}</h3>
              <p className="text-sm text-[var(--nexus-outline)] mb-6 px-4 font-medium">
                {joiningRoom.description || '이 채팅방에 참여하여 대화를 나눠보세요.'}
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--nexus-outline)] font-bold mb-1">현재 인원</span>
                  <span className="text-sm font-black text-[var(--nexus-on-bg)]">{joiningRoom.participantCount || 0}명</span>
                </div>
                <div className="w-[1px] h-8 bg-[var(--nexus-surface-container)]" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--nexus-outline)] font-bold mb-1">방 유형</span>
                  <span className="text-sm font-black text-[var(--nexus-on-bg)]">{joiningRoom.type === 'GROUP' ? '그룹' : '1:1'}</span>
                </div>
              </div>

              {joiningRoom.hasPassword && (
                <div className="space-y-3 mb-8 text-left">
                  <label className="text-xs font-black text-[var(--nexus-outline)] uppercase tracking-widest ml-1">비밀번호 입력</label>
                  <input 
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="이 방의 비밀번호를 입력하세요"
                    className="w-full px-6 py-4 bg-[var(--nexus-surface-low)] border-transparent focus:bg-[var(--nexus-surface-lowest)] focus:border-[var(--nexus-primary)] rounded-2xl text-base font-bold transition-all placeholder:text-[var(--nexus-outline)] text-[var(--nexus-on-bg)]"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setConfirmModalOpen(false);
                    setJoiningRoom(null);
                  }}
                  className="flex-1 py-4 bg-[var(--nexus-surface-container)] hover:bg-[var(--nexus-surface-container-high)] text-[var(--nexus-outline)] font-bold rounded-2xl transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={confirmJoinRoom}
                  className="flex-1 py-4 bg-[var(--nexus-primary)] hover:opacity-90 text-[var(--nexus-on-primary)] font-bold rounded-2xl shadow-lg shadow-[var(--nexus-primary)]/20 transition-all"
                >
                  입장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 6. 퇴장 확인 커스텀 모달 */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[var(--nexus-on-bg)]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[var(--nexus-surface-lowest)] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-[var(--nexus-error)]/20">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-3xl mx-auto mb-6 flex items-center justify-center text-[var(--nexus-error)] shadow-inner">
                <LogOut size={40} />
              </div>
              <h3 className="text-xl font-black text-[var(--nexus-on-bg)] mb-2">채팅방 나가기</h3>
              <p className="text-sm text-[var(--nexus-outline)] mb-8 px-4 leading-relaxed font-medium">
                정말 이 채팅방을 떠나시겠습니까?<br />
                <span className="font-bold text-[var(--nexus-error)]">퇴장 후에는 기존 대화 내역을 볼 수 없으며, 목록에서 삭제됩니다.</span>
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setLeaveModalOpen(false)}
                  className="flex-1 py-4 bg-[var(--nexus-surface-container)] hover:bg-[var(--nexus-surface-container-high)] text-[var(--nexus-outline)] font-bold rounded-2xl transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={confirmLeaveRoom}
                  className="flex-1 py-4 bg-[var(--nexus-error)] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[var(--nexus-error)]/20 transition-all"
                >
                  방 나가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 7. 사용자 초대 모달 */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[var(--nexus-on-bg)]/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[var(--nexus-surface-lowest)] rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-[var(--nexus-surface-container)]">
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-[var(--nexus-primary)]">멤버 초대하기</h2>
                <p className="text-xs font-bold text-[var(--nexus-secondary)] mt-1 uppercase tracking-widest">
                  {selectedUserIds.length}명 선택됨
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setSelectedUserIds([]);
                }}
                className="w-10 h-10 rounded-full hover:bg-[var(--nexus-surface-low)] flex items-center justify-center transition-colors"
              >
                <Plus className="rotate-45 text-[var(--nexus-outline)]" size={24} />
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--nexus-outline)]" size={16} />
                <input 
                  type="text" 
                  placeholder="닉네임 또는 이메일 검색..."
                  className="w-full pl-12 pr-4 py-3 bg-[var(--nexus-surface-low)] border-transparent focus:bg-[var(--nexus-surface-lowest)] focus:border-[var(--nexus-primary)] rounded-2xl text-sm transition-all text-[var(--nexus-on-bg)] placeholder:text-[var(--nexus-outline)] font-medium"
                />
              </div>

              <div className="max-h-[350px] overflow-y-auto px-2 custom-scrollbar">
                {inviteCandidates.length > 0 ? (
                  inviteCandidates.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all mb-1 ${
                        selectedUserIds.includes(user.id) 
                          ? 'bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] shadow-lg shadow-[var(--nexus-primary)]/20' 
                          : 'hover:bg-[var(--nexus-surface-container)] text-[var(--nexus-on-bg)] border border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        selectedUserIds.includes(user.id) ? 'bg-[var(--nexus-primary-container)]' : 'bg-[var(--nexus-surface-low)] text-[var(--nexus-outline)] border border-[var(--nexus-surface-container)]'
                      }`}>
                        {user.nickname[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{user.nickname}</div>
                        <div className={`text-[10px] font-medium ${selectedUserIds.includes(user.id) ? 'text-[var(--nexus-on-primary)]/70' : 'text-[var(--nexus-outline)]'}`}>
                          {user.email}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedUserIds.includes(user.id) 
                          ? 'border-[var(--nexus-on-primary)] bg-[var(--nexus-on-primary)]' 
                          : 'border-[var(--nexus-outline)]/30'
                      }`}>
                        {selectedUserIds.includes(user.id) && <div className="w-2.5 h-2.5 bg-[var(--nexus-primary)] rounded-full animate-in zoom-in duration-200" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-[var(--nexus-outline)]">
                    <Users size={32} className="mx-auto mb-3 opacity-20 text-[var(--nexus-primary)]" />
                    <p className="text-xs font-bold">초대 가능한 사용자가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 pt-4 flex gap-3">
              <button 
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setSelectedUserIds([]);
                }}
                className="flex-1 py-4 bg-[var(--nexus-surface-container)] hover:bg-[var(--nexus-surface-container-high)] text-[var(--nexus-outline)] font-bold rounded-2xl transition-all"
              >
                취소
              </button>
              <button 
                disabled={selectedUserIds.length === 0 || isInviting}
                onClick={handleInviteUsers}
                className={`flex-2 px-8 py-4 rounded-2xl font-black text-sm shadow-xl transition-all active:scale-95 ${
                  selectedUserIds.length > 0 
                    ? 'bg-[var(--nexus-primary)] text-[var(--nexus-on-primary)] shadow-[var(--nexus-primary)]/20 hover:opacity-90' 
                    : 'bg-[var(--nexus-surface-container)] text-[var(--nexus-outline)] shadow-none cursor-not-allowed'
                }`}
              >
                {isInviting ? '초대 중...' : `${selectedUserIds.length}명 초대하기`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
