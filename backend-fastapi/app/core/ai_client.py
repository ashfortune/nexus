import os
from google import genai
from google.genai import types
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
import httpx
import asyncio
import functools
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util
import base64
from PIL import Image
import io

# HuggingFace 로딩 경고 무시 설정
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="huggingface_hub")

load_dotenv()

class BaseAIClient(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, chat_history: List[Dict[str, str]]) -> str:
        pass

    @abstractmethod
    async def generate_image(self, prompt: str, output_path: str) -> str:
        pass

def retry_async(max_retries=3, delay=2):
    """비동기 함수를 위한 재시도 데코레이터"""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_exc = None
            for i in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exc = e
                    # 500 에러나 네트워크 에러 등 재시도가 필요한 경우만 로깅
                    print(f"⚠️ [AI Retry {i+1}/{max_retries}] 일시적 오류 발생: {str(e)[:100]}...")
                    if i < max_retries - 1:
                        await asyncio.sleep(delay * (i + 1)) # 지수 백오프 적용
            raise last_exc
        return wrapper
    return decorator

class GeminiClient(BaseAIClient):
    _local_model = None # 로컬 모델 싱글톤 보관용

    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'models/gemma-4-31b-it' 
        
        # 로컬 임베딩 모델 로드 (최초 1회)
        if GeminiClient._local_model is None:
            print("🧠 로컬 임베딩 모델(768차원) 로딩 중... 잠시만 기다려주세요.")
            GeminiClient._local_model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
            print("✅ 로컬 모델 로딩 완료!")

    @retry_async(max_retries=3, delay=2)
    async def generate_response(self, system_instruction: str, chat_history: List[Dict[str, str]]) -> str:
        # History 변환 (새로운 SDK 포맷: types.Content 활용)
        gemini_history = []
        for msg in chat_history:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append(
                types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])])
            )
        
        # 새로운 비동기(aio) 클라이언트 호출 방식 (stateless 방식)
        response = await self.client.aio.models.generate_content(
            model=self.model_name,
            contents=gemini_history,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        
        return response.text

    async def generate_image(self, prompt: str, output_path: str) -> str:
        """Gemini 이미지 모델을 사용하여 이미지를 생성합니다."""
        # 비동기 클라이언트를 사용하여 이미지 명시적 생성 (response_modalities=['IMAGE'])
        response = await self.client.aio.models.generate_content(
            model='models/gemini-3.1-flash-image-preview',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            )
        )
        
        # 응답에서 이미지 데이터 추출 및 저장
        try:
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    with open(output_path, "wb") as f:
                        f.write(part.inline_data.data)
                    return output_path
            
            if response.text and "http" in response.text:
                return response.text
                
            raise ValueError("이미지 데이터를 찾을 수 없습니다.")
        except Exception as e:
            print(f"Gemini Image Generation Error: {str(e)}")
            raise e

    async def embed_text(self, text: str) -> List[float]:
        """텍스트를 로컬 모델을 사용하여 768차원 벡터로 변환합니다."""
        # 모델 추론은 CPU/GPU를 많이 사용하므로 별도 스레드에서 실행하여 비동기 루프를 보호합니다.
        embedding = await asyncio.to_thread(GeminiClient._local_model.encode, text)
        return embedding.tolist()

class OllamaClient(BaseAIClient):
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = "gemma:2b"

    async def generate_response(self, system_instruction: str, chat_history: List[Dict[str, str]]) -> str:
        # Ollama /api/chat 엔드포인트 활용
        messages = [{"role": "system", "content": system_instruction}]
        messages.extend(chat_history)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "stream": False
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]

    async def generate_image(self, prompt: str, output_path: str) -> str:
        # Ollama는 현재 표준 API로 이미지 생성을 지원하지 않음 (SD 연동 필요 시 별도 구현)
        raise NotImplementedError("Ollama does not support image generation natively.")

class StableDiffusionClient(BaseAIClient):
    def __init__(self):
        self.api_key = os.getenv("STABILITY_API_KEY")
        self.engine_id = "stable-diffusion-xl-1024-v1-0"
        self.base_url = f"https://api.stability.ai/v1/generation/{self.engine_id}/text-to-image"

    async def generate_response(self, prompt: str, chat_history: List[Dict[str, str]]) -> str:
        raise NotImplementedError("Stable Diffusion client is for image generation only.")

    async def generate_image(self, prompt: str, output_path: str) -> str:
        """Stability AI v1 API를 사용하여 이미지를 생성합니다. (SDXL 1.0 모델)"""
        if not self.api_key:
            raise ValueError("STABILITY_API_KEY가 설정되어 있지 않습니다.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        # v1 API (JSON 규격)
        payload = {
            "text_prompts": [
                {
                    "text": prompt,
                    "weight": 1
                }
            ],
            "cfg_scale": 7,
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.base_url, 
                headers=headers, 
                json=payload, 
                timeout=60.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Stability AI v1 API Error: {response.text}")

            import base64
            data = response.json()
            
            # 응답에서 Base64 이미지 데이터 추출 및 저장
            for i, image in enumerate(data["artifacts"]):
                with open(output_path, "wb") as f:
                    f.write(base64.b64decode(image["base64"]))
                
            return output_path

    async def generate_image_base64(self, prompt: str) -> str:
        """이미지를 파일로 저장하지 않고 Base64 문자열로 반환합니다."""
        import base64
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        payload = {
            "text_prompts": [{"text": prompt, "weight": 1}],
            "cfg_scale": 7,
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.base_url, headers=headers, json=payload, timeout=60.0)
            if response.status_code != 200:
                raise Exception(f"Stability AI API error: {response.text}")

            data = response.json()
            image_base64 = data["artifacts"][0]["base64"]
            return f"data:image/png;base64,{image_base64}"

def get_ai_client(provider: str = "gemini") -> BaseAIClient:
    if provider == "gemini":
        return GeminiClient()
    elif provider == "ollama":
        return OllamaClient()
    elif provider == "stability":
        return StableDiffusionClient()
    else:
        raise ValueError(f"Unsupported AI provider: {provider}")

_CLIP_TEXT_MODEL = None
_CLIP_IMAGE_MODEL = None

async def calculate_alignment_score(text: str, base64_image: str) -> float:
    """텍스트와 Base64 이미지 간의 의미적 일치도를 계산합니다 (0.0 ~ 100.0)"""
    global _CLIP_TEXT_MODEL, _CLIP_IMAGE_MODEL
    if _CLIP_TEXT_MODEL is None:
        print("🧠 로컬 다국어 CLIP 텍스트 모델 로딩 중...")
        _CLIP_TEXT_MODEL = SentenceTransformer('clip-ViT-B-32-multilingual-v1')
    if _CLIP_IMAGE_MODEL is None:
        print("🧠 로컬 CLIP 이미지 모델 로딩 중...")
        _CLIP_IMAGE_MODEL = SentenceTransformer('clip-ViT-B-32')
        print("✅ CLIP 모델 세트 로딩 완료!")
        
    try:
        if base64_image.startswith("data:image"):
            _, encoded = base64_image.split(",", 1)
        else:
            encoded = base64_image
            
        image_bytes = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        def _compute():
            text_emb = _CLIP_TEXT_MODEL.encode(text)
            img_emb = _CLIP_IMAGE_MODEL.encode(image)
            similarity = util.cos_sim(text_emb, img_emb).item()
            return float(similarity)
            
        score = await asyncio.to_thread(_compute)
        
        # CLIP 모델의 코사인 유사도는 일반적으로 0.15 ~ 0.35 사이에 분포합니다.
        # 이를 사용자 친화적인 0 ~ 100% 스케일로 변환(Calibration)합니다.
        clip_min = 0.15
        clip_max = 0.35
        
        calibrated_score = (score - clip_min) / (clip_max - clip_min)
        normalized_score = max(0.0, min(1.0, calibrated_score)) * 100
        return normalized_score
        
    except Exception as e:
        print(f"⚠️ Alignment Score 계산 실패: {str(e)}")
        return 0.0
