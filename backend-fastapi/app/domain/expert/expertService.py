import json
import re

from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Expert, ExpertMatchRequest, IndustryCategory

from app.core.ai_client import get_ai_client


async def match_expert_service(db: AsyncSession, user_id: str, request_content: str, category_id: str = None):
    ai_client = get_ai_client("gemini")

    # 0. 매칭 요청 기록 생성 (PENDING 상태)
    match_request = ExpertMatchRequest(
        requester_id=user_id,
        industry_category_id=category_id,
        request_content=request_content,
        status="PENDING"
    )
    db.add(match_request)
    await db.commit()
    await db.refresh(match_request)

    # 1. 요구사항 임베딩 변환
    req_vector = await ai_client.embed_text(request_content)
    vector_str = "[" + ",".join(map(str, req_vector)) + "]"

    # 2. Vector DB 검색 (Top 5를 뽑아서 AI가 정제하도록 함)
    sql_query = """
        SELECT e.id, e.portfolio_text, e.rating, e.name, e.phone
        FROM experts e
    """
    params = {"vector": vector_str}

    if category_id:
        sql_query += " WHERE e.industry_category_id = :cat_id "
        params["cat_id"] = category_id

    sql_query += " ORDER BY e.embedding <=> CAST(:vector AS vector) LIMIT 5"

    result = await db.execute(text(sql_query), params)
    top_experts = result.fetchall()

    if not top_experts:
        match_request.status = "FAILED"
        await db.commit()
        return {"matches": [], "message": "가용한 전문가가 없습니다.", "match_request_id": str(match_request.id)}

    # 3. AI 컨설턴트 프롬프트 구성 및 LLM 호출
    expert_info_list = [f"[ID: {str(e.id)}] {e.name}: {e.portfolio_text}" for e in top_experts]
    experts_context = "\n".join(expert_info_list)

    system_instruction = """당신은 스타트업 전문 매칭 컨설턴트입니다. 
가장 적합한 전문가 3명을 선정하고 구체적인 추천 사유를 JSON 형식으로만 응답하세요.
반드시 'matched_expert_id'에 제공된 UUID를 정확히 입력하세요."""

    chat_history = [{"role": "user", "content": f"요구사항: {request_content}\n\n후보군:\n{experts_context}"}]
    response_text = await ai_client.generate_response(system_instruction, chat_history)

    # 4. 결과 파싱 및 보정
    enriched_matches = []
    try:
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        matches = json.loads(json_match.group()) if json_match else []
        expert_map = {str(e.id): e for e in top_experts}

        for m in matches:
            exp = expert_map.get(m.get("matched_expert_id"))
            if exp and len(enriched_matches) < 3:
                enriched_matches.append({
                    "matched_expert_id": str(exp.id),
                    "expert_name": exp.name,
                    "expert_phone": exp.phone or "010-0000-0000",
                    "match_reason": m.get("match_reason") or "전문 분야의 탁월한 역량을 보유하고 있습니다.",
                    "rating": float(exp.rating) if exp.rating else 5.0,
                    "portfolio": exp.portfolio_text
                })
    except Exception:
        pass

    # 5. 부족한 결과 채우기 (Fallback)
    if len(enriched_matches) < 3:
        for exp in top_experts:
            if len(enriched_matches) >= 3: break
            if str(exp.id) not in [m["matched_expert_id"] for m in enriched_matches]:
                enriched_matches.append({
                    "matched_expert_id": str(exp.id),
                    "expert_name": exp.name,
                    "expert_phone": exp.phone or "010-0000-0000",
                    "match_reason": "고객님의 요구사항과 연관된 전문성을 보유하여 추천드립니다.",
                    "rating": float(exp.rating) if exp.rating else 5.0,
                    "portfolio": exp.portfolio_text
                })

    # 6. 매칭 기록 업데이트 (첫 번째 추천 전문가를 메인으로 기록)
    if enriched_matches:
        match_request.matched_expert_id = enriched_matches[0]["matched_expert_id"]
        match_request.match_reason = enriched_matches[0]["match_reason"]
        match_request.status = "COMPLETED"
    else:
        match_request.status = "FAILED"
    
    await db.commit()

    return {
        "match_request_id": str(match_request.id),
        "matches": enriched_matches
    }
