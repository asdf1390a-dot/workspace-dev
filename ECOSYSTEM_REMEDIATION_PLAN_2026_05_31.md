# 🏗️ 생태계 정리 및 복구 계획 (2026-05-31)

## 상황 요약

**위반사항 3가지 확인됨:**

1. **언어 규칙 위반:** SOUL.md "한국어 100% (절대)" 규칙 → MEMORY.md, HEARTBEAT.md, 상태 리포트에 영어 제목/헤더 다수 포함
2. **데이터 소유권 위반:** 개인 포트폴리오 데이터 (`portfolio_items` 테이블) → Team Dashboard (회사 앱)에 혼재
3. **저장소 분류 오류:** Travel Management (개인 여행/경비정산 앱) → dsc-fms-portal (회사 포탈)에 위치

---

## 파트 1: 애플리케이션 분류 (증거 기반)

### 회사 애플리케이션 (DSC-INDIA-MANNUR-*)

#### ✅ Asset Master
**현황:** DSC-INDIA-MANNUR-ASSET-MASTER (개별 저장소)
- **데이터:** 506개 고정자산 (회사 소유)
- **소유:** company (모든 직원이 접근)
- **스키마:** assets, asset_categories, asset_locations, asset_audit_log
- **RLS:** public read (모든 직원), authenticated write (권한자)
- **마이그레이션:** db/20~29
- **상태:** ✅ Phase 2 완료 (16 API)

#### ✅ Backup Management
**현황:** DSC-INDIA-MANNUR-BACKUP (개별 저장소)
- **데이터:** 백업 일정, 백업 이력 (회사 운영)
- **소유:** company
- **스키마:** backup_schedules, backup_events, backup_logs, backup_retention_policies
- **RLS:** public read, authenticated write
- **마이그레이션:** db/30~39
- **상태:** ✅ Phase 2 완료 (UI + API)

#### ⚠️ Team Dashboard
**현황:** DSC-INDIA-MANNUR-TEAM-DASHBOARD (개별 저장소)
- **데이터:** DSC Mannur 팀 11명 조직도 + 활동 이력 (회사 정보)
- **소유:** company
- **스키마:**
  - ✅ team_members (팀원 프로필)
  - ✅ team_structure (조직도)
  - ✅ activity_log (활동 이력)
  - ❌ **portfolio_items** ← **위반사항** (개인 포트폴리오)
  - ❌ **projects, milestones, completion_history** ← **위반사항** (Phase 2A에 추가됨)
- **RLS:** public read (팀원), authenticated write (본인/관리자)
- **마이그레이션:** db/36, db/42
- **상태:** Phase 2A 완료 (20 API) 하지만 portfolio_items 포함으로 인한 오염

#### ❓ Discord Bot
**현황:** dsc-fms-portal 내부 코드 (분류 필요)
- **의도:** 팀 협업용 (Telegram ↔ Discord 양방향)
- **추정 소유:** company (회사 팀원용)
- **결정:** **DSC-INDIA-MANNUR-DISCORD-BOT로 분리 필요**

---

### 개인 애플리케이션 (JEEPNEY-*)

#### ❌ Travel Management
**현황:** dsc-fms-portal 내부 (잘못 위치)
- **데이터:** 개인 여행/경비 관리
- **소유:** personal (user_id 기반 개인 전용)
- **증거:**
  ```
  • travel_records.user_id = 개인 사용자 (auth.uid())
  • TravelMember: roles = 'organizer'|'companion'|'guest' (친구/동료 개인여행)
  • TravelCostSplit: 경비 정산 (친구끼리 쪼개기)
  • TravelChecklistItem: category = 'clothing'|'toiletries'|'electronics'|'medicine' (짐 리스트)
  • TravelDocument: type = 'visa'|'passport'|'flight_ticket'|'hotel_booking' (개인 문서)
  • RLS: "user_id = auth.uid()" (자신의 기록만 조회)
  ```
- **마이그레이션:** db/21, db/24, db/26
- **결정:** **JEEPNEY-TRAVEL로 이동**

#### ❌ Portfolio
**현황:** Team Dashboard 내부 `portfolio_items` 테이블 (오염)
- **데이터:** C-3PO 개인 포트폴리오
- **소유:** personal
- **스키마:**
  - portfolio_items (member별 프로젝트)
  - projects (Phase 2A에서 추가)
  - milestones (Phase 2A에서 추가)
  - completion_history (Phase 2A에서 추가)
- **문제:** 회사 조직도 대시보드에 개인 포트폴리오 섞임
- **결정:** **JEEPNEY-PORTFOLIO로 분리 + Team Dashboard에서 제거**

---

## 파트 2: 언어 규칙 위반 (SOUL.md 절대 규칙)

### 규칙
```
한국어 100% (절대)
- 제목, 헤더, 상태 표시, 설명, 본문: 모두 한국어
- 코드/API 이름/변수명/함수명/테이블명: 영어 유지
```

### 위반 사항 확인

#### MEMORY.md (238줄)
- ❌ "Task State Machine Checkpoint" → "작업상태머신체크포인트"
- ❌ "ZERO transitions" → "전환 0건"
- ❌ "Phase 2F Morning Checklist" → "Phase 2F 아침체크리스트"
- ❌ "COMPLETED" → "✅ 완료"
- ❌ "IN PROGRESS" → "🟡 진행중"
- ❌ "BLOCKED" → "🔴 블로킹"
- **다수 영어 섹션헤더 적재**

#### HEARTBEAT.md
- ❌ "Daily Checkpoint" → "일일체크포인트"
- ❌ 상태 텍스트 영어로 혼재

#### 기타 문서들
- 상태 리포트: "COMPLETED", "PENDING", "FAILED" → 한국어 변환 필요
- 기술용어는 OK: "POST /api/assets", "db/29", "JWT", "RLS"

### 수정 전략

**우선순위:**
1. 🔴 **CRITICAL:** MEMORY.md 모든 영어 제목 → 한국어 (238줄 검토)
2. 🔴 **CRITICAL:** HEARTBEAT.md 상태 표시 → 한국어
3. 🟡 **HIGH:** 체크포인트 문서 제목/헤더 → 한국어
4. 🟡 **HIGH:** memory/*.md 파일들 상태표시 → 한국어

**변환 규칙:**
- `Task State Machine Checkpoint #XXX` → `작업상태머신체크포인트#XXX`
- `Phase 2A`, `Phase 2B` 등 → 유지 (기술용어)
- `COMPLETED` → `✅ 완료`
- `IN_PROGRESS` → `🟡 진행중`
- `BLOCKED` → `🔴 블로킹`
- `checkpoint` → `체크포인트` (제목 내)
- API 엔드포인트, 함수명, 변수명 → 영어 유지

---

## 파트 3: 데이터 소유권 위반 (Team Dashboard)

### 위반 항목

#### ❌ portfolio_items 테이블
- **위치:** dsc-fms-portal db/36, db/42
- **문제:** 회사 조직도에 개인 포트폴리오 섞임
- **마이그레이션 코드:** `db/36_team_dashboard_phase2_schema.sql`
  - `portfolio_items`: member_id, project_name, description, url, tech_stack, timeline
- **API 엔드포인트:**
  - `GET /api/team/portfolio` (조회)
  - `POST /api/team/portfolio` (생성)
  - `GET /api/team/portfolio?memberId=...` (필터)
- **테스트:** `__tests__/api/team.test.ts` (portfolio 관련 2개)

#### ❌ Phase 2A 추가 위반
- **마이그레이션:** `db/42_team_dashboard_phase2_api.sql`
- **테이블 추가:**
  - `projects` (member별 프로젝트)
  - `milestones` (마일스톤)
  - `completion_history` (완료 이력)
- **API 엔드포인트:**
  - `GET /api/team/projects`
  - `POST /api/team/projects`
  - `GET /api/team/projects/[id]`
  - `PATCH /api/team/projects/[id]`
  - `DELETE /api/team/projects/[id]`
  - `GET /api/team/projects/[id]/milestones`
  - 등 8개 더
- **상태:** 20개 테스트 모두 통과 (기술적으로는 완성, 하지만 구조적으로 잘못됨)

### 정정 전략

**Step 1: 데이터 유지**
- portfolio_items, projects, milestones, completion_history 데이터 백업
- Supabase 스냅샷 다운로드 (필요시)

**Step 2: Team Dashboard 정제**
- 유지할 테이블: `team_members`, `team_structure`, `activity_log`
- 제거할 테이블: `portfolio_items`, `projects`, `milestones`, `completion_history`
- 새 마이그레이션: `db/43_team_dashboard_portfolio_removal.sql`

**Step 3: API 정리**
- 제거할 엔드포인트:
  - `GET /api/team/portfolio`
  - `POST /api/team/portfolio`
  - `GET /api/team/projects/*` (모든 projects 관련)
  - `GET /api/team/projects/[id]/milestones/*`
  - `GET /api/team/projects/[id]/history/*`
- 유지할 엔드포인트:
  - `/api/team/members/*`
  - `/api/team/structure/*`
  - `/api/team/activity/*`

**Step 4: 테스트 정리**
- `__tests__/api/team.test.ts` → portfolio, projects 관련 테스트 제거 (20개 중 ~10개)
- 남은 테스트: members, structure, activity (10개)

**Step 5: JEEPNEY-PORTFOLIO 생성**
- 새 저장소 또는 분리된 앱으로 portfolio_items, projects, milestones, completion_history 이동
- 새 마이그레이션: `db/portfolio_01_init.sql`

---

## 파트 4: 저장소 분리 계획

### 현재 구조 (문제)
```
dsc-fms-portal/ ← 모든 것이 혼재
├─ app/api/assets/ ✅
├─ app/api/backup/ ✅
├─ app/api/team/ ⚠️ (portfolio 오염)
├─ app/api/travel/ ❌ (개인앱)
├─ app/api/discord/ ❓ (분류 필요)
├─ db/20-29 (assets) ✅
├─ db/30-39 (backup) ✅
├─ db/36,42 (team+portfolio) ⚠️
├─ db/21,24,26 (travel) ❌
└─ types/
   ├─ assets.ts ✅
   ├─ backup.ts ✅
   ├─ travel.ts ❌
   └─ team.ts ⚠️
```

### 목표 구조 (정리됨)
```
DSC-INDIA-MANNUR-ASSET-MASTER/
├─ db/20-29
├─ app/api/assets/
├─ types/assets.ts
└─ ...

DSC-INDIA-MANNUR-BACKUP/
├─ db/30-39
├─ app/api/backup/
├─ types/backup.ts
└─ ...

DSC-INDIA-MANNUR-TEAM-DASHBOARD/
├─ db/36, db/43 (portfolio 제거됨)
├─ app/api/team/ (portfolio 엔드포인트 제거됨)
├─ types/team.ts
└─ ...

DSC-INDIA-MANNUR-DISCORD-BOT/
├─ app/api/discord/ (이동)
└─ ...

JEEPNEY-TRAVEL/
├─ db/21, db/24, db/26
├─ app/pages/travel/
├─ app/api/travel/
├─ types/travel.ts
└─ ...

JEEPNEY-PORTFOLIO/
├─ db/portfolio_01_init.sql (새 마이그레이션)
├─ app/pages/portfolio/
├─ app/api/portfolio/
├─ types/portfolio.ts (portfolio_items → 이동)
└─ ...
```

---

## 파트 5: 실행 순서 (의존성 기반)

### Phase 1: 언어 규칙 정정 (즉시, 병렬 가능)
**담당:** 비서 (자동화)
**소요:** 30분

- [ ] MEMORY.md: 모든 영어 제목 → 한국어 변환
- [ ] HEARTBEAT.md: 상태 표시 → 한국어
- [ ] memory/*.md: 헤더, 상태 → 한국어
- [ ] 코드/API 이름은 영어 유지
- [ ] git commit: "style(docs): Korean language rule enforcement (SOUL.md)"

### Phase 2: Team Dashboard 정제 (의존성 없음)
**담당:** 웹개발자 또는 자동화
**소요:** 2시간

#### 2-1: 스키마 정리 (database)
- [ ] db/43 마이그레이션 생성: portfolio_items, projects, milestones, completion_history 제거
- [ ] Supabase 백업 (스냅샷)
- [ ] db/43 적용
- [ ] RLS 정책 확인 (남은 3개 테이블)

#### 2-2: API 정리 (backend)
- [ ] `app/api/team/portfolio/` 전체 삭제
- [ ] `app/api/team/projects/` 전체 삭제
- [ ] `types/team.ts` 에서 Portfolio*, Project*, Milestone*, CompletionHistory* 타입 삭제

#### 2-3: 테스트 정리 (frontend)
- [ ] `__tests__/api/team.test.ts` 에서 portfolio/projects 관련 테스트 제거 (10개→)
- [ ] 남은 테스트 실행 및 통과 확인
- [ ] git commit: "refactor(team-dashboard): remove portfolio data (JEEPNEY-PORTFOLIO separation)"

#### 2-4: 문서 정리
- [ ] `TEAM_DASHBOARD_PHASE1_COMPLETION.md` 업데이트 (portfolio 제거됨)
- [ ] `TEAM_DASHBOARD_PHASE1_API.md` 업데이트 (endpoint 제거됨)
- [ ] `project_team_dashboard.md` (memory) 업데이트

### Phase 3: 개인 앱 분리 (순차적)
**담당:** 웹개발자
**소요:** 3시간 ~ 1일

#### 3-1: JEEPNEY-TRAVEL 생성
- [ ] 새 저장소 생성 (또는 분리된 앱)
- [ ] `dsc-fms-portal`에서 travel 관련 파일 추출:
  - `app/api/travel/*` 전체
  - `types/travel.ts`
  - `db/21_travel_module.sql`, `db/24_create_travel_tables.sql`, `db/26_travel_enhancements.sql`
- [ ] 새 저장소에 복사/이동
- [ ] 새 Supabase 프로젝트 또는 스키마 생성
- [ ] db/21, db/24, db/26 적용
- [ ] API 테스트 확인

#### 3-2: JEEPNEY-PORTFOLIO 생성
- [ ] 새 저장소 생성
- [ ] `dsc-fms-portal`에서 portfolio 데이터 추출:
  - db/43 실행 후 portfolio_items 백업 데이터 복구 (또는 원본 schema 사용)
  - `db/portfolio_01_init.sql` 생성 (portfolio_items, projects, milestones, completion_history)
- [ ] 새 Supabase 스키마 생성
- [ ] API 엔드포인트 생성 (간단: GET, POST, PATCH, DELETE portfolio_items)
- [ ] Next.js 포트폴리오 페이지 생성

#### 3-3: DSC-INDIA-MANNUR-DISCORD-BOT 분리
- [ ] dsc-fms-portal에서 discord 관련 파일 추출
- [ ] 새 저장소 또는 단독 앱으로 생성
- [ ] 필요한 마이그레이션/스키마 분리

### Phase 4: dsc-fms-portal 최종화 (Phase 3 이후)
**담당:** 비서
**소요:** 30분

- [ ] dsc-fms-portal: travel, discord, portfolio 관련 코드 전부 제거
- [ ] 확인: Asset, Backup, Team Dashboard만 남음
- [ ] 빌드 테스트 (`npm run build`)
- [ ] git commit: "refactor: separate travel/discord/portfolio to independent repositories"

---

## 파트 6: 우선순위 및 타임라인

| 단계 | 항목 | 소요시간 | 우선순위 | 시작 | 완료예정 |
|------|------|---------|---------|------|---------|
| 1 | 언어 규칙 정정 | 30분 | 🔴 CRITICAL | 즉시 | +30분 |
| 2 | Team Dashboard 정제 | 2시간 | 🔴 CRITICAL | 1 완료 후 | +2시간 |
| 3 | JEEPNEY-TRAVEL | 1시간 | 🟡 HIGH | 병렬 또는 2 후 | +1시간 |
| 3 | JEEPNEY-PORTFOLIO | 1시간 | 🟡 HIGH | 병렬 또는 2 후 | +1시간 |
| 3 | DISCORD-BOT 분리 | 30분 | 🔵 MEDIUM | 병렬 | +30분 |
| 4 | dsc-fms-portal 최종화 | 30분 | 🟡 HIGH | 3 완료 후 | +30분 |

**총 예상 소요:** 4시간 ~ 5시간 (병렬화 고려)

---

## 파트 7: 커밋 계획

```
1. style(docs): Korean language rule enforcement (SOUL.md)
   - MEMORY.md 모든 제목/헤더 한국어 변환
   - HEARTBEAT.md 상태 한국어 변환
   - 언어 규칙 확인 완료

2. refactor(team-dashboard): remove portfolio data (JEEPNEY-PORTFOLIO separation)
   - db/43_team_dashboard_portfolio_removal.sql 추가
   - api/team/portfolio 제거
   - api/team/projects 제거
   - types/team.ts 정리

3. feat(jeepney): create TRAVEL and PORTFOLIO apps
   - JEEPNEY-TRAVEL 저장소 생성 + 이동
   - JEEPNEY-PORTFOLIO 저장소 생성 + 이동

4. refactor(discord): separate to independent app
   - DSC-INDIA-MANNUR-DISCORD-BOT 저장소 생성 + 이동

5. refactor: dsc-fms-portal consolidation
   - Asset + Backup + Team Dashboard만 남음
   - 불필요한 타입/API 제거
```

---

## 파트 8: 검증 체크리스트

### 언어 규칙
- [ ] MEMORY.md: 영어 제목 0건
- [ ] HEARTBEAT.md: 영어 상태 0건
- [ ] memory/*.md: 영어 헤더 0건
- [ ] 코드/API/DB명: 영어 유지

### Team Dashboard
- [ ] portfolio_items 테이블 제거됨
- [ ] projects, milestones, completion_history 테이블 제거됨
- [ ] `/api/team/portfolio` 엔드포인트 제거됨
- [ ] `/api/team/projects` 엔드포인트 제거됨
- [ ] 남은 테스트: 모두 통과 (10개)

### 저장소 분리
- [ ] JEEPNEY-TRAVEL: 4개 마이그레이션 + API 13개 + 타입 정의
- [ ] JEEPNEY-PORTFOLIO: portfolio 마이그레이션 + API + 페이지
- [ ] DSC-INDIA-MANNUR-DISCORD-BOT: 분리됨
- [ ] dsc-fms-portal: Asset + Backup + Team Dashboard만 남음

### 빌드 & 배포
- [ ] dsc-fms-portal: `npm run build` 성공
- [ ] JEEPNEY-TRAVEL: `npm run build` 성공 (또는 테스트 통과)
- [ ] JEEPNEY-PORTFOLIO: `npm run build` 성공
- [ ] 모든 마이그레이션: Supabase 적용 완료

---

## 상태

- **Phase 1 (언어):** 🔴 대기 (즉시 시작 필요)
- **Phase 2 (Team Dashboard):** 🔴 대기 (Phase 1 완료 후)
- **Phase 3 (앱 분리):** 🔴 대기 (Phase 2 완료 후)
- **Phase 4 (최종화):** 🔴 대기 (Phase 3 완료 후)

---

**작성자:** 비서 (자동)  
**작성일:** 2026-05-31  
**검토:** 대기중  
**승인:** 대기중
