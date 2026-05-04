import os
import sys
import asyncio
import uuid
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

# 프로젝트 루트 디렉토리를 path에 추가 (app 모듈 임포트용)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models import IndustryCategory
from app.core.ai_client import get_ai_client

async def sync_embeddings():
    """로컬 모델을 사용하여 모든 업종 데이터를 고속으로 동기화합니다."""
    print("🚀 로컬 모델 기반 초고속 임베딩 동기화 시작...")
    
    # 모델 로딩 (최초 실행 시 다운로드 시간이 발생할 수 있습니다)
    ai_client = get_ai_client("gemini")
    
    async with AsyncSessionLocal() as db:
        # 1. 기존 임베딩 초기화 (모델이 바뀌었으므로 전체 재작성 필요)
        print("🧹 기존 임베딩 데이터 초기화 중...")
        await db.execute(update(IndustryCategory).values(embedding=None))
        await db.commit()

        # 2. 전체 업종 조회
        stmt = select(IndustryCategory)
        result = await db.execute(stmt)
        industries = result.scalars().all()
        
        print(f"📦 총 {len(industries)}개의 업종을 로컬 모델로 처리합니다.")
        
        count = 0
        for ind in industries:
            try:
                # 3. 로컬 모델로 임베딩 생성 (초고속)
                vector = await ai_client.embed_text(ind.name)
                
                # 4. DB 업데이트
                ind.embedding = vector
                count += 1
                
                if count % 100 == 0:
                    print(f"⏳ 진행 중... ({count}/{len(industries)})")
                    await db.commit() # 100개 단위로 저장
                    
            except Exception as e:
                print(f"❌ 오류 발생 ({ind.name}): {str(e)}")
        
        await db.commit()
        print(f"✨ 동기화 완료! 총 {count}개의 업종이 로컬 모델로 업데이트되었습니다.")

if __name__ == "__main__":
    asyncio.run(sync_embeddings())
