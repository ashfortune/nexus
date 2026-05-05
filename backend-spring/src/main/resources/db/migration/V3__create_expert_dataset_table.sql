-- 전문가 데이터셋 전용 테이블 생성
CREATE TABLE IF NOT EXISTS experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    industry_category_id UUID REFERENCES industry_categories(id),
    portfolio_text TEXT,
    rating DOUBLE PRECISION DEFAULT 0.0,
    embedding VECTOR(768), -- AI 의미 검색용 벡터
    created_at TIMESTAMP DEFAULT NOW()
);

-- 기존 expert_profiles 테이블과 혼동되지 않도록 주석 추가
COMMENT ON TABLE experts IS 'AI 전문가 추천을 위한 독립 데이터셋 테이블';
