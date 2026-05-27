-- Team Dashboard Phase 2 마이그레이션 검증 쿼리
-- db/42a + db/42b 실행 후 아래 쿼리 실행하여 결과 확인

-- 1. team_members 구조 확인 (status, join_date 등 18개 컬럼)
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'team_members' ORDER BY ordinal_position;

-- 2. Phase 2 추가 테이블 존재 확인
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('team_structure', 'capability_scores', 'portfolio_items', 'activity_log')
ORDER BY tablename;

-- 3. 인덱스 생성 확인
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('team_members', 'team_structure', 'capability_scores', 'portfolio_items', 'activity_log')
ORDER BY tablename, indexname;

-- 4. RLS 정책 확인
SELECT schemaname, tablename, policyname, qual FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- 5. team_members 현재 데이터 샘플
SELECT id, name, email, status, role, join_date FROM team_members LIMIT 5;

-- 6. team_structure 테이블 준비 확인
SELECT COUNT(*) as team_structure_count FROM team_structure;

-- 7. 모든 트리거 확인
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public' AND event_object_table IN ('team_structure', 'capability_scores', 'portfolio_items', 'activity_log');
