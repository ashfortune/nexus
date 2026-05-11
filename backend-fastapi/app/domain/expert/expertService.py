import json
import re
from typing import List, Dict, Any, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Expert, ExpertMatchRequest
from app.core.ai_client import get_ai_client


async def match_expert_service(db: AsyncSession, user_id: str, request_content: str, category_id: str = None) -> Dict[str, Any]:
    """전문가 매칭 메인 서비스"""
    ai_client = get_ai_client("gemini")

    # 1. 매칭 요청 기록 생성 (request_id만 반환)
    match_request_id = await _create_match_request(db, user_id, request_content, category_id)

    # 2. 유사 전문가 검색 (Vector DB)
    top_experts = await _search_top_experts(db, ai_client, request_content, category_id)
    
    if not top_experts:
        return await _handle_match_failure(db, match_request_id)

    # 3. AI 추천 사유 생성 (10초 timeout, 실패 시 fallback)
    try:
        import asyncio
        enriched_matches = await asyncio.wait_for(
            _generate_ai_recommendations(ai_client, request_content, top_experts),
            timeout=10.0
        )
    except Exception:
        # AI 실패 또는 timeout 시 vector 검색 상위 3명 즉시 반환
        enriched_matches = [
            _format_expert_info(exp, "고객님의 요구사항과 연관된 전문성을 보유하여 추천드립니다.")
            for exp in top_experts[:3]
        ]

    # 4. 결과 업데이트 및 반환
    return await _finalize_match_result(db, match_request_id, enriched_matches)


async def _create_match_request(db: AsyncSession, user_id: str, content: str, category_id: str):
    """매칭 요청 초기 기록 생성 (FK 우회: users 테이블 미동기화 환경 대응)"""
    import uuid as _uuid
    new_id = _uuid.uuid4()
    # FK 제약 우회를 위해 raw SQL INSERT 사용
    sql = text("""
        INSERT INTO expert_match_requests (id, requester_id, industry_category_id, request_content, status, created_at)
        VALUES (:id, :requester_id, :cat_id, :content, 'PENDING', NOW())
    """)
    await db.execute(sql, {
        "id": new_id,
        "requester_id": user_id,
        "cat_id": category_id,
        "content": content
    })
    await db.commit()
    return new_id


async def _search_top_experts(db: AsyncSession, ai_client: Any, content: str, category_id: str) -> List[Any]:
    """요구사항 기반 유사 전문가 검색 (Fallback 포함)"""
    req_vector = await ai_client.embed_text(content)
    vector_str = "[" + ",".join(map(str, req_vector)) + "]"
    
    base_sql = "SELECT e.id, e.portfolio_text, e.rating, e.name, e.phone FROM experts e"
    params = {"vector": vector_str}
    
    # 1차: 카테고리 필터링 검색
    if category_id:
        sql = base_sql + " WHERE e.industry_category_id = :cat_id ORDER BY e.embedding <=> CAST(:vector AS vector) LIMIT 5"
        params["cat_id"] = category_id
        result = await db.execute(text(sql), params)
        experts = result.fetchall()
        if experts: return experts

    # 2차: 전체 검색 (Fallback)
    sql = base_sql + " ORDER BY e.embedding <=> CAST(:vector AS vector) LIMIT 5"
    result = await db.execute(text(sql), params)
    return result.fetchall()


async def _generate_ai_recommendations(ai_client: Any, content: str, candidates: List[Any]) -> List[Dict[str, Any]]:
    """AI를 이용해 후보군 중 최적의 3인 선정 및 사유 생성"""
    # 포트폴리오 텍스트를 500자로 잘라 API 토큰 초과 방지
    context = "\n".join([f"[ID: {str(e.id)}] {e.name}: {(e.portfolio_text or '')[:500]}" for e in candidates])
    
    system_instr = (
        "당신은 스타트업 전문 매칭 컨설턴트입니다. "
        "가장 적합한 전문가 3명을 선정하고 구체적인 추천 사유를 JSON 형식으로만 응답하세요. "
        "반드시 'matched_expert_id'에 제공된 UUID를 정확히 입력하세요."
    )
    
    history = [{"role": "user", "content": f"요구사항: {content}\n\n후보군:\n{context}"}]
    response_text = await ai_client.generate_response(system_instr, history)
    
    import logging
    logging.info(f"[AI Match] Gemini 응답: {response_text[:200]}")
    
    matches = _parse_ai_response(response_text)
    return _enrich_and_fallback(matches, candidates)


def _parse_ai_response(text_data: str) -> List[Dict[str, Any]]:
    """AI 응답 텍스트에서 JSON 추출 및 파싱 (마크다운 코드블록 처리 포함)"""
    try:
        # 마크다운 코드블록 제거 (```json ... ``` 또는 ``` ... ```)
        cleaned = re.sub(r'```(?:json)?', '', text_data).strip()
        # JSON 배열 추출
        json_match = re.search(r'\[.*\]', cleaned, re.DOTALL)
        return json.loads(json_match.group()) if json_match else []
    except Exception:
        return []


def _enrich_and_fallback(ai_matches: List[Dict[str, Any]], candidates: List[Any]) -> List[Dict[str, Any]]:
    """AI 결과를 상세 데이터와 결합하고 부족분은 Fallback으로 채움"""
    enriched = []
    candidate_map = {str(c.id): c for c in candidates}
    
    # 1. AI 추천 결과 결합
    for m in ai_matches:
        cand = candidate_map.get(m.get("matched_expert_id"))
        if cand and len(enriched) < 3:
            enriched.append(_format_expert_info(cand, m.get("match_reason")))
            
    # 2. 3명이 안 될 경우 후보군 순서대로 채우기
    for cand in candidates:
        if len(enriched) >= 3: break
        if str(cand.id) not in [e["matched_expert_id"] for e in enriched]:
            reason = "고객님의 요구사항과 연관된 전문성을 보유하여 추천드립니다."
            enriched.append(_format_expert_info(cand, reason))
            
    return enriched


def _format_expert_info(exp: Any, reason: str) -> Dict[str, Any]:
    """전문가 정보를 공통 포맷으로 변환"""
    return {
        "matched_expert_id": str(exp.id),
        "expert_name": exp.name,
        "expert_phone": exp.phone or "010-0000-0000",
        "match_reason": reason or "전문 분야의 탁월한 역량을 보유하고 있습니다.",
        "rating": float(exp.rating) if exp.rating else 5.0,
        "portfolio": exp.portfolio_text
    }


async def _handle_match_failure(db: AsyncSession, request_id) -> Dict[str, Any]:
    """매칭 실패 처리"""
    await db.execute(text("UPDATE expert_match_requests SET status='FAILED' WHERE id=:id"), {"id": request_id})
    await db.commit()
    return {
        "matches": [],
        "message": "가용한 전문가가 없습니다. 데이터베이스를 확인해주세요.",
        "match_request_id": str(request_id)
    }


async def _finalize_match_result(db: AsyncSession, request_id, matches: List[Dict[str, Any]]) -> Dict[str, Any]:
    """최종 결과 업데이트 및 반환"""
    if matches:
        await db.execute(
            text("UPDATE expert_match_requests SET status='COMPLETED', matched_expert_id=:eid, match_reason=:reason WHERE id=:id"),
            {"eid": matches[0]["matched_expert_id"], "reason": matches[0]["match_reason"], "id": request_id}
        )
    else:
        await db.execute(text("UPDATE expert_match_requests SET status='FAILED' WHERE id=:id"), {"id": request_id})

    await db.commit()
    return {
        "match_request_id": str(request_id),
        "matches": matches
    }
