import asyncio
import os
import sys
from sqlalchemy import text
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.database import AsyncSessionLocal

async def check_requests():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT id, status, request_content, created_at FROM expert_match_requests ORDER BY created_at DESC LIMIT 5"))
        reqs = res.fetchall()
        print("Recent Expert Match Requests:")
        for r in reqs:
            print(f"ID: {r.id}, Status: {r.status}, Content: {r.request_content[:30]}..., CreatedAt: {r.created_at}")

if __name__ == "__main__":
    asyncio.run(check_requests())
