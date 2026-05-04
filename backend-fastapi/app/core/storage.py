import os
import uuid
import base64
from abc import ABC, abstractmethod
from typing import Optional
from supabase import create_client, Client

class BaseStorage(ABC):
    @abstractmethod
    async def upload_file(self, file_path: str, destination_path: str) -> str:
        """파일을 업로드하고 접근 가능한 URL을 반환합니다."""
        pass

    @abstractmethod
    async def upload_bytes(self, content: bytes, destination_path: str, content_type: str = "image/png") -> str:
        """바이트 데이터를 업로드하고 접근 가능한 URL을 반환합니다."""
        pass

class LocalStorage(BaseStorage):
    def __init__(self, base_url: str = "/static"):
        self.base_url = base_url
        self.base_dir = "app/static"

    async def upload_file(self, file_path: str, destination_path: str) -> str:
        # 이미 로컬에 저장된 경우이므로 경로만 변환하여 반환 (필요시 복사 로직 추가 가능)
        return f"{self.base_url}/{destination_path}"

    async def upload_bytes(self, content: bytes, destination_path: str, content_type: str = "image/png") -> str:
        full_path = os.path.join(self.base_dir, destination_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(content)
        return f"{self.base_url}/{destination_path}"

class SupabaseStorage(BaseStorage):
    def __init__(self):
        url: str = os.getenv("SUPABASE_URL")
        key: str = os.getenv("SUPABASE_KEY")
        self.bucket_name: str = os.getenv("SUPABASE_BUCKET", "uploads")
        if not url or not key:
            raise ValueError("SUPABASE_URL 및 SUPABASE_KEY 환경 변수가 설정되지 않았습니다.")
        self.client: Client = create_client(url, key)

    async def upload_file(self, file_path: str, destination_path: str) -> str:
        with open(file_path, "rb") as f:
            res = self.client.storage.from_(self.bucket_name).upload(
                path=destination_path,
                file=f,
                file_options={"content-type": "image/png", "x-upsert": "true"}
            )
        return self.client.storage.from_(self.bucket_name).get_public_url(destination_path)

    async def upload_bytes(self, content: bytes, destination_path: str, content_type: str = "image/png") -> str:
        res = self.client.storage.from_(self.bucket_name).upload(
            path=destination_path,
            file=content,
            file_options={"content-type": content_type, "x-upsert": "true"}
        )
        return self.client.storage.from_(self.bucket_name).get_public_url(destination_path)

def get_storage_client() -> BaseStorage:
    storage_type = os.getenv("STORAGE_TYPE", "LOCAL").upper()
    if storage_type == "SUPABASE":
        return SupabaseStorage()
    return LocalStorage()
