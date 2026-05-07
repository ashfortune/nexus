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
    """
    try:
        result = await getAnalysisFromDb(userId, db)
        return {"status": "success", "data": result}
    except ValueError as e:
        # 데이터 부족은 에러가 아니라 '데이터 없음' 상태로 반환
        return {"status": "no_data", "message": str(e), "data": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail="서버 내부 오류가 발생했습니다.")
