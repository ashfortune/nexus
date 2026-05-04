// ──────────────────────────────────────────────
// /api/v1/sim/search-list
// ──────────────────────────────────────────────
export interface SimIndustCatsDto {
  industryName: string;
  ksicCode: string;
}

export interface SimRegCodesDto {
  regionCode: number;
  cityName: string;
  countyName: string;
}

export interface SimSearchListDto {
  indust_cats: SimIndustCatsDto[];
  reg_codes: SimRegCodesDto[];
}

// ──────────────────────────────────────────────
// /api/v1/sim/real-estate?regionCode={code}
// ──────────────────────────────────────────────
export interface ProcessedRealEstateDto {
  buildingAr: string | null;
  landUse: string | null;
  buildingType: string | null;
  buildingUse: string | null;
  floor: string | null;
  address: string | null;
  dealAmount: number | null;
  pricePerPyeong: number | null;
  dealDate: string | null;
  buildAge: number | null;
  isWithin100M: boolean | null;
}

// ──────────────────────────────────────────────
// /api/v1/sim/equip-price?ksicCode={code}
// ──────────────────────────────────────────────
export interface EquipPriceItem {
  equip_name_kr: string;
  equip_name_eng: string;
  product_name: string;
  product_price: number;
  detail: string;
  link: string | null;
  imageUrl: string | null;
  source: string;
}

export interface EquipPriceResponseDto {
  industry_name: string;
  essential_equip_cnt: number;
  naver_sources_cnt: number;
  rag_sources_cnt: number;
  llm_sources_cnt: number;
  human_sources_cnt: number;
  equip_prices: EquipPriceItem[];
}

// ──────────────────────────────────────────────
// UI 내부용 (수량 조정 포함)
// ──────────────────────────────────────────────
export interface EquipPriceItemWithQty extends EquipPriceItem {
  qty: number; // 기본 1
}
