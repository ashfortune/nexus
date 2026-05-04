"use client";

import dynamic from 'next/dynamic';

// ChatComponent를 클라이언트 사이드에서만 로드하도록 설정 (Dynamic Import)
// Turbopack Panic을 방지하기 위해 브라우저 전용 라이브러리(SockJS 등)가 포함된 컴포넌트를 분리합니다.
const ChatComponent = dynamic(() => import('./ChatComponent'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="text-xl font-medium">채팅방을 불러오는 중...</p>
      </div>
    </div>
  )
});

export default function ChatPage() {
  return <ChatComponent />;
}
