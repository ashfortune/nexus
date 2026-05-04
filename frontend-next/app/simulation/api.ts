import {
  SimSearchListDto,
  ProcessedRealEstateDto,
  EquipPriceResponseDto,
} from "./types";

const BASE = "/simulation/api/proxy?path=/api/v1/sim";

/** 업종 / 지역 검색 목록 */
export async function fetchSearchList(): Promise<SimSearchListDto> {
  const res = await fetch(`${BASE}/search-list`);
  if (!res.ok) throw new Error(`search-list 요청 실패: ${res.status}`);
  return res.json();
}

/** 부동산 실거래 예측 */
export async function fetchRealEstate(
  regionCode: number
): Promise<ProcessedRealEstateDto[]> {
  const res = await fetch(`${BASE}/real-estate&regionCode=${regionCode}`);
  if (!res.ok) throw new Error(`real-estate 요청 실패: ${res.status}`);
  return res.json();
}

/** 설비 가격 리스트 */
export async function fetchEquipPrice(
  ksicCode: string
): Promise<EquipPriceResponseDto> {
  const res = await fetch(`${BASE}/equip-price&ksicCode=${ksicCode}`);
  if (!res.ok) throw new Error(`equip-price 요청 실패: ${res.status}`);
  return res.json();
}
