import asyncio
import logging
import os
import random
import sys
import uuid
from typing import Any

import requests
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# 로그 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.ai_client import get_ai_client
from app.core.database import AsyncSessionLocal

# 1. 고품질 수동 시드 데이터 (전문가 매칭의 기준점)
SEED_EXPERT_DATA = [
    {
        "name": "김민수",
        "phone": "010-1234-5678",
        "category": "마케팅/그로스해킹",
        "portfolio": "스타트업 전문 그로스해커. 초기 스타트업의 CAC 최적화와 리텐션 개선 전문가. 10개 이상의 커머스 브랜드 스케일업 경험 보유. 데이터 분석 기반의 퍼포먼스 마케팅과 CRM 마케팅 전략 수립 및 실행."
    },
    {
        "name": "박준영",
        "phone": "010-3456-7890",
        "category": "IT/플랫폼 개발",
        "portfolio": "10년차 풀스택 개발자. Next.js와 Spring Boot 기반의 고가용성 플랫폼 아키텍처 설계 전문. 클라우드 인프라(AWS/GCP) 최적화 및 보안 강화 솔루션 제공. 다양한 MVP 개발 경험."
    },
    {
        "name": "정성훈",
        "phone": "010-5678-9012",
        "category": "투자/정부지원금",
        "portfolio": "벤처캐피탈(VC) 심사역 출신 컨설턴트. IR 피칭 덱 구성 및 투자 유치 전략 수립 전문. 예비/초기/창업도약패키지 등 정부지원사업 선정 가이드 및 사업계획서 고도화."
    },
    {
        "name": "한지희",
        "phone": "010-6789-0123",
        "category": "디자인/브랜딩",
        "portfolio": "브랜드 아이덴티티(BI) 및 패키지 디자인 전문가. 브랜드의 가치를 시각적으로 전달하는 디자인 시스템 구축. 스타트업 브랜드 리뉴얼 프로젝트 다수 수행."
    }
]

# 2. 대규모 크롤링을 위한 키워드 세팅
CRAWL_KEYWORDS = [
    ("스타트업 마케터", "마케팅/그로스해킹"), ("퍼포먼스 마케팅", "마케팅/그로스해킹"), ("그로스해커", "마케팅/그로스해킹"),
    ("스타트업 개발자", "IT/플랫폼 개발"), ("웹 백엔드 개발", "IT/플랫폼 개발"), ("App 서비스 기획", "IT/플랫폼 개발"),
    ("스타트업 투자", "투자/정부지원금"), ("벤처캐피탈", "투자/정부지원금"), ("IR 피칭 전략", "투자/정부지원금"),
    ("브랜드 디자이너", "디자인/브랜딩"), ("UXUI 디자인", "디자인/브랜딩"), ("스타트업 로고", "디자인/브랜딩"),
    ("스타트업 세무", "법무/세무"), ("변리사 특허", "법무/세무"), ("창업 노무 컨설팅", "법무/세무")
]

MAX_PAGES_PER_KEYWORD = 10
TARGET_TOTAL_COUNT = 1000

async def get_or_create_category(db: AsyncSession, category_name: str) -> uuid.UUID:
    """카테고리가 없으면 생성하고 ID를 반환합니다."""
    result = await db.execute(text("SELECT id FROM industry_categories WHERE name = :name LIMIT 1"), {"name": category_name})
    cat_id = result.scalar()

    if not cat_id:
        cat_id = uuid.uuid4()
        await db.execute(text("INSERT INTO industry_categories (id, name, level, created_at) VALUES (:id, :name, 1, NOW())"), {"id": cat_id, "name": category_name})
        await db.commit()
    return cat_id

async def save_expert(db: AsyncSession, ai_client: Any, name: str, phone: str, email: str, category_id: uuid.UUID, portfolio: str):
    """전문가 데이터를 임베딩하여 DB에 저장합니다."""
    try:
        # 중복 체크 (이름과 포트폴리오 일부로 판단)
        check_sql = "SELECT id FROM experts WHERE name = :name AND portfolio_text LIKE :p_part LIMIT 1"
        result = await db.execute(text(check_sql), {"name": name, "p_part": portfolio[:20] + "%"})
        if result.scalar():
            return False

        # AI 임베딩 생성
        vector = await ai_client.embed_text(portfolio)
        vector_str = "[" + ",".join(map(str, vector)) + "]"

        exp_id = uuid.uuid4()
        sql = """
            INSERT INTO experts (id, name, phone, email, industry_category_id, portfolio_text, rating, embedding) 
            VALUES (:id, :name, :phone, :email, :cat_id, :portfolio, :rating, CAST(:vector AS vector))
        """
        await db.execute(text(sql), {
            "id": exp_id,
            "name": name,
            "phone": phone,
            "email": email,
            "cat_id": category_id,
            "portfolio": portfolio,
            "rating": round(random.uniform(4.2, 5.0), 1),
            "vector": vector_str
        })
        await db.commit()
        return True
    except Exception as e:
        logger.error(f"전문가 저장 중 오류: {e}")
        await db.rollback()
        return False

async def run_unified_seeder():
    logger.info("🚀 [Nexus Unified Seeder] 전문가 데이터 구축을 시작합니다...")
    ai_client = get_ai_client("gemini")
    total_saved = 0
    seen_names = set()

    async with AsyncSessionLocal() as db:
        # 단계 1: 시드 데이터(Curation) 먼저 삽입
        logger.info("💎 [Step 1] 고품질 시드 데이터 삽입 중...")
        for data in SEED_EXPERT_DATA:
            cat_id = await get_or_create_category(db, data["category"])
            success = await save_expert(
                db, ai_client, data["name"], data["phone"],
                f"expert_{uuid.uuid4().hex[:6]}@nexus.com", cat_id, data["portfolio"]
            )
            if success:
                total_saved += 1
                seen_names.add(data["name"])

        # 단계 2: 대규모 크롤링(Crawling) 수행
        logger.info(f"🌐 [Step 2] 브런치 대규모 크롤링 시작 (목표: {TARGET_TOTAL_COUNT}명)...")
        for keyword, category in CRAWL_KEYWORDS:
            if total_saved >= TARGET_TOTAL_COUNT: break

            logger.info(f"🔍 키워드 검색: {keyword} ({category})")
            cat_id = await get_or_create_category(db, category)

            for page in range(1, MAX_PAGES_PER_KEYWORD + 1):
                if total_saved >= TARGET_TOTAL_COUNT: break

                url = f"https://api.brunch.co.kr/v1/search/article?q={keyword}&page={page}"
                try:
                    res = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
                    if res.status_code != 200: break

                    articles = res.json().get('data', {}).get('list', [])
                    if not articles: break

                    for art in articles:
                        profile = art.get('profile', {})
                        user_name = profile.get('userName', '전문가')
                        user_desc = profile.get('userDesc', '')
                        title = art.get('title', '')

                        if not user_desc or user_name in seen_names: continue

                        portfolio = f"[{user_name} 전문가의 소개]\n{user_desc}\n\n[주요 활동 및 기고]\n{title}"

                        success = await save_expert(
                            db, ai_client, user_name,
                            f"010-{random.randint(1000,9999)}-{random.randint(1000,9999)}",
                            f"brunch_{uuid.uuid4().hex[:6]}@nexus.com", cat_id, portfolio
                        )
                        if success:
                            total_saved += 1
                            seen_names.add(user_name)
                            if total_saved % 10 == 0:
                                logger.info(f"✅ 현재까지 {total_saved}명의 전문가가 등록되었습니다.")

                        # AI API 할당량 조절을 위한 짧은 휴식
                        await asyncio.sleep(0.5)

                except Exception as e:
                    logger.warning(f"크롤링 중 일시적 오류: {e}")

                await asyncio.sleep(1) # IP 차단 방지

    logger.info(f"✨ 모든 작업이 완료되었습니다. 총 {total_saved}명의 전문가 데이터가 구축되었습니다.")

if __name__ == "__main__":
    asyncio.run(run_unified_seeder())
