from pydantic import BaseModel, Field
from typing import Dict, Any

class SalesUploadResponseSchema(BaseModel):
    """CSV 업로드 응답 스키마입니다."""
    status: str = Field(..., description="처리 상태")
    count: int = Field(..., description="적재된 데이터 건수")
    message: str = Field(..., description="결과 메시지")

    class Config:
        # 응답 시 camelCase 변수명을 사용할 수 있도록 설정 (필요 시)
        populate_by_name = True
