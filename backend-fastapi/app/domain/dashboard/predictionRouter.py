from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from app.core.database import get_db
from app.domain.dashboard.predictionService import getAnalysisFromDb
from app.domain.dashboard.predictionSchema import PredictionResponseSchema

router = APIRouter()

@router.get("/analysis", response_model=PredictionResponseSchema)
async def getAnalysis(
    userId: str = "3394857b-7033-4f96-8095-2022830f785b", # TODO: 인증 연동 필요
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    DB에 적재된 데이터를 바탕으로 분석 결과를 반환합니다.
    """
    try:
        result = await getAnalysisFromDb(userId, db)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
