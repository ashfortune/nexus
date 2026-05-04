from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from app.core.database import get_db
from app.domain.dashboard.dashboardService import processSalesCsv
from app.domain.dashboard.dashboardSchema import SalesUploadResponseSchema

router = APIRouter()

@router.get("/")
async def getRoot() -> Dict[str, str]:
    """도메인 루트 엔드포인트입니다."""
    return {"message": "Ops & Dashboard Domain API"}

@router.post("/upload-sales", response_model=SalesUploadResponseSchema)
async def uploadSales(
    file: UploadFile = File(...),
    userId: str = "3394857b-7033-4f96-8095-2022830f785b", # TODO: 인증 연동 필요
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """매출 내역 CSV 파일을 업로드하여 마스터 테이블에 적재합니다."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능합니다.")
        
    try:
        result = await processSalesCsv(file, userId, db)
        return result
    except Exception as e:
        # 에러 발생 시 로그를 남기고 500 에러를 반환합니다.
        raise HTTPException(status_code=500, detail=str(e))
