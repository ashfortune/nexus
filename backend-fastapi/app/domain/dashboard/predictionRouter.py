from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domain.dashboard.predictionSchema import PredictionResponseSchema
from app.domain.dashboard.predictionService import getAnalysisFromDb

router = APIRouter()


@router.get("/analysis", response_model=PredictionResponseSchema)
async def getAnalysis(
    userId: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    DB에 적재된 데이터를 바탕으로 분석 결과를 반환합니다.
    (캐시가 없으면 실시간 분석 수행)
    """
    return await executeAnalysis(userId, db)


@router.post("/analysis", response_model=PredictionResponseSchema)
async def triggerAnalysis(
    userId: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    분석을 강제로 트리거하거나 수행합니다.
    """
    return await executeAnalysis(userId, db)


async def executeAnalysis(userId: str, db: AsyncSession) -> Dict[str, Any]:
    try:
        result = await getAnalysisFromDb(userId, db)
        return {"status": "success", "data": result}
    except ValueError as e:
        return {"status": "no_data", "message": str(e), "data": None}
    except Exception:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")
