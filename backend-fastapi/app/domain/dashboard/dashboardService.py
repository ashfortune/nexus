import pandas as pd
import io
import uuid
import datetime
import logging
from typing import Dict, Any, List
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Sale

logger = logging.getLogger(__name__)

async def processSalesCsv(file: UploadFile, userId: str, db: AsyncSession) -> Dict[str, Any]:
    """매출 CSV 파일을 파싱하고 DB에 적재하는 메인 프로세스입니다."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if df.empty or len(df.columns) < 2:
            raise ValueError("CSV 파일 형식이 올바르지 않습니다.")

        cleanedData = prepareSalesData(df, file.filename)
        count = await saveSalesToDb(cleanedData, userId, db)
        
        return {
            "status": "success",
            "count": count,
            "message": f"{count}건의 데이터가 적재되었습니다."
        }
    except Exception as e:
        logger.error(f"CSV 적재 중 최종 실패: {str(e)}")
        raise e

def prepareSalesData(df: pd.DataFrame, fileName: str) -> List[Dict[str, Any]]:
    """CSV 데이터를 DB 모델에 맞게 클렌징합니다."""
    dateCol, salesCol = df.columns[0], df.columns[1]
    df[dateCol] = pd.to_datetime(df[dateCol])
    # 시간대 정보 강제 제거 (timezone-naive 변환)
    if df[dateCol].dt.tz is not None:
        df[dateCol] = df[dateCol].dt.tz_localize(None)
    
    df[salesCol] = pd.to_numeric(df[salesCol], errors='coerce').fillna(0).astype(int)
    
    return [
        {
            "date": row[dateCol].to_pydatetime().replace(tzinfo=None) if hasattr(row[dateCol], 'to_pydatetime') else row[dateCol].replace(tzinfo=None) if hasattr(row[dateCol], 'replace') else row[dateCol],
            "amount": int(row[salesCol]),
            "fileName": fileName
        } for _, row in df.iterrows()
    ]

async def saveSalesToDb(dataList: List[Dict[str, Any]], userId: str, db: AsyncSession) -> int:
    """클렌징된 데이터를 DB에 저장합니다."""
    userUuid = uuid.UUID(userId)
    for item in dataList:
        newSale = Sale(
            id=uuid.uuid4(),
            user_id=userUuid,
            sales_date=item["date"],
            total_amount=item["amount"],
            store_number="CSV_UPLOAD",
            file_url=item["fileName"]
        )
        db.add(newSale)
    
    await db.commit()
    return len(dataList)
