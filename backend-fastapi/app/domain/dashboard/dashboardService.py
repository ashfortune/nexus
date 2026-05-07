import io
import logging
import uuid
from typing import Any, Dict, List

import pandas as pd
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
            "message": f"{count}건의 데이터가 적재되었습니다.",
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

    df[salesCol] = pd.to_numeric(df[salesCol], errors="coerce").fillna(0).astype(int)

    return [
        {
            "date": row[dateCol].to_pydatetime().replace(tzinfo=None)
            if hasattr(row[dateCol], "to_pydatetime")
            else row[dateCol].replace(tzinfo=None)
            if hasattr(row[dateCol], "replace")
            else row[dateCol],
            "amount": int(row[salesCol]),
            "fileName": fileName,
        }
        for _, row in df.iterrows()
    ]


async def saveSalesToDb(dataList: List[Dict[str, Any]], userId: str, db: AsyncSession) -> int:
    """클렌징된 데이터를 DB에 저장하되, 동일 날짜 중복 시 최대 매출액으로 대체합니다."""
    from sqlalchemy import select
    userUuid = uuid.UUID(userId)
    
    # 1. DB에서 이 유저의 기존 매출 데이터를 모두 가져옵니다.
    stmt = select(Sale).where(Sale.user_id == userUuid)
    result = await db.execute(stmt)
    existing_sales_list = result.scalars().all()
    
    # 날짜(date) -> Sale 객체 매핑 딕셔너리 생성 (TIMESTAMPTZ를 naive date로 정규화)
    existing_map = {}
    for s in existing_sales_list:
        naive_date = s.sales_date.date() if hasattr(s.sales_date, "date") else s.sales_date
        existing_map[naive_date] = s

    # 2. 업로드된 데이터 내에서도 동일 날짜가 중복될 수 있으므로 날짜별 최대 매출액으로 단일화합니다.
    aggregated_data = {}
    for item in dataList:
        item_date = item["date"].date() if hasattr(item["date"], "date") else item["date"]
        amount = item["amount"]
        if item_date not in aggregated_data or amount > aggregated_data[item_date]["amount"]:
            aggregated_data[item_date] = item

    count = 0
    # 3. DB 업데이트 또는 신규 추가
    for item_date, item in aggregated_data.items():
        if item_date in existing_map:
            # 기존 데이터가 있는 경우: 기존 매출보다 큰 경우에만 최대 매출 값으로 대체
            db_sale = existing_map[item_date]
            if item["amount"] > db_sale.total_amount:
                db_sale.total_amount = item["amount"]
                db_sale.file_url = item["fileName"]  # 파일명도 최신 파일로 갱신
                count += 1
        else:
            # 기존 데이터가 없는 경우: 신규 추가
            newSale = Sale(
                id=uuid.uuid4(),
                user_id=userUuid,
                sales_date=item["date"],
                total_amount=item["amount"],
                store_number="CSV_UPLOAD",
                file_url=item["fileName"],
            )
            db.add(newSale)
            count += 1

    await db.commit()
    return count
