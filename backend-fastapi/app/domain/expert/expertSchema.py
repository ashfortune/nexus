import uuid
from typing import List, Optional

from pydantic import BaseModel


class ExpertMatchRequest(BaseModel):
    request_content: str
    category_id: Optional[uuid.UUID] = None

class ExpertMatchResult(BaseModel):
    matched_expert_id: str
    expert_name: str
    expert_phone: str
    match_reason: str
    rating: float
    portfolio: Optional[str] = None

class ExpertMatchResponse(BaseModel):
    matches: List[ExpertMatchResult]
    message: Optional[str] = None
