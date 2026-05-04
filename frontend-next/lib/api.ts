import { useAuthStore } from '@/store/useAuthStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * 모든 API 요청을 처리하는 베이스 함수입니다.
 * 1. 환경변수 기반의 BASE_URL을 적용합니다.
 * 2. useAuthStore에서 토큰을 자동으로 읽어와 Bearer 헤더에 추가합니다.
 * 3. FormData가 아닐 경우 기본 Content-Type을 application/json으로 설정합니다.
 */
async function request(path: string, options: RequestOptions = {}) {
  const { token } = useAuthStore.getState();
  
  const headers = new Headers(options.headers);
  
  // 토큰이 존재하면 Authorization 헤더에 추가
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // FormData가 아닐 때만 Content-Type을 application/json으로 설정
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // URL 생성 (파라미터 포함)
  const url = new URL(`${BASE_URL}${path}`);
  if (options.params) {
    Object.keys(options.params).forEach(key => 
      url.searchParams.append(key, options.params![key])
    );
  }

  try {
    const response = await fetch(url.toString(), {
      ...options,
      headers,
    });

    // 401 Unauthorized 처리 (세션 만료 등)
    if (response.status === 401) {
      console.warn('인증이 만료되었거나 권한이 없습니다.');
      // 필요 시 이곳에서 로그아웃 처리 및 로그인 페이지 리다이렉트 가능
      // useAuthStore.getState().clearAuth();
    }

    return response;
  } catch (error) {
    console.error('API 요청 중 오류 발생:', error);
    throw error;
  }
}

export const api = {
  get: (path: string, options?: RequestOptions) => 
    request(path, { ...options, method: 'GET' }),
    
  post: (path: string, body?: any, options?: RequestOptions) => 
    request(path, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  put: (path: string, body?: any, options?: RequestOptions) => 
    request(path, { 
      ...options, 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
  delete: (path: string, options?: RequestOptions) => 
    request(path, { ...options, method: 'DELETE' }),
};
