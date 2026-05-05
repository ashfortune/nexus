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
    
    system_instruction = """당신은 스타트업과 소상공인을 위한 AI 전문 매칭 컨설턴트입니다. 
창업자의 요구사항과 검색된 전문가 3명의 정보를 바탕으로, 각 전문가별 맞춤 추천 사유를 작성하세요.

[준수 사항]
1. 반드시 전문가 후보 리스트에 제공된 '실제 전문가 ID(UUID)'를 "matched_expert_id" 값으로 사용하세요. 예시에 있는 "ID1" 등을 그대로 쓰면 절대 안 됩니다.
2. 각 전문가의 '포트폴리오 및 이력' 데이터를 참고하여 해당 전문가만의 독특한 강점을 언급하세요.
3. 창업자의 요구사항과 전문가의 경력이 어떻게 매칭되는지 구체적으로 기술하세요.
4. 사유는 1~2줄 내외로, 신뢰감 있고 전문적인 톤을 유지하세요.
5. 반드시 제공된 후보 3명 모두에 대해 각각 다른 사유를 작성하여 정확히 3개의 JSON 객체를 포함한 배열을 반환하세요.
6. 백틱(`)이나 추가 설명 없이 순수 JSON 배열만 반환하세요.

[출력 형식 예시]
[
  { "matched_expert_id": "제공된-실제-UUID-1", "expert_name": "이름1", "match_reason": "경험과 강점을 포함한 구체적 사유1" },
  { "matched_expert_id": "제공된-실제-UUID-2", "expert_name": "이름2", "match_reason": "경험과 강점을 포함한 구체적 사유2" },
  { "matched_expert_id": "제공된-실제-UUID-3", "expert_name": "이름3", "match_reason": "경험과 강점을 포함한 구체적 사유3" }
]"""

    chat_history = [
        {"role": "user", "content": f"창업자 요구사항: {request_content}\n\n전문가 후보 리스트:\n{experts_context}"}
    ]
    
    # 4. LLM 답변 생성 (Gemini)
    response_text = await ai_client.generate_response(system_instruction, chat_history)
    print(f"DEBUG: AI Expert Match Response: {response_text}")
    
    # 5. JSON 파싱 및 데이터 보강 (실명/전화번호 추가)
    try:
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            matches = json.loads(json_str)
            
            # DB 데이터와 매칭하여 추가 정보(실명, 전화번호) 부여
            expert_id_map = {str(exp.id): exp for exp in top_experts}
            expert_name_map = {exp.name: exp for exp in top_experts}
            
            enriched_matches = []
            for m in matches:
                exp_id = m.get("matched_expert_id")
                exp_name = m.get("expert_name")
                
                # 1. ID로 찾기 시도, 실패 시 2. 이름으로 찾기 시도
                exp = expert_id_map.get(exp_id) or expert_name_map.get(exp_name)
                
                if exp:
                    enriched_matches.append({
                        "matched_expert_id": str(exp.id),
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
                        # 동적 폴백 메시지 생성
                        short_portfolio = (exp.portfolio_text[:30] + "...") if len(exp.portfolio_text) > 30 else exp.portfolio_text
                        enriched_matches.append({
                            "matched_expert_id": str(exp.id),
                            "expert_name": exp.name,
                            "expert_phone": exp.phone if exp.phone else "연락처 미등록",
                            "match_reason": f"{short_portfolio} 관련 전문 지식을 보유하고 있어 추가로 추천드립니다.",
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
            # 동적 폴백 메시지 생성 (최악의 경우에도 개별화)
            short_portfolio = (exp.portfolio_text[:30] + "...") if len(exp.portfolio_text) > 30 else exp.portfolio_text
            fallback_matches.append({
                "matched_expert_id": str(exp.id), 
                "expert_name": exp.name,
                "expert_phone": exp.phone if exp.phone else "연락처 미등록",
                "match_reason": f"{short_portfolio} 분야의 전문적인 커리어를 바탕으로 선정한 추천 전문가입니다.",
                "rating": exp.rating,
                "portfolio": exp.portfolio_text
            })
        return {"matches": fallback_matches}
