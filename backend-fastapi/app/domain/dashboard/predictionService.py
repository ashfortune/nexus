import datetime
import logging
import os
import uuid
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from statsmodels.tsa.holtwinters import SimpleExpSmoothing

from app.models import DailyPrediction, Prediction

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

    df = pd.DataFrame(rows, columns=["date", "actual"])
    df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)
    df["actual"] = df["actual"].astype(float)
    return df


def analyzeStatistics(df: pd.DataFrame) -> Dict[str, Any]:
    """매출 데이터의 통계치(이동평균, 변동률)를 계산합니다."""
    windowSize = min(7, len(df))
    df["movingAverage"] = df["actual"].rolling(window=windowSize).mean()
    df["returnRate"] = df["actual"].pct_change() * 100

    currentMa = df["movingAverage"].iloc[-1] if not pd.isna(df["movingAverage"].iloc[-1]) else df["actual"].mean()
    currentReturnRate = df["returnRate"].iloc[-1] if not pd.isna(df["returnRate"].iloc[-1]) else 0.0

    return {"currentMa": float(currentMa), "currentReturnRate": float(currentReturnRate)}


async def predictWithBasicStats(df: pd.DataFrame) -> Dict[str, Any]:
    """30일 이하 데이터: 이동평균 기반 단순 예측"""
    stats = analyzeStatistics(df)
    forecastValue = int(stats["currentMa"])
    nextDate = df["date"].iloc[-1] + datetime.timedelta(days=1)
    
    # 분석용 가상 피팅 데이터 생성 (과거치 = 실제치, 마지막만 MA)
    df["predicted"] = df["actual"]
    
    return {
        "forecastValue": forecastValue,
        "nextDate": nextDate.strftime("%Y-%m-%d"),
        "method": "Simple Moving Average",
        "nextMonthForecast": forecastValue * 30  # 단순 추정
    }


async def predictWithStatsmodels(df: pd.DataFrame) -> Dict[str, Any]:
    """30일~90일 데이터: Statsmodels SES 모델 사용"""
    model = SimpleExpSmoothing(df["actual"], initialization_method="estimated").fit()
    df["predicted"] = model.fittedvalues
    forecast = model.forecast(1)
    
    nextDate = df["date"].iloc[-1] + datetime.timedelta(days=1)
    
    return {
        "forecastValue": int(forecast.iloc[0]),
        "nextDate": nextDate.strftime("%Y-%m-%d"),
        "method": "Exponential Smoothing (Statsmodels)",
        "nextMonthForecast": int(forecast.iloc[0] * 30)
    }


async def predictWithTimesFM(df: pd.DataFrame) -> Dict[str, Any]:
    """90일 이상 데이터: TimesFM (AI Foundation Model) 실모델 호출"""
    # CPU 전용 모드 및 환경 변수 설정
    os.environ["JAX_PLATFORM_NAME"] = "cpu"
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
    
    try:
        from timesfm import TimesFm
        
        # 모델 초기화 (CPU 백엔드 명시)
        tfm = TimesFm(
            context_len=512,
            horizon_len=31,
            input_patch_len=32,
            output_patch_len=128,
            num_layers=20,
            model_dims=1280,
            backend="cpu",
        )
        
        # 허깅페이스에서 모델 체크포인트 로드 (로컬 캐시 활용)
        tfm.load_from_checkpoint(repo_id="google/timesfm-1.0-200m")
        
        # 데이터 준비: [B, T] 형태의 리스트 필요
        actual_data = df["actual"].values.tolist()
        forecast_input = [actual_data]
        
        # 예측 수행 (freq 0은 정수형 데이터/일일 데이터를 의미)
        point_forecast, _, _ = tfm.forecast(forecast_input, freq=[0])
        
        # 결과 추출 (B=1, H=31)
        forecast_values = point_forecast[0]
        forecastValue = int(forecast_values[0])  # 내일 매출
        nextMonthForecast = int(np.sum(forecast_values[:30]))  # 다음 달(30일) 합산 매출
        
        # 분석 리포트용 피팅 데이터 (간소화)
        df["predicted"] = df["actual"].rolling(window=7).mean().fillna(df["actual"])
        
    except (ImportError, Exception) as e:
        logger.warning(f"TimesFM 실모델 호출 실패 ({str(e)}). Statsmodels로 전환합니다.")
        return await predictWithStatsmodels(df)
    
    nextDate = df["date"].iloc[-1] + datetime.timedelta(days=1)
    
    return {
        "forecastValue": forecastValue,
        "nextDate": nextDate.strftime("%Y-%m-%d"),
        "method": "TimesFM (AI Foundation Model) - Local CPU",
        "nextMonthForecast": nextMonthForecast
    }


async def persistAnalysisResults(
    userId: uuid.UUID,
    df: pd.DataFrame,
    stats: Dict[str, Any],
    pred: Dict[str, Any],
    db: AsyncSession,
) -> Prediction:
    """분석 및 예측 결과를 DB에 저장합니다."""
    nowNaive = datetime.datetime.now().replace(tzinfo=None)
    
    newPred = Prediction(
        id=uuid.uuid4(),
        user_id=userId,
        base_date=nowNaive,
        total_sales=int(df["actual"].iloc[-1]),
        predicted_cost=pred["forecastValue"],
        moving_average=stats["currentMa"],
        return_rate=stats["currentReturnRate"],
    )
    db.add(newPred)
    await db.flush()

    for _, row in df.iterrows():
        pureDate = row["date"].to_pydatetime().replace(tzinfo=None) if hasattr(row["date"], "to_pydatetime") else row["date"].replace(tzinfo=None)

        daily = DailyPrediction(
            id=uuid.uuid4(),
            prediction_id=newPred.id,
            target_date=pureDate,
            pred_sales=int(row["predicted"]) if "predicted" in row else int(row["actual"]),
            actual_sales=int(row["actual"]),
            moving_average=float(row["movingAverage"]) if not pd.isna(row["movingAverage"]) else None,
            return_rate=float(row["returnRate"]) if not pd.isna(row["returnRate"]) else None,
        )
        db.add(daily)

    await db.commit()
    return newPred


async def getAnalysisFromDb(userId: str, db: AsyncSession) -> Dict[str, Any]:
    """데이터 크기에 따라 모델을 선택하여 분석을 수행합니다."""
    try:
        userUuid = uuid.UUID(userId)
        df = await fetchSalesData(userUuid, db)
        dataSize = len(df)
        
        # 1. 통계 분석 (공통)
        stats = analyzeStatistics(df)
        
        # 2. 데이터 크기별 예측 모델 분기
        if dataSize <= 30:
            pred = await predictWithBasicStats(df)
        elif dataSize <= 90:
            pred = await predictWithStatsmodels(df)
        else:
            pred = await predictWithTimesFM(df)
            
        # 3. 결과 저장
        await persistAnalysisResults(userUuid, df, stats, pred, db)

        return {
            "prediction": {
                "amount": pred["forecastValue"],
                "date": pred["nextDate"],
                "confidence": 0.95 if dataSize > 90 else (0.85 if dataSize > 30 else 0.70),
            },
            "analysisData": [
                {
                    "date": str(r["date"].date()),
                    "amount": int(r["actual"]),
                }
                for _, r in df.iterrows()
            ],
            "analysisReport": (
                f"분석 기법: {pred['method']}. "
                f"최근 데이터 {dataSize}일을 기반으로 분석되었습니다. "
                f"이동평균: {stats['currentMa']:,.0f}원, 변동률: {stats['currentReturnRate']:.2f}%. "
                f"다음 달 예상 총 매출: {pred.get('nextMonthForecast', 0):,.0f}원입니다."
            ),
            "predictionMethod": pred["method"],
            "nextMonthForecast": pred.get("nextMonthForecast", 0),
            "movingAverage": stats["currentMa"],
            "returnRate": stats["currentReturnRate"],
        }
    except Exception as e:
        logger.error(f"Prediction Service Error: {str(e)}")
        await db.rollback()
        raise e

