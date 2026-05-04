from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.domain.branding import brandingService, brandingSchema
import uuid

router = APIRouter()

@router.post("/", response_model=brandingSchema.BrandingResponse)
async def start_branding(
    request: brandingSchema.BrandingCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    새 브랜딩 시작하기 API
    - 업종 ID와 제목을 받아 새로운 브랜딩 프로젝트를 생성합니다.
    """
    try:
        new_project = await brandingService.create_new_branding(db, request)
        
        return brandingSchema.BrandingResponse(
            success=True,
            data=brandingSchema.BrandingResponseData(projectId=new_project.id)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"브랜딩 생성 중 오류가 발생했습니다: {str(e)}")

@router.patch("/{branding_id}/interview", response_model=brandingSchema.CommonResponse)
async def update_interview(
    branding_id: uuid.UUID,
    request: brandingSchema.BrandingInterviewRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    인터뷰 답변 저장 API (PATCH)
    - 사용자와 AI 간의 대화 결과(키워드, 답변 데이터)를 프로젝트에 저장합니다.
    """
    try:
        updated = await brandingService.update_branding_interview(db, branding_id, request)
        
        if not updated:
            raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")
            
        return brandingSchema.CommonResponse(
            success=True,
            message="인터뷰 답변이 성공적으로 저장되었습니다. 이제 브랜드 명 생성 단계로 이동할 수 있습니다."
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"인터뷰 저장 중 오류가 발생했습니다: {str(e)}")

@router.post("/{branding_id}/chat", response_model=brandingSchema.ChatResponse)
async def start_chat(
    branding_id: uuid.UUID,
    request: brandingSchema.ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    AI 인터뷰 채팅 API
    - 사용자의 메시지를 받아 AI의 답변을 반환합니다.
    - AI가 인터뷰가 충분하다고 판단하면 isFinished=True와 함께 추출된 정보를 반환합니다.
    """
    try:
        # 1. 채팅 엔진 호출 (업종 자동 업데이트를 위해 DB 세션 전달)
        result = await brandingService.chat_with_ai(db, branding_id, request)
        
        # 2. 만약 인터뷰가 자동 종료되었다면 DB 업데이트 (선택 사항 - 클라이언트가 PATCH를 호출할 수도 있음)
        # 여기서는 AI 의견에 따라 자동으로 '인터뷰 저장' 로직을 미리 실행하거나 데이터를 반환만 합니다.
        
        return brandingSchema.ChatResponse(
            success=True,
            aiResponse=result["aiResponse"],
            isFinished=result["isFinished"],
            extractedData=result["extractedData"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 채팅 중 오류가 발생했습니다: {str(e)}")

@router.post("/{branding_id}/naming", response_model=brandingSchema.NamingResponse)
async def generate_brand_names_api(
    branding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    브랜드 명 생성 API
    - 저장된 인터뷰 데이터를 바탕으로 AI가 브랜드 명 3안을 생성하고 저장합니다.
    """
    try:
        results_data = await brandingService.generate_brand_names(db, branding_id)
        
        if not results_data:
            raise HTTPException(status_code=400, detail="인터뷰 데이터가 부족하거나 프로젝트를 찾을 수 없습니다.")
            
        results = [
            brandingSchema.NamingResult(
                identityId=item["identity"].id,
                brandName=item["identity"].brand_name,
                slogan=item["identity"].slogan,
                brandStory=item["identity"].brand_story,
                ipStatus=item["ip_result"].get("status"),
                ipDetails=item["ip_result"]
            ) for item in results_data
        ]


        
        return brandingSchema.NamingResponse(
            success=True,
            data=results
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"브랜드 명 생성 중 오류가 발생했습니다: {str(e)}")

@router.post("/identity/{identity_id}/logo", response_model=brandingSchema.LogoResponse)
async def generate_logo_api(
    identity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    브랜드 로고 생성 API
    - 선택된 브랜드 아이덴티티 정보를 바탕으로 AI가 로고 이미지 '파일'들을 생성하여 반환합니다. (DB 저장 X)
    """
    try:
        candidates = await brandingService.generate_brand_logo(db, identity_id)
        
        if not candidates:
            raise HTTPException(status_code=404, detail="해당 브랜드 아이덴티티를 찾을 수 없습니다.")
            
        return brandingSchema.LogoResponse(
            success=True,
            data=[brandingSchema.LogoCandidate(**c) for c in candidates]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"로고 생성 중 오류가 발생했습니다: {str(e)}")

@router.post("/identity/{identity_id}/logo/finalize", response_model=brandingSchema.LogoFinalizeResponse)
async def finalize_logo_api(
    identity_id: uuid.UUID,
    request: brandingSchema.LogoFinalizeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    브랜드 로고 확정 API
    - 사용자가 선택한 로고 이미지 URL을 받아 최종적으로 DB에 저장합니다.
    """
    try:
        final_logo = await brandingService.finalize_brand_logo(db, identity_id, request.imageUrl)
        
        return brandingSchema.LogoFinalizeResponse(
            success=True,
            logoAssetId=final_logo.id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"로고 확정 중 오류가 발생했습니다: {str(e)}")

@router.post("/identity/{identity_id}/assets", response_model=brandingSchema.BrandingAssetsResponse)
async def generate_marketing_assets_api(
    identity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    마케팅 에셋 생성 API
    - 확정된 로고와 브랜드 정보를 바탕으로 명함, 메뉴판 등의 목업 이미지를 생성합니다.
    """
    try:
        assets = await brandingService.generate_marketing_assets(db, identity_id)
        
        if not assets:
            raise HTTPException(status_code=404, detail="에셋을 생성할 수 없습니다. 로고 확정 여부를 확인해주세요.")
            
        return brandingSchema.BrandingAssetsResponse(
            success=True,
            data=[brandingSchema.BrandingAssetResult(**a) for a in assets]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"에셋 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/test")
async def test_branding():
    return {"message": "AI Branding Domain API is healthy"}
