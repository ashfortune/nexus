from typing import Any, Dict

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.domain.dashboard.operationSchema import IngestionResponseSchema
from app.domain.dashboard.operationService import process_pdf_upload

router = APIRouter()

@router.post("/ingest-pdf", response_model=IngestionResponseSchema)
def ingest_pdf(
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """
    KCD 트렌드 리포트 PDF 파일을 업로드하여 RAG 시스템용 벡터 DB에 인제스트합니다.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다.")

    try:
        result = process_pdf_upload(file)
        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["message"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
