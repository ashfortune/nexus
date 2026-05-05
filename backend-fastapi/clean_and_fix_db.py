import asyncio
import os
import sys
from sqlalchemy import text
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import AsyncSessionLocal

async def clean_and_fix():
    async with AsyncSessionLocal() as db:
        print("Cleaning up old match requests and fixing FK...")
        try:
            # 1. 기존 매칭 요청 기록 삭제 (충돌 방지)
            await db.execute(text("DELETE FROM expert_match_requests"))
            
            # 2. 기존 외래키 제약 조건 삭제
            await db.execute(text("ALTER TABLE expert_match_requests DROP CONSTRAINT IF EXISTS expert_match_requests_matched_expert_id_fkey"))
            
            # 3. 새로운 experts 테이블을 바라보는 외래키 제약 조건 추가
            await db.execute(text("ALTER TABLE expert_match_requests ADD CONSTRAINT expert_match_requests_matched_expert_id_fkey FOREIGN KEY (matched_expert_id) REFERENCES experts(id)"))
            
            await db.commit()
            print("Cleanup and FK Update Successful!")
        except Exception as e:
            print(f"Error: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(clean_and_fix())
