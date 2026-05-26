---
name: Travel Management 모듈 전체 설계
description: 여행/출장 기록 + 일정/비용/체크리스트 관리, 4탭 상세조회, 다중 참여자 비용분담, 6 API endpoints
type: project
relatedFiles: dsc-fms-portal/TRAVEL_MANAGEMENT_DESIGN.md
---

# Travel Management 모듈 전체 설계

**설계 완료:** 2026-05-16 (from 서브디렉토리)  
**상태:** ✅ 설계 완료 → 구현 준비

## 개요

**목표:** 팀원 여행/출장 기록, 일정, 비용, 체크리스트를 통합 관리  
**대상 사용자:** Travel Lead (Na Kyeongtae), 동반자 (Huishuwo Leiyawon)  
**배포 대상:** DSC Hub 내 Travel Management 탭

## 정보 구조

### Travel Records Tab
- **List View:** 카드 형식, 여행명/일정/상태 표시
- **Detail View:** 4개 서브탭 (Overview, Schedule, Costs, Checklist)

### 4가지 상세 탭

#### 1. Overview 탭
- 여행명, 목적지, 시작/종료 날짜
- Travel Lead 정보
- 동반자 목록
- 총 예산 + 실제 지출
- 진행 상태 (계획중 | 진행중 | 완료)

#### 2. Schedule 탭
- Timeline 형식 이벤트 목록
- 이벤트명, 시간, 위치, 설명
- 드래그앤드롭 재정렬 (실시간)
- 이벤트 추가/편집 버튼

#### 3. Costs 탭
- 비용 항목 테이블 (항목명, 카테고리, 금액, 지불자, 분담 방식)
- 실시간 비용 합계 계산
- 비용 카테고리: 항공료, 숙박, 식사, 교통, 활동, 기타
- 분담 계산:
  - 균등 분담 (total / 인원)
  - 개인별 비용 (각자 지출한 것)
  - 정산 제안 (누가 누구에게 얼마 정산)
- 영수증 사진 업로드

#### 4. Checklist 탭
- 준비물 체크리스트 (checkbox)
- 항목명, 담당자, 완료율
- 진행 상황 추적 (% 표시)
- 신규 항목 추가

## 사용자 흐름 (User Flows)

### 1. 여행 생성
1. "새 여행" 버튼 클릭
2. 여행명, 목적지, 날짜 입력
3. Travel Lead 선택
4. 동반자 추가 (이메일 초대)
5. 저장 → 초대 메일 발송

### 2. 일정 관리
1. Schedule 탭 클릭
2. "이벤트 추가" → 날짜, 시간, 위치, 설명 입력
3. 저장
4. 드래그앤드롭으로 순서 변경

### 3. 비용 추적
1. Costs 탭 클릭
2. "비용 추가" → 항목명, 카테고리, 금액, 지불자 선택
3. 분담 방식 선택 (균등/개인별)
4. 영수증 사진 업로드 (선택사항)
5. 자동 정산 계산 표시
6. 비용 삭제 가능

### 4. 체크리스트 관리
1. Checklist 탭 클릭
2. "항목 추가" → 항목명, 담당자 선택
3. Checkbox로 완료 표시
4. 삭제 가능

## 컴포넌트 명세

### 주요 컴포넌트 (8개)

1. **TravelRecordList** — 여행 목록 카드
   - 여행명, 날짜, 상태 표시
   - 카드 클릭 → Detail View
   - 필터: 상태별, 날짜별

2. **TravelDetailView** — 4탭 상세 조회
   - Tab navigation (Overview | Schedule | Costs | Checklist)
   - 각 탭 content 로드

3. **TravelOverviewTab** — 기본 정보
   - 정보 표시 (읽기전용, 수정 버튼)
   - Travel Lead, 동반자, 예산 요약

4. **TravelScheduleTab** — 일정 관리
   - Timeline 형식 이벤트 목록
   - 드래그앤드롭 지원
   - 이벤트 추가/편집/삭제 모달

5. **TravelCostsTab** — 비용 관리
   - 비용 항목 테이블
   - 실시간 합계 + 분담 계산
   - "비용 추가" 모달
   - 영수증 업로드

6. **TravelChecklistTab** — 체크리스트
   - Checkbox 목록
   - 담당자 표시
   - 항목 추가/삭제

7. **CostSplitCalculator** — 비용 분담 계산
   - 균등 분담 / 개인별 계산 선택
   - 정산 제안 표시
   - 실시간 업데이트

8. **EventModalForm** — 일정 추가/편집
   - 날짜, 시간, 위치, 설명 입력 필드
   - Save / Cancel 버튼

## 데이터베이스 스키마

### travels (여행 기본 정보)
```
id (uuid, PK)
travel_name (string)
destination (string)
start_date (date)
end_date (date)
travel_lead_id (uuid, FK to auth.users)
status (enum: planning | in_progress | completed)
total_budget (decimal)
created_at (timestamp)
updated_at (timestamp)
```

### trip_events (여행 일정)
```
id (uuid, PK)
travel_id (uuid, FK to travels)
event_name (string)
event_date (date)
event_time (time)
location (string)
description (text, nullable)
sequence_order (integer)
created_at (timestamp)
updated_at (timestamp)
```

### trip_costs (비용)
```
id (uuid, PK)
travel_id (uuid, FK to travels)
cost_name (string)
category (enum: flight | accommodation | meal | transport | activity | other)
amount (decimal)
payer_id (uuid, FK to auth.users)
split_type (enum: equal | individual)
receipt_photo_url (string, nullable)
created_at (timestamp)
updated_at (timestamp)
```

### trip_participants (참여자)
```
travel_id (uuid, FK to travels)
user_id (uuid, FK to auth.users)
is_travel_lead (boolean)
joined_at (timestamp)
PRIMARY KEY (travel_id, user_id)
```

### trip_checklists (체크리스트)
```
id (uuid, PK)
travel_id (uuid, FK to travels)
item_name (string)
assignee_id (uuid, FK to auth.users, nullable)
is_completed (boolean, default false)
completion_date (timestamp, nullable)
created_at (timestamp)
updated_at (timestamp)
```

### trip_documents (여행 관련 문서/사진)
```
id (uuid, PK)
travel_id (uuid, FK to travels)
document_type (enum: receipt | passport_copy | booking | photo | other)
file_url (string)
file_name (string)
uploaded_by (uuid, FK to auth.users)
uploaded_at (timestamp)
```

## API 엔드포인트 (최소 6개)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/travels | 여행 목록 (필터: status, date range) |
| POST | /api/travels | 새 여행 생성 |
| GET | /api/travels/:id | 여행 상세 조회 |
| PUT | /api/travels/:id | 여행 정보 수정 |
| DELETE | /api/travels/:id | 여행 삭제 |
| POST | /api/travels/:id/events | 일정 추가 |
| PUT | /api/travels/:id/events/:event_id | 일정 수정 |
| DELETE | /api/travels/:id/events/:event_id | 일정 삭제 |
| POST | /api/travels/:id/costs | 비용 추가 |
| PUT | /api/travels/:id/costs/:cost_id | 비용 수정 |
| DELETE | /api/travels/:id/costs/:cost_id | 비용 삭제 |
| GET | /api/travels/:id/cost-split | 비용 분담 계산 |
| POST | /api/travels/:id/checklists | 체크리스트 항목 추가 |
| PUT | /api/travels/:id/checklists/:item_id | 체크리스트 수정 |
| DELETE | /api/travels/:id/checklists/:item_id | 체크리스트 삭제 |

## 엣지 케이스 & 예외 처리

### 통화 변환
- 국가별 현지 통화 지원 (KRW, INR, USD 등)
- 실시간 환율 적용 또는 고정 환율 설정

### 시간대 처리
- 사용자 선택 시간대 저장
- 일정 시간은 현지 시간대 기준 표시
- 데이터베이스에는 UTC로 저장

### 비용 분담 계산
- 다중 참여자의 복잡한 분담 처리
- 누군가 자신의 비용만 지불한 경우
- 정산 제안의 명확성

### 동시 편집
- 여러 사용자가 동시에 비용 추가/수정
- 최후 수정 우선 원칙 또는 충돌 감지
- Optimistic locking 또는 timestamp 기반 versioning

### 문서 중복 방지
- 같은 여행에 중복 파일 업로드 방지
- Hash 기반 중복 감지

## 상태
🟡 **설계 완료** → 구현 준비 중
