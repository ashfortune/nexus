-- 유저 테이블에 실명과 전화번호 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 전문가 프로필 조회 시 실명과 전화번호를 포함하도록 인덱스 및 제약 조건 고려 (필요 시)
COMMENT ON COLUMN users.name IS '실명';
COMMENT ON COLUMN users.phone IS '전화번호';
