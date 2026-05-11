from app.core.redis import redis_client, AUTOCOMPLETE_KEY


def autocomplete_equipment(query: str):
    query = query.strip()

    if not query:
        return []

    names = redis_client.zrange(
        AUTOCOMPLETE_KEY,
        0,
        -1
    )

    matched_names = [
        name for name in names
        if query.lower() in name.lower()
    ][:10]

    results = []

    for name in matched_names:
        detail = redis_client.hgetall(
            f"equipment:detail:{name}"
        )

        if detail:
            results.append({
                "id": detail.get("id"),
                "name": detail.get("name"),
                "category": detail.get("category"),
            })

    return results