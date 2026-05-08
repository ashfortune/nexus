import { api } from '@/lib/api';

export async function getCategories(parentId?: string) {
  const url = parentId
    ? `/api/v1/industry/categories/${parentId}`
    : `/api/v1/industry/categories`;

  const res = await api.get(url);
  return res.json();
}

export async function getSurveys(industryId: string) {
  try {
    const res = await api.get(`/api/v1/industry/${industryId}/surveys`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch surveys:', error);
    return [];
  }
}

export async function createChecklist(payload: any) {
  const res = await api.post('/api/v1/checklist/create', payload);
  return res.json();
}

export async function updateStep(progressId: string, payload: any) {
  await api.patch(`/api/v1/checklist/${progressId}/step`, payload);
}
