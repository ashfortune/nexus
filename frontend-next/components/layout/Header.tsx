'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface SubMenu {
  name: string;
  href: string;
  allowedRoles?: number[];
}

interface MenuItem {
  id: string;
  title: string;
  hasSub: boolean;
  href?: string;
  subMenu?: SubMenu[];
  allowedRoles?: number[];
}

const MENU_DATA: MenuItem[] = [
  {
    id: 'analysis',
    title: '창업 분석',
    hasSub: true,
    subMenu: [
      { name: '창업 비용 시뮬레이션', href: '/simulation' },
      { name: '상권 분석 지도', href: '/store-map' },
    ],
  },
  { id: 'subsidy', title: '지원금 찾기', hasSub: false, href: '/subsidy', allowedRoles: [0, 1, 2] },
  { id: 'creative', title: 'AI 브랜딩', hasSub: false, href: '/branding', allowedRoles: [1, 2] },
  {
    id: 'compliance',
    title: '창업 가이드',
    hasSub: true,
    allowedRoles: [0, 1, 2],
    subMenu: [
      { name: '서류 가이드', href: '/license', allowedRoles: [0, 1, 2] },
      { name: '고용 가이드', href: '/worker', allowedRoles: [0, 1, 2] },
    ],
  },
  {
    id: 'community',
    title: '커뮤니티',
    hasSub: true,
    href: '/board',
    allowedRoles: [0, 1, 2],
    subMenu: [
      { name: '자유 게시판', href: '/board', allowedRoles: [0, 1, 2] },
      { name: '지역별 게시판', href: '/region-board', allowedRoles: [0, 1, 2] },
      { name: '업종별 게시판', href: '/industry-board', allowedRoles: [0, 1, 2] },
      { name: '전문가 매칭', href: '/expert', allowedRoles: [1, 2] },
    ],
  },
  { id: 'group-purchases', title: '공동구매', hasSub: false, href: '/group-purchases', allowedRoles: [0, 1, 2] },
];

export default function Header() {
  const { user, isAuthenticated, clearAuth, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 권한에 따른 메뉴 필터링
  const filteredMenus = useMemo(() => {
    // 비로그인 상태일 때는 전체 노출 (클릭 시 가드에서 처리)
    if (!isAuthenticated) return MENU_DATA;

    const userType = user?.userType ?? 0;

    return MENU_DATA.filter(menu => {
      // 메인 메뉴 권한 체크
      const isMenuAllowed = !menu.allowedRoles || menu.allowedRoles.includes(userType);
      if (!isMenuAllowed) return false;

      // 서브 메뉴 권한 필터링
      if (menu.subMenu) {
        menu.subMenu = menu.subMenu.filter(sub => 
          !sub.allowedRoles || sub.allowedRoles.includes(userType)
        );
      }
      return true;
    });
  }, [isAuthenticated, user?.userType]);

  const handleMenuHover = (menuId: string | null, hasSub: boolean) => {
    if (hasSub) {
      setActiveMenu(menuId);
      setIsProfileOpen(false);
    } else {
      setActiveMenu(null);
    }
  };

  const toggleProfile = () => {
    const nextState = !isProfileOpen;
    setIsProfileOpen(nextState);
    if (nextState) setActiveMenu(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    clearAuth();
    window.location.href = '/';
  };

  return (
    <header className="relative w-full bg-[var(--nexus-surface-lowest)] border-b border-[var(--nexus-outline-variant)] z-[100]">
      <div className="max-w-[1440px] mx-auto h-20 px-6 md:px-8 flex items-center justify-between">
        <div className="w-[100px] lg:w-[160px] shrink-0">
          <Link
            href="/"
            className="text-xl md:text-2xl font-black tracking-tighter text-[var(--nexus-primary)]"
          >
            NEXUS
          </Link>
        </div>

        <nav className="hidden lg:block flex-grow h-full">
          {mounted && _hasHydrated ? (
            <ul className="grid grid-cols-6 h-full items-center">
              {filteredMenus.map((menu) => (
                <li
                  key={menu.id}
                  className="relative flex items-center justify-center h-full cursor-pointer"
                  onMouseEnter={() => handleMenuHover(menu.id, menu.hasSub)}
                >
                  <Link
                    href={menu.href || '#'}
                    className={`text-[15px] xl:text-[16px] font-bold whitespace-nowrap transition-colors ${activeMenu === menu.id ? 'text-[var(--nexus-primary)]' : 'text-[var(--nexus-on-bg)]'}`}
                  >
                    {menu.title}
                  </Link>
                  {activeMenu === menu.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] bg-[var(--nexus-primary)]" />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-full w-full" />
          )}
        </nav>

        <div
          className="w-[100px] lg:w-[160px] shrink-0 flex items-center justify-end gap-3"
          ref={profileRef}
        >
          {mounted && _hasHydrated ? (
            <>
              {!isAuthenticated ? (
                <Link
                  href="/auth/login"
                  className="whitespace-nowrap text-sm font-bold text-[var(--nexus-primary)] px-4 py-2 border border-[var(--nexus-primary)] rounded hover:bg-[var(--nexus-primary)] hover:text-white transition-colors"
                >
                  로그인
                </Link>
              ) : (
                <div className="relative flex items-center">
                  <button
                    onClick={toggleProfile}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-[var(--nexus-outline-variant)] overflow-hidden bg-white flex items-center justify-center shadow-sm"
                  >
                    {user?.profileImage ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${user.profileImage}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-black text-[var(--nexus-primary)]">
                        {user?.nickname?.[0] || 'P'}
                      </span>
                    )}
                  </button>
                  {isProfileOpen && (
                    <div className="absolute right-0 top-14 w-52 bg-white border border-[var(--nexus-outline-variant)] shadow-xl rounded-md overflow-hidden z-[110]">
                      <div className="px-5 py-3.5 text-sm text-gray-400 border-b border-gray-100 bg-gray-50/50">
                        <span className="font-bold text-[var(--nexus-primary)]">{user?.nickname}</span>님
                        환영합니다
                      </div>
                      <Link
                        href={user?.userType === 2 ? '/mypage/admin' : '/mypage'}
                        className="block px-5 py-3.5 text-sm hover:bg-gray-50 border-b border-gray-100"
                      >
                        {user?.userType === 2 ? '⚙️ 관리자 콘솔' : 'ℹ️ 프로필'}
                      </Link>
                      {user?.userType === 2 && (
                        <Link
                          href="/mypage"
                          className="block px-5 py-3.5 text-sm hover:bg-gray-50 border-b border-gray-100 text-gray-500"
                        >
                          ℹ️ 프로필
                        </Link>
                      )}
                      <Link
                        href="/chat"
                        className="block px-5 py-3.5 text-sm hover:bg-gray-50 border-b border-gray-100"
                      >
                        💬 채팅하기
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3.5 text-sm text-red-500 hover:bg-red-50 font-semibold"
                      >
                        🚣 로그아웃
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                className="lg:hidden p-2 text-[var(--nexus-primary)]"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="메뉴 열기"
              >
                <span className="text-2xl leading-none">{isMobileMenuOpen ? '✕' : '☰'}</span>
              </button>
            </>
          ) : (
            <div className="h-10 w-10" />
          )}
        </div>
      </div>

      {mounted && _hasHydrated && (
        <div
          onMouseLeave={() => setActiveMenu(null)}
          className={`hidden lg:block absolute top-20 left-0 w-full bg-[var(--nexus-surface-lowest)] border-b border-[var(--nexus-outline-variant)] shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${activeMenu ? 'max-h-[250px] opacity-100 py-8' : 'max-h-0 opacity-0 py-0'}`}
        >
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 flex items-start justify-between">
            <div className="w-[160px] shrink-0" />
            <div className="flex-grow grid grid-cols-6">
              {filteredMenus.map((menu) => (
                <div key={menu.id} className="flex flex-col items-center">
                  {activeMenu === menu.id && menu.hasSub && (
                    <ul className="flex flex-col gap-4 text-center">
                      {menu.subMenu?.map((sub, sIdx) => (
                        <li key={sIdx}>
                          <Link
                            href={sub.href}
                            className="text-[14px] text-gray-500 hover:text-[var(--nexus-primary)] hover:underline underline-offset-4 font-medium whitespace-nowrap"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div className="w-[160px] shrink-0" />
          </div>
        </div>
      )}
      {/* ── 모바일 사이드바 드로어 ── */}
      {mounted && isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[200]" onClick={() => setIsMobileMenuOpen(false)}>
          {/* 오버레이 */}
          <div className="absolute inset-0 bg-black/40" />
          {/* 드로어 패널 */}
          <div
            className="absolute right-0 top-0 h-full w-72 bg-[var(--nexus-surface-lowest)] shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 h-20 border-b border-[var(--nexus-outline-variant)]">
              <span className="text-xl font-black tracking-tighter text-[var(--nexus-primary)]">
                NEXUS
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-[var(--nexus-on-bg)]"
              >
                <span className="text-2xl leading-none">✕</span>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              {filteredMenus.map((menu) => (
                <div key={menu.id} className="border-b border-[var(--nexus-outline-variant)]/30">
                  {menu.hasSub ? (
                    <>
                      <div className="px-6 py-4 text-[15px] font-bold text-[var(--nexus-on-bg)]">
                        {menu.title}
                      </div>
                      {menu.subMenu?.map((sub, sIdx) => (
                        <Link
                          key={sIdx}
                          href={sub.href}
                          className="block px-10 py-3 text-sm text-gray-500 hover:text-[var(--nexus-primary)] hover:bg-[var(--nexus-surface-low)]"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      href={menu.href || '#'}
                      className="block px-6 py-4 text-[15px] font-bold text-[var(--nexus-on-bg)] hover:text-[var(--nexus-primary)] hover:bg-[var(--nexus-surface-low)]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {menu.title}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
            <div className="px-6 py-6 border-t border-[var(--nexus-outline-variant)]">
              {!isAuthenticated ? (
                <Link
                  href="/auth/login"
                  className="block w-full text-center py-3 text-sm font-bold text-[var(--nexus-primary)] border border-[var(--nexus-primary)] rounded-lg hover:bg-[var(--nexus-primary)] hover:text-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  로그인
                </Link>
              ) : (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 text-sm font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  🚣 로그아웃
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
