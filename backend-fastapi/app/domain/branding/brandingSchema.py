from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List

class BrandingCreateRequest(BaseModel):
    industryId: UUID = Field(..., description="선택한 업종의 고유 ID")
    title: Optional[str] = Field(None, description="브랜딩 프로젝트의 초기 제목 (없을 경우 AI와 협의)")
    userId: Optional[UUID] = Field(None, description="사용자의 고유 ID")

class BrandingResponseData(BaseModel):
    projectId: UUID = Field(..., description="생성된 브랜딩 프로젝트의 고유 ID")

class BrandingResponse(BaseModel):
    success: bool = Field(True, description="요청 성공 여부")
    data: BrandingResponseData

class BrandingInterviewRequest(BaseModel):
    keywords: List[str] = Field(..., description="추출된 핵심 키워드 리스트")
    interviewData: dict = Field(..., description="인터뷰 전체 상세 데이터 (JSON 형식)")

class CommonResponse(BaseModel):
    success: bool = Field(True, description="성공 여부")
    message: str = Field(..., description="처리 결과 메시지")

class ChatMessage(BaseModel):
    role: str = Field(..., description="user 또는 assistant")
    content: str = Field(..., description="메시지 내용")

class ChatRequest(BaseModel):
    message: str = Field(..., description="사용자가 입력한 메시지")
    history: List[ChatMessage] = Field(default=[], description="이전 대화 이력")

class ChatResponse(BaseModel):
    success: bool = Field(True)
    aiResponse: str = Field(..., description="AI의 답변")
    isFinished: bool = Field(False, description="인터뷰가 종료되었는지 여부")
    extractedData: Optional[dict] = Field(None, description="추출된 데이터(종료 시)")

class NamingResult(BaseModel):
    identityId: UUID = Field(..., description="생성된 브랜드 아이덴티티의 고유 ID")
    brandName: str = Field(..., description="추천 브랜드 이름")
    slogan: str = Field(..., description="추천 슬로건")
    brandStory: str = Field(..., description="브랜드 스토리")
    ipStatus: Optional[str] = Field(None, description="상표권 검증 상태 (SAFE, WARNING, DANGER)")
    ipDetails: Optional[dict] = Field(None, description="상표권 검증 상세 정보")


class NamingResponse(BaseModel):
    success: bool = Field(True)
    data: List[NamingResult] = Field(..., description="제안된 브랜드 명 3안 리스트")

class LogoCandidate(BaseModel):
    tempId: str = Field(..., description="임시 ID")
    imageUrl: str = Field(..., description="로고 이미지 공개 URL")

class LogoResponse(BaseModel):
    success: bool = Field(True)
    data: List[LogoCandidate] = Field(..., description="생성된 로고 후보 리스트")

class LogoFinalizeRequest(BaseModel):
    imageUrl: str = Field(..., description="선택된 로고의 이미지 URL")

class LogoFinalizeResponse(BaseModel):
    success: bool = Field(True)
    logoAssetId: UUID = Field(..., description="최종 저장된 로고 에셋 ID")

# [추가] 마케팅 에셋 응답 스키마
class BrandingAssetResult(BaseModel):
    id: str
    type: str
    title: str
    description: str
    imageUrl: str

class BrandingAssetsResponse(BaseModel):
    success: bool = Field(True)
    data: List[BrandingAssetResult]
