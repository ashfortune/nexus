import { api } from '@/lib/api';
import type { SubsidyDetail, SubsidyFilterRequest, SubsidyListResponse } from './subsidyTypes';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export async function fetchSubsidies(payload: SubsidyFilterRequest) {
  const res = await api.post('/api/v1/ai/subsidy/recommend', payload, {
    baseUrl: FASTAPI_URL,
    cache: 'no-store',
  } as any); // cache is not in RequestOptions but handled by fetch options spread

  return res.json();
}

export async function fetchSubsidyDetail(id: string) {
  const res = await api.get(`/api/v1/ai/subsidy/detail/${id}`, {
    baseUrl: FASTAPI_URL,
    cache: 'no-store',
  } as any);

  return res.json();
}
