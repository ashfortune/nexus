-- 매칭 요청 테이블의 외래키를 새로운 전문가 테이블로 변경
ALTER TABLE expert_match_requests 
DROP CONSTRAINT IF EXISTS expert_match_requests_matched_expert_id_fkey;

ALTER TABLE expert_match_requests 
ADD CONSTRAINT expert_match_requests_matched_expert_id_fkey 
FOREIGN KEY (matched_expert_id) REFERENCES experts(id);

-- 기존 expert_profiles 테이블에 데이터가 있다면 백업하거나 정리 (선택 사항)
-- COMMENT ON TABLE expert_profiles IS '사용되지 않는 레거시 전문가 프로필 테이블';
