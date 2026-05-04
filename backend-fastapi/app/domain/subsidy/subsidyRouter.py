from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from uuid import UUID
from app.core.database import get_db
from app.domain.subsidy.subsidySchema import SubsidyFilterRequest, SubsidyListResponse, SubsidyDetailResponse
from app.domain.subsidy.subsidyService import get_subsidies, collect_subsidies, get_subsidy_by_id

router = APIRouter()

@router.post("/recommend", response_model=SubsidyListResponse)
async def recommend_subsidies(
        request: SubsidyFilterRequest,
        db: AsyncSession = Depends(get_db)
):
    total, rows = await get_subsidies(
        db,
        region=request.region,
        life_cycle=request.life_cycle,
        query=request.query,
        page=request.page,
        size=request.size
    )
    return SubsidyListResponse(
        total=total,
        page=request.page,
        size=request.size,
        data=[dict(row._mapping) for row in rows]
    )

@router.get("/detail/{subsidy_id}", response_model=SubsidyDetailResponse)
async def get_subsidy_detail(
        subsidy_id: UUID,
        db: AsyncSession = Depends(get_db)
):
    row = await get_subsidy_by_id(db, subsidy_id)
    if not row:
        raise HTTPException(status_code=404, detail="지원금을 찾을 수 없습니다.")
    return dict(row._mapping)

@router.post("/collect")
async def trigger_collect(db: AsyncSession = Depends(get_db)):
    await collect_subsidies(db)
    return {"message": "지원금 수집 완료"}

scheduler = AsyncIOScheduler()

def start_scheduler(db_getter):
    async def job():
        async for db in db_getter():
            await collect_subsidies(db)
    scheduler.add_job(job, "cron", hour=3)
    scheduler.start()