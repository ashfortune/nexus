import asyncio
import os
import sys
from sqlalchemy import text
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import AsyncSessionLocal

async def fix():
    async with AsyncSessionLocal() as db:
        print("Updating Foreign Key Constraints...")
        try:
            # 1. Drop old constraint
            await db.execute(text("ALTER TABLE expert_match_requests DROP CONSTRAINT IF EXISTS expert_match_requests_matched_expert_id_fkey"))
            
            # 2. Add new constraint pointing to 'experts' table
            await db.execute(text("ALTER TABLE expert_match_requests ADD CONSTRAINT expert_match_requests_matched_expert_id_fkey FOREIGN KEY (matched_expert_id) REFERENCES experts(id)"))
            
            await db.commit()
            print("FK Updated Successfully")
        except Exception as e:
            print(f"Error updating FK: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(fix())
