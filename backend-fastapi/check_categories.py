import asyncio
import os
import sys
from sqlalchemy import text
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import AsyncSessionLocal

async def check_categories():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT id, name FROM industry_categories"))
        cats = res.fetchall()
        print("Real Category IDs in DB:")
        for c in cats:
            print(f"ID: {c.id}, Name: {c.name}")

if __name__ == "__main__":
    asyncio.run(check_categories())
