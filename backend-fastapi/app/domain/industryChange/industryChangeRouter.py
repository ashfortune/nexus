from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import redis_client, AUTOCOMPLETE_KEY
from app.domain.industryChange.industryChangeSchema import RecommendRequest, RecommendResponse
from app.domain.industryChange.industryChangeService import recommend_industry_change

router = APIRouter(tags=["Industry Change"])


@router.get("/equipment/search")
async def search_equipment(q: str = ""):
    if not q:
        return []

    matches = await redis_client.zrangebylex(
        AUTOCOMPLETE_KEY,
        f"[{q}",
        f"[{q}\xff",
        0, 10
    )
    if not matches:
        return []

    results = []
    for name in matches:
        detail = await redis_client.hgetall(f"equipment:detail:{name}")
        if detail:
            results.append({
                "equipment_id":   detail.get("id"),
                "equipment_name": name,
                "category":       detail.get("category"),
            })
    return results


@router.get("/equipment")
async def get_equipment_by_restaurant_type(
        restaurant_type_id: str,
        db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import text
    result = await db.execute(text("""
                                   SELECT
                                       e.id          AS equipment_id,
                                       e.name        AS equipment_name,
                                       e.category,
                                       rem.is_required,
                                       rem.weight
                                   FROM restaurant_equipment_map rem
                                            JOIN equipment e ON e.id = rem.equipment_id
                                   WHERE rem.restaurant_type_id = :rt_id
                                   ORDER BY rem.is_required DESC, rem.weight DESC
                                   """), {"rt_id": restaurant_type_id})
    rows = result.fetchall()
    return [
        {
            "equipment_id":   str(r.equipment_id),
            "equipment_name": r.equipment_name,
            "category":       r.category,
            "is_required":    r.is_required,
            "weight":         float(r.weight),
        }
        for r in rows
    ]


@router.get("/restaurant-types")
async def get_restaurant_types(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    result = await db.execute(text("""
                                   SELECT id, name, building_use_code
                                   FROM restaurant_types
                                   ORDER BY name
                                   """))
    rows = result.fetchall()
    return [
        {
            "restaurant_type_id":   str(r.id),
            "restaurant_type_name": r.name,
            "building_use_code":    r.building_use_code,
        }
        for r in rows
    ]


@router.post("/recommend", response_model=RecommendResponse)
async def recommend(
        body: RecommendRequest,
        db: AsyncSession = Depends(get_db),
):
    """선택한 설비 ID 목록 → 전환 가능 업종 Top N 추천"""
    return await recommend_industry_change(db, body.equipment_ids, body.top_n)