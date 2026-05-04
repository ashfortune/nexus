# 🌌 Nexus (넥서스)
### AI 기반 통합 미디어 브랜딩 및 데이터 기반 창업 지원 플랫폼

---

## 🚀 1. 프로젝트 개요 (Overview)
**Nexus**는 소상공인과 예비 창업자를 위해 AI가 브랜딩 에셋을 생성하고, 데이터 기반의 상권 분석 및 행정/노무 솔루션을 제공하는 **All-in-One 창업 지원 플랫폼**입니다.

- **AI 브랜딩**: 브랜드 네이밍, 슬로건, 로고 및 마케팅 에셋 자동 생성.
- **창업 시뮬레이션**: 지능형 상권 분석 및 초기 창업 비용 예측.
- **행정 & 정책 매칭**: 복잡한 인허가 절차 및 맞춤형 정부 보조금 매칭.
- **운영 분석 대시보드**: AI를 활용한 매출 예측 및 고객 리뷰 감성 분석.

---

## 🏗️ 2. 시스템 아키텍처 (System Architecture)
본 프로젝트는 독립적인 확장성과 유지보수성을 위해 **도메인 중심(Domain-Driven) 아키텍처**를 채택하고 있습니다.

### 🌐 Frontend (`frontend-next`)
- **Next.js 16 (App Router)** 기반.
- `features/` 하위에 도메인별 컴포넌트와 비즈니스 로직을 격리 관리.

### ☕ Backend - Core (`backend-spring`)
- **Spring Boot 3.3** 기반의 메인 비즈니스 서버.
- 도메인별 3계층(`Controller`-`Service`-`Repository`) 구조를 철저히 준수.

### 🐍 Backend - AI Engine (`backend-fastapi`)
- **FastAPI** 기반의 지능형 엔진.
- 도메인별 폴더 내부에 `{domain}Router.py`, `{domain}Service.py`, `{domain}Schema.py`를 두어 응집도 극대화.

---

## 📂 3. 디렉토리 구조 (Directory Structure)

### [Next.js Frontend]
```text
frontend-next/
  src/
    app/              # Next.js App Router (Pages)
    components/       # 공통 UI 컴포넌트
    features/         # 도메인별 핵심 기능 (Branding, Simulation 등)
    services/         # API 통신 로직
```

### [Spring Boot Backend]
```text
backend-spring/
  src/main/java/com/team/nexus/
    domain/           # 도메인별 패키지 (auth, branding, community 등)
      {domain}/
        controller/   # REST 컨트롤러
        service/      # 비즈니스 로직
        repository/   # Spring Data JPA
        dto/          # 데이터 전송 객체
    global/           # 공통 엔티티 및 예외 처리
```

### [FastAPI Backend]
```text
backend-fastapi/
  app/
    domain/           # 도메인별 폴더
      {domain}/
        {domain}Router.py   # API 엔드포인트
        {domain}Service.py  # AI 및 데이터 처리 로직
        {domain}Schema.py   # Pydantic 모델 (DTO)
    core/             # DB 및 공통 설정
    models.py         # 통합 SQLAlchemy 엔티티 (Global)
```

---

## 🛠️ 3. 기술 스택 (Technical Stack)

| 구분 | 기술 (Technology) | 버전 (Version) | 상세 내역 |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js | `16.2.1` | App Router, React 19, TypeScript |
| **Styling** | Tailwind CSS | `v4.x` | 최신 유틸리티 엔진 |
| **Backend (Core)** | Spring Boot | `3.3.4` | Java 17, Gradle |
| **Backend (AI)** | FastAPI | `1.0.0` | Python 3.10+, .venv |
| **Database** | PostgreSQL | `16.x` | UUID-OSSP, Vector 지원 |
| **Documentation** | Swagger / Redoc | - | OpenAPI 3.0 사양 |

---

## ⚙️ 4. 시작하기 (Quick Start Guide)

### 🐘 1단계: 환경변수 설정
보안을 위해 실제 설정 파일은 복사하여 사용하세요.
1. **Spring Boot**: `backend-spring/src/main/resources/application-local.properties.example` ➡️ `application-local.properties`
2. **FastAPI**: `backend-fastapi/.env.example` ➡️ `.env`
3. **Database (Docker)**: 프로젝트 루트에서 아래 명령어를 실행하여 DB를 기동하세요. (자동 스키마 생성)
   ```bash
   docker-compose up -d
   ```

### 🏃 2단계: 서비스 실행
```bash
# 1. Database (Docker) - 최우선 실행
docker-compose up -d

# 2. FastAPI (AI 서버)
cd backend-fastapi && source .venv/bin/activate
python -m app.main

# 3. Spring Boot (비즈니스 서버)
cd backend-spring
./gradlew bootRun

# 4. Next.js (프론트엔드)
cd frontend-next
npm install && npm run dev
```

---

## ✅ 5. 초기 환경 검증 (Verification Protocol)
설정이 완료되면 아래 엔드포인트에 접속하여 서버 및 DB 연결 상태를 확인하세요.

> [!IMPORTANT]
> **Checklist**
> - [ ] **Spring Boot UP**: [http://localhost:8080/api/status/check](http://localhost:8080/api/status/check) (`status: "UP"`, `database: "CONNECTED"`)
> - [ ] **FastAPI UP**: [http://localhost:8000/health](http://localhost:8000/health) (`status: "UP"`, `database: "CONNECTED"`)
> - [ ] **Inter-Server Link**: [http://localhost:8080/api/comm/call-fastapi](http://localhost:8080/api/comm/call-fastapi) (정상 호출 확인)

---

## 👥 6. 협업 가이드 (Collaboration)

### 🤖 AI 에이전트(Antigravity) 활용
본 프로젝트는 AI와의 완벽한 협업을 위해 컨벤션을 공유합니다. 
> "프로젝트 루트의 **`.agent-conventions.md`**를 읽고 규칙을 준수하여 개발을 도와줘."

### 📝 개발 규칙
1. **엔티티 수정**: 모든 엔티티는 `com.team.nexus.global.entity`에서 전역 관리합니다.
2. **도메인 격리**: 본인이 맡은 `domain/` 하위 폴더 외부의 코드를 수정할 경우 반드시 상의하세요.
3. **API 우선 설계**: 구현 전 Swagger/Redoc을 통해 인터페이스를 먼저 확정합니다.

---
