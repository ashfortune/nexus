import asyncio
import os
import sys
import uuid
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.core.ai_client import get_ai_client

EXPERT_DATA = [
    {
        "name": "김민수",
        "phone": "010-1234-5678",
        "category": "마케팅/그로스해킹",
        "portfolio": "스타트업 전문 그로스해커. 초기 스타트업의 CAC 최적화와 리텐션 개선 전문가. 10개 이상의 커머스 브랜드 스케일업 경험 보유. 데이터 분석 기반의 퍼포먼스 마케팅과 CRM 마케팅 전략 수립 및 실행."
    },
    {
        "name": "이하은",
        "phone": "010-2345-6789",
        "category": "마케팅/그로스해킹",
        "portfolio": "콘텐츠 마케팅 및 브랜딩 전문가. 소셜 미디어를 통한 유기적 도달 전략과 브랜드 스토리텔링 강점. MZ 세대 타겟팅 캠페인 다수 진행 및 성공 사례 보유."
    },
    {
        "name": "박준영",
        "phone": "010-3456-7890",
        "category": "IT/플랫폼 개발",
        "portfolio": "10년차 풀스택 개발자. Next.js와 Spring Boot 기반의 고가용성 플랫폼 아키텍처 설계 전문. 클라우드 인프라(AWS/GCP) 최적화 및 보안 강화 솔루션 제공. 다양한 MVP 개발 경험."
    },
    {
        "name": "최다원",
        "phone": "010-4567-8901",
        "category": "IT/플랫폼 개발",
        "portfolio": "모바일 앱 개발 전문가. Flutter와 React Native를 활용한 크로스 플랫폼 앱 개발 경험 풍부. 사용자 경험(UX) 중심의 인터랙티브한 UI 구현 강점."
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
    },
    {
        "name": "강현우",
        "phone": "010-7890-1234",
        "category": "법무/세무",
        "portfolio": "스타트업 전문 변리사. 지식재산권(IP) 확보 및 기술 보호 전략 수립. 특허 출원, 상표 등록 및 분쟁 대응 컨설팅 제공. 정부 지원 기술 가치 평가 경험."
    },
    {
        "name": "윤서윤",
        "phone": "010-8901-2345",
        "category": "법무/세무",
        "portfolio": "공인회계사 및 세무사. 스타트업 법인 설립부터 세무 기장, 세무 조사 대응까지 전 과정 케어. 엔젤 투자 및 스톡옵션 관련 세무 이슈 해결 전문."
    }
]

async def seed_expert_data():
    print("🚀 [Seed] 전문가 전용 데이터셋 생성을 시작합니다...")
    ai_client = get_ai_client("gemini")
    
    async with AsyncSessionLocal() as db:
        # 0. 테이블 생성 확인 (없으면 생성)
        print("🛠️ 전문가 테이블 확인 및 생성...")
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS experts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(50) NOT NULL,
                phone VARCHAR(20),
                email VARCHAR(100),
                industry_category_id UUID REFERENCES industry_categories(id),
                portfolio_text TEXT,
                rating DOUBLE PRECISION DEFAULT 0.0,
                embedding VECTOR(768),
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        await db.commit()

        # 1. 기존 데이터 정리 (선택 사항)
        print("🧹 기존 전문가 데이터셋을 초기화합니다...")
        await db.execute(text("DELETE FROM experts"))
        await db.commit()

        for data in EXPERT_DATA:
            # 카테고리 ID 조회
            result = await db.execute(text("SELECT id FROM industry_categories WHERE name = :name LIMIT 1"), {"name": data["category"]})
            cat_id = result.scalar()
            
            if not cat_id:
                cat_id = uuid.uuid4()
                await db.execute(text("INSERT INTO industry_categories (id, name, level, created_at) VALUES (:id, :name, 1, NOW())"), {"id": cat_id, "name": data["category"]})
                await db.commit()

            # 임베딩 생성
            print(f"✨ '{data['name']}' 전문가의 임베딩 생성 중...")
            vector = await ai_client.embed_text(data["portfolio"])
            vector_str = "[" + ",".join(map(str, vector)) + "]"

            # 전문가 데이터셋 테이블에 직접 삽입
            exp_id = uuid.uuid4()
            exp_sql = """
                INSERT INTO experts (id, name, phone, email, industry_category_id, portfolio_text, rating, embedding) 
                VALUES (:id, :name, :phone, :email, :cat_id, :portfolio, :rating, CAST(:vector AS vector))
            """
            await db.execute(text(exp_sql), {
                "id": exp_id,
                "name": data["name"],
                "phone": data["phone"],
                "email": f"expert_{exp_id.hex[:8]}@nexus-dataset.com",
                "cat_id": cat_id,
                "portfolio": data["portfolio"],
                "rating": round(random.uniform(4.5, 5.0), 1),
                "vector": vector_str
            })
            
            await db.commit()
            print(f"✅ '{data['name']}' 전문가 데이터셋 등록 완료")

    print("\n🎯 전용 전문가 데이터셋이 성공적으로 구축되었습니다.")

if __name__ == "__main__":
    asyncio.run(seed_expert_data())
