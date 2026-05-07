from typing import Any, Dict

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domain.dashboard.dashboardSchema import SalesUploadResponseSchema
from app.domain.dashboard.dashboardService import processSalesCsv

router = APIRouter()


@router.get("/")
async def getRoot() -> Dict[str, str]:
    """도메인 루트 엔드포인트입니다."""
    return {"message": "Ops & Dashboard Domain API"}


@router.post("/upload-sales", response_model=SalesUploadResponseSchema)
async def uploadSales(
    file: UploadFile = File(...),
    userId: str = "11111111-1111-1111-1111-111111111111",  # TODO: 인증 연동 필요
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """매출 내역 CSV 파일을 업로드하여 마스터 테이블에 적재합니다."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능합니다.")

    try:
        result = await processSalesCsv(file, userId, db)
        return result
    except Exception as e:
        # 에러 발생 시 로그를 남기고 500 에러를 반환합니다.
        raise HTTPException(status_code=500, detail=str(e))
