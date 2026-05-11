from fastapi import APIRouter, Query

from app.domain.industryChange.industryChangeService import (autocomplete_equipment)

router = APIRouter()


@router.get("/equipment/autocomplete")
def equipment_autocomplete(
        q: str = Query(..., min_length=1)
):
    return autocomplete_equipment(q)