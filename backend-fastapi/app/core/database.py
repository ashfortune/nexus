import os
import datetime
from dotenv import load_dotenv
from sqlalchemy import func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# .env 파일 로드
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL이 설정되지 않았습니다. .env 파일을 확인해주세요.")

# 비동기 엔진 생성
engine = create_async_engine(
    DATABASE_URL, 
    echo=True,
    connect_args={"statement_cache_size": 0}
)

# 비동기 세션 메이커
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base 클래스 정의 (SQLAlchemy 2.0 style)
class Base(DeclarativeBase):
    pass

# DB 세션 의존성 주입을 위한 제너레이터
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
