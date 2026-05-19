---
name: Travel Management 모듈 설계 요약
description: 8개 DB 테이블, 6개 탭 UI, 아키텍처 개요, 체크리스트
type: project
relatedFiles: dsc-fms-portal/TRAVEL_MANAGEMENT_SUMMARY.md
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
---
# Travel Management 모듈 — 설계 요약

**상태:** 플레너 최종 설계 → 웹개발자 구현 단계  
**작성일:** 2026-05-14  
**담당:** 플레너 (설계 완료), 웹개발자 (구현 대기)

## 목표

Na Kyeongtae의 베트남 호치민 여행 (2026-05-15 ~ 05-24)을 DSC Hub 포탈에서 **통합 관리**:
- 항공, 숙소, 식사 일정 추적
- 동반자 간 비용 정산
- 준비물 체크리스트
- 서류 보관 (비자, 항공권 등)
- 자동 알림 시스템

## 아키텍처

```
DSC Hub (포탈)
  ├─ Tab 1: Personal History (개인이력)
  ├─ Tab 2: DSC FMS (공장 업무)
  └─ Tab 3: Travel Records ← 신규 모듈
       ├─ Travel List (여행 목록)
       └─ Travel Detail (6개 탭)
            ├─ Overview (기본 정보)
            ├─ Schedule (일정 + 캘린더 + 타임라인)
            ├─ Costs (비용 + 정산)
            ├─ Checklist (준비물)
            ├─ Documents (서류 보관)
            └─ Notifications (알림 설정)
```

## 주요 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| **여행 CRUD** | 생성/수정/삭제 | ✅ 필수 |
| **멤버 관리** | 동반자 초대 + 권한 제어 | ✅ 필수 |
| **일정 관리** | 항공, 숙소, 식사 등 이벤트 | ✅ 필수 |
| **캘린더 뷰** | 월간 캘린더 + 타임라인 | ✅ 필수 |
| **비용 관리** | 항목별 비용 등록 | ✅ 필수 |
| **정산 계산** | 균등 분할, 비율 분할, 커스텀 | ✅ 필수 |
| **체크리스트** | 카테고리별 준비물 관리 | ✅ 필수 |
| **문서 보관** | 파일 업로드 (드래그 & 드롭) | ✅ 필수 |
| **자동 알림** | Cron 기반 예정 알림 | ✅ 필수 |
| **다중 채널** | 인앱, 이메일, Telegram | ✅ 필수 |
| **권한 제어** | Organizer/Companion/Guest | ✅ 필수 |
| **모바일 최적화** | 반응형 디자인 | ✅ 필수 |

## DB 스키마 (8개 테이블)

### travels (여행 마스터)
```
id: uuid (PK)
user_id: uuid (FK → auth.users)
name: text
start_date: date
end_date: date
location: text
status: enum (planning|ongoing|completed)
created_at: timestamp
```

### travel_members (멤버/권한)
```
id: uuid (PK)
travel_id: uuid (FK → travels)
user_id: uuid (FK → auth.users)
role: enum (organizer|companion|guest)
permission: jsonb (권한 플래그)
joined_at: timestamp
unique(travel_id, user_id)
```

### travel_events (일정/이벤트)
```
id: uuid (PK)
travel_id: uuid (FK → travels)
title: text
event_type: enum (flight|hotel|meal|transport|other)
event_date: date
event_time: time (nullable)
location: text
description: text (nullable)
status: enum (scheduled|in_progress|completed)
created_at: timestamp
```

### travel_costs (비용)
```
id: uuid (PK)
travel_id: uuid (FK → travels)
payer_id: uuid (FK → auth.users)
title: text
amount: numeric
cost_type: enum (flight|accommodation|meal|transport|other)
cost_date: date
created_at: timestamp
```

### travel_cost_splits (비용 분담)
```
id: uuid (PK)
cost_id: uuid (FK → travel_costs)
member_id: uuid (FK → auth.users)
amount: numeric
split_type: enum (equal|percentage|custom)
unique(cost_id, member_id)
```

### travel_checklist_items (체크리스트)
```
id: uuid (PK)
travel_id: uuid (FK → travels)
title: text
category: enum (documents|clothing|toiletries|electronics|medicine|custom)
is_completed: boolean
priority: enum (low|medium|high)
created_at: timestamp
```

### travel_documents (파일)
```
id: uuid (PK)
travel_id: uuid (FK → travels)
file_name: text
file_path: text (Supabase Storage)
file_size: bigint
document_type: enum (visa|passport|flight_ticket|hotel_booking|receipt|other)
uploaded_at: timestamp
```

### travel_notifications (알림)
```
id: uuid (PK)
travel_id: uuid (FK → travels)
user_id: uuid (FK → auth.users)
title: text
message: text
trigger_date: date
trigger_time: time
channels: jsonb ({in_app, email, telegram})
is_sent: boolean
sent_at: timestamp (nullable)
```

### travel_notification_rules (알림 규칙)
```
id: uuid (PK)
travel_id: uuid (FK → travels)
rule_type: enum (days_before_departure|event_time|checklist_reminder|custom)
rule_config: jsonb
is_enabled: boolean
created_at: timestamp
```

## UI/UX 설계

### Travel List (여행 목록)
- **카드 뷰:** 여행명, 기간, 지역, 인원, 총 비용
- **필터:** 상태별 (upcoming/ongoing/completed)
- **정렬:** 날짜순/비용순/이름순

### Travel Detail (여행 상세) - 6개 탭

**Tab 1: Overview**
- 기본 정보 (항공, 숙소, 인원, 비용)

**Tab 2: Schedule**
- 일정 (캘린더 + 타임라인 + 이벤트 추가)

**Tab 3: Costs**
- 경비 (항목 목록 + 정산 계산표)

**Tab 4: Checklist**
- 준비물 (카테고리별 + 진행률)

**Tab 5: Documents**
- 서류 (폴더별 파일 + 업로드)

**Tab 6: Notifications**
- 알림 (규칙 활성화/채널 선택)

## 반응형 설계

| 화면 크기 | 범위 | 레이아웃 |
|----------|------|---------|
| **모바일** | 320~767px | 풀 너비 카드, 탭 드롭다운 |
| **태블릿** | 768~1023px | 2열 레이아웃 |
| **데스크톱** | 1024px+ | 3열 레이아웃 |

## 개발 체크리스트

### Phase 1: DB & API (완료)
- ✅ 8개 테이블 스키마 정의
- ✅ RLS 정책 설계
- ✅ 13개 API 엔드포인트 구현
- ✅ Vercel Cron 자동 알림 스케줄 설정

### Phase 2: UI & Components (진행 중)
- ⏳ TravelList 페이지 구현
- ⏳ TravelDetail 페이지 + 6개 탭 구현
- ⏳ 10개 컴포넌트 구현 (Card, Form, Manager 등)
- ⏳ 바우처 자동 파싱 기능 추가
- ⏳ 모바일 반응형 & 접근성 검증

### Phase 3: Testing & Deployment
- ⏲️ 통합 테스트
- ⏲️ 성능 최적화
- ⏲️ Vercel 배포
- ⏲️ 모니터링 & 알림 설정

## 기술 스택

- **Frontend:** Next.js 14, React, Tailwind CSS, Zustand, SWR
- **Backend:** Vercel Functions, PostgreSQL (Supabase)
- **Real-time:** Supabase Realtime (선택)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Charts:** Recharts
- **Form Validation:** React Hook Form + Zod
- **Date:** date-fns + react-day-picker
- **Dialogs:** Radix UI Dialog

## 예상 완료 일정

- **설계 완료:** 2026-05-14
- **UI 구현 시작:** 2026-05-15
- **구현 예상 완료:** 2026-05-27 (13일)
- **배포:** 2026-05-27
