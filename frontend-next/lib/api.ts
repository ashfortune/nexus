import { useAuthStore } from '@/store/useAuthStore';

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  baseUrl?: string;
}

/**
 * 모든 API 요청을 처리하는 베이스 함수입니다.
 */
async function request(path: string, options: RequestOptions = {}) {
  const { token, clearAuth } = useAuthStore.getState();
  const { baseUrl, params, ...fetchOptions } = options;
  
  const headers = new Headers(fetchOptions.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // URL 생성
  const base = baseUrl || DEFAULT_BASE_URL;
  const url = path.startsWith('http') ? new URL(path) : new URL(`${base}${path}`);
  
  if (params) {
    Object.keys(params).forEach(key => 
      url.searchParams.append(key, params[key])
    );
  }

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    });

    if (response.status === 401) {
      console.warn('인증이 만료되었거나 권한이 없습니다. 로그아웃 처리합니다.');
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `API 요청 실패: ${response.status}`);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
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
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
    }),
    
  put: (path: string, body?: any, options?: RequestOptions) => 
    request(path, { 
      ...options, 
      method: 'PUT', 
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
    }),

  patch: (path: string, body?: any, options?: RequestOptions) => 
    request(path, { 
      ...options, 
      method: 'PATCH', 
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined)
    }),
    
  delete: (path: string, options?: RequestOptions) => 
    request(path, { ...options, method: 'DELETE' }),
};
