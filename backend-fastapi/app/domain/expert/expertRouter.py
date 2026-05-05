from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.domain.expert.expertSchema import ExpertMatchRequestBase, ExpertMatchResponse
from app.domain.expert.expertService import match_expert_service

router = APIRouter(tags=["Expert Matching"])

@router.post("/match", response_model=ExpertMatchResponse)
async def match_expert(
    request: ExpertMatchRequestBase,
    db: AsyncSession = Depends(get_db)
):
    result = await match_expert_service(db, request.request_content, request.industry_category_id)
    return ExpertMatchResponse(matches=result["matches"])
