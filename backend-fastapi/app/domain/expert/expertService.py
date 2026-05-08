import json
import re

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import get_ai_client


async def match_expert_service(db: AsyncSession, request_content: str, category_id: str = None):
    ai_client = get_ai_client("gemini")

    # 1. 요구사항 임베딩 변환 (768차원 로컬 모델)
    req_vector = await ai_client.embed_text(request_content)
    vector_str = "[" + ",".join(map(str, req_vector)) + "]"

    # 2. Vector DB 검색 (Top 3)
    sql_query = """
        SELECT e.id, e.portfolio_text, e.rating, e.name, e.phone
        FROM experts e
    """
    params = {"vector": vector_str}

    if category_id:
        sql_query += " WHERE e.industry_category_id = :cat_id "
        params["cat_id"] = category_id

    sql_query += " ORDER BY e.embedding <=> CAST(:vector AS vector) LIMIT 3"

    result = await db.execute(text(sql_query), params)
    top_experts = result.fetchall()

    if not top_experts:
        return {"matches": [], "message": "해당 분야의 전문가를 찾을 수 없습니다."}

    # 3. AI 컨설턴트 프롬프트 구성
    expert_info_list = []
    for exp in top_experts:
        expert_info_list.append(
            f"[전문가: {exp.name} (ID: {str(exp.id)})]\n포트폴리오: {exp.portfolio_text}\n평점: {exp.rating or '신규'}"
        )
    experts_context = "\n\n".join(expert_info_list)

    system_instruction = """당신은 스타트업 전문 매칭 컨설턴트입니다. 
창업자의 요구사항과 검색된 전문가 3명의 정보를 바탕으로, 맞춤 추천 사유를 작성하세요.

[준수 사항]
1. 반드시 실제 전문가 ID(UUID)를 "matched_expert_id" 값으로 사용하세요.
2. 전문가의 '포트폴리오' 내 구체적인 키워드(경력, 자격증, 프로젝트명 등)를 반드시 언급하세요.
3. "경험이 풍부하다"는 식의 막연한 표현 대신, 구체적인 사실에 근거하여 사유를 작성하세요.
4. 사유는 1~2줄 내외로 전문적이고 신뢰감 있게 작성하세요.
5. 정확히 3명의 JSON 배열만 반환하세요. (설명 생략)

[출력 형식]
[
  { "matched_expert_id": "UUID", "expert_name": "이름", "match_reason": "구체적 인용 사유" }
]"""

    chat_history = [
        {"role": "user", "content": f"요구사항: {request_content}\n\n후보군:\n{experts_context}"}
    ]

    # 4. LLM 호출 및 결과 파싱
    response_text = await ai_client.generate_response(system_instruction, chat_history)

    try:
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if not json_match:
            raise ValueError("Invalid AI JSON response")

        matches = json.loads(json_match.group())
        expert_data_map = {str(exp.id): exp for exp in top_experts}

        enriched_matches = []
        for m in matches:
            exp = expert_data_map.get(m.get("matched_expert_id"))
            if exp:
                enriched_matches.append({
                    "matched_expert_id": str(exp.id),
                    "expert_name": exp.name,
                    "expert_phone": exp.phone or "연락처 비공개",
                    "match_reason": m.get("match_reason"),
                    "rating": exp.rating,
                    "portfolio": exp.portfolio_text
                })

        # 3명 미만일 경우 폴백 보강
        if len(enriched_matches) < 3:
            matched_ids = {m["matched_expert_id"] for m in enriched_matches}
            for exp in top_experts:
                if len(enriched_matches) >= 3: break
                if str(exp.id) not in matched_ids:
                    enriched_matches.append({
                        "matched_expert_id": str(exp.id),
                        "expert_name": exp.name,
                        "expert_phone": exp.phone or "연락처 비공개",
                        "match_reason": f"{exp.portfolio_text[:30]}... 관련 전문성을 보유한 전문가입니다.",
                        "rating": exp.rating,
                        "portfolio": exp.portfolio_text
                    })

        return {"matches": enriched_matches}

    except Exception:
        # 파싱 에러 시 기본 정보 기반 폴백
        return {
            "matches": [{
                "matched_expert_id": str(exp.id),
                "expert_name": exp.name,
                "expert_phone": exp.phone or "연락처 비공개",
                "match_reason": f"{exp.portfolio_text[:30]}... 전문 경력을 보유하고 있습니다.",
                "rating": exp.rating,
                "portfolio": exp.portfolio_text
            } for exp in top_experts]
        }
