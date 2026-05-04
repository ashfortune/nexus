from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date

class SubsidyFilterRequest(BaseModel):
    region: Optional[str] = None
    life_cycle: Optional[str] = None
    query: Optional[str] = None
    page: int = 1
    size: int = 10

class SubsidyCardResponse(BaseModel):
    id: UUID
    name: str
    organization: str
    region: Optional[str]
    life_cycle: Optional[str]
    max_amount: Optional[int]
    deadline: Optional[date]
    description: Optional[str]
    apply_url: Optional[str]

class SubsidyDetailResponse(BaseModel):
    id: UUID
    name: str
    organization: str
    region: Optional[str]
    life_cycle: Optional[str]
    max_amount: Optional[int]
    deadline: Optional[date]
    start_date: Optional[date]
    description: Optional[str]
    support_content: Optional[str]
    target: Optional[str]
    how_to_apply: Optional[str]
    contact: Optional[str]
    apply_url: Optional[str]

class SubsidyListResponse(BaseModel):
    total: int
    page: int
    size: int
    data: list[SubsidyCardResponse]