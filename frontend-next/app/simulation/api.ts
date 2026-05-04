import { api } from '@/lib/api';
import { SimSearchListDto, ProcessedRealEstateDto, EquipPriceResponseDto } from './types';

const BASE = '/api/v1/sim';

/** 업종 / 지역 검색 목록 */
export async function fetchSearchList(): Promise<SimSearchListDto> {
  const res = await api.get(`${BASE}/search-list`);
  return res.json();
}

/** 부동산 실거래 예측 */
export async function fetchRealEstate(regionCode: number): Promise<ProcessedRealEstateDto[]> {
  const res = await api.get(`${BASE}/real-estate`, {
    params: { regionCode: String(regionCode) }
  });
  return res.json();
}

/** 설비 가격 리스트 */
export async function fetchEquipPrice(ksicCode: string): Promise<EquipPriceResponseDto> {
  const res = await api.get(`${BASE}/equip-price`, {
    params: { ksicCode }
  });
  return res.json();
}
