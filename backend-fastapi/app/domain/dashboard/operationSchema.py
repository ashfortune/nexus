from typing import Optional

from pydantic import BaseModel


class IngestionResponseSchema(BaseModel):
    status: str
    message: str
    chunk_count: Optional[int] = None
