from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx
import os
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text
from app.domain.auth import authRouter as auth
from app.domain.branding import brandingRouter as branding
from app.domain.simulation import simulationRouter as simulation
from app.domain.compliance import complianceRouter as compliance
from app.domain.community import communityRouter as community
from app.domain.dashboard import dashboardRouter as dashboard
from app.domain.dashboard import predictionRouter as prediction
from app.core.database import get_db, AsyncSessionLocal
from app.domain.branding.brandingService import initialize_industry_cache
from app.core.ai_client import get_ai_client
from contextlib import asynccontextmanager
from app.domain.subsidy import subsidyRouter as subsidy
from app.domain.subsidy.subsidyRouter import start_scheduler as subsidy_start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 실행될 로직
    print("🚀 Nexus API Server 시작 중...")
    
    # 1. AI 임베딩 모델 프리로딩
    get_ai_client("gemini") 
    
    # 2. 업종 카테고리 데이터 캐싱
    async with AsyncSessionLocal() as db:
        await initialize_industry_cache(db)

    # 3. 지원금찾기 데이터 오전 3시 스케쥴
    subsidy_start_scheduler(get_db)

    print("✨ 모든 초기화가 완료되었습니다. 서비스를 시작합니다.")
    yield
    # 서버 종료 시 실행될 로직 (필요 시)

app = FastAPI(
    title="Nexus API Server",
    description="Nexus 프로젝트를 위한 통합 API 서버입니다. MSA 구조의 개별 도메인 로직을 담당합니다.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정 (운영 환경에 맞춰 허용 도메인 지정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://nexus-sigma-gilt.vercel.app",
        "https://nexus-g3li.onrender.com",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 설정
static_candidates_path = "app/static/candidates"
static_final_logos_path = "app/static/final_logos"
static_assets_path = "app/static/assets"

for path in [static_candidates_path, static_final_logos_path, static_assets_path]:
    if not os.path.exists(path):
        os.makedirs(path)

app.mount("/static/candidates", StaticFiles(directory=static_candidates_path), name="candidates")
app.mount("/static/final_logos", StaticFiles(directory=static_final_logos_path), name="final_logos")
app.mount("/static/assets", StaticFiles(directory=static_assets_path), name="assets")

# Spring Boot 서버 주소 (배포 환경에서는 환경변수 SPRING_BOOT_URL 사용)
SPRING_BOOT_URL = os.getenv("SPRING_BOOT_URL", "http://localhost:8080")

# 도메인별 라우터 등록
app.include_router(auth.router, prefix="/api/v1/ai/auth", tags=["Authentication"])
app.include_router(branding.router, prefix="/api/v1/ai/branding", tags=["AI Branding"])
app.include_router(simulation.router, prefix="/api/v1/ai/simulation", tags=["Startup Simulation"])
app.include_router(compliance.router, prefix="/api/v1/ai/compliance", tags=["Compliance & Policy"])
app.include_router(community.router, prefix="/api/v1/ai/community", tags=["Hyper-local Community"])
app.include_router(dashboard.router, prefix="/api/v1/ai/dashboard", tags=["Ops & Dashboard"])
app.include_router(prediction.router, prefix="/api/v1/ai/prediction", tags=["Sales Prediction"])
app.include_router(subsidy.router, prefix="/api/v1/ai/subsidy", tags=["Subsidy Guide"])

@app.get("/")
async def root():
    return {"message": "Nexus FastAPI Server is running!"}

@app.get("/health")
async def health_check(db=Depends(get_db)):
    try:
        # DB 연결 확인
        await db.execute(text("SELECT 1"))
        return {
            "status": "UP",
            "message": "Nexus FastAPI Server is running.",
            "database": "CONNECTED"
        }
    except Exception as e:
        return {
            "status": "UP",
            "database": "DISCONNECTED",
            "error": str(e)
        }

@app.get("/call-spring")
async def call_spring():
    """Spring Boot 서버의 헬스체크 API를 호출하여 데이터를 가져옴"""
    async with httpx.AsyncClient() as client:
        try:
            # Spring Boot의 새로운 상태 확인 API 호출 (/api/v1/status/check)
            response = await client.get(f"{SPRING_BOOT_URL}/api/v1/status/check")
            if response.status_code == 200:
                return {"status": "success", "spring_response": response.json()}
            else:
                return {"status": "error", "message": f"Spring Boot returned status {response.status_code}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to connect to Spring Boot: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
