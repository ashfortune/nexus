import asyncio
import os
import sys
from sqlalchemy import text
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import AsyncSessionLocal

async def check_schema():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'experts'"))
        cols = res.fetchall()
        print("Experts Table Schema:")
        for c in cols:
            print(f"Column: {c.column_name}, Type: {c.data_type}")

if __name__ == "__main__":
    asyncio.run(check_schema())
