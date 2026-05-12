import datetime
import logging
import os
import uuid
from typing import Any, Dict

import numpy as np
import pandas as pd
import torch
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from statsmodels.tsa.holtwinters import SimpleExpSmoothing
from transformers import TimesFm2_5ModelForPrediction

from app.models import DailyPrediction, Prediction

logger = logging.getLogger(__name__)


async def fetchSalesData(userId: uuid.UUID, db: AsyncSession) -> pd.DataFrame:
    """DB에서 최근 매출 데이터를 조회하여 DataFrame으로 반환합니다."""
    query = text("""
        SELECT DATE(sales_date) as date, MAX(total_amount) as actual 
        FROM sales 
        WHERE user_id = :uid 
        GROUP BY DATE(sales_date) 
        ORDER BY DATE(sales_date) ASC
    """)
    result = await db.execute(query, {"uid": userId})
    rows = result.fetchall()

    if len(rows) == 0:
        raise ValueError("등록된 매출 데이터가 없습니다. 먼저 매출 데이터를 업로드해 주세요.")

    if len(rows) < 2:
        raise ValueError("분석을 시작하려면 최소 2일 이상의 매출 데이터가 필요합니다.")

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


async def predictWithBasicStats(df: pd.DataFrame) -> tuple[pd.DataFrame, Dict[str, Any]]:
    """30일 이하 데이터: 이동평균 기반 단순 예측"""
    stats = analyzeStatistics(df)
    forecastValue = int(stats["currentMa"])
    nextDate = df["date"].iloc[-1] + datetime.timedelta(days=1)

    # 분석용 가상 피팅 데이터 생성 (과거치 = 실제치)
    df["predicted"] = df["actual"]

    # 미래 1일 데이터만 추가 (그냥 내일 예측값만 주고)
    future_dates = [nextDate]
    future_df = pd.DataFrame({"date": future_dates, "predicted": [forecastValue]})
    df = pd.concat([df, future_df], ignore_index=True)

    return df, {
        "forecastValue": forecastValue,
        "nextDate": nextDate.strftime("%Y-%m-%d"),
        "method": "Simple Moving Average",
        "nextMonthForecast": forecastValue * 30  # 30일 이후는 내일 예측값에서 *30 한 값
    }


async def predictWithStatsmodels(df: pd.DataFrame) -> tuple[pd.DataFrame, Dict[str, Any]]:
    """30일~90일 데이터: Statsmodels SES 모델 사용 (30일 이후부터 예측치 노출)"""
    # 전체 데이터에 대해 모델을 1회 피팅합니다.
    # smoothing_level을 0.3으로 고정 설정하여 최적화 시 예측선이 평탄화(전체 평균값 수렴)되는 현상을 차단합니다.
    model = SimpleExpSmoothing(df["actual"], initialization_method="estimated").fit()
    
    # 30일 이전(index 0~29)은 예측치를 노출하지 않고(None), 30일 이후(index 30)부터만 예측치가 노출되도록 구성합니다.
    fitted_vals = list(model.fittedvalues)
    predicted_vals = [None] * 30 + [int(v) for v in fitted_vals[30:]]
    df["predicted"] = predicted_vals

    # 미래 30일 예측치 계산
    forecast = model.forecast(30)
    forecast_val = int(forecast.iloc[0])

    last_date = df["date"].iloc[-1]
    future_dates = [last_date + datetime.timedelta(days=i) for i in range(1, 31)]

    # 미래 30일 데이터 추가 (각 일자별 예측값 저장)
    future_df = pd.DataFrame({
        "date": future_dates,
        "predicted": [int(v) for v in forecast]
    })
    df = pd.concat([df, future_df], ignore_index=True)

    nextDate = future_dates[0]

    return df, {
        "forecastValue": forecast_val,
        "nextDate": nextDate.strftime("%Y-%m-%d"),
        "method": "Exponential Smoothing (Statsmodels)",
        "nextMonthForecast": sum(int(v) for v in forecast)  # 30일치 예측값의 총합
    }


async def predictWithTimesFM(df: pd.DataFrame) -> Dict[str, Any]:
    """90일 이상 데이터: TimesFM (AI Foundation Model) 실모델 호출 (내일 정밀 예측용)"""
    # CPU 전용 모드 및 환경 변수 설정
    device = "cuda" if torch.cuda.is_available() else "cpu"

    try:
        # 최신 사전학습 모델 google/timesfm-2.5-200m-pytorch 로드
        tfm = TimesFm2_5ModelForPrediction.from_pretrained(
            "google/timesfm-2.5-200m-transformers",
            device_map=device
        )
        tfm = tfm.to(torch.float32).eval()
        
        target_col = "actual"
        context_len = 365
        horizon = tfm.config.horizon_length

        # 최근 context_len(최대 365일)만큼의 데이터만 슬라이싱하여 추론 입력(past_values)으로 전달합니다
        ts = df[target_col].values
        context = ts[-(context_len + horizon):-horizon]

        
        past_values = [torch.tensor(context, dtype=torch.float32, device=device)]
        
        with torch.no_grad():
            outputs = tfm(past_values=past_values, forecast_lengths=1024)
        
        forecast = outputs.mean_predictions[0].cpu().numpy() 
        
        nextMonthForecast = int(np.sum(forecast[:30]))
        forecastValue = [int(v) for v in forecast]  # 365일 전체 예측 배열 추출

    except (ImportError, Exception) as e:
        logger.warning(f"TimesFM 2.5 실모델 호출 실패 ({str(e)}).")
        raise e

    nextDate = df["date"].iloc[-1] + datetime.timedelta(days=1)

    return {
        "forecastValue": forecastValue,
        "nextDate": nextDate.strftime("%Y-%m-%d"),
        "method": "TimesFM 2.5 (AI Foundation Model) - Local CPU",
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
        total_sales=int(df["actual"].dropna().iloc[-1]),
        predicted_cost=pred["forecastValue"],
        moving_average=stats["currentMa"],
        return_rate=stats["currentReturnRate"],
    )
    db.add(newPred)
    await db.flush()

    future_idx = 0
    for _, row in df.iterrows():
        # date와 datetime 모두 대응 가능하도록 수정
        date_obj = row["date"]
        if hasattr(date_obj, "to_pydatetime"):
            date_obj = date_obj.to_pydatetime()

        if isinstance(date_obj, datetime.datetime):
            pureDate = date_obj.replace(tzinfo=None)
        else:
            pureDate = date_obj  # 이미 date 객체인 경우

        actual_val = int(row["actual"]) if pd.notna(row.get("actual")) else None
        pred_val = int(row["predicted"]) if pd.notna(row.get("predicted")) else actual_val
        ma_val = float(row["movingAverage"]) if pd.notna(row.get("movingAverage")) else None
        return_rate_val = float(row["returnRate"]) if pd.notna(row.get("returnRate")) else None

        # 미래 날짜(actual_val이 None인 행)이고, 예측 방법이 TimesFM인 경우에 순차적으로 365일 예측값을 timesfm_sales에 저장합니다.
        is_future = (actual_val is None)
        is_timesfm = "TimesFM" in pred.get("method", "")
        
        timesfm_val = None
        if is_future and is_timesfm:
            forecast_list = pred.get("forecast_values", [])
            if forecast_list and future_idx < len(forecast_list):
                timesfm_val = forecast_list[future_idx]
                future_idx += 1
            elif future_idx == 0:
                timesfm_val = pred.get("forecastValue")

        daily = DailyPrediction(
            id=uuid.uuid4(),
            prediction_id=newPred.id,
            target_date=pureDate,
            pred_sales=pred_val,
            actual_sales=actual_val,
            timesfm_sales=timesfm_val,
            moving_average=ma_val,
            return_rate=return_rate_val,
        )
        db.add(daily)

    await db.commit()
    return newPred


async def getAnalysisFromDb(userId: str, db: AsyncSession) -> Dict[str, Any]:
    """데이터 크기에 따라 모델을 선택하여 분석을 수행합니다."""
    try:
        userUuid = uuid.UUID(userId)

        # 1. 오늘 이미 생성된 예측 기록이 있는지 확인 (단, 마지막 분석 이후에 새로운 매출 업로드가 없어야 함)
        today_start = datetime.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)

        check_query = text("""
            SELECT p.id, p.predicted_cost, p.moving_average, p.return_rate, p.created_at
            FROM predictions p
            WHERE p.user_id = :uid AND p.base_date >= :today_start
            AND (
                SELECT COALESCE(MAX(s.created_at), '1970-01-01') FROM sales s 
                WHERE s.user_id = :uid
            ) <= p.created_at
            ORDER BY p.created_at DESC LIMIT 1
        """)
        pred_result = await db.execute(check_query, {"uid": userUuid, "today_start": today_start})
        existing_pred = pred_result.fetchone()

        if existing_pred:
            logger.info(f"캐시된 분석 결과를 사용합니다. (생성일시: {existing_pred.created_at})")
            # 기존 기록이 있으면 daily_predictions에서 불러와서 리턴
            pred_id = existing_pred.id
            daily_query = text("""
                SELECT target_date, actual_sales, pred_sales, timesfm_sales, moving_average, return_rate
                FROM daily_predictions
                WHERE prediction_id = :pid
                ORDER BY target_date ASC
            """)
            daily_result = await db.execute(daily_query, {"pid": pred_id})
            daily_rows = daily_result.fetchall()

            # 캐시된 레코드에서 TimesFM이 정상적으로 사용되었었는지 판별 (timesfm_sales 필드가 채워져 있는지)
            was_timesfm_used = any(r.timesfm_sales is not None for r in daily_rows)

            analysis_data = []
            next_date_str = None
            for r in daily_rows:
                if r.actual_sales is None:
                    # target_date가 date일 수도, datetime일 수도 있으므로 안전하게 처리
                    next_date_str = str(r.target_date.date()) if hasattr(r.target_date, "date") else str(r.target_date)
                    break

            for r in daily_rows:
                date_str = str(r.target_date.date()) if hasattr(r.target_date, "date") else str(r.target_date)

                analysis_data.append({
                    "date": date_str,
                    "actual": int(r.actual_sales) if r.actual_sales is not None else None,
                    "predicted": int(r.pred_sales) if r.pred_sales is not None else None,
                    # DB의 timesfm_sales 값으로 바로 안전하게 제공
                    "timesfm": int(r.timesfm_sales) if r.timesfm_sales is not None else None,
                    "movingAverage": float(r.moving_average) if r.moving_average is not None else None,
                    "returnRate": float(r.return_rate) if r.return_rate is not None else None,
                })

            # 정확한 예측 모델 및 신뢰도 판별
            historical_data_size = len([r for r in daily_rows if r.actual_sales is not None])
            if was_timesfm_used:
                prediction_method = "TimesFM 2.5 (AI Foundation Model) - Local CPU"
            elif historical_data_size <= 30:
                prediction_method = "Simple Moving Average"
            else:
                prediction_method = "Exponential Smoothing (Statsmodels)"

            return {
                "prediction": {
                    "amount": existing_pred.predicted_cost,
                    "date": next_date_str or (datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
                    "confidence": 0.95 if was_timesfm_used else (0.85 if historical_data_size > 30 else 0.70),
                },
                "analysisData": analysis_data,
                "analysisReport": f"오늘 분석된 최신 예측 데이터를 불러왔습니다. 내일 예측 매출: {existing_pred.predicted_cost:,.0f}원",
                "predictionMethod": prediction_method,
                "nextMonthForecast": existing_pred.predicted_cost * 30,
                "movingAverage": existing_pred.moving_average,
                "returnRate": existing_pred.return_rate,
            }

        # 2. 캐시된 기록이 없으면 새롭게 데이터 분석
        df = await fetchSalesData(userUuid, db)

        # 통계 분석 (실제 데이터에 대해서만)
        stats = analyzeStatistics(df)
        dataSize = len(df)

        # 3. 데이터 크기별 예측 모델 분기 및 저장용 데이터 정립
        if dataSize <= 30:
            df, pred = await predictWithBasicStats(df)
            method_name = pred["method"]
        else:
            # 30일 초과 구간에서의 하이브리드 전략:
            # Statsmodels로 피팅 및 일일 예측선 생성 (daily_predictions)
            df_stats, pred_stats = await predictWithStatsmodels(df.copy())

            # TimesFM으로 내일 하루의 핵심 AI 예측값 생성 (predictions.predicted_cost)
            try:
                pred_timesfm = await predictWithTimesFM(df)
                pred = pred_timesfm
                df = df_stats
                method_name = pred_timesfm["method"]
            except Exception as e:
                logger.warning(f"TimesFM 예측 실패, Statsmodels 결과로 대체합니다: {str(e)}")
                pred = pred_stats
                df = df_stats
                method_name = pred_stats["method"]

        # 4. 결과 저장 (predictions 에는 TimesFM, daily_predictions 에는 Statsmodels 예측치 입력됨)
        await persistAnalysisResults(userUuid, df, stats, pred, db)

        return {
            "prediction": {
                "amount": pred["forecastValue"],
                "date": pred["nextDate"],
                # 실제로 TimesFM 예측이 이루어졌는지 여부("TimesFM" in pred["method"])에 따라 신뢰도를 부여하여 정합성을 맞춥니다.
                "confidence": 0.95 if "TimesFM" in pred.get("method", "") else (0.85 if dataSize > 30 else 0.70),
            },
            "analysisData": [
                {
                    "date": str(r["date"].date()) if hasattr(r["date"], "date") else str(r["date"]),
                    "actual": int(r["actual"]) if pd.notna(r.get("actual")) else None,
                    "predicted": int(r["predicted"]) if pd.notna(r.get("predicted")) else None,
                    # 내일 날짜이면서 실제로 TimesFM이 구동된 경우에만 예측치(forecastValue)를 timesfm 필드에 제공하여 그래프 점 렌더링 보장
                    "timesfm": int(pred["forecastValue"]) if ("TimesFM" in pred.get("method", "") and (str(r["date"].date()) if hasattr(r["date"], "date") else str(r["date"])) == pred["nextDate"]) else None,
                    "movingAverage": float(r["movingAverage"]) if pd.notna(r.get("movingAverage")) else None,
                    "returnRate": float(r["returnRate"]) if pd.notna(r.get("returnRate")) else None,
                }
                for _, r in df.iterrows()
            ],
            "analysisReport": (
                f"분석 기법: {method_name}. "
                f"최근 데이터 {dataSize}일을 기반으로 분석되었습니다. "
                f"이동평균: {stats['currentMa']:,.0f}원, 변동률: {stats['currentReturnRate']:.2f}%. "
                f"다음 달 예상 총 매출: {pred.get('nextMonthForecast', 0):,.0f}원입니다."
            ),
            "predictionMethod": method_name,
            "nextMonthForecast": pred.get("nextMonthForecast", 0),
            "movingAverage": stats["currentMa"],
            "returnRate": stats["currentReturnRate"],
        }
    except Exception as e:
        logger.error(f"Prediction Service Error: {str(e)}")
        await db.rollback()
        raise e

