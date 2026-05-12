import numpy as np
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sklearn.neighbors import NearestNeighbors

def jaccard_similarity(user_vec: np.ndarray, type_vec: np.ndarray) -> float:
    u = user_vec > 0
    t = type_vec > 0
    intersection = np.sum(u & t)
    union = np.sum(u | t)
    return float(intersection / union) if union > 0 else 0.0


def cosine_similarity(user_vec: np.ndarray, type_vec: np.ndarray) -> float:
    dot = np.dot(user_vec, type_vec)
    norm = np.linalg.norm(user_vec) * np.linalg.norm(type_vec)
    return float(dot / norm) if norm > 0 else 0.0


def knn_similarity(user_vec: np.ndarray, all_vecs: np.ndarray, idx: int, k: int = 5) -> float:
    n_samples = all_vecs.shape[0]
    k = min(k, n_samples)
    knn = NearestNeighbors(n_neighbors=k, metric="cosine")
    knn.fit(all_vecs)
    distances, indices = knn.kneighbors(user_vec.reshape(1, -1))
    if idx in indices[0]:
        pos = np.where(indices[0] == idx)[0][0]
        return float(1 - distances[0][pos])
    return 0.0


def ensemble_similarity(jaccard: float, cosine: float, knn: float) -> float:
    return jaccard * 0.3 + cosine * 0.5 + knn * 0.2


def final_score(similarity: float, survival_rate_3y: float | None) -> float:
    survival = (survival_rate_3y / 100) if survival_rate_3y else 0.5
    return round(similarity * 0.8 + survival * 0.2, 4)

async def get_all_equipment(db: AsyncSession) -> list[dict]:
    result = await db.execute(text("SELECT id, name, category FROM equipment ORDER BY name"))
    return [dict(r._mapping) for r in result.fetchall()]


async def get_restaurant_type_equipment_map(db: AsyncSession) -> dict[str, dict]:
    result = await db.execute(text("""
        SELECT
            rt.id               AS rt_id,
            rt.name             AS rt_name,
            rt.survival_rate_3y,
            rem.equipment_id,
            rem.weight
        FROM restaurant_types rt
        JOIN restaurant_equipment_map rem ON rt.id = rem.restaurant_type_id
    """))
    rows = result.fetchall()

    rt_map: dict[str, dict] = {}
    for r in rows:
        rt_id = str(r.rt_id)
        if rt_id not in rt_map:
            rt_map[rt_id] = {
                "name": r.rt_name,
                "survival_rate_3y": float(r.survival_rate_3y) if r.survival_rate_3y else None,
                "equipment": {},
            }
        rt_map[rt_id]["equipment"][str(r.equipment_id)] = float(r.weight)
    return rt_map

async def recommend_industry_change(
    db: AsyncSession,
    equipment_ids: list[UUID],
    top_n: int = 10,
) -> dict:

    all_eq = await get_all_equipment(db)
    eq_index = {str(e["id"]): i for i, e in enumerate(all_eq)}
    eq_id_to_info = {str(e["id"]): e for e in all_eq}
    n_eq = len(all_eq)

    user_eq_ids = {str(eq_id) for eq_id in equipment_ids}
    user_vec = np.zeros(n_eq)
    for eq_id in equipment_ids:
        idx = eq_index.get(str(eq_id))
        if idx is not None:
            user_vec[idx] = 1.0

    rt_map = await get_restaurant_type_equipment_map(db)
    rt_ids  = list(rt_map.keys())
    rt_vecs = np.zeros((len(rt_ids), n_eq))
    for i, rt_id in enumerate(rt_ids):
        for eq_id, weight in rt_map[rt_id]["equipment"].items():
            idx = eq_index.get(eq_id)
            if idx is not None:
                rt_vecs[i][idx] = weight

    results = []
    for i, rt_id in enumerate(rt_ids):
        type_vec = rt_vecs[i]

        j_sim = jaccard_similarity(user_vec, type_vec)
        c_sim = cosine_similarity(user_vec, type_vec)
        k_sim = knn_similarity(user_vec, rt_vecs, i)
        e_sim = ensemble_similarity(j_sim, c_sim, k_sim)
        f_score = final_score(e_sim, rt_map[rt_id]["survival_rate_3y"])

        rt_eq_ids = set(rt_map[rt_id]["equipment"].keys())
        matched_ids = user_eq_ids & rt_eq_ids
        matched_equipment = [
            {
                "equipment_id":   eq_id,
                "equipment_name": eq_id_to_info[eq_id]["name"],
                "category":       eq_id_to_info[eq_id]["category"],
            }
            for eq_id in matched_ids
            if eq_id in eq_id_to_info
        ]

        matched_equipment.sort(
            key=lambda x: rt_map[rt_id]["equipment"].get(x["equipment_id"], 0),
            reverse=True,
        )

        results.append({
            "restaurant_type_id":   rt_id,
            "restaurant_type_name": rt_map[rt_id]["name"],
            "survival_rate_3y":     rt_map[rt_id]["survival_rate_3y"],
            "jaccard":              round(j_sim, 4),
            "cosine":               round(c_sim, 4),
            "knn":                  round(k_sim, 4),
            "similarity":           round(e_sim, 4),
            "final_score":          f_score,
            "matched_equipment":    matched_equipment,
        })

    results.sort(key=lambda x: x["final_score"], reverse=True)
    return {"top_n": results[:top_n], "total": len(results)}
