import os
import unicodedata
from datetime import date

import joblib
import numpy as np
import pandas as pd
from fastapi import HTTPException
from huggingface_hub import hf_hub_download
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import xgboost as xgb

from app.domain.simulation.simulationSchema import PredictionRequest, PredictionResponse
from app.models import AdministrativeBoundary, RegionCode

# ── 전역 변수 (v14 전용) ──────────────────────────────────────
_xgboost_model        = None   # XGBClassifier
_xgboost_meta         = None   # joblib dict 전체
_xgboost_biz_cols     = None   # ['업종_노래연습장업', ...]
_xgboost_biz_names    = None   # ['노래연습장업', ...]
_xgboost_target_maps  = None   # target_maps 서브딕셔너리
_xgboost_global_mean  = None   # float
_xgboost_feature_order = None  # list[str], 31개
_xgboost_threshold    = None   # float (0.3961)
_xgboost_coord_medians = None  # {'X': float, 'Y': float}

_XGBOOST_PANDEMIC_START = pd.Timestamp('2020-03-11')
_XGBOOST_PANDEMIC_END   = pd.Timestamp('2023-05-05')

# ── GU_CACHE: adm_cd 앞 4자리 → 구명, region_code → 개방자치단체코드 ──
GU_CACHE = {
    "gu_name":    {},   # '1101' → '종로구'
    "gov_code":   {},   # '1101' → 11010000  (region_code 기반)
    "initialized": False,
}


def _get_model_file(filename: str) -> str:
    """로컬 pd_models 디렉토리 우선, 없으면 HuggingFace에서 다운로드."""
    REPO_ID = os.environ.get("HF_REPO_ID")
    TOKEN   = os.environ.get("HF_TOKEN")

    local_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "../../pd_models", filename
    )
    if os.path.exists(local_path):
        return local_path
    return hf_hub_download(repo_id=REPO_ID, filename=filename, token=TOKEN)


def _load_xgboost_model():
    """v14 모델과 메타데이터를 Lazy Loading으로 불러옵니다."""
    global _xgboost_model, _xgboost_meta, _xgboost_biz_cols, _xgboost_biz_names, \
           _xgboost_target_maps, _xgboost_global_mean, _xgboost_feature_order, \
           _xgboost_threshold, _xgboost_coord_medians

    if _xgboost_model is not None:
        return

    try:
        # 1. 메타데이터 로드
        meta_path  = _get_model_file("xgboost_metadata.joblib")
        _xgboost_meta  = joblib.load(meta_path)

        _xgboost_biz_cols      = _xgboost_meta["biz_cols"]       # ['업종_노래연습장업', ...]
        _xgboost_biz_names     = _xgboost_meta["biz_names"]      # ['노래연습장업', ...]
        _xgboost_target_maps   = _xgboost_meta["target_maps"]
        _xgboost_global_mean   = float(_xgboost_target_maps["global_mean"])
        _xgboost_feature_order = _xgboost_meta["feature_names"]  # 31개, 순서 고정
        _xgboost_threshold     = float(_xgboost_meta["best_threshold"])
        _xgboost_coord_medians = _xgboost_meta["coord_medians"]  # {'X': float, 'Y': float}

        # 2. XGBoost 모델 로드 (Raw Booster 사용)
        model_path = _get_model_file("xgboost_model.json")
        _xgboost_model = xgb.Booster()
        _xgboost_model.load_model(model_path)

        source = "Local" if "pd_models" in model_path else "HuggingFace"
        print(f"✅ [v14] XGBoost 모델 로드 완료 (Source: {source})")
        print(f"   threshold={_xgboost_threshold:.4f}, features={len(_xgboost_feature_order)}개")

    except Exception as e:
        print(f"❌ [v14] 모델 로드 실패: {e}")
        raise e


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


async def initialize_gu_cache(db: AsyncSession):
    """
    region_codes를 로드해 adm_cd 앞 4자리(또는 5자리) → 구명 / 개방자치단체코드를 매핑합니다.
    """
    if GU_CACHE["initialized"]:
        return

    result = await db.execute(
        select(RegionCode)
        .where(RegionCode.city_name == "서울특별시")
        .order_by(RegionCode.region_code)
    )
    rows = result.scalars().all()

    for i, rc in enumerate(rows, 1):
        # 1. 실제 법정동 코드 앞자리 매핑 (예: 11110 -> 1111)
        code_str = str(rc.region_code)
        if len(code_str) >= 4:
            prefix = code_str[:4]
            GU_CACHE["gu_name"][prefix] = _nfc(rc.county_name)
            GU_CACHE["gov_code"][prefix] = int(rc.region_code)
        
        # 2. 순차적 코드 매핑 (예: 1, 2, 3번째 구 -> 1101, 1102, 1103)
        adm4_seq = f"11{i:02d}"
        GU_CACHE["gu_name"][adm4_seq] = _nfc(rc.county_name)
        GU_CACHE["gov_code"][adm4_seq] = int(rc.region_code)

    GU_CACHE["initialized"] = True
    print(f"DEBUG: GU_CACHE keys: {list(GU_CACHE['gu_name'].keys())}")
    print(f"[GU_CACHE] 구 매핑 {len(GU_CACHE['gu_name'])}개 초기화 완료 (서울 25개구 x 2타입)")


def _centroid(boundary) -> tuple[float | None, float | None]:
    """GeoJSON boundary (Polygon/MultiPolygon/Point)의 중심점(WGS84 또는 미터)을 계산합니다."""
    try:
        if isinstance(boundary, dict):
            coords = boundary.get("coordinates", [])
        else:
            coords = boundary

        if not coords:
            return None, None

        # 좌표 평탄화: 모든 [x, y] 쌍을 추출
        def flatten(l):
            if not isinstance(l, list):
                return []
            if len(l) >= 2 and all(isinstance(i, (int, float)) for i in l[:2]):
                return [l[:2]]
            res = []
            for i in l:
                res.extend(flatten(i))
            return res

        flat_coords = flatten(coords)
        if not flat_coords:
            return None, None

        xs = [float(p[0]) for p in flat_coords]
        ys = [float(p[1]) for p in flat_coords]
        
        return float(np.mean(xs)), float(np.mean(ys))
    except Exception as e:
        print(f"⚠️ [_centroid] 좌표 계산 중 오류: {e}")
        return None, None


def _ensure_meters(cx: float | None, cy: float | None) -> tuple[float, float]:
    """
    좌표가 위경도(WGS84)인 경우에만 미터(EPSG:5181)로 변환하고, 
    이미 미터 좌표계인 경우(>1000) 그대로 반환하여 중복 변환을 방지합니다.
    """
    if cx is None or cy is None:
        return 200000.0, 450000.0 # 서울 중심 기본값 (미터)

    # 위경도 범위 (대한민국: 120~135, 30~45) 내에 있으면 WGS84로 판단
    if 120 < cx < 135 and 30 < cy < 45:
        # WGS84 -> EPSG:5181 (서울 지역 근사)
        x = (cx - 127.0) * 88242.9 + 200000.0
        y = (cy - 38.0) * 111120.0 + 500000.0
        return x, y
    
    # 이미 미터 단위 좌표이거나 범위를 벗어난 경우 그대로 반환
    return cx, cy


def _xgboost_covid_flags(open_date: date) -> tuple[float, float, float]:
    """
    팬데믹 플래그 계산.
    Returns: (before_pandemic, during_pandemic, after_pandemic)
    """
    dt = pd.Timestamp(open_date)
    if dt < _XGBOOST_PANDEMIC_START:
        return 1.0, 0.0, 0.0
    elif dt < _XGBOOST_PANDEMIC_END:
        return 0.0, 1.0, 0.0
    else:
        return 0.0, 0.0, 1.0


def _build_xgboost_features(
    cx: float,
    cy: float,
    gu: str,
    dong: str,
    industry: str,
    open_date: date,
    gov_code: int,
) -> pd.DataFrame:
    """
    모델의 apply_target_features + 기본 피처 생성을 재현합니다.
    반드시 FEATURE_ORDER(31개) 순서로 반환합니다.
    
    피처 목록:
      [개방자치단체코드, X_log, Y_log, Quarter,
       Month_sin, Month_cos, Day_sin, Day_cos,
       before_pandemic, during_pandemic, after_pandemic,
       업종_* ×14,
       구_freq, 동_freq, 구_폐업률, 동_폐업률,
       동업종_폐업률, 구업종_폐업률]
    """
    dt    = pd.Timestamp(open_date)
    month = dt.month
    dow   = dt.dayofweek + 1  # 노트북: dt.dayofweek + 1

    before_pandemic, during_pandemic, after_pandemic = _xgboost_covid_flags(open_date)

    # ── 좌표 처리 (결측이면 학습 시 median 사용) ─────────────────
    # cx, cy는 경계 centroid이므로 정상값이지만, 혹시 0이면 median 대체
    safe_cx = cx if cx > 0 else _xgboost_coord_medians["X"]
    safe_cy = cy if cy > 0 else _xgboost_coord_medians["Y"]
    x_log   = float(np.log1p(safe_cx))
    y_log   = float(np.log1p(safe_cy))

    # ── 타겟인코딩 맵 참조 ──────────────────────────────────────
    tm  = _xgboost_target_maps
    gm  = _xgboost_global_mean
    gu_nfc   = _nfc(gu)
    dong_nfc = _nfc(dong)
    ind_nfc  = _nfc(industry)

    # 구/동 단순 타겟인코딩
    구_freq    = float(tm["구_freq_map"].get(gu_nfc, 0.0))
    동_freq    = float(tm["동_freq_map"].get(dong_nfc, 0.0))
    구_폐업률  = float(tm["구_target_map"].get(gu_nfc, gm))
    동_폐업률  = float(tm["동_target_map"].get(dong_nfc, gm))

    # 복합 키: (동명, 업종명) 튜플 — 노트북의 get_smoothed_map과 동일
    동업종_폐업률 = float(
        tm["동업종_target_map"].get((dong_nfc, ind_nfc), gm)
    )
    구업종_폐업률 = float(
        tm["구업종_target_map"].get((gu_nfc, ind_nfc), gm)
    )

    # ── 기본 피처 dict 구성 ──────────────────────────────────────
    row: dict = {
        "개방자치단체코드": int(gov_code),
        "X_log":            x_log,
        "Y_log":            y_log,
        "Quarter":          int(dt.quarter),
        "Month_sin":        float(np.sin(2 * np.pi * month / 12)),
        "Month_cos":        float(np.cos(2 * np.pi * month / 12)),
        "Day_sin":          float(np.sin(2 * np.pi * dow / 7)),
        "Day_cos":          float(np.cos(2 * np.pi * dow / 7)),
        "before_pandemic":  before_pandemic,
        "during_pandemic":  during_pandemic,
        "after_pandemic":   after_pandemic,
        # ── 타겟인코딩 6개 ──
        "구_freq":           구_freq,
        "동_freq":           동_freq,
        "구_폐업률":          구_폐업률,
        "동_폐업률":          동_폐업률,
        "동업종_폐업률":      동업종_폐업률,
        "구업종_폐업률":      구업종_폐업률,
    }

    # ── 업종 원핫인코딩 (v14: BIZ_COLS 14개) ────────────────────
    # _xgboost_biz_cols = ['업종_노래연습장업', '업종_세탁업', ...]
    # _xgboost_biz_names= ['노래연습장업', '세탁업', ...]
    # 매칭: col '업종_X'에서 'X' == industry인 경우 1.0, 나머지 0.0
    target_col = f"업종_{ind_nfc}"
    for col in _xgboost_biz_cols:
        row[_nfc(col)] = 1.0 if _nfc(col) == target_col else 0.0

    # ── FEATURE_ORDER 순서로 DataFrame 생성 ─────────────────────
    # 노트북의 X_train.columns 순서와 반드시 일치해야 XGBoost가 올바로 예측
    try:
        df_row = pd.DataFrame([row])[_xgboost_feature_order]
    except KeyError as e:
        missing = set(_xgboost_feature_order) - set(row.keys())
        raise ValueError(f"피처 누락: {missing}") from e

    return df_row


async def predict_survival(
    db: AsyncSession, request: PredictionRequest
) -> PredictionResponse:
    """XGBoost 모델로 창업 생존 예측을 수행합니다."""
    try:
        # ── 1. 모델 로드 (Lazy) ──────────────────────────────────────
        _load_xgboost_model()

        # ── 2. 업종 검증 ─────────────────────────────────────────────
        industry_nfc = _nfc(request.industry)
        valid_industries = [_nfc(n) for n in _xgboost_biz_names]
        if industry_nfc not in valid_industries:
            raise HTTPException(
                status_code=400,
                detail=f"지원하지 않는 업종입니다. 가능 업종: {_xgboost_biz_names}",
            )

        # ── 3. GU_CACHE 초기화 ───────────────────────────────────────
        if not GU_CACHE["initialized"]:
            await initialize_gu_cache(db)

        # ── 4. 행정동 조회 ───────────────────────────────────────────
        result = await db.execute(
            select(AdministrativeBoundary)
            .where(AdministrativeBoundary.adm_cd == request.adm_cd)
        )
        ab = result.scalar_one_or_none()
        if not ab:
            raise HTTPException(
                status_code=404,
                detail=f"행정동을 찾을 수 없습니다. (adm_cd={request.adm_cd})",
            )

        # ── 5. 구명 & 개방자치단체코드 결정 ─────────────────────────
        adm4     = request.adm_cd[:4]
        gu       = GU_CACHE["gu_name"].get(adm4, "unknown")
        gov_code = GU_CACHE["gov_code"].get(adm4, 0)

        # ── 6. 좌표 결정 (Boundary 우선, 없으면 RegionCode Fallback) ──
        c_x, c_y = _centroid(ab.boundary)
        if c_x is None:
            # DB 경계 데이터가 없을 경우 해당 구의 대표 좌표 시도
            rc_res = await db.execute(
                select(RegionCode).where(RegionCode.city_name == "서울특별시", RegionCode.county_name == gu).limit(1)
            )
            rc = rc_res.scalar_one_or_none()
            if rc and rc.longitude and rc.latitude:
                c_x, c_y = float(rc.longitude), float(rc.latitude)

        cx, cy = _ensure_meters(c_x, c_y)

        # ── 7. 피처 생성 & 예측 ──────────────────────────────────────
        try:
            X = _build_xgboost_features(
                cx, cy, gu, ab.adm_nm, industry_nfc, request.open_date, gov_code
            )
        except Exception as fe:
            print(f"❌ [predict_survival] 피처 생성 오류: {fe}")
            raise HTTPException(status_code=500, detail=f"피처 생성 중 오류: {str(fe)}")

        try:
            # XGBoost Booster를 사용할 때는 DMatrix로 변환해야 함
            dmatrix = xgb.DMatrix(X)
            prob_arr = _xgboost_model.predict(dmatrix)
            prob = float(prob_arr[0])
        except Exception as pe:
            print(f"❌ [predict_survival] 모델 예측 오류: {pe}")
            raise HTTPException(status_code=500, detail=f"모델 예측 중 오류: {str(pe)}")

        pred = prob >= _xgboost_threshold   # v14 최적 임계값 (0.3961)
        label = "caution" if pred else "stable"

        # ── 8. 응답 메시지 & 분석 요인 ──────────────────────────────
        dt       = pd.Timestamp(request.open_date)
        
        # 동/구 폐업률 및 빈도 (기존 로직 원복)
        tm = _xgboost_target_maps
        gm = _xgboost_global_mean
        dong_freq = float(tm.get("동_freq_map", {}).get(_nfc(ab.adm_nm), 0.0))
        dong_rate = float(tm.get("동_target_map", {}).get(_nfc(ab.adm_nm), gm))
        gu_rate   = float(tm.get("구_target_map", {}).get(_nfc(gu), gm))

        before_pandemic, during_pandemic, after_pandemic = _xgboost_covid_flags(request.open_date)
        if after_pandemic:
            era_msg = "최근 상권 흐름 및 중장기 소비 시장의 트렌드가 분석 지표로 활용되었습니다."
        elif during_pandemic:
            era_msg = "시장 변동성이 높았던 시기의 소비 패턴 보정 데이터가 반영되었습니다."
        else:
            era_msg = "표준적인 과거 소비 환경 모델을 기초로 분석되었습니다."

        factors = [
            f"{gu} 지역의 업계 평균 생존 통계와 지역별 상권 특성을 기초 지표로 활용했습니다.",
            era_msg,
            f"선택하신 {dt.month}월의 계절성 요인 및 상권별 성수기 트렌드가 반영되었습니다.",
        ]

        if dong_freq > 0:
            factors.insert(1, f"{ab.adm_nm} 지역의 세부 상권 변화 추이 및 업종별 밀집도를 추가로 분석했습니다.")
        else:
            # '학습 데이터 외' 표현 제거 -> 지역 표준 지표 활용으로 표현
            factors.insert(1, f"{gu} 지역의 광역 상권 데이터와 표준 지표를 기반으로 분석이 진행되었습니다.")

        if pred:
            if dong_rate > gu_rate:
                factors.append(f"{ab.adm_nm} 상권의 최근 변동성이 구 평균보다 높아 입지 리스크를 고려한 예측입니다.")
            else:
                factors.append(f"해당 상권 내 유사 업종 간의 경쟁 밀도 및 소비 전환 데이터가 반영되었습니다.")
            msg = f"{ab.adm_nm} {request.industry} 창업은 현재 데이터 분석 상 '주의' 단계입니다."
        else:
            factors.append(f"{ab.adm_nm} 지역은 동일 업종 생존 지표가 비교적 안정적이며 상권 진입 장벽이 낮게 평가됩니다.")
            msg = f"{ab.adm_nm} {request.industry} 창업은 현재 데이터 분석 상 '안정' 단계입니다."

        return PredictionResponse(
            risk_score=round(prob * 100, 1),
            label=label,
            label_kor="주의" if pred else "안정",
            industry=request.industry,
            dong=ab.adm_nm,
            gu=gu,
            open_date=str(request.open_date),
            message=msg,
            threshold=_xgboost_threshold,
            factors=factors,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [predict_survival] 전체 실행 오류: {e}")
        import traceback
        tb = traceback.format_exc()
        print(tb)
        # 에러 메시지에 트레이스백을 포함하여 프론트엔드에서 원인 파악이 가능하게 함
        raise HTTPException(status_code=500, detail=f"예측 서버 오류: {str(e)}\n{tb}")


# ── CatBoost 심층 예측 (상권 데이터 포함) ─────────────────────────────────
_cb_bundle          = None
_cb_model           = None
_cb_industry_list   = None
_cb_dong_agg        = None   # list[dict] — adstrd_cd_nm 키로 lookup
_cb_trdar_coords    = None   # ndarray shape (N, 2) — [xcnts, ydnts]
_cb_trdar_meta      = None   # list[dict] — trdar_se_cd, relm_ar 등
_cb_feature_order   = None
_cb_cat_indices     = None
_cb_threshold       = None
_cb_year_base       = None
_cb_dist_threshold  = None

_COVID_DATE   = pd.Timestamp('2020-01-01')
_ENDEMIC_DATE = pd.Timestamp('2023-05-05')


def _load_cb_model():
    """CatBoost 모델과 메타데이터를 지연 로딩(Lazy Loading) 방식으로 불러옵니다."""
    global _cb_bundle, _cb_model, _cb_industry_list, _cb_dong_agg, \
        _cb_trdar_coords, _cb_trdar_meta, _cb_feature_order, \
        _cb_cat_indices, _cb_threshold, _cb_year_base, _cb_dist_threshold

    if _cb_model is not None:
        return

    try:
        # 1. 메타데이터 로드
        meta_path   = _get_model_file("catboost_metadata.joblib")
        _cb_bundle  = joblib.load(meta_path)

        _cb_industry_list  = _cb_bundle["industry_list"]
        _cb_feature_order  = _cb_bundle["feature_names"]
        _cb_cat_indices    = _cb_bundle["cat_feature_indices"]
        _cb_threshold      = float(_cb_bundle["threshold"])
        _cb_year_base      = int(_cb_bundle["year_base"])
        _cb_dist_threshold = float(_cb_bundle["dist_threshold"])

        # dong_agg: adstrd_cd_nm 기준 dict로 변환 (빠른 lookup)
        _cb_dong_agg = {
            _nfc(row["adstrd_cd_nm"]): row
            for row in _cb_bundle["dong_agg"]
        }

        # trdar_map_data: numpy 배열로 변환 (nearest-neighbor 계산용)
        trdar_list       = _cb_bundle["trdar_map_data"]
        _cb_trdar_coords = np.array(
            [[r["xcnts_value"], r["ydnts_value"]] for r in trdar_list],
            dtype=float,
        )
        _cb_trdar_meta = trdar_list

        # 2. 핵심 모델 로드 (CatBoost .cbm)
        from catboost import CatBoostClassifier
        model_path = _get_model_file("catboost_model.cbm")
        _cb_model  = CatBoostClassifier()
        _cb_model.load_model(model_path)

        print(
            f"✅ [DeepSim] CatBoost 심층 모델 로드 완료 "
            f"(Source: {'Local' if 'pd_models' in model_path else 'HuggingFace'})"
        )
    except Exception as e:
        print(f"❌ [DeepSim] CatBoost 모델 로드 실패: {e}")
        raise e


def _nearest_trdar(cx: float, cy: float) -> dict:
    """BallTree 없이 브로드캐스팅으로 가장 가까운 상권 정보를 반환합니다."""
    diffs = _cb_trdar_coords - np.array([cx, cy])
    dists = np.sqrt((diffs ** 2).sum(axis=1))
    idx   = int(np.argmin(dists))
    return _cb_trdar_meta[idx], float(dists[idx])

def _build_cb_features(
    cx: float, cy: float, gu: str, dong: str, industry: str, open_date: date
) -> pd.DataFrame:
    """
    모델 학습의 전처리와 동일하게 구성.
    """
    dt     = pd.Timestamp(open_date)
    year   = dt.year
    month  = dt.month

    # ── 시간 피처 ──────────────────────────────────────────────
    open_year_offset = year - _cb_year_base   # YEAR_BASE=2000

    _CB_TRAIN_MAX_YEAR_OFFSET = 21
    open_year_offset = min(open_year_offset, _CB_TRAIN_MAX_YEAR_OFFSET)

    period = 0
    if dt >= _COVID_DATE:    # 2020-01-01
        period = 1
    if dt >= _ENDEMIC_DATE:  # 2023-05-05
        period = 2

    quarter   = dt.quarter
    month_sin = float(np.sin(2 * np.pi * month / 12))
    month_cos = float(np.cos(2 * np.pi * month / 12))

    month_x_covid   = month_sin * (1 if period == 1 else 0)
    month_x_endemic = month_sin * (1 if period == 2 else 0)
    q2_covid        = int(quarter == 2 and period == 1)
    q2_endemic      = int(quarter == 2 and period == 2)

    opened_pre_covid    = int(2018 <= year <= 2019)
    opened_during_covid = int(2020 <= year <= 2022)

    # ── 좌표 피처 ──────────────────────────────────────────────
    x_log = float(np.log1p(max(cx, 0)))
    y_log = float(np.log1p(max(cy, 0)))

    # ── 방법1: nearest-neighbor 상권 피처 ──────────────────────
    trdar, dist = _nearest_trdar(cx, cy)
    dist_to_trdar_center = float(dist)

    if dist <= _cb_dist_threshold:
        trdar_se_cd = str(trdar["trdar_se_cd"])
        relm_ar_raw = trdar.get("relm_ar") or 0
        trdar_relm_ar_log = float(np.log1p(max(float(relm_ar_raw), 0)))
    else:
        # 학습 코드: far_mask → trdar_relm_ar = NaN → fillna(median) → log1p
        # 메타데이터에 median이 있으면 사용, 없으면 0.0
        trdar_relm_ar_median = _cb_bundle.get("trdar_relm_ar_median", 0.0)
        trdar_se_cd       = "unknown"
        trdar_relm_ar_log = float(np.log1p(max(trdar_relm_ar_median, 0)))

    # ── 방법2: 행정동 조인 피처 ───────────────────────────────
    dong_nfc = _nfc(dong)
    agg      = _cb_dong_agg.get(dong_nfc, {})

    dong_trdar_count            = int(agg.get("dong_trdar_count", 0))
    dong_trdar_relm_ar_sum_log  = float(agg.get("dong_trdar_relm_ar_sum_log", 0.0))
    dong_trdar_relm_ar_mean_log = float(agg.get("dong_trdar_relm_ar_mean_log", 0.0))
    dong_trdar_type_diversity   = int(agg.get("dong_trdar_type_diversity", 0))

    # ── row 구성 (CB_FEATURE_ORDER와 동일한 키) ───────────────
    row = {
        # COORD_FEATURES
        "X_log"                      : x_log,
        "Y_log"                      : y_log,
        # TIME_FEATURES
        "open_year_offset"           : open_year_offset,
        "period"                     : period,
        "Quarter"                    : quarter,
        "Month_sin"                  : month_sin,
        "Month_cos"                  : month_cos,
        "month_x_covid"              : month_x_covid,
        "month_x_endemic"            : month_x_endemic,
        "q2_covid"                   : q2_covid,
        "q2_endemic"                 : q2_endemic,
        "opened_pre_covid"           : opened_pre_covid,
        "opened_during_covid"        : opened_during_covid,
        # TRDAR_FEATURES_M1
        "trdar_relm_ar_log"          : trdar_relm_ar_log,
        "dist_to_trdar_center"       : dist_to_trdar_center,
        # TRDAR_FEATURES_M2
        "dong_trdar_count"           : dong_trdar_count,
        "dong_trdar_relm_ar_sum_log" : dong_trdar_relm_ar_sum_log,
        "dong_trdar_relm_ar_mean_log": dong_trdar_relm_ar_mean_log,
        "dong_trdar_type_diversity"  : dong_trdar_type_diversity,
        # CAT_FEATURES_RAW (CatBoost이 내부적으로 인코딩)
        "구"                          : gu,
        "동"                          : dong_nfc,
        "industry"                   : _nfc(industry),
        "trdar_se_cd"                : trdar_se_cd,
    }

    # _cb_feature_order는 메타데이터의 feature_names — 순서 보장
    return pd.DataFrame([row])[_cb_feature_order]


def get_deep_industry_list() -> list[str]:
    """CatBoost 메타데이터에서 업종 목록을 반환합니다."""
    _load_cb_model()
    return sorted(_cb_industry_list)


async def deep_predict_market_survival(db: AsyncSession, request: PredictionRequest) -> PredictionResponse:
    _load_cb_model()

    industry_nfc = _nfc(request.industry)
    valid_cb_industries = [_nfc(n) for n in _cb_industry_list]
    if industry_nfc not in valid_cb_industries:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 업종입니다. 가능 업종: {industry_nfc} not in {valid_cb_industries[:5]}...",
        )

    if not GU_CACHE["initialized"]:
        await initialize_gu_cache(db)

    result = await db.execute(
        select(AdministrativeBoundary).where(AdministrativeBoundary.adm_cd == request.adm_cd)
    )
    ab = result.scalar_one_or_none()
    if not ab:
        raise HTTPException(
            status_code=404,
            detail=f"행정동을 찾을 수 없습니다. (adm_cd={request.adm_cd})",
        )

    gu = GU_CACHE["gu_name"].get(request.adm_cd[:4], "unknown")
    c_x, c_y = _centroid(ab.boundary)
    if c_x is None:
        # Fallback to RegionCode
        rc_res = await db.execute(
            select(RegionCode).where(RegionCode.city_name == "서울특별시", RegionCode.county_name == gu).limit(1)
        )
        rc = rc_res.scalar_one_or_none()
        if rc and rc.longitude and rc.latitude:
            c_x, c_y = float(rc.longitude), float(rc.latitude)

    cx, cy = _ensure_meters(c_x, c_y)
    dt = pd.Timestamp(request.open_date)

    X    = _build_cb_features(cx, cy, gu, ab.adm_nm, request.industry, request.open_date)
    prob = float(_cb_model.predict_proba(X)[0][1])
    pred = prob >= _cb_threshold

    label = "caution" if pred else "stable"

    trdar, dist = _nearest_trdar(cx, cy)
    dist_val = float(dist)
    
    # 상권 구분 코드 매핑
    se_cd_map = {"A": "골목상권", "U": "발달상권", "R": "전통시장", "D": "관광특구"}
    trdar_type = se_cd_map.get(trdar.get("trdar_se_cd"), "일반상권")
    trdar_ar   = float(trdar.get("relm_ar", 0))

    dong_nfc = _nfc(ab.adm_nm)
    agg      = _cb_dong_agg.get(dong_nfc, {})
    trdar_cnt = int(agg.get("dong_trdar_count", 0))
    diversity = int(agg.get("dong_trdar_type_diversity", 0))

    # 시대 문구
    period = 0
    if dt >= _COVID_DATE:
        period = 1
    if dt >= _ENDEMIC_DATE:
        period = 2

    if period == 2:
        era_msg = "상권 회복기 소비 패턴 변화를 고려한 시점 보정 데이터가 분석에 반영되었습니다."
    elif period == 1:
        era_msg = "상권 위축 및 변동성이 컸던 시기의 시장 지표가 분석 인자로 활용되었습니다."
    else:
        era_msg = "안정적인 표준 영업 환경 데이터를 기준으로 상권 심층 분석이 진행되었습니다."

    dist_desc = f"상권 중심부에 인접({dist_val:.0f}m)" if dist_val < 50 else f"가장 가까운 상권과 {dist_val:.0f}m 거리"
    if dist_val > 2000: # 2km 이상이면 상권 영향력이 낮음
        dist_desc = "주요 상권 영역 외곽에 위치하여 독립적 입지 분석이 적용됨"

    factors = [
        f"{ab.adm_nm} 인근 {trdar_cnt}개 상권 구역의 면적·밀집도 지표를 정밀 분석했습니다.",
        f"분석 대상지는 {trdar_type}에 속하며, {dist_desc} 정보가 핵심 변수로 활용되었습니다.",
        f"해당 상권의 배후지 면적({trdar_ar:,.0f}㎡)과 활성화된 업종 구성({diversity}종)이 반영되었습니다.",
        era_msg,
    ]

    if pred:
        msg = f"{ab.adm_nm} {request.industry} 창업은 상권 심층 분석 결과 '주의' 단계입니다."
    else:
        msg = f"{ab.adm_nm} {request.industry} 창업은 상권 심층 분석 결과 '안정' 단계입니다."

    return PredictionResponse(
        risk_score=round(prob * 100, 1),
        label=label,
        label_kor="주의" if pred else "안정",
        industry=request.industry,
        dong=ab.adm_nm,
        gu=gu,
        open_date=str(request.open_date),
        message=msg,
        threshold=_cb_threshold,
        factors=factors,
        trdar_count=trdar_cnt,
        trdar_area_sum=float(np.expm1(agg.get("dong_trdar_relm_ar_sum_log", 0.0))),
        trdar_area_mean=float(np.expm1(agg.get("dong_trdar_relm_ar_mean_log", 0.0))),
        dist_to_trdar=dist_val,
        type_diversity=int(agg.get("dong_trdar_type_diversity", 0)),
        trdar_type=trdar_type,
    )