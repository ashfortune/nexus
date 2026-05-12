from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domain.simulation import simulationSchema, simulationService

router = APIRouter()


@router.post("/market-prediction", response_model=simulationSchema.PredictionResponse)
async def predict_market_survival(
    request: simulationSchema.PredictionRequest, db: AsyncSession = Depends(get_db)
):
    """
    창업 생존 예측 API
    - 행정동 코드, 업종, 창업 예정일을 입력받아 2년 내 폐업 위험도를 반환합니다.
    """
    try:
        result = await simulationService.predict_survival(db, request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"예측 중 오류가 발생했습니다: {str(e)}")



@router.post("/deep-prediction", response_model=simulationSchema.PredictionResponse)
async def deep_predict_market_survival(
    request: simulationSchema.PredictionRequest, db: AsyncSession = Depends(get_db)
):
    """
    창업 심층 생존 예측 API (CatBoost + 상권 데이터)
    - 행정동 코드, 업종, 창업 예정일을 입력받아 상권 면적·밀집도 기반 폐업 위험도를 반환합니다.
    """
    try:
        result = await simulationService.deep_predict_market_survival(db, request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"심층 예측 중 오류가 발생했습니다: {str(e)}")


@router.get("/deep-prediction-list")
async def get_deep_industry_list():
    """
    CatBoost 심층 예측 모델의 지원 업종 목록을 반환합니다.
    """
    try:
        return {"industry_list": simulationService.get_deep_industry_list()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"업종 목록 조회 중 오류: {str(e)}")


@router.get("/test")
async def test_prediction():
    return {"message": "Market Prediction API is healthy"}
