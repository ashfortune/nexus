import asyncio
import os
import sys
from sqlalchemy import text
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT COUNT(*) FROM experts"))
        count = res.scalar()
        print(f"Total Experts: {count}")
        
        res = await db.execute(text("SELECT id, name, industry_category_id FROM experts LIMIT 5"))
        experts = res.fetchall()
        for e in experts:
            print(f"ID: {e.id}, Name: {e.name}, CategoryID: {e.industry_category_id}")

if __name__ == "__main__":
    asyncio.run(check())
