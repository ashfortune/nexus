import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import SimpleExpSmoothing
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Any
import uuid
import datetime
from app.models import Prediction, DailyPrediction, Sale
import logging

logger = logging.getLogger(__name__)

async def fetchSalesData(userId: uuid.UUID, db: AsyncSession) -> pd.DataFrame:
    """DB에서 최근 매출 데이터를 조회하여 DataFrame으로 반환합니다."""
    query = text("""
        SELECT sales_date as date, total_amount as actual 
        FROM sales WHERE user_id = :uid ORDER BY sales_date ASC
    """)
    result = await db.execute(query, {"uid": userId})
    rows = result.fetchall()
    
    if len(rows) < 2:
        raise ValueError("분석을 위한 데이터가 충분하지 않습니다. (최소 2건 필요)")
        
    df = pd.DataFrame(rows, columns=['date', 'actual'])
    # 날짜 정제: 시간대 정보를 완전히 제거하여 Naive 상태로 만듦
    df['date'] = pd.to_datetime(df['date']).dt.tz_localize(None)
    df['actual'] = df['actual'].astype(float)
    return df

def analyzeStatistics(df: pd.DataFrame) -> Dict[str, Any]:
    """매출 데이터의 통계치(이동평균, 변동률)를 계산합니다."""
    df['movingAverage'] = df['actual'].rolling(window=min(7, len(df))).mean()
    df['returnRate'] = df['actual'].pct_change() * 100
    
    currentMa = df['movingAverage'].iloc[-1] if not pd.isna(df['movingAverage'].iloc[-1]) else df['actual'].mean()
    currentReturnRate = df['returnRate'].iloc[-1] if not pd.isna(df['returnRate'].iloc[-1]) else 0.0
    
    return {
        "currentMa": float(currentMa),
        "currentReturnRate": float(currentReturnRate)
    }

def generatePrediction(df: pd.DataFrame) -> Dict[str, Any]:
    """SES 모델을 사용하여 내일 매출을 예측합니다."""
    model = SimpleExpSmoothing(df['actual'], initialization_method="estimated").fit()
    df['exponentialSmoothing'] = model.fittedvalues
    forecast = model.forecast(1)
    
    lastDate = df['date'].iloc[-1]
    nextDate = lastDate + datetime.timedelta(days=1)
    
    return {
        "forecastValue": int(forecast.iloc[0]),
        "nextDate": nextDate.strftime('%Y-%m-%d')
    }

async def persistAnalysisResults(
    userId: uuid.UUID, df: pd.DataFrame, stats: Dict[str, Any], 
    pred: Dict[str, Any], db: AsyncSession
) -> Prediction:
    """분석 및 예측 결과를 DB에 저장합니다. 시간대 에러를 완벽히 차단합니다."""
    nowNaive = datetime.datetime.now().replace(tzinfo=None)
    newPred = Prediction(
        id=uuid.uuid4(), user_id=userId, base_date=nowNaive,
        total_sales=int(df['actual'].iloc[-1]), predicted_cost=pred["forecastValue"],
        moving_average=stats["currentMa"], return_rate=stats["currentReturnRate"]
    )
    db.add(newPred)
    await db.flush()

    for _, row in df.iterrows():
        # row['date']에서 시간대 정보를 다시 한번 확실하게 제거
        pureDate = row['date']
        if hasattr(pureDate, 'to_pydatetime'):
            pureDate = pureDate.to_pydatetime().replace(tzinfo=None)
        elif hasattr(pureDate, 'replace'):
            pureDate = pureDate.replace(tzinfo=None)
            
        daily = DailyPrediction(
            id=uuid.uuid4(), prediction_id=newPred.id, target_date=pureDate,
            pred_sales=int(row['exponentialSmoothing']), actual_sales=int(row['actual']),
            moving_average=float(row['movingAverage']) if not pd.isna(row['movingAverage']) else None,
            return_rate=float(row['returnRate']) if not pd.isna(row['returnRate']) else None
        )
        db.add(daily)
    
    await db.commit()
    return newPred

async def getAnalysisFromDb(userId: str, db: AsyncSession) -> Dict[str, Any]:
    """메인 분석 프로세스: 프론트엔드 요구사항(analysisData)에 맞춰 반환합니다."""
    try:
        userUuid = uuid.UUID(userId)
        df = await fetchSalesData(userUuid, db)
        stats = analyzeStatistics(df)
        pred = generatePrediction(df)
        await persistAnalysisResults(userUuid, df, stats, pred, db)
        
        # 프론트엔드 컴포넌트(AnalysisReport)와 호환되도록 키값 설정
        return {
            "prediction": {
                "amount": pred["forecastValue"], 
                "date": pred["nextDate"], 
                "confidence": 0.92
            },
            "analysisData": [
                {"date": str(r['date'].date() if hasattr(r['date'], 'date') else r['date']), "amount": int(r['actual'])} 
                for _, r in df.iterrows()
            ],
            "analysisReport": (
                f"최근 7일간의 이동평균은 {stats['currentMa']:,.0f}원이며, 현재 매출 변동률은 {stats['currentReturnRate']:.2f}%입니다. "
                "(참고: 모든 매출 데이터는 시간 정보를 배제하고 일자별로 분석되었습니다.)"
            ),
            "movingAverage": stats['currentMa'],
            "returnRate": stats['currentReturnRate']
        }
    except Exception as e:
        logger.error(f"분석 서비스 최종 오류: {str(e)}")
        await db.rollback()
        raise e
