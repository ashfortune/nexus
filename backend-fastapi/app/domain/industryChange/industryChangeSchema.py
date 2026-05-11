from pydantic import BaseModel
from uuid import UUID


class EquipmentAutocompleteResponse(BaseModel):
    id: str
    name: str
    category: str


class RecommendRequest(BaseModel):
    equipment_ids: list[UUID]
    top_n: int = 10


class RestaurantTypeResult(BaseModel):
    restaurant_type_id:   str
    restaurant_type_name: str
    survival_rate_3y:     float | None
    jaccard:              float
    cosine:               float
    knn:                  float
    similarity:           float
    final_score:          float


class RecommendResponse(BaseModel):
    top_n: list[RestaurantTypeResult]
    total: int