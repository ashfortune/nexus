from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.ai_client import get_ai_client
import json
import re

async def match_expert_service(db: AsyncSession, request_content: str, category_id: str = None):
    ai_client = get_ai_client("gemini")
    
    # 1. 사용자의 요구사항을 텍스트 임베딩으로 변환 (로컬 모델 활용)
    req_vector = await ai_client.embed_text(request_content)
    # pgvector 쿼리를 위한 문자열 형태 리스트로 변환
    vector_str = "[" + ",".join(map(str, req_vector)) + "]"
    
    # 2. Vector DB (pgvector) 검색 (Raw SQL)
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
        return {"matches": [], "message": "선택하신 분야에 아직 등록된 전문가가 없습니다."}
    
    # 3. RAG 프롬프트 구성
    expert_info_list = []
    for exp in top_experts:
        expert_info_list.append(
            f"[전문가: {exp.name} (ID: {str(exp.id)})]\n포트폴리오 및 이력: {exp.portfolio_text}\n평점: {exp.rating or '평가 없음'}"
        )
        
    experts_context = "\n\n".join(expert_info_list)
    
    system_instruction = """당신은 스타트업을 위한 전문 매칭 컨설턴트(AI)입니다. 
창업자의 요구사항과 검색된 전문가 후보 3명의 정보를 바탕으로, 각각의 전문가를 왜 추천하는지 친절하고 전문적인 말투로 1~2줄의 매칭 사유를 작성하세요.
반드시 제공된 후보 3명을 모두 포함하여 정확히 3개의 객체를 가진 JSON 배열 형식을 반환하세요.
백틱(`)이나 추가 설명 없이 JSON 배열만 반환하세요.
[
  { "matched_expert_id": "첫번째전문가ID", "expert_name": "이름1", "match_reason": "추천사유1" },
  { "matched_expert_id": "두번째전문가ID", "expert_name": "이름2", "match_reason": "추천사유2" },
  { "matched_expert_id": "세번째전문가ID", "expert_name": "이름3", "match_reason": "추천사유3" }
]"""

    chat_history = [
        {"role": "user", "content": f"창업자 요구사항: {request_content}\n\n전문가 후보 리스트:\n{experts_context}"}
    ]
    
    # 4. LLM 답변 생성 (Gemini)
    response_text = await ai_client.generate_response(system_instruction, chat_history)
    
    # 5. JSON 파싱 및 데이터 보강 (실명/전화번호 추가)
    try:
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            matches = json.loads(json_str)
            
            # DB 데이터와 매칭하여 추가 정보(실명, 전화번호) 부여
            expert_map = {str(exp.id): exp for exp in top_experts}
            
            enriched_matches = []
            for m in matches:
                exp_id = m.get("matched_expert_id")
                if exp_id in expert_map:
                    exp = expert_map[exp_id]
                    enriched_matches.append({
                        "matched_expert_id": exp_id,
                        "expert_name": exp.name,
                        "expert_phone": exp.phone if exp.phone else "연락처 미등록",
                        "match_reason": m.get("match_reason"),
                        "rating": exp.rating,
                        "portfolio": exp.portfolio_text
                    })
            
            # 3명이 안 될 경우 fallback
            if len(enriched_matches) < 3:
                existing_ids = {m.get("matched_expert_id") for m in enriched_matches}
                for exp in top_experts:
                    if len(enriched_matches) >= 3: break
                    if str(exp.id) not in existing_ids:
                        enriched_matches.append({
                            "matched_expert_id": str(exp.id),
                            "expert_name": exp.name,
                            "expert_phone": exp.phone if exp.phone else "연락처 미등록",
                            "match_reason": "사용자 요구사항과 유사한 포트폴리오를 보유하여 추가로 추천해 드립니다.",
                            "rating": exp.rating,
                            "portfolio": exp.portfolio_text
                        })
            
            return {"matches": enriched_matches}
        else:
            raise ValueError("JSON 배열 형식을 찾을 수 없음")
    except Exception as e:
        print(f"RAG Parsing Error: {e}")
        fallback_matches = []
        for exp in top_experts:
            fallback_matches.append({
                "matched_expert_id": str(exp.id), 
                "expert_name": exp.name,
                "expert_phone": exp.phone if exp.phone else "연락처 미등록",
                "match_reason": "시스템 자동 추천 전문가입니다.",
                "rating": exp.rating,
                "portfolio": exp.portfolio_text
            })
        return {"matches": fallback_matches}

