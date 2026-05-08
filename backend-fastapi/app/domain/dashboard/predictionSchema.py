from typing import List, Optional

from pydantic import BaseModel


class PredictionDetailSchema(BaseModel):
    amount: int
    date: str
    confidence: float


class DailyStatSchema(BaseModel):
    date: str
    actual: Optional[int] = None
    predicted: Optional[int] = None
    timesfm: Optional[int] = None
    movingAverage: Optional[float] = None
    returnRate: Optional[float] = None


class PredictionDataSchema(BaseModel):
    prediction: PredictionDetailSchema
    analysisData: List[DailyStatSchema]
    analysisReport: str
    predictionMethod: str
    nextMonthForecast: int
    movingAverage: float
    returnRate: float


class PredictionResponseSchema(BaseModel):
    status: str
    data: Optional[PredictionDataSchema] = None
    message: Optional[str] = None
