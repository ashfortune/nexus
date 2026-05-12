-- [Nexus] 시스템 공통 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

---------------------------------------
-- 1. 기초 마스터 데이터 (Master Data)
---------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    passwd VARCHAR(255) NOT NULL,
    user_type INT DEFAULT 0, 
    biz_no VARCHAR(12),
    address VARCHAR(255),
    login_type INT DEFAULT 0, 
    profile_image VARCHAR(255),
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);




CREATE TABLE industry_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    parent_id   UUID REFERENCES industry_categories(id) ON DELETE SET NULL,
    level       SMALLINT NOT NULL, 
    ksic_code   VARCHAR(20),
    embedding VECTOR(768),       
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE region_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code INT NOT NULL,
    city_name VARCHAR(10) NOT NULL,
    county_name VARCHAR(10) NOT NULL,
    latitude DECIMAL(13, 10),
    longitude DECIMAL(13, 10)
);

---------------------------------------
-- 2. AI 브랜딩 모듈 (Creative Engine)
---------------------------------------

CREATE TABLE brandings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    industry_category_id UUID NOT NULL REFERENCES industry_categories(id),
    title VARCHAR(100) NOT NULL,
    keywords JSONB,
    chat_history JSONB,
    current_step VARCHAR(20) DEFAULT 'INTERVIEW',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brand_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branding_id UUID NOT NULL REFERENCES brandings(id) ON DELETE CASCADE,
    brand_name VARCHAR(100) NOT NULL,
    slogan VARCHAR(255),
    brand_story TEXT,
    is_selected BOOLEAN DEFAULT FALSE,
    embedding VECTOR(768) 
);

CREATE TABLE logo_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES brand_identities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    style_tag VARCHAR(50),
    is_final BOOLEAN DEFAULT FALSE
);

CREATE TABLE marketing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_id UUID NOT NULL REFERENCES brand_identities(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, 
    file_url TEXT NOT NULL
);

---------------------------------------
-- 3. 행정 및 인허가 모듈 (Compliance)
---------------------------------------

CREATE TABLE license_industries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    law_name VARCHAR(200) NOT NULL,
    law_article VARCHAR(100),
    license_type VARCHAR(20) NOT NULL,
    department VARCHAR(100) NOT NULL
);

CREATE TABLE license_industry_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES industry_categories(id),
    license_id UUID NOT NULL REFERENCES license_industries(id)
);

CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES license_industries(id) ON DELETE CASCADE,
    question VARCHAR(300) NOT NULL,
    order_num SMALLINT NOT NULL
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES license_industries(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    issuer VARCHAR(100) NOT NULL,
    is_common BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE survey_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    answer BOOLEAN NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id)
);

CREATE TABLE checklist_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES license_industries(id) ON DELETE CASCADE,
    order_num SMALLINT NOT NULL,
    place VARCHAR(100) NOT NULL,
    task VARCHAR(300) NOT NULL,
    estimated_days VARCHAR(50)
);

CREATE TABLE checklist_progresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_id UUID NOT NULL REFERENCES license_industries(id),
    current_step SMALLINT NOT NULL DEFAULT 1,
    industry_code VARCHAR(50),
    conditions JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------
-- 4. 매출 및 운영 분석 모듈 (Analytics & Operations)
---------------------------------------

-- 매출 마스터 테이블
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sales_date DATE NOT NULL,
    total_amount INT DEFAULT 0,
    store_number VARCHAR(255),
    file_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 매출 상세 항목 테이블 (OCR 데이터)
CREATE TABLE sales_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_name VARCHAR(255), 
    price INT DEFAULT 0,
    quantity INT DEFAULT 1
);

-- 매출/비용 예측 통계 마스터
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    base_date DATE NOT NULL,
    total_sales INT,
    predicted_cost INT,
    moving_average DOUBLE PRECISION,
    return_rate DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일별 예상 매출 상세
CREATE TABLE daily_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    pred_sales INT,
    actual_sales INT,
    timesfm_sales INT,
    moving_average DOUBLE PRECISION,
    return_rate DOUBLE PRECISION
);

-- 리뷰 및 감성 분석 데이터
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    tokens TEXT,
    sentiment_score FLOAT,
    sentiment_label VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI 분석 통합 보고서
CREATE TABLE ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluation_summary TEXT,
    report_file_url VARCHAR(255),
    pos_ratio FLOAT,
    neg_ratio FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------
-- 5. 창업 지원 및 노무 (Support & HR)
---------------------------------------

CREATE TABLE subsidies (
    id uuid default gen_random_uuid() not null primary key,
    name varchar(200) not null,
    organization varchar(100) not null,
    region varchar(100),
    industry varchar(100),
    min_age smallint,
    max_age smallint,
    max_amount integer,
    deadline date,
    start_date date,
    description text,
    support_content text,
    target text,
    how_to_apply text,
    contact text,
    apply_url text,
    source_url varchar(500) unique,
    embedding vector(768),
    is_active boolean default true,
    life_cycle varchar(20),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

CREATE TABLE equipment_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry_category_id UUID REFERENCES industry_categories(id),
    equipment_kr VARCHAR(50) NOT NULL,
    equipment_eng VARCHAR(50) NOT NULL,
    product_name VARCHAR(100),
    price INT DEFAULT 0,
    detail VARCHAR(255),
    link VARCHAR(500),
    image_url VARCHAR(500),
    source VARCHAR(20)
);

CREATE TABLE labor_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employer_name VARCHAR(100) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    workplace VARCHAR(200) NOT NULL,
    job_description VARCHAR(300) NOT NULL,
    daily_work_hours SMALLINT NOT NULL,
    weekly_work_days SMALLINT NOT NULL,
    hourly_wage INTEGER NOT NULL,
    weekly_allowance INTEGER,
    employee_type VARCHAR(20) NOT NULL,
    pdf_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------
-- 6. 커뮤니티, 커머스, 채팅 (Nexus Ecosystem)
---------------------------------------

CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    industry_category_id UUID REFERENCES industry_categories(id),
    title VARCHAR(100) NOT NULL,
    content TEXT,
    region_name VARCHAR(20),
    category_name VARCHAR(20),
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    image_url VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE board_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

CREATE TABLE board_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    report_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    item_price INT NOT NULL,
    target_count INT NOT NULL,
    current_count INT DEFAULT 1,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) CHECK (status IN ('RECRUITING', 'SUCCESS', 'FAILED', 'COMPLETED', 'CANCEL')) DEFAULT 'RECRUITING',
    description TEXT,
    image_url TEXT,
    region VARCHAR(100)
);

CREATE TABLE group_orders (
    id VARCHAR(50) PRIMARY KEY,
    gp_id UUID NOT NULL REFERENCES group_purchases(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_count INT DEFAULT 1,
    total_price INT NOT NULL,
    payment_provider VARCHAR(100),
    payment_key TEXT,
    payment_method VARCHAR(100),
    payment_status VARCHAR(50),
    paid_at TIMESTAMPTZ
);

CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100),
    description TEXT,
    image_url VARCHAR(500),
    type VARCHAR(20) DEFAULT 'GROUP',
    user_id UUID REFERENCES users(id),
    password VARCHAR(255),
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'TALK',
    file_url TEXT,
    file_name VARCHAR(255),
    sender_nickname VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------
-- 7. 업종-KSIC 매핑 (소상공인진흥공단 ksic)
---------------------------------------
CREATE TABLE semas_industry_mappings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semas_ksic_code      VARCHAR(20),
    ksic_code            VARCHAR(20),
    large_category_name  VARCHAR(100),
    medium_category_name VARCHAR(100),
    small_category_name  VARCHAR(100)
);

---------------------------------------
-- 8. 행정 경계 (Administrative Boundaries)
---------------------------------------

CREATE TABLE IF NOT EXISTS administrative_boundaries (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adm_cd   VARCHAR(20)  NOT NULL,
    adm_nm   VARCHAR(100) NOT NULL,
    boundary JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_administrative_boundaries_adm_cd
    ON administrative_boundaries (adm_cd);

---------------------------------------
-- 9. 전문가 추천 및 매칭 모듈 (AI Expert)
---------------------------------------

CREATE TABLE experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    industry_category_id UUID REFERENCES industry_categories(id),
    portfolio_text TEXT,
    rating DOUBLE PRECISION DEFAULT 0.0,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expert_match_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    industry_category_id UUID REFERENCES industry_categories(id),
    request_content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, MATCHED, COMPLETED, FAILED
    matched_expert_id UUID REFERENCES experts(id),
    match_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

---------------------------------------
-- 10. 업종 전환 및 설비 데이터 (Industry Change)
---------------------------------------

CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS restaurant_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    building_use_code VARCHAR(20),
    kosis_category VARCHAR(100),
    survival_rate_1y FLOAT,
    survival_rate_3y FLOAT,
    survival_rate_5y FLOAT
);

CREATE TABLE IF NOT EXISTS restaurant_equipment_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_type_id UUID REFERENCES restaurant_types(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE,
    weight FLOAT DEFAULT 1.0,
    UNIQUE(restaurant_type_id, equipment_id)
);
