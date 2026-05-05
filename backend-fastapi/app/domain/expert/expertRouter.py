from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.domain.expert import expertSchema, expertService

router = APIRouter()

@router.post("/match", response_model=expertSchema.ExpertMatchResponse)
async def match_experts(
    request: expertSchema.ExpertMatchRequest, 
    db: AsyncSession = Depends(get_db)
):
    """
    AI 전문가 매칭 API
    - 사용자의 요구사항과 카테고리를 바탕으로 최적의 전문가 3명을 추천합니다.
    """
    try:
        result = await expertService.match_expert_service(
            db, 
            request.request_content, 
            request.category_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"전문가 매칭 중 오류가 발생했습니다: {str(e)}")
