from pydantic import BaseModel
from typing import Optional

class IngestionResponseSchema(BaseModel):
    status: str
    message: str
    chunk_count: Optional[int] = None
