---
name: Travel Management Phase 2 UI 구현 계획
description: 13일 프론트엔드 개발 계획, 페이지 구조, 컴포넌트 분해, 파일 조직
type: project
relatedFiles: dsc-fms-portal/TRAVEL_MANAGEMENT_PHASE2_PLAN.md
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
---
# Travel Management Phase 2 — UI 구현 계획

**타임라인:** 2026-05-15 ~ 2026-05-27 (13일)  
**상태:** Phase 1 API 완료, UI 구현 대기

## 파일 구조

```
dsc-fms-portal/
├── app/travels/
│   ├── page.tsx              # TravelList 페이지
│   └── [id]/
│       ├── page.tsx          # TravelDetail 페이지
│       └── layout.tsx        # 탭 내비게이션 레이아웃
├── components/travels/
│   ├── TravelCard.tsx        # 카드 (목록 뷰)
│   ├── TravelForm.tsx        # 생성/수정 모달
│   ├── MemberManager.tsx     # 멤버 추가/제거
│   ├── EventManager.tsx      # 일정 목록 + 폼
│   ├── CostManager.tsx       # 비용 목록 + 폼
│   ├── SettlementTable.tsx   # 정산 요약
│   ├── ChecklistManager.tsx  # 체크리스트 항목
│   ├── DocumentUploader.tsx  # 파일 업로드
│   ├── NotificationSettings.tsx  # 규칙 관리
│   └── TabNavigation.tsx     # 탭 전환
└── hooks/
    └── useTravelData.ts      # 데이터 페칭 & 동기화 커스텀 훅
```

## 페이지 설계

### TravelList (`app/travels/page.tsx`)

**기능:**
- 사용자 여행 페칭 (마운트 시)
- 카드 그리드로 표시
- 상태별 필터 (all, upcoming, ongoing, completed)
- 정렬 옵션 (date, cost, name)
- 액션 버튼: 새로 만들기, 상세 보기

**컴포넌트 사용:**
- TravelCard (8회 이상)
- TravelForm (모달)

**상태:**
```
travels: Travel[]
filter: status
sort: 'date' | 'cost' | 'name'
isCreateModalOpen: boolean
```

### TravelDetail (`app/travels/[id]/page.tsx`)

**레이아웃:** 6개 수평 탭

**Tab 1: Overview**
- 여행명, 설명, 날짜, 위치
- 멤버 목록 (역할 포함)
- 편집 버튼 (주최자만)

**Tab 2: Schedule**
- 이벤트 목록 (항공, 호텔, 식사, 교통, 기타)
- 타임라인/캘린더 뷰
- 이벤트 추가 버튼
- 이벤트별 편집/삭제 버튼

**Tab 3: Costs & Settlement**
- 비용 목록 (지불자, 금액, 분담)
- 정산 테이블 (멤버 잔액)
- 비용 추가 버튼
- 일괄 편집 분담
- 정산 리포트 다운로드

**Tab 4: Checklist**
- 항목 (카테고리별: 서류, 의류, 위생용품 등)
- 체크/언체크
- 우선순위 표시 (low/medium/high)
- 항목 추가/삭제

**Tab 5: Documents**
- 파일 목록 (업로드 일시, 크기, 타입)
- 문서 타입 태그 (비자, 여권, 영수증 등)
- 업로드 버튼 (드래그 & 드롭)
- 다운로드 링크
- 삭제 버튼

**Tab 6: Notifications**
- 발송된 알림 목록
- 알림 규칙 설정 (활성화/비활성화)
- 채널: in_app, email, telegram

## 컴포넌트 분해

### TravelCard
- 표시: name, location, date range, member count, total cost
- 액션: view, edit, delete
- 상태 배지 (upcoming/ongoing/completed)
- 비용 진행률 바

### TravelForm
- 모달 폼:
  - name (text input)
  - description (textarea)
  - start_date (date picker)
  - end_date (date picker)
  - location (text input)
- 검증: 날짜 범위, 필수 필드
- 핸들러: create 또는 update

### MemberManager
- 멤버 목록 + 권한 표시
- 초대 입력 필드
- 멤버별 삭제 버튼
- 역할 변경 드롭다운 (organizer/companion/guest)

### EventManager
- 이벤트 목록 (타입별 아이콘)
- 이벤트 추가 모달
- 필드: title, event_type, event_date, event_time, location, description
- 수정/삭제 버튼

### CostManager
- 비용 목록 + 지불자명
- 비용 추가 모달
- 분담 설정 인터페이스 (균등/비율/커스텀)

### SettlementTable
- 멤버별 수취/지불 액수
- "A가 B에게 100,000 원 이체" 형식의 정산 제안
- CSV 내보내기 버튼

### ChecklistManager
- 카테고리별 항목 그룹화
- 체크박스
- 우선순위 아이콘
- 항목 추가/삭제 인터페이스

### DocumentUploader
- 드래그 & 드롭 존
- 파일 선택 버튼
- 진행률 표시
- 업로드 완료 후 파일 목록 갱신

### NotificationSettings
- 규칙 목록 (days_before_departure, event_time, checklist_reminder, custom)
- 활성화/비활성화 토글
- 채널 선택 (체크박스)
- 규칙 추가/수정/삭제

### TabNavigation
- 6개 탭 버튼
- 활성 탭 강조
- 모바일: 드롭다운으로 축소

## 개발 일정 (13일)

| 일차 | 작업 | 예상 시간 |
|------|------|---------|
| 1-2일 | 레이아웃 + useTravelData 훅 | 4시간 |
| 3-4일 | TravelList + TravelCard + TravelForm | 5시간 |
| 5일 | TravelDetail 셸 + 탭 내비게이션 | 3시간 |
| 6-7일 | Overview + Schedule + EventManager | 5시간 |
| 8-9일 | Costs + SettlementTable + CostManager | 5시간 |
| 10일 | Checklist + ChecklistManager | 3시간 |
| 11일 | Documents + DocumentUploader | 3시간 |
| 12일 | Notifications + NotificationSettings | 3시간 |
| 13일 | 모바일 반응형 + 접근성 + 에러 처리 | 4시간 |
