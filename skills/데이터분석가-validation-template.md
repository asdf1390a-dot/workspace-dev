---
name: 데이터분석가 API 검증 템플릿
description: API 완료 검증 시 자동 실행되는 5단계 검증 체크리스트 (442 LOC learnings 기반)
version: 1.0
activation: 모든 API 개발 완료 후 배포 전
---

# 데이터분석가 — API 검증 5단계 체크리스트 (learnings.md 기반)

**이 템플릿은 웹개발자 완료 후 배포 전에 자동으로 활성화됩니다.**

---

## 🎯 검증 순서 (반드시 순서대로)

### 1️⃣ **요구사항 검증**

```
[ ] 스펙 문서 확인: [파일 경로]
[ ] API 엔드포인트 확인: /api/[endpoint]
[ ] HTTP 메서드 확인: GET / POST / PUT / DELETE
[ ] 쿼리 파라미터 확인: [list parameters]
[ ] 응답 스키마 확인: [expected structure]
```

**체크리스트:**
- [ ] 개발된 엔드포인트가 스펙 문서와 100% 일치?
- [ ] 누락된 필드 없나? (스펙 대비)
- [ ] 추가된 필드 (스펙에 없는 것) 없나?

**예시:**
```
스펙: GET /api/bm/events?asset_id=DCMI-XXX&limit=10
개발: GET /api/bm/events?asset_id=&limit=10&offset=0 ✅ 일치

스펙 응답: { id, asset_id, failure_code, timestamp, priority }
개발 응답: { id, asset_id, failure_code, timestamp, priority, created_at } ⚠️ 추가 필드
```

---

### 2️⃣ **API 응답값 검증**

```bash
# 각 엔드포인트에 대해 다음 테스트 실행:

# 정상 요청
curl -H "Authorization: Bearer $ANON_KEY" \
  "https://project.supabase.co/rest/v1/endpoint?select=*"

# 경계값 요청 (아래 3가지 모두 테스트)
curl "...endpoint?limit=0"           # 최소값
curl "...endpoint?limit=1000"        # 최대값
curl "...endpoint?offset=9999"       # 범위 초과
```

**체크리스트:**
- [ ] 정상 요청: 200 + 예상 구조 응답?
- [ ] limit=0: 빈 배열 반환? (무한 루프 아님?)
- [ ] offset 초과: 빈 배열? (에러 아님?)
- [ ] 없는 ID 요청: 404 또는 빈 배열?

**타입 검증:**
```
예상: { id: number, asset_id: string, priority: "Urgent"|"Normal" }
실제 응답: id의 타입 확인 (number? string?)
실제 응답: priority가 정확히 2개 값만? (스펙 이외 값 없나?)
실제 응답: null 필드 있나? (required 필드가 null일 수 없다)
```

**null 처리 검증:**
```
[ ] 선택 필드 (nullable): null 가능?
    예: notes (선택사항) → null OK
[ ] 필수 필드: null 불가?
    예: asset_id (필수) → null은 에러 OR 이전 값 유지
[ ] 배열 필드: null vs [] 구분?
    예: attachments → null? 또는 빈 배열?
```

---

### 3️⃣ **데이터베이스 검증**

```sql
-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'table_name' 
ORDER BY ordinal_position;

-- Foreign Key 확인
SELECT constraint_name, column_name, foreign_table_name 
FROM information_schema.table_constraints 
WHERE table_name = 'table_name' AND constraint_type = 'FOREIGN KEY';

-- 인덱스 확인
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'table_name';

-- 성능 확인
EXPLAIN ANALYZE 
SELECT * FROM table_name 
WHERE condition LIKE '%value%';  -- LIKE 성능 저하 확인
```

**체크리스트:**

데이터 타입:
- [ ] 문자열 필드 충분한 길이? (asset_id VARCHAR(50)? 20은 부족?)
- [ ] 숫자 필드 정수/소수 구분? (priority는 정수? cycle_time은 소수?)
- [ ] 시간 필드 timezone 포함? (timestamp with timezone?)
- [ ] 불린 필드 is_active 같이 is_ 접두사?

제약 조건:
- [ ] Primary Key 있나? (모든 테이블 필수)
- [ ] Foreign Key 설정 정상? (asset_id → assets.id)
- [ ] Unique 제약 필요한가? (asset_id + date 조합 중복 방지?)
- [ ] NOT NULL 제약 정상? (필수 필드만)

성능:
- [ ] 자주 조회되는 필드에 인덱스? (asset_id, timestamp)
- [ ] LIKE '%value%' 쿼리 성능? (시간 초과 없나?)
- [ ] JOIN 성능 정상? (설명 계획에서 Seq Scan 없나?)

---

### 4️⃣ **비즈니스 로직 검증**

실제 데이터 샘플로 검증:

```javascript
// 테스트 케이스 (실제 상황 기반)

// Case 1: BM 이벤트 우선순위 필터링
GET /api/bm/events?priority=Urgent
→ Urgent 등급만 반환되나? (Normal 섞여있지 않나?)

// Case 2: Asset 가동률 계산
GET /api/assets/DCMI-ABC-001/uptime
→ (정상시간 / 총시간) * 100 계산 정상?

// Case 3: 중복 BM 방지
POST /api/bm/events { asset_id, failure_code, timestamp }
→ 동일 asset + failure + 5분 이내 재입력 시 중복 경고?
  (수동 더블클릭이 중복 이벤트 생성 안 하나?)

// Case 4: 재고 자동 차감
POST /api/bm/events + equipment replacement
→ 해당 부품 재고 자동 -1 되나?
→ 재고 0이면 드롭다운에서 비활성화되나?
```

**체크리스트:**
- [ ] 계산 논리 정상? (MTBF, MTTR 공식 맞나?)
- [ ] 조건부 로직 정상? (모든 if-else 브랜치 테스트?)
- [ ] 중복 방지 로직? (같은 요청 2번 → 이벤트 1개만 생성?)
- [ ] 트랜잭션 안전? (부분 실패 시 전체 롤백?)

---

### 5️⃣ **최종 판정**

```markdown
# [API명] 검증 리포트 — YYYY-MM-DD

## 검증 결과 요약
- 요구사항 일치도: ✅ / 🟡 / 🔴
- API 응답값: ✅ / 🟡 / 🔴
- DB 정합성: ✅ / 🟡 / 🔴
- 비즈니스 로직: ✅ / 🟡 / 🔴

## 발견 이슈

### 🔴 Critical (배포 차단)
- FK 제약 위반: [설명]
- null 처리 오류: [위치]
- 계산 로직 오류: [예시]

### 🟡 Medium (조건부 배포)
- 성능 저하: LIKE 쿼리 [ms]
- 누락된 인덱스: [테이블.필드]

### 🟢 Low (배포 가능)
- 타입 정의 불완전: [스키마]

## 최종 판정
[ ] ✅ 승인 — 모든 항목 정상
[ ] 🟡 조건부 승인 — 경미 이슈, 보정 후 배포
[ ] 🔴 반려 — 주요 결함, 재개발 필요

**승인자:** [이름]  
**검증일:** YYYY-MM-DD
**다음 단계:** [배포 / 재검토 / 보정]
```

---

## 🔄 실행 흐름

```
1️⃣ 웹개발자: API 완료 → PR 생성
2️⃣ 데이터분석가: 이 템플릿 자동 로드
3️⃣ 데이터분석가: 1~5단계 순서대로 검증
4️⃣ 최종 판정: ✅ 승인 / 🟡 조건부 / 🔴 반려
5️⃣ 배포 단계로 진행 (승인인 경우만)
```

---

## 📊 예시: Spot Check (선택사항)

배포 후 1개월 동시 검증:

```sql
-- 실제 사용자 데이터로 재검증
SELECT COUNT(*) FROM bm_events 
WHERE failure_code NOT IN (SELECT code FROM glossary_failure_codes);
→ 0이면 OK, >0이면 데이터 오염 발생

SELECT AVG(resolution_time) FROM bm_events 
WHERE priority = 'Urgent';
→ 긴급 이벤트의 평균 해결 시간이 정상범위?

SELECT COUNT(*) FROM bm_events 
WHERE created_at = updated_at;
→ AI 자동화 도입 후 AI 추천 선택률?
```

---

## 🔗 참고 문서

**완전 가이드**: `/home/jeepney/.openclaw/workspace-dev/skills/데이터분석가-learnings.md`  
**Supabase REST**: https://supabase.com/docs/guides/api  
**PostgreSQL**: https://www.postgresql.org/docs/

---

**마지막 업데이트:** 2026-06-05 02:29 KST  
**자동 활성화:** API 완료 후 배포 전 (분석가 호출 시)
