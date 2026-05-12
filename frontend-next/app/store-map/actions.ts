'use server';

import { api } from '@/lib/api';

export async function fetchStoresData(regionCode: string, ksicCode: string) {
  console.log(`[Server Action] Fetching stores for Region: ${regionCode}, KSIC: ${ksicCode}`);
  try {
    const res = await api.get(`/api/v1/sim/stores?signguCd=${regionCode}&semasKsicCode=${ksicCode}`, {
      cache: 'no-store',
    });
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch stores data from backend:', error);
    return null;
  }
}
