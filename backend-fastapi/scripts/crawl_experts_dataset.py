import asyncio
import os
import sys
import uuid
import requests
import random
import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.core.ai_client import get_ai_client

# 수집 타겟 키워드 및 카테고리 매칭
KEYWORDS = [
    ("스타트업 마케팅", "마케팅/그로스해킹"), ("퍼포먼스 마케터", "마케팅/그로스해킹"), ("그로스해킹 전략", "마케팅/그로스해킹"),
    ("React 개발자", "IT/플랫폼 개발"), ("Spring Boot 백엔드", "IT/플랫폼 개발"), ("App 서비스 기획", "IT/플랫폼 개발"),
    ("정부지원사업 합격", "투자/정부지원금"), ("엔젤투자 유치", "투자/정부지원금"), ("IR 피칭 덱", "투자/정부지원금"),
    ("로고 디자인", "디자인/브랜딩"), ("브랜드 아이덴티티", "디자인/브랜딩"), ("UIUX 디자인", "디자인/브랜딩"),
    ("스타트업 특허", "법무/세무"), ("법인 세무 관리", "법무/세무"), ("창업 노무 컨설팅", "법무/세무")
]

# 가상 이름 생성을 위한 성/이름 리스트
LAST_NAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "전", "홍"]
FIRST_NAMES = ["민준", "서준", "도윤", "예준", "시우", "하준", "주원", "지호", "지후", "준서", "서연", "서윤", "지우", "서현", "하은", "하윤", "민서", "지유", "윤서", "채원"]

def generate_random_name():
    return random.choice(LAST_NAMES) + random.choice(FIRST_NAMES)

def generate_random_phone():
    return f"010-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"

async def crawl_experts_dataset():
    print("🚀 [Dataset Crawler] 전문가 데이터셋 대량 수집 및 임베딩을 시작합니다...")
    ai_client = get_ai_client("gemini")
    total_saved = 0
    
    async with AsyncSessionLocal() as db:
        for keyword, category in KEYWORDS:
            print(f"\n🔍 키워드 검색: '{keyword}' (분야: {category})")
            
            # 카테고리 ID 조회
            result = await db.execute(text("SELECT id FROM industry_categories WHERE name = :name LIMIT 1"), {"name": category})
            cat_id = result.scalar()
            
            if not cat_id:
                cat_id = uuid.uuid4()
                await db.execute(text("INSERT INTO industry_categories (id, name, level, created_at) VALUES (:id, :name, 1, NOW())"), {"id": cat_id, "name": category})
                await db.commit()

            # 브런치 API 등을 활용한 데이터 수집 (예시: 페이지당 10개씩 3페이지)
            for page in range(1, 4):
                url = f"https://api.brunch.co.kr/v1/search/article?q={keyword}&page={page}"
                headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                
                try:
                    response = requests.get(url, headers=headers, timeout=10)
                    if response.status_code != 200: break
                    
                    articles = response.json().get('data', {}).get('list', [])
                    if not articles: break
                    
                    for article in articles:
                        profile = article.get('profile', {})
                        user_desc = profile.get('userDesc', '현업 실무 전문가입니다.')
                        title = article.get('title', '')
                        
                        # 포트폴리오 텍스트 구성
                        portfolio = f"{user_desc}\n\n[주요 이력 및 프로젝트]\n{title}"
                        
                        # 실명 및 연락처 랜덤 생성 (데이터셋 보강)
                        real_name = generate_random_name()
                        phone = generate_random_phone()
                        
                        # 1. 임베딩 생성 (AI 서비스 호출)
                        print(f"✨ '{real_name}' 전문가 데이터 임베딩 중...")
                        try:
                            vector = await ai_client.embed_text(portfolio)
                            vector_str = "[" + ",".join(map(str, vector)) + "]"
                        except Exception as e:
                            print(f"⚠️ 임베딩 실패 (건너뜀): {e}")
                            continue

                        # 2. 전용 테이블에 삽입
                        exp_id = uuid.uuid4()
                        exp_sql = """
                            INSERT INTO experts (id, name, phone, email, industry_category_id, portfolio_text, rating, embedding) 
                            VALUES (:id, :name, :phone, :email, :cat_id, :portfolio, :rating, CAST(:vector AS vector))
                        """
                        await db.execute(text(exp_sql), {
                            "id": exp_id,
                            "name": real_name,
                            "phone": phone,
                            "email": f"dataset_{exp_id.hex[:6]}@nexus.com",
                            "cat_id": cat_id,
                            "portfolio": portfolio,
                            "rating": round(random.uniform(4.0, 5.0), 1),
                            "vector": vector_str
                        })
                        
                        await db.commit()
                        total_saved += 1
                        print(f"✅ 수집 완료 ({total_saved}명): {real_name}")
                        
                        # API 레이트 리밋 방지
                        await asyncio.sleep(0.5)

                except Exception as e:
                    print(f"⚠️ 에러 발생 (건너뜀): {e}")
                    await db.rollback()

    print(f"\n🎯 크롤링 완료! 총 {total_saved}명의 전문가 데이터셋이 구축되었습니다.")

if __name__ == "__main__":
    asyncio.run(crawl_experts_dataset())
