from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_
from sqlalchemy.orm import load_only
from app.models import Branding, BrandIdentity, LogoAsset, IndustryCategory, MarketingAsset
from app.domain.branding.brandingSchema import BrandingCreateRequest, BrandingInterviewRequest, ChatRequest
from app.core.ai_client import get_ai_client
from app.core.storage import get_storage_client
import json
import os
import uuid
import base64

# 테스트용 기본 유저 ID (요청에 없을 경우 대비)
DEFAULT_USER_ID = uuid.UUID("a248bb6e-7302-4b48-9375-c23ee477ea45")

# [최적화] 업종 데이터 인메모리 캐시
INDUSTRY_CACHE = {
    "map": {},        # ID -> IndustryCategory (이름, 부모ID 등 포함)
    "initialized": False
}

async def initialize_industry_cache(db: AsyncSession):
    """서버 시작 시 4,000여 개의 업종 데이터를 메모리에 로드하며, 기본 ID가 없을 경우 생성합니다."""
    if INDUSTRY_CACHE["initialized"]:
        return

    # [안전장치] 프론트엔드 기본 업종 ID(550e8400-e29b-41d4-a716-446655440000) 존재 확인
    default_id = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
    check_stmt = select(IndustryCategory).where(IndustryCategory.id == default_id)
    check_res = await db.execute(check_stmt)
    if not check_res.scalar_one_or_none():
        print(f"🛠 [System] 기본 업종 ID({default_id})를 생성합니다.")
        db.add(IndustryCategory(id=default_id, name="초기화/분석전", level=0))
        await db.commit()

    print("🧠 [Cache] 업종 카테고리 데이터를 메모리에 로딩 중...")
    # 임베딩 제외, 경로 계산에 필요한 필드만 가볍게 조회
    stmt = select(IndustryCategory).options(load_only(
        IndustryCategory.id, 
        IndustryCategory.name, 
        IndustryCategory.parent_id
    ))
    result = await db.execute(stmt)
    industries = result.scalars().all()
    
    INDUSTRY_CACHE["map"] = {ind.id: ind for ind in industries}
    INDUSTRY_CACHE["initialized"] = True
    print(f"✅ [Cache] {len(INDUSTRY_CACHE['map'])}개의 업종 데이터 로딩 완료!")

    # [백그라운드] 비어있는 임베딩 자동 채우기 시작
    import asyncio
    asyncio.create_task(auto_sync_missing_embeddings())

async def auto_sync_missing_embeddings():
    """임베딩이 없는 업종을 찾아 백그라운드에서 자동으로 채웁니다."""
    from app.core.database import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        # 임베딩이 없는 데이터 조회
        stmt = select(IndustryCategory).where(IndustryCategory.embedding == None)
        result = await db.execute(stmt)
        targets = result.scalars().all()
        
        if not targets:
            return

        print(f"⚙️ [Background] {len(targets)}개의 누락된 임베딩을 발견했습니다. 동기화를 시작합니다.")
        ai_client = get_ai_client("gemini")
        
        count = 0
        for ind in targets:
            try:
                vector = await ai_client.embed_text(ind.name)
                ind.embedding = vector
                count += 1
                
                # 50개 단위로 커밋하여 안정성 확보
                if count % 50 == 0:
                    await db.commit()
                    print(f"⏳ [Background] 임베딩 동기화 중... ({count}/{len(targets)})")
            except Exception as e:
                print(f"⚠️ [Background] '{ind.name}' 임베딩 생성 실패: {e}")
                continue
        
        await db.commit()
        print(f"✨ [Background] 총 {count}개의 업종 임베딩 동기화가 완료되었습니다.")

def get_full_path(ind):
    """캐시된 데이터를 사용하여 업종의 전체 경로를 즉시 반환합니다."""
    path = [ind.name]
    curr = ind
    ind_map = INDUSTRY_CACHE["map"]
    
    # 무한 루프 방지 및 캐시 활용
    depth = 0
    while curr.parent_id and curr.parent_id in ind_map and depth < 10:
        curr = ind_map[curr.parent_id]
        path.insert(0, curr.name)
        depth += 1
    return " > ".join(path)

async def create_new_branding(db: AsyncSession, request: BrandingCreateRequest) :
    """새로운 브랜딩 프로젝트를 생성하고 DB에 저장합니다."""
    try:
        new_branding = Branding(
            id=uuid.uuid4(),
            user_id=request.userId or DEFAULT_USER_ID,
            industry_category_id=request.industryId,
            title=request.title or "새 브랜딩 프로젝트",
            current_step="INTERVIEW"
        )
        db.add(new_branding)
        await db.commit()
        await db.refresh(new_branding)
        return new_branding
    except Exception as e:
        await db.rollback()
        print(f"❌ [create_new_branding 에러 상세]: {str(e)}")
        raise e

async def update_branding_interview(db: AsyncSession, branding_id: uuid.UUID, request: BrandingInterviewRequest):
    """인터뷰 답변을 저장하고 단계를 업데이트합니다."""
    result = await db.execute(select(Branding).where(Branding.id == branding_id))
    branding = result.scalar_one_or_none()
    if not branding:
        return None
    updated_data = {
        "keywords": request.keywords,
        "interview_data": request.interviewData
    }
    branding.keywords = updated_data
    branding.current_step = "NAMING_READY"
    await db.commit()
    await db.refresh(branding)
    return branding

INTERVIEW_SYSTEM_PROMPT_TEMPLATE = """
당신은 대표님의 성공적인 창업을 돕는 전문 컨설턴트 'Nexus AI'입니다. 
정중하고 친절하면서도 전문적인 어투를 유지하세요. (대표님에 대한 예우를 갖추세요)

[인터뷰 미션]
다음 4가지 핵심 정보가 어느 정도 파악되었다면 즉시 인터뷰를 종료하고 리포트 생성 단계로 안내하세요:
1. 비즈니스의 핵심 가치 (어떤 문제를 해결하는지)
2. 주요 타겟 고객층 (누구에게 판매하는지)
3. 브랜드의 시각적/감성적 분위기 (톤앤매너)
4. 아래 [업종 카테고리] 중 하나 확정 (가장 중요)

[업종 카테고리 목록]
{industry_list}

[규칙]
- 사용자가 업종을 명확히 선택했거나, 대화 맥락상 업종이 확정되었다면 고민하지 말고 `is_finished`를 `true`로 설정하세요.
- 완벽하게 모든 정보를 캐낼 필요는 없습니다. 브랜드 네이밍을 시작하기에 충분한 영감이 확보되었다면 종료하세요.
- 답변은 2~3문장 내외로 친절하게 작성하고, 마지막에 "브랜드 리포트를 생성할 준비가 되었습니다."와 같은 안내를 포함하세요.
- 업종이 확정되면 반드시 JSON에 해당 `industry_id`를 포함하세요.

[응답 포맷]
반드시 구분선 --- 뒤에 아래 JSON만 작성하세요.
---
{{
  "is_finished": bool,
  "industry_id": "UUID",
  "keywords": ["키워드1", "키워드2", ...],
  "msg": "대표님께 전달할 메시지"
}}
"""

async def chat_with_ai(db: AsyncSession, branding_id: uuid.UUID, request: ChatRequest):
    """AI와 대화를 나누고 상태를 분석하며 데이터를 실시간으로 DB에 동기화합니다."""
    try:
        ai_client = get_ai_client("gemini")
        
        # 1. 브랜딩 프로젝트 정보 우선 조회 (현재 단계 확인용)
        stmt = select(Branding).where(Branding.id == branding_id)
        db_result = await db.execute(stmt)
        branding = db_result.scalar_one_or_none()
        
        industry_list_str = "N/A"
        
        # 2. [최적화] 인터뷰 단계에서만 벡터 검색(업종 추천) 수행
        # 대표님 요청 사항: 불필요한 단계에서 벡터 로그가 남지 않도록 조건부 실행
        if branding and branding.current_step == "INTERVIEW":
            # 사용자의 현재 메시지를 벡터화하여 유사 업종 검색
            user_vector = await ai_client.embed_text(request.message)
            
            # HNSW 인덱스를 활용한 고속 유사도 검색
            stmt_ind = (
                select(IndustryCategory)
                .order_by(IndustryCategory.embedding.cosine_distance(user_vector))
                .limit(10)
            )
            industry_result = await db.execute(stmt_ind)
            industries = industry_result.scalars().all()
            
            # 캐시를 사용하여 업종 목록 문자열 생성
            if not INDUSTRY_CACHE["initialized"]:
                await initialize_industry_cache(db)
            industry_list_str = "\n".join([f"- {get_full_path(ind)} (ID: {ind.id})" for ind in industries])
        else:
            # 인터뷰 단계가 아니거나 업종이 이미 확정된 경우 벡터 검색 생략
            industry_list_str = "업종이 이미 확정되었거나 인터뷰 단계가 아닙니다."

        # 3. 프롬프트 완성
        system_prompt = INTERVIEW_SYSTEM_PROMPT_TEMPLATE.replace("{industry_list}", industry_list_str)

        history = [{"role": m.role, "content": m.content} for m in request.history[-6:]]
        history.append({"role": "user", "content": request.message})
        
        # 재시도 로직이 적용된 AI 호출
        raw_response = await ai_client.generate_response(system_prompt, history)
    except Exception as e:
        import traceback
        print("❌ [chat_with_ai 에러 발생]")
        traceback.print_exc()
        raise e # 에러를 다시 던져서 500 에러 상태는 유지
    try:
        if "---" in raw_response:
            parts = raw_response.split("---")
            json_str = parts[-1].strip()
            result = json.loads(json_str)
            if branding:
                industry_id = result.get("industry_id")
                # UUID 유효성 검사 추가
                if industry_id and industry_id != "null" and industry_id != "UUID":
                    try:
                        branding.industry_category_id = uuid.UUID(str(industry_id))
                    except (ValueError, TypeError):
                        print(f"Invalid UUID received from AI: {industry_id}")
                        
                branding.keywords = {
                    "extracted_keywords": result.get("keywords", [])
                }
                
                # 대화 내역(Chat History) 저장: 기존 history + 이번 대화
                full_history = [{"role": m.role, "content": m.content} for m in request.history] + [
                    {"role": "user", "content": request.message},
                    {"role": "assistant", "content": result.get("msg", "")}
                ]
                branding.chat_history = full_history
                
                await db.commit()
            
            return {
                "aiResponse": result.get("msg", "네, 알겠습니다. 계속해서 말씀을 나눠볼까요?"),
                "isFinished": result.get("is_finished", False),
                "extractedData": {
                    "keywords": result.get("keywords", []),
                    "industryId": result.get("industry_id")
                }
            }
    except Exception as e:
        print(f"Chat Logic Error: {e}")
    return {
        "aiResponse": raw_response.split("---")[0].strip(),
        "isFinished": False,
        "extractedData": {"keywords": []}
    }

NAMING_SYSTEM_PROMPT = """
당신은 최고의 브랜드 네이밍 전문가입니다. 
제공된 사용자의 인터뷰 데이터와 키워드를 분석하여, 브랜드의 가치를 가장 잘 담아내는 세련된 브랜드 명 3안을 제안하세요.

[출력 형식]
반드시 다음 구조의 JSON 리스트 형식으로만 응답하세요:
[
  {
    "brand_name": "이름 1",
    "slogan": "슬로건 1",
    "story": "브랜드가 탄생하게 된 배경과 그 이름이 가진 의미 설명"
  },
  {
    "brand_name": "이름 2",
    "slogan": "슬로건 2",
    "story": "..."
  },
  {
    "brand_name": "이름 3",
    "slogan": "슬로건 3",
    "story": "..."
  }
]
"""

async def generate_brand_names(db: AsyncSession, branding_id: uuid.UUID):
    """
    AI를 호출하여 브랜드 명을 생성하고 KIPRIS API로 실시간 검증합니다.
    중복된 상표(DANGER)가 발견되면 AI에게 재생성을 요청하는 'Self-Correction Loop'를 수행합니다.
    """
    result = await db.execute(select(Branding).where(Branding.id == branding_id))
    branding = result.scalar_one_or_none()
    if not branding or not branding.keywords:
        return None

    ai_client = get_ai_client("gemini")
    from app.core.kipris_client import get_kipris_client
    kipris_client = get_kipris_client()

    final_results = []
    avoid_names = []
    max_retries = 3
    retry_count = 0

    # 인터뷰 데이터 기반 컨텍스트 구성
    context_base = f"업종: {branding.title}\n키워드 및 인터뷰 데이터: {json.dumps(branding.keywords, ensure_ascii=False)}"

    while len(final_results) < 3 and retry_count < max_retries:
        retry_count += 1
        print(f"🔄 [Naming Loop] {retry_count}회차 생성 및 검증 시도 중...")
        
        # 제외할 이름 목록 추가
        avoid_msg = f"\n다음 이름들은 상표권 중복으로 인해 제외해야 합니다: {', '.join(avoid_names)}" if avoid_names else ""
        context = context_base + avoid_msg
        
        raw_response = await ai_client.generate_response(NAMING_SYSTEM_PROMPT, [{"role": "user", "content": context}])
        
        try:
            clean_json = raw_response.strip()
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[1].split("```")[0].strip()
            
            candidates = json.loads(clean_json)
            
            for opt in candidates:
                if len(final_results) >= 3:
                    break
                    
                brand_name = opt["brand_name"]
                if brand_name in avoid_names:
                    continue

                # KIPRIS 실시간 검증
                ip_result = await kipris_client.check_trademark(brand_name)
                
                if ip_result.get("status") == "DANGER":
                    print(f"⚠️ [DANGER] '{brand_name}'은(는) 상표권 중복으로 제외됩니다.")
                    avoid_names.append(brand_name)
                    continue # DANGER는 사용자에게 보여주지 않고 버림
                
                # SAFE 또는 WARNING인 경우만 채택
                
                # 브랜드 정체성 텍스트 임베딩 생성 (명칭 + 슬로건 + 스토리)
                full_identity_text = f"{brand_name} {opt.get('slogan', '')} {opt.get('story', '')}"
                identity_vector = await ai_client.embed_text(full_identity_text)
                
                identity = BrandIdentity(
                    id=uuid.uuid4(),
                    branding_id=branding_id,
                    brand_name=brand_name,
                    slogan=opt.get("slogan"),
                    brand_story=opt.get("story"),
                    is_selected=False,
                    embedding=identity_vector # 임베딩 값 저장
                )
                db.add(identity)
                
                final_results.append({
                    "identity": identity,
                    "ip_result": ip_result
                })
                
        except Exception as e:
            print(f"Naming Parsing Error at attempt {retry_count}: {str(e)}")
            if retry_count >= max_retries:
                raise e

    await db.commit()
    return final_results


LOGO_PROMPT_MAKER = """
당신은 로고 디자인 전문가입니다. 주어진 브랜드 정보를 바탕으로 시각적으로 독창적이고 안전한 로고 디자인을 위한 상세 영어 프롬프트를 **반드시 3개** 생성하세요.

**중요 규칙 (저작권/상표권 보호를 위해 반드시 준수할 것)**:
1. **모방 절대 금지**: 기존의 유명 브랜드, 로고, 아티스트 이름, 특정 캐릭터 등을 프롬프트에 절대 포함하지 마세요. (예: "in the style of Apple", "like Disney" 등 금지)
2. **추상성 및 기하학적 형태 강조**: 특정 사물을 너무 구체적으로 묘사하기보다는, 브랜드의 핵심 가치를 담은 기하학적 도형(Geometric shapes)이나 추상적인 심볼(Abstract symbols), 타이포그래피를 사용하여 독창성을 극대화하세요.
3. **벡터 스타일 강제**: 모든 로고는 군더더기 없이 깔끔하고 플랫한 벡터 일러스트레이션(Flat vector illustration, minimalist, SVG style) 형태로 디자인되도록 묘사하세요.

**일반 규칙**:
4. 각 프롬프트는 '---' (하이픈 3개)로 명확히 구분하세요.
5. 각 프롬프트는 800자 이내의 상세한 영어 문장이어야 합니다.
6. 로고의 색상, 질감, 배경(주로 단색 배경 권장)을 상세히 묘사하세요.

**출력 형식**:
[프롬프트 1]
---
[프롬프트 2]
---
[프롬프트 3]
"""

async def generate_brand_logo(db: AsyncSession, identity_id: uuid.UUID):
    """AI를 통해 3가지 스타일의 로고 파일만 생성하고 URL을 반환합니다. (DB 저장 X)"""
    
    # 1. 브랜드 아이덴티티 조회
    # (제목 자동 업데이트를 위해 Branding 엔티티를 조인하여 가져옵니다)
    from sqlalchemy.orm import joinedload
    stmt = select(BrandIdentity).options(joinedload(BrandIdentity.branding)).where(BrandIdentity.id == identity_id)
    result = await db.execute(stmt)
    identity = result.scalar_one_or_none()
    
    if not identity:
        return None
        
    if identity.branding:
        # [대표님 요청] 최종 브랜드 이름이 결정되었으므로 Branding 프로젝트의 제목을 업데이트합니다.
        if identity.branding.title != identity.brand_name:
            identity.branding.title = identity.brand_name
        
        # current_step도 업데이트 (인터뷰 -> 로고 생성 단계로)
        identity.branding.current_step = "LOGO_GENERATION"
        
        # [상태 반영] 선택된 아이덴티티의 is_selected를 True로, 나머지는 False로 설정
        await db.execute(
            update(BrandIdentity)
            .where(BrandIdentity.branding_id == identity.branding_id)
            .values(is_selected=False)
        )
        identity.is_selected = True
        
        await db.commit()
        
    # 2. 로고용 시각화 프롬프트 3종 생성
    ai_llm_client = get_ai_client("gemini") 
    context = f"브랜드명: {identity.brand_name}, 슬로건: {identity.slogan}, 스토리: {identity.brand_story}"
    raw_response = await ai_llm_client.generate_response(LOGO_PROMPT_MAKER, [{"role": "user", "content": context}])
    
    # 3개 후보군 추출 (최소 1개는 보장)
    prompts = [p.strip() for p in raw_response.split('---') if p.strip()]
    if not prompts:
        prompts = [raw_response.strip() or "A professional modern logo design for a brand"]
    
    # 3개가 안되면 보충
    while len(prompts) < 3:
        prompts.append(prompts[0] + f" style variant {len(prompts)}")
    
    prompts = prompts[:3]
    
    # 3. 이미지 생성 (Stability API - Base64 반환)
    ai_image_client = get_ai_client("stability")
    
    import asyncio
    async def create_logo_base64(visual_prompt: str, idx: int):
        try:
            # 파일 저장 없이 Base64 문자열 반환
            base64_data = await ai_image_client.generate_image_base64(visual_prompt)
            return {
                "tempId": f"temp_{idx}_{uuid.uuid4().hex[:4]}",
                "imageUrl": base64_data # 데이터 URI 직접 전달
            }
        except Exception as e:
            import traceback
            print(f"Logo Generation Error (Index {idx}):\n{traceback.format_exc()}")
            return None

    tasks = [create_logo_base64(p, i) for i, p in enumerate(prompts)]
    results = await asyncio.gather(*tasks)
    
    # --- Alignment Score 계산 및 품질 로깅 ---
    try:
        from app.core.ai_client import calculate_alignment_score
        
        valid_results = [r for r in results if r is not None]
        
        if valid_results:
            print(f"\n🎯 [AI Quality Log] 브랜드명: {identity.brand_name}")
            print("-" * 50)
            
            # 모든 로고에 대해 병렬로 점수 계산 (context는 텍스트, r["imageUrl"]은 Base64)
            score_tasks = [calculate_alignment_score(context, r["imageUrl"]) for r in valid_results]
            scores = await asyncio.gather(*score_tasks)
            
            for i, score in enumerate(scores):
                print(f"▶ {i+1}번 로고 - 정렬 점수(Alignment Score): {score:.1f}%")
            print("-" * 50 + "\n")
            
        return valid_results
    except Exception as e:
        print(f"⚠️ Alignment Score 로깅 중 에러 발생: {e}")
        return [r for r in results if r is not None]

# [추가] 마케팅 에셋(목업) 생성 프롬프트 메이커
MOCKUP_PROMPT_MAKER = """
브랜드 정보와 로고를 바탕으로, 실제 제품에 로고가 적용된 고품질 마케팅 목업 이미지(명함, 메뉴판/브로슈어, 포스터) 3종을 위한 프롬프트를 생성하세요.

**중요 규칙**:
1. 반드시 3개의 에셋(Business Card, Menu, Poster)을 생성하세요.
2. 각 에셋 블록은 '---' (하이픈 3개)로 구분하세요.
3. 각 블록 내에 Type, Title, Description, Prompt 필드를 반드시 포함하세요.
4. Prompt는 반드시 10자 이상의 상세한 영어 문장이어야 합니다.
5. [가장 중요] 이미지는 멀리서 찍은 풍경이 아니라, 해당 아이템(명함이면 딱 명함만, 메뉴판이면 딱 메뉴판만)이 화면에 꽉 차게(fill the frame), 클로즈업(close-up shot, macro shot)으로 선명하게 보이도록 프롬프트를 작성하세요. 배경은 단순하고 깔끔하게 처리하여 오직 아이템 자체에만 온전히 집중되도록 해야 합니다 (예: top-down view on a minimal solid color desk, studio lighting, strictly focused entirely on the single object).

응답 형식:
Type: Business Card
Title: [에셋 제목]
Description: [한 줄 설명]
Prompt: [영어 프롬프트]
---
Type: Menu
Title: [에셋 제목]
Description: [한 줄 설명]
Prompt: [영어 프롬프트]
---
Type: Poster
Title: [에셋 제목]
Description: [한 줄 설명]
Prompt: [영어 프롬프트]
"""

async def generate_marketing_assets(db: AsyncSession, identity_id: uuid.UUID):
    """최종 선정된 로고를 바탕으로 명함, 메뉴판 등의 마케팅 에셋 목업 이미지를 생성합니다."""
    try:
        # 1. 브랜드 아이덴티티, 로고 정보, 그리고 부모 객체인 branding 정보까지 한 번에 Eager Loading 조회
        from sqlalchemy.orm import joinedload
        stmt = select(BrandIdentity).options(
            joinedload(BrandIdentity.logo_assets),
            joinedload(BrandIdentity.branding)
        ).where(BrandIdentity.id == identity_id)
        result = await db.execute(stmt)
        identity = result.unique().scalar_one_or_none()
        
        if not identity or not identity.logo_assets:
            print(f"DEBUG: Identity or LogoAssets not found for {identity_id}")
            return None
            
        # 가장 최근에 확정된 로고 사용
        final_logo = identity.logo_assets[-1] 
        
        # 2. 에셋용 시각화 프롬프트 3종 생성 (LLM 활용)
        ai_llm_client = get_ai_client("gemini")
        context = f"브랜드명: {identity.brand_name}, 슬로건: {identity.slogan}, 스토리: {identity.brand_story}, 확정된로고특징: {final_logo.image_url}"
        raw_response = await ai_llm_client.generate_response(MOCKUP_PROMPT_MAKER, [{"role": "user", "content": context}])
        
        # 3. 응답 파싱
        asset_blocks = [block.strip() for block in raw_response.split('---') if block.strip()]
        assets_data = []
        
        ai_image_client = get_ai_client("stability")
        storage_client = get_storage_client()
        
        # 임시 디렉토리 사용 (업로드 후 삭제 예정이거나 캐시용)
        temp_dir = "app/static/temp"
        os.makedirs(temp_dir, exist_ok=True)
        
        import asyncio
        async def create_asset_file(block, idx):
            lines = block.split('\n')
            asset_info = {}
            for line in lines:
                if line.startswith("Type:"): asset_info["type"] = line.replace("Type:", "").strip()
                if line.startswith("Title:"): asset_info["title"] = line.replace("Title:", "").strip()
                if line.startswith("Description:"): asset_info["description"] = line.replace("Description:", "").strip()
                if line.startswith("Prompt:"): asset_info["prompt"] = line.replace("Prompt:", "").strip()
            prompt = asset_info.get("prompt", "").strip()
            if not prompt:
                prompt = f"A professional {asset_info.get('type', 'marketing asset')} mockup showing the brand logo"

            file_name = f"asset_{identity_id}_{uuid.uuid4().hex[:8]}_{idx}.png"
            temp_file_path = os.path.join(temp_dir, file_name)
            destination_path = f"assets/{file_name}"
            
            try:
                # 1. AI 이미지 생성 (로컬 임시 저장)
                await ai_image_client.generate_image(prompt, temp_file_path)
                
                # 2. 저장소(Supabase 등)에 업로드
                public_url = await storage_client.upload_file(temp_file_path, destination_path)
                
                # 3. 임시 파일 삭제 (클라우드 사용 시)
                if os.path.exists(temp_file_path) and os.getenv("STORAGE_TYPE") == "SUPABASE":
                    os.remove(temp_file_path)
                    
                return {
                    "id": str(uuid.uuid4()),
                    "type": asset_info.get("type", "Marketing Asset"),
                    "title": asset_info.get("title", "Marketing Asset"),
                    "description": asset_info.get("description", ""),
                    "imageUrl": public_url
                }
            except Exception as e:
                print(f"Asset generation error: {str(e)}")
            return None

        tasks = [create_asset_file(b, i) for i, b in enumerate(asset_blocks[:3])]
        results = await asyncio.gather(*tasks)
        
        # [DB 저장] 생성된 에셋 정보를 marketing_assets 테이블에 저장
        final_results = []
        for r in results:
            if r:
                # Type 정규화 (Business Card -> BUSINESS_CARD 등)
                raw_type = r.get("type", "Marketing Asset").upper().replace(" ", "_")
                
                new_asset = MarketingAsset(
                    id=uuid.UUID(r["id"]),
                    identity_id=identity_id,
                    type=raw_type,
                    file_url=r["imageUrl"]
                )
                db.add(new_asset)
                final_results.append(r)
        
        # 브랜딩 단계 완료 업데이트
        if identity.branding:
            identity.branding.current_step = "COMPLETED"
            identity.branding.title = identity.brand_name # 최종 브랜드 이름으로 제목 업데이트
            
        await db.commit()
        return final_results
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR in generate_marketing_assets:\n{traceback.format_exc()}")
        raise e

async def finalize_brand_logo(db: AsyncSession, identity_id: uuid.UUID, image_url: str):
    """선택된 로고(Base64)를 파일로 저장하고 DB에 등록합니다."""
    # 1. Base64 데이터 파싱 및 업로드
    storage_client = get_storage_client()
    file_name = f"final_logo_{identity_id}_{uuid.uuid4().hex[:6]}.png"
    destination_path = f"logos/{file_name}"
    final_url = image_url
    
    try:
        if image_url.startswith("data:image"):
            # Base64 데이터 추출 (data:image/png;base64,...)
            header, encoded = image_url.split(",", 1)
            image_bytes = base64.b64decode(encoded)
            
            # 저장소 클라이언트를 사용하여 업로드
            final_url = await storage_client.upload_bytes(image_bytes, destination_path)
    except Exception as e:
        print(f"Final logo upload error: {str(e)}")
        # 실패 시에도 에러를 던지지 않고 기존 URL 사용 시도 (또는 에러 처리)

    # 2. DB 저장
    new_logo = LogoAsset(
        id=uuid.uuid4(),
        identity_id=identity_id,
        image_url=final_url,
        style_tag="FINAL_SELECTION",
        is_final=True
    )
    db.add(new_logo)
    await db.commit()
    await db.refresh(new_logo)
    
    # 3. 프로젝트 타이틀 업데이트 (선택된 브랜드명으로)
    stmt = select(BrandIdentity).where(BrandIdentity.id == identity_id)
    result = await db.execute(stmt)
    identity = result.scalar_one_or_none()
    
    if identity:
        from app.models import Branding
        await db.execute(
            update(Branding)
            .where(Branding.id == identity.branding_id)
            .values(title=identity.brand_name, current_step="LOGO_GENERATION")
        )
        # 아이덴티티 선택 상태 보장
        identity.is_selected = True
        await db.commit()
        
    return new_logo
