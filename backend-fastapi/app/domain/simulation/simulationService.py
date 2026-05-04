from datetime import date
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from xgboost import XGBClassifier
from huggingface_hub import hf_hub_download
from app.domain.simulation.simulationSchema import PredictionRequest, PredictionResponse
import os
import joblib
import numpy as np
import pandas as pd
import unicodedata
from app.models import AdministrativeBoundary, RegionCode

REPO_ID = os.environ.get("HF_REPO_ID")
TOKEN   = os.environ.get("HF_TOKEN")

_bundle           = joblib.load(hf_hub_download(repo_id=REPO_ID, filename="best_model_v7_metadata.joblib", token=TOKEN))
_freq_map         = _bundle["freq_map"]
_industry_map     = _bundle["업종_매핑"]
_industry_columns = _bundle["업종_columns"]
_best_model_name  = _bundle["best_model_name"]
FEATURE_ORDER     = _bundle["feature_names"]

_model_path = hf_hub_download(repo_id=REPO_ID, filename=_bundle["core_model_path"], token=TOKEN)
if _best_model_name == "XGBoost":
    _model = XGBClassifier()
    _model.load_model(_model_path)
    _model.n_classes_ = 2
else:
    _model = joblib.load(_model_path)

THRESHOLD = 0.35
_industry_list = [v.replace("업종_", "") for v in set(_industry_map.values())]

GU_CACHE = {"map": {}, "initialized": False}

async def initialize_gu_cache(db: AsyncSession):
    """region_codes를 region_code 오름차순으로 로드해 adm_cd 앞 4자리와 매핑합니다.
    서울 구 코드(11xxx)의 INSERT 순서가 adm_cd 앞 4자리(1101~1125) 순번과 일치합니다."""
    if GU_CACHE["initialized"]:
        return
    result = await db.execute(
        select(RegionCode)
        .where(RegionCode.city_name == "서울특별시")
        .order_by(RegionCode.region_code)
    )
    for i, rc in enumerate(result.scalars().all(), 1):
        adm4 = f"11{i:02d}"
        GU_CACHE["map"][adm4] = rc.county_name
    GU_CACHE["initialized"] = True
    print("[GU_CACHE]", GU_CACHE["map"]) 


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def _centroid(boundary) -> tuple[float, float]:
    coords = boundary[0] if isinstance(boundary[0][0], list) else boundary
    xs = [p[0] for p in coords]
    ys = [p[1] for p in coords]
    return float(np.mean(xs)), float(np.mean(ys))


def _build_features(cx: float, cy: float, gu: str, dong: str, industry: str, open_date: date) -> pd.DataFrame:
    dt        = pd.Timestamp(open_date)
    month     = dt.month
    dayofweek = dt.dayofweek + 1
    row = {
        "개방자치단체코드": 0,
        "X_log":     np.log1p(max(cx, 0)),
        "Y_log":     np.log1p(max(cy, 0)),
        "Year":      2019,
        "Quarter":   dt.quarter,
        "Month_sin": np.sin(2 * np.pi * month / 12),
        "Month_cos": np.cos(2 * np.pi * month / 12),
        "Day_sin":   np.sin(2 * np.pi * dayofweek / 7),
        "Day_cos":   np.cos(2 * np.pi * dayofweek / 7),
        "구_freq":   _freq_map["구"].get(gu, 0.0),
        "동_freq":   _freq_map["동"].get(dong, 0.0),
    }
    nfc_industry = _nfc(industry)
    for col in _industry_columns:
        row[col] = 1.0 if _nfc(_industry_map.get(col, "").replace("업종_", "")) == nfc_industry else 0.0
    return pd.DataFrame([row])[FEATURE_ORDER]


async def predict_survival(db: AsyncSession, request: PredictionRequest) -> PredictionResponse:
    if request.industry not in _industry_list:
        raise HTTPException(status_code=400, detail=f"지원하지 않는 업종입니다. 가능 업종: {_industry_list}")

    if not GU_CACHE["initialized"]:
        await initialize_gu_cache(db)

    result = await db.execute(select(AdministrativeBoundary).where(AdministrativeBoundary.adm_cd == request.adm_cd))
    ab = result.scalar_one_or_none()
    if not ab:
        raise HTTPException(status_code=404, detail=f"행정동을 찾을 수 없습니다. (adm_cd={request.adm_cd})")

    gu = GU_CACHE["map"].get(request.adm_cd[:4], "unknown")

    cx, cy = _centroid(ab.boundary)
    dt     = pd.Timestamp(request.open_date)
    X      = _build_features(cx, cy, gu, ab.adm_nm, request.industry, request.open_date)
    prob   = float(_model.predict_proba(X)[0][1])
    pred   = prob >= THRESHOLD
    label  = "caution" if pred else "stable"

    dong_freq = _freq_map["동"].get(ab.adm_nm, 0)

    factors = [
        f"{gu} 지역 내 {request.industry}의 전반적인 장기 생존 지표를 반영하였습니다.",
        f"선택하신 {dt.month}월의 업종별 계절 소비 패턴이 분석에 포함되었습니다.",
    ]

    if pred:
        factors.append(
            f"{ab.adm_nm} 내 동일 업종 밀집도가 {dong_freq*100:.1f}%로 타 지역 대비 높습니다."
            if dong_freq > 0.01 else
            f"{ab.adm_nm} 지역의 유동인구 대비 해당 업종의 결제 전환율이 다소 낮게 예측됩니다."
        )
        msg = f"{ab.adm_nm} {request.industry} 창업은 현재 데이터 분석 상 '주의' 단계입니다."
    else:
        factors.append(
            f"{ab.adm_nm} 지역은 동일 업종 밀집도가 낮아 상권 진입에 유리한 조건입니다."
            if dong_freq < 0.01 else
            f"{ab.adm_nm} 지역의 해당 업종 소비 활성도가 안정적인 구간에 진입해 있습니다."
        )
        msg = f"{ab.adm_nm} {request.industry} 창업은 현재 데이터 분석 상 '안정' 단계입니다."

    return PredictionResponse(
        risk_score = round(prob * 100, 1),
        label      = label,
        label_kor  = "주의" if pred else "안정",
        industry   = request.industry,
        dong       = ab.adm_nm,
        gu         = gu,
        open_date  = str(request.open_date),
        message    = msg,
        threshold  = THRESHOLD,
        factors    = factors,
    )