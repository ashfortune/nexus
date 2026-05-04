from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class PredictionDetailSchema(BaseModel):
    amount: int
    date: str
    confidence: float

class DailyStatSchema(BaseModel):
    date: str
    amount: int

class PredictionDataSchema(BaseModel):
    prediction: PredictionDetailSchema
    daily_stats: List[DailyStatSchema]
    analysis_report: str
    moving_average: Optional[float] = None
    return_rate: Optional[float] = None

class PredictionResponseSchema(BaseModel):
    status: str
    data: PredictionDataSchema
