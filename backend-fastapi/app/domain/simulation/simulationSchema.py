from datetime import date
from pydantic import BaseModel


class PredictionRequest(BaseModel):
    industry: str  # 업종명
    adm_cd: str  # 8자리 행정코드
    open_date: date  # 영업 날짜


class PredictionResponse(BaseModel):
    risk_score: float
    label: str  # 'stable' | 'caution'
    label_kor: str  # '안정' | '주의'
    industry: str
    dong: str
    gu: str
    open_date: str
    message: str
    threshold: float
    factors: list[str]
    # 추가 상세 지표
    trdar_count: int | None = None
    trdar_area_sum: float | None = None
    trdar_area_mean: float | None = None
    dist_to_trdar: float | None = None
    type_diversity: int | None = None
    trdar_type: str | None = None
