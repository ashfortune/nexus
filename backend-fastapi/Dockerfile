FROM python:3.10-slim

# 시스템 의존성 설치 (pytesseract 등 필요한 경우)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

# Hugging Face Spaces는 기본적으로 7860 포트를 사용합니다.
ENV PORT=7860
EXPOSE 7860

# 서버 실행 (Hugging Face 환경에 맞춰 0.0.0.0:7860 바인딩)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
