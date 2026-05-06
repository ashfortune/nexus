import os
import re
from typing import List
from dotenv import load_dotenv

# LangChain 관련 임포트
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document
from fastapi import UploadFile
import tempfile
import shutil

# 1. 환경 변수 로드 및 설정
load_dotenv()

# DB 연결 정보 (환경 변수에서 로드)
DB_USER = os.getenv("DB_USER", "human2team")
DB_PASS = os.getenv("DB_PASS", "human2team")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "nexus_db")

# Google API Key (임베딩용)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# 연결 문자열 구성 (psycopg2 사용)
# 형식: postgresql+psycopg2://user:password@host:port/dbname
CONNECTION_STRING = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 컬렉션(테이블) 이름 설정
COLLECTION_NAME = "kcd_reports"

def get_metadata_from_filename(filename: str):
    """
    파일명에서 연도와 분기를 추출합니다.
    예: KCD_Trend_Report_2025Q3_fin.pdf -> year: 2025, quarter: 3Q
    """
    # 연도(4자리 숫자)와 분기(숫자 + Q) 추출을 위한 정규표현식
    year_match = re.search(r"(\d{4})", filename)
    quarter_match = re.search(r"(\d)Q", filename, re.IGNORECASE)
    
    year = year_match.group(1) if year_match else "Unknown"
    quarter = f"{quarter_match.group(1)}Q" if quarter_match else "Unknown"
    
    return {
        "source": filename,
        "year": year,
        "quarter": quarter
    }

def split_pdf_by_parts(file_path: str) -> List[dict]:
    """
    PyPDFLoader로 PDF를 읽고 'Part [숫자]'를 기준으로 텍스트를 분리합니다.
    """
    print(f"[1/4] PDF 로딩 및 섹션 분리 중: {os.path.basename(file_path)}")
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    
    # 전체 텍스트 병합
    full_text = "\n".join([p.page_content for p in pages])
    
    # 'Part' 키워드를 기준으로 텍스트 분할 (Regex 사용)
    # Part 1, Part 2 등을 기준으로 나누며, 파트 제목도 함께 캡처하기 위해 split 대신 finditer 사용 고려 가능
    # 여기서는 간단히 Part [숫자]를 구분자로 사용하여 분할
    parts = re.split(r"(Part\s+\d+\.)", full_text)
    
    parts_data = []
    # re.split에 괄호를 사용하면 구분자도 결과에 포함됨 [None, 'Part 1.', '내용...', 'Part 2.', '내용...']
    for i in range(1, len(parts), 2):
        part_title = parts[i].strip()
        part_content = parts[i+1].strip() if i+1 < len(parts) else ""
        parts_data.append({
            "part_name": part_title,
            "content": part_content
        })
        
    return parts_data

def chunk_documents(parts_data: List[dict], metadata_base: dict) -> List[Document]:
    """
    분리된 Part별 텍스트를 RecursiveCharacterTextSplitter로 세부 청킹합니다.
    """
    print(f"[2/4] 텍스트 청킹(Chunking) 중... (Part 수: {len(parts_data)})")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        length_function=len,
        is_separator_regex=False,
    )
    
    final_docs = []
    
    for part in parts_data:
        # 각 파트의 텍스트를 청크로 분할
        chunks = text_splitter.split_text(part["content"])
        
        for chunk in chunks:
            # 메타데이터 조합
            metadata = metadata_base.copy()
            metadata["part"] = part["part_name"]
            
            # Document 객체 생성
            doc = Document(page_content=chunk, metadata=metadata)
            final_docs.append(doc)
            
    return final_docs

def upsert_to_vector_db(documents: List[Document]):
    """
    PGVector를 사용하여 벡터 데이터베이스에 저장(Upsert)합니다.
    """
    print(f"[3/4] 벡터 DB(PostgreSQL) 저장 중... (총 청크 수: {len(documents)})")
    
    # 임베딩 모델 설정
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    
    # PGVector 인스턴스 생성 및 데이터 추가
    # langchain_postgres의 PGVector 사용
    vector_store = PGVector(
        embeddings=embeddings,
        collection_name=COLLECTION_NAME,
        connection=CONNECTION_STRING,
        use_jsonb=True,
    )
    
    vector_store.add_documents(documents)
    print(f"[4/4] 저장 완료! 테이블명: {COLLECTION_NAME}")

def run_ingestion(pdf_file_path: str) -> int:
    """
    전체 인제스트 프로세스를 실행합니다.
    """
    if not os.path.exists(pdf_file_path):
        print(f"오류: 파일을 찾을 수 없습니다. ({pdf_file_path})")
        return 0

    # 1. 파일명에서 기본 메타데이터 추출
    filename = os.path.basename(pdf_file_path)
    metadata_base = get_metadata_from_filename(filename)
    
    # 2. PDF 로드 및 Part 단위 분리
    parts_data = split_pdf_by_parts(pdf_file_path)
    
    # 3. 세부 청킹 및 Document 객체 생성
    final_docs = chunk_documents(parts_data, metadata_base)
    
    # 4. 벡터 DB 저장
    upsert_to_vector_db(final_docs)
    
    return len(final_docs)

def process_pdf_upload(file: UploadFile) -> dict:
    """
    업로드된 PDF 파일을 임시 저장하고 인제스트 프로세스를 실행합니다.
    """
    # 임시 파일 경로 생성
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        chunk_count = run_ingestion(tmp_path)
        return {
            "status": "success",
            "message": f"성공적으로 '{file.filename}' 파일을 처리했습니다.",
            "chunk_count": chunk_count
        }
    except Exception as e:
        print(f"인제스트 중 오류 발생: {str(e)}")
        return {
            "status": "error",
            "message": f"파일 처리 중 오류가 발생했습니다: {str(e)}",
            "chunk_count": 0
        }
    finally:
        # 임시 파일 삭제
        if os.path.exists(tmp_path):
            os.remove(tmp_path)