import asyncio
import json
import logging
import os
import random
import re
import sys
import uuid
from typing import Any, List, Dict

import requests
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# 로그 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.getcwd())

from app.core.ai_client import get_ai_client
from app.core.database import AsyncSessionLocal

# 데이터 경로
MODOO_JSON_PATH = os.path.join(os.path.dirname(__file__), "modoo_mentors_full.json")

# 실명 패턴 (2~4글자 한글)
KOREAN_NAME_PATTERN = re.compile(r'^[가-힣]{2,4}$')

# 카테고리 키워드
CATEGORY_KEYWORDS = {
    "투자/정부지원금": ["투자", "IR", "팁스", "VC", "AC", "자금", "정부지원", "심사역"],
    "IT/플랫폼 개발": ["IT", "소프트웨어", "플랫폼", "AI", "개발", "기술", "CTO", "기획"],
    "외식/F&B": ["외식", "F&B", "식품", "카페", "프랜차이즈", "식당", "요리"],
    "법무/세무/노무": ["법률", "세무", "노무", "특허", "변리사", "변호사", "회계", "IP"],
    "유통/커머스": ["유통", "커머스", "마케팅", "이커머스", "판로", "물류", "MD"],
    "바이오/헬스케어": ["바이오", "헬스케어", "의료", "제약", "디지털헬스"],
    "에듀테크": ["교육", "에듀", "학습", "강의"]
}

def map_category(text_data: str) -> str:
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text_data for kw in keywords):
            return cat
    return "창업/경영"

async def get_or_create_category(db: AsyncSession, category_name: str) -> uuid.UUID:
    result = await db.execute(text("SELECT id FROM industry_categories WHERE name = :name LIMIT 1"), {"name": category_name})
    cat_id = result.scalar()
    if not cat_id:
        cat_id = uuid.uuid4()
        await db.execute(text("INSERT INTO industry_categories (id, name, level, created_at) VALUES (:id, :name, 1, NOW())"), {"id": cat_id, "name": category_name})
        await db.commit()
    return cat_id

async def save_expert(db: AsyncSession, ai_client: Any, name: str, phone: str, category_id: uuid.UUID, portfolio: str, rating: float = None):
    try:
        vector = await ai_client.embed_text(portfolio)
        vector_str = "[" + ",".join(map(str, vector)) + "]"
        exp_id = uuid.uuid4()
        sql = """
            INSERT INTO experts (id, name, phone, industry_category_id, portfolio_text, rating, embedding) 
            VALUES (:id, :name, :phone, :cat_id, :portfolio, :rating, CAST(:vector AS vector))
        """
        await db.execute(text(sql), {
            "id": exp_id, "name": name, "phone": phone,
            "cat_id": category_id, "portfolio": portfolio,
            "rating": rating or round(random.uniform(4.3, 4.8), 1),
            "vector": vector_str
        })
        await db.commit()
        return True
    except Exception as e:
        logger.error(f"저장 오류: {e}")
        await db.rollback()
        return False

async def run_unified_seeder():
    logger.info("🚀 [Nexus Expert Seeder] '모두의 창업' 전문가 데이터 500명 구축 시작...")
    ai_client = get_ai_client("gemini")
    total_saved = 0
    seen_names = set()

    async with AsyncSessionLocal() as db:
        # 단계 0: 기존 데이터 초기화 (전문가 테이블만)
        await db.execute(text("TRUNCATE TABLE experts CASCADE"))
        await db.commit()

        # 단계 1: '모두의 창업' 데이터 삽입 (약 500명)
        if os.path.exists(MODOO_JSON_PATH):
            with open(MODOO_JSON_PATH, "r", encoding="utf-8") as f:
                mentors = json.load(f)
            
            logger.info(f"📂 JSON 파일 로드 완료: {len(mentors)}명 탐색 중...")
            
            for data in mentors:
                # ✨ 핵심: 실명 패턴(2-4글자 한글)만 허용하여 불건전 데이터 차단
                if not KOREAN_NAME_PATTERN.match(data["name"]) or data["name"] in seen_names:
                    continue
                    
                pos = data.get("position", "전문가")
                career = data.get("career", "대한민국 공식 인증 멘토입니다.")
                tags = ", ".join(data.get("tags", []))
                
                cat_name = map_category(data["company"] + " " + tags)
                cat_id = await get_or_create_category(db, cat_name)
                
                portfolio = f"[{data['name']} {pos}]\n소속: {data['company']}\n전문분야: {tags}\n\n[주요 경력]\n{career}"
                
                # 가짜 전화번호 생성 (실제 연락은 서비스 내에서 중개)
                fake_phone = f"010-{random.randint(1000,9999)}-{random.randint(1000,9999)}"
                
                if await save_expert(db, ai_client, data["name"], fake_phone, cat_id, portfolio, rating=round(random.uniform(4.7, 5.0), 1)):
                    total_saved += 1
                    seen_names.add(data["name"])
                    if total_saved % 50 == 0:
                        logger.info(f"✅ {total_saved}명 임베딩 및 저장 완료...")

        else:
            logger.error(f"❌ 데이터 파일을 찾을 수 없습니다: {MODOO_JSON_PATH}")

    logger.info(f"✨ 완성! 총 {total_saved}명의 검증된 전문가 데이터셋 구축이 완료되었습니다.")

if __name__ == "__main__":
    asyncio.run(run_unified_seeder())
