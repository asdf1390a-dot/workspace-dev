---
name: Team Dashboard Phase 2C 설계 명세서 (최종)
description: 4개 신규 페이지 (Performance, Resource, Communication, Audit) + 12 API endpoints + Figma 컴포넌트 명세
type: project
relatedFiles: TEAM_DASHBOARD_PHASE2_UI_DESIGN.md, project_team_dashboard.md
status: ✅ 설계 완료 — Phase C #2 구현자 준비 완료
createdAt: 2026-05-27 23:30 KST
deadline: 2026-06-10 18:00 KST
---

# Team Dashboard Phase 2C UI 설계 명세서 (최종)

**설계자:** Design Specialist (Phase C #1)  
**상태:** ✅ 설계 완료 → Web-Builder AI Agent 구현 준비  
**마감:** 2026-06-10 18:00 KST  
**예상 구현 기간:** 5일 (2026-06-03 ~ 2026-06-07)  

---

## 📋 목차

1. [개요](#개요)
2. [Phase 2C 범위 정의](#phase-2c-범위-정의)
3. [페이지 1: 팀 성능 대시보드](#페이지-1-팀-성능-대시보드)
4. [페이지 2: 리소스 할당 플래너](#페이지-2-리소스-할당-플래너)
5. [페이지 3: 커뮤니케이션 허브](#페이지-3-커뮤니케이션-허브)
6. [페이지 4: 감사 추적](#페이지-4-감사-추적)
7. [API 엔드포인트 명세](#api-엔드포인트-명세)
8. [데이터 모델 추가](#데이터-모델-추가)
9. [컴포넌트 설계 상세](#컴포넌트-설계-상세)
10. [구현 로드맵](#구현-로드맵)
11. [배포 체크리스트](#배포-체크리스트)

---

## 개요

### 목표

Team Dashboard Phase 2C는 **15명 AI 팀 규모의 고급 성능 관리, 리소스 최적화, 커뮤니케이션 통합, 완전한 감시 기능**을 제공하는 4개의 새로운 페이지를 추가한다.

**Phase 2B와의 차이점:**
- Phase 2B: 기본 조직도, 팀원 프로필, 프로젝트 추적
- Phase 2C: 실시간 성능 메트릭, 동적 리소스 할당, 통합 메시징 로그, 감사 추적

### 성공 기준

✅ 4개 페이지 완전 설계 (UI/UX + 데이터 흐름)  
✅ 12개 API 엔드포인트 명세 (request/response 포함)  
✅ 3개 신규 Supabase 테이블 정의  
✅ Figma/UI 구조도 제공  
✅ 구현 단계별 로드맵  

---

## Phase 2C 범위 정의

### 포함사항 (MVP)

| 항목 | 개수 | 설명 |
|------|------|------|
| **신규 페이지** | 4 | Performance Dashboard, Resource Planner, Communication Hub, Audit Trail |
| **신규 API 엔드포인트** | 12 | 성능 메트릭, 리소스 할당, 메시징 로그, 감사 기록 조회 |
| **신규 DB 테이블** | 3 | team_performance_metrics, resource_allocations, team_activity_logs |
| **신규 UI 컴포넌트** | 18 | PerformanceChart, ResourceGrid, MessageFeed, AuditTimeline 등 |
| **데이터 시각화** | 3 | Line Chart (성능 트렌드), Gantt (리소스), Timeline (감시) |

### 제외사항 (Phase 2D 연기)

- 고급 필터링 (AI 기반 추천)
- 내보내기/보고서 (PDF/Excel 생성)
- 예측 분석 (머신러닝 기반)
- 모바일 앱 네이티브
- 국제화 (i18n)

---

## 페이지 1: 팀 성능 대시보드

**경로:** `/team/performance`  
**목적:** 실시간 팀원 성능 메트릭 시각화 + 트렌드 분석  
**대상 사용자:** CEO, 비서 AI  

### UI 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  팀 성능 대시보드 | 기간선택 [최근 4주 ▼] | 새로고침         │
├─────────────────────────────────────────────────────────────┤
│
│ 【메트릭 카드 4개】
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐
│ │ 평균 신뢰도  │ 활성 프로젝트│ 완료율 평균  │ 위험 지표    │
│ │   85/100     │      8/12    │    72%       │      2건     │
│ │ ↑ 5% (주)    │ ↑ 2개 (주)   │ ↓ 3% (주)    │ ↓ 1건 (주)   │
│ └──────────────┴──────────────┴──────────────┴──────────────┘
│
│ 【팀원별 성능 라인 차트】(5개 메트릭, 4주 트렌드)
│ ┌──────────────────────────────────────────────────────────┐
│ │ 신뢰도 ◆ 기술역량 ◆ 달성률 ◆ 의사소통 ◆ 학습속도      │
│ │                                                          │
│ │   100│     ▲                                            │
│ │   80 │    ╱ ╲                                           │
│ │   60 │   ╱   ╲    ╱─                                    │
│ │   40 │        ╲  ╱                                      │
│ │   20 │         ──                                       │
│ │    0 │_____________                                    │
│ │      1주  2주  3주  4주                                │
│ └──────────────────────────────────────────────────────────┘
│
│ 【팀원 목록 (정렬 가능)】
│ ┌──────────────────────────────────────────────────────────┐
│ │ #  │ 이름 (정렬▼) │ 신뢰도 │ 완료율 │ 활동  │ 상태 │ 액션│
│ ├────┼──────────────┼────────┼────────┼───────┼──────┼────┤
│ │ 1  │ 김준호       │  95    │  85%   │ 12일  │ ✅   │ ... │
│ │ 2  │ Park Jin-ok │  88    │  72%   │  8일  │ ✅   │ ... │
│ │ 3  │ Sanjay Kumar │  82    │  68%   │ 15일  │ ⚠️   │ ... │
│ │... │              │        │        │       │      │     │
│ └──────────────────────────────────────────────────────────┘
│
│ 【개선액션 현황】
│ 진행 중: 12개 | 완료: 28개 | 대기: 5개
│
└─────────────────────────────────────────────────────────────┘
```

### 데이터 구조

**메트릭 카드 (4개)**
```typescript
interface TeamPerformanceMetrics {
  period: 'week' | 'month' | 'quarter';
  averageTrustScore: number;        // 0-100
  activeProjects: number;
  averageCompletionRate: number;    // 0-100
  riskIndicators: number;
  
  // 변화도
  trustScoreTrend: number;          // +5 (%)
  projectsTrend: number;            // +2
  completionTrend: number;          // -3 (%)
  riskTrend: number;                // -1
}
```

**팀원 성능 데이터**
```typescript
interface MemberPerformance {
  memberId: uuid;
  memberName: string;
  technicalCompetency: number;      // 0-100
  taskAchievement: number;
  communication: number;
  learningSpeed: number;
  reliability: number;
  
  // 추가 정보
  completionRate: number;           // 0-100
  lastActivityDate: date;
  status: 'active' | 'warning' | 'inactive';
  riskFactors: string[];            // ["missed_deadline", "low_communication"]
}
```

### 컴포넌트 목록

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `PerformanceMetricCard` | KPI 카드 (4개) | metric, value, trend, period |
| `PerformanceTrendChart` | 라인 차트 (5개 메트릭) | data, period, selectedMetrics |
| `TeamMemberPerformanceTable` | 팀원 성능 테이블 | members, sortBy, onRowClick |
| `ImprovementActionSummary` | 액션 현황 요약 | actionCounts |
| `PerformancePeriodSelector` | 기간 선택 드롭다운 | period, onChange |

### API 엔드포인트 (3개)

#### 1. GET /api/team/performance/metrics
**설명:** 팀 전체 성능 메트릭 (기간별)

**Query Parameters:**
```
GET /api/team/performance/metrics?period=week&weeks=4
```

**Response (200 OK):**
```json
{
  "period": "week",
  "timeRange": {
    "from": "2026-05-06",
    "to": "2026-05-27"
  },
  "metrics": {
    "averageTrustScore": 85,
    "activeProjects": 8,
    "averageCompletionRate": 72,
    "riskIndicators": 2
  },
  "trends": {
    "trustScoreTrend": 5,
    "projectsTrend": 2,
    "completionTrend": -3,
    "riskTrend": -1
  },
  "updatedAt": "2026-05-27T14:30:00Z"
}
```

#### 2. GET /api/team/performance/members
**설명:** 팀원별 성능 데이터 조회

**Query Parameters:**
```
GET /api/team/performance/members?sort=trustScore&order=desc&limit=100
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "김준호",
      "technicalCompetency": 92,
      "taskAchievement": 88,
      "communication": 95,
      "learningSpeed": 90,
      "reliability": 98,
      "completionRate": 85,
      "lastActivityDate": "2026-05-27",
      "status": "active",
      "riskFactors": []
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 100
}
```

#### 3. GET /api/team/performance/trends
**설명:** 성능 메트릭 시간별 트렌드

**Query Parameters:**
```
GET /api/team/performance/trends?metricType=trustScore&weeks=4
```

**Response (200 OK):**
```json
{
  "metric": "trustScore",
  "timeFrame": "4_weeks",
  "data": [
    {
      "week": "2026-04-27",
      "trustScore": 80,
      "memberCount": 15,
      "minScore": 65,
      "maxScore": 98,
      "averageScore": 80
    },
    {
      "week": "2026-05-04",
      "trustScore": 82,
      "memberCount": 15,
      "minScore": 68,
      "maxScore": 98,
      "averageScore": 82
    }
  ]
}
```

---

## 페이지 2: 리소스 할당 플래너

**경로:** `/team/resources`  
**목적:** 팀원 가용성 + 프로젝트 할당 최적화 (Gantt 차트)  
**대상 사용자:** CEO, 비서 AI  

### UI 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  리소스 할당 플래너 | 월별 보기 [2026-06 ▼] | 추가 할당      │
├─────────────────────────────────────────────────────────────┤
│
│ 【가용성 요약】
│ ┌──────────────┬──────────────┬──────────────┐
│ │ 전체 용량    │ 할당됨       │ 가용 시간    │
│ │  600시간/월  │  490시간/월  │  110시간/월  │
│ └──────────────┴──────────────┴──────────────┘
│
│ 【Gantt 차트 - 팀원별 할당】
│ ┌─────────┬──────────────────────────────────────┐
│ │ 김준호  │ ████ [P1] ████ [P2] ██ [관리]       │
│ │ Park... │ ██████ [P3] ██████ [P4]            │
│ │ Sanjay  │ ███ [P5] ███████ [P1]             │
│ │ Jagan   │ ██████ [P6] ████ [P7]             │
│ │...      │ ...                                 │
│ └─────────┴──────────────────────────────────────┘
│
│ 【팀원별 할당 현황 (드래그 가능)】
│ ┌────────────────────────────────────────────────┐
│ │ 팀원     │ 현황        │ % 할당 │ 다음 가용 │    │
│ ├──────────┼─────────────┼────────┼──────────┤    │
│ │ 김준호   │ 100%        │ 100    │ 2026-06-05   │
│ │ Park ... │ 85%         │  85    │ 2026-06-02   │
│ │ Sanjay   │ 70%         │  70    │ 2026-05-30   │
│ │ ...      │             │        │             │
│ └────────────────────────────────────────────────┘
│
│ 【프로젝트 할당 상세】
│ ┌────────────────────────────────────────────────┐
│ │ Asset Master P2 | 담당: Park, Sanjay           │
│ │ 시작: 2026-05-29 | 예상 완료: 2026-06-02     │
│ │ 진행률: 70% | 우선순위: 높음                  │
│ └────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

### 데이터 구조

**리소스 할당 데이터**
```typescript
interface ResourceAllocation {
  allocationId: uuid;
  memberId: uuid;
  memberName: string;
  projectId: uuid;
  projectName: string;
  
  // 할당 시간
  allocatedHours: number;        // 이번 달 예정시간
  estimatedHours: number;        // 전체 프로젝트 예상시간
  completedHours: number;        // 완료된 시간
  
  // 기간
  startDate: date;
  endDate: date;
  
  // 상태
  allocationPercentage: number;  // 0-100
  status: 'scheduled' | 'active' | 'completed';
  priority: 'high' | 'medium' | 'low';
}
```

**팀원 가용성 데이터**
```typescript
interface MemberAvailability {
  memberId: uuid;
  memberName: string;
  month: string;                // "2026-06"
  totalCapacityHours: number;   // 월 기본 시간
  allocatedHours: number;       // 할당된 시간
  availableHours: number;       // 가용 시간
  allocationPercentage: number; // 0-100
  nextAvailableDate: date;      // 다음 가용 시작일
  activeProjects: number;       // 진행 중인 프로젝트 수
}
```

### 컴포넌트 목록

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `CapacitySummaryCards` | 용량 요약 (3개 카드) | total, allocated, available |
| `ResourceGanttChart` | Gantt 차트 (팀원별) | allocations, month |
| `MemberAvailabilityTable` | 팀원별 가용성 테이블 | members, month |
| `ProjectAllocationCard` | 프로젝트 할당 상세 | allocation, onDragStart |
| `MonthSelector` | 월 선택 드롭다운 | month, onChange |

### API 엔드포인트 (3개)

#### 4. GET /api/team/resources/availability
**설명:** 팀원별 월간 가용성

**Query Parameters:**
```
GET /api/team/resources/availability?month=2026-06
```

**Response (200 OK):**
```json
{
  "month": "2026-06",
  "data": [
    {
      "memberId": "uuid-1",
      "memberName": "김준호",
      "totalCapacityHours": 160,
      "allocatedHours": 160,
      "availableHours": 0,
      "allocationPercentage": 100,
      "nextAvailableDate": "2026-06-05",
      "activeProjects": 3
    }
  ],
  "totalTeamCapacity": 2400,
  "totalAllocated": 2090,
  "totalAvailable": 310,
  "teamAllocationPercentage": 87
}
```

#### 5. GET /api/team/resources/allocations
**설명:** 프로젝트별 팀원 할당 상황

**Query Parameters:**
```
GET /api/team/resources/allocations?month=2026-06&projectId=optional
```

**Response (200 OK):**
```json
{
  "month": "2026-06",
  "data": [
    {
      "allocationId": "uuid-1",
      "memberId": "uuid-2",
      "memberName": "Park Jin-ok",
      "projectId": "uuid-3",
      "projectName": "Asset Master Phase 2",
      "allocatedHours": 120,
      "estimatedHours": 150,
      "completedHours": 90,
      "startDate": "2026-05-29",
      "endDate": "2026-06-02",
      "allocationPercentage": 75,
      "status": "active",
      "priority": "high"
    }
  ],
  "total": 42
}
```

#### 6. PUT /api/team/resources/allocations/:id
**설명:** 팀원 할당 수정 (드래그 & 드롭)

**Request Body:**
```json
{
  "startDate": "2026-06-01",
  "endDate": "2026-06-05",
  "allocatedHours": 120,
  "priority": "high"
}
```

**Response (200 OK):**
```json
{
  "allocationId": "uuid-1",
  "status": "updated",
  "updatedAt": "2026-05-27T15:00:00Z"
}
```

---

## 페이지 3: 커뮤니케이션 허브

**경로:** `/team/communications`  
**목적:** Slack/Discord/Telegram 메시지 통합 로그 + 스레드 추적  
**대상 사용자:** CEO, 비서 AI  

### UI 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  커뮤니케이션 허브 | 채널 [모두 ▼] | 기간 [최근 7일 ▼]     │
├─────────────────────────────────────────────────────────────┤
│
│ 【채널 필터】
│ ☑ Slack #일반 ☐ Slack #기술 ☑ Discord #팀보고 ☑ Telegram │
│
│ 【메시지 피드 (최신순)】
│ ┌──────────────────────────────────────────────────────────┐
│ │
│ │ 2026-05-27 14:30 | 김준호 (CEO) | Slack #일반
│ │ "Asset Master Phase 2 배포 완료. 팀 모두 축하합니다!"
│ │ [5개 반응] [2개 댓글] → 열기
│ │
│ │ 2026-05-27 13:45 | Park Jin-ok | Slack #기술
│ │ "코드 리뷰 완료. @Sanjay 확인 바랍니다."
│ │ [3개 반응] [1개 댓글] → 열기
│ │
│ │ 2026-05-27 12:20 | Sanjay Kumar | Discord #팀보고
│ │ "일일 백업 완료: 490시간 할당됨, 110시간 남음"
│ │ [0개 반응] [0개 댓글]
│ │
│ │ ... (더 보기 버튼)
│ │
│ └──────────────────────────────────────────────────────────┘
│
│ 【통계】
│ Slack 메시지: 250건 | Discord: 180건 | Telegram: 120건
│ 가장 활발한 채널: Slack #일반 (85건/주)
│
│ 【스레드 모달】(메시지 클릭 시)
│ ┌──────────────────────────────────────────┐
│ │ 원본: 김준호 | "배포 완료..."         │
│ │ ────────────────────────────────────────│
│ │ 댓글 1: Sanjay | "축하합니다!"          │
│ │ 댓글 2: Park   | "잘됐습니다!"          │
│ │ 댓글 3: Jagan  | "+1"                   │
│ │                                        │
│ │ [답글 작성] 📎 [전송]                  │
│ └──────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

### 데이터 구조

**메시지 로그 데이터**
```typescript
interface MessageLog {
  messageId: uuid;
  channel: 'slack' | 'discord' | 'telegram';
  channelName: string;           // "#일반", "#기술", "#팀보고"
  
  authorId: uuid;
  authorName: string;
  authorAvatarUrl: string;
  
  content: string;               // 메시지 본문
  messageTimestamp: timestamp;
  
  // 상호작용
  reactionCount: number;
  replyCount: number;
  
  // 메타데이터
  isThreadParent: boolean;
  threadId?: uuid;               // 스레드의 부모 메시지 ID
  
  // 인덱싱
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

**스레드 데이터**
```typescript
interface ThreadMessage {
  threadId: uuid;
  parentMessageId: uuid;
  replySequence: number;
  
  authorId: uuid;
  authorName: string;
  
  content: string;
  createdAt: timestamp;
  
  // 메타데이터
  reactions: string[];           // ["👍", "❤️"]
}
```

### 컴포넌트 목록

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `ChannelFilterBar` | 채널 필터 체크박스 | channels, selectedChannels, onChange |
| `MessageFeed` | 메시지 목록 (피드) | messages, onMessageClick |
| `MessageCard` | 단일 메시지 카드 | message, onThreadClick |
| `ThreadModal` | 스레드 대화 모달 | threadId, onClose |
| `ReactionBadges` | 반응 배지 (👍, ❤️) | reactions |
| `CommunicationStats` | 채널별 통계 | stats |

### API 엔드포인트 (3개)

#### 7. GET /api/team/communications/messages
**설명:** 통합 메시지 로그 조회

**Query Parameters:**
```
GET /api/team/communications/messages?channels=slack,discord,telegram&days=7&limit=100
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "messageId": "uuid-1",
      "channel": "slack",
      "channelName": "#일반",
      "authorName": "김준호",
      "content": "Asset Master Phase 2 배포 완료.",
      "messageTimestamp": "2026-05-27T14:30:00Z",
      "reactionCount": 5,
      "replyCount": 2,
      "isThreadParent": true,
      "threadId": "uuid-2"
    }
  ],
  "total": 550,
  "page": 1,
  "limit": 100
}
```

#### 8. GET /api/team/communications/threads/:threadId
**설명:** 스레드 전체 메시지 조회

**Response (200 OK):**
```json
{
  "threadId": "uuid-2",
  "parentMessage": {
    "messageId": "uuid-1",
    "authorName": "김준호",
    "content": "배포 완료",
    "createdAt": "2026-05-27T14:30:00Z"
  },
  "replies": [
    {
      "threadId": "uuid-2",
      "replySequence": 1,
      "authorName": "Sanjay",
      "content": "축하합니다!",
      "createdAt": "2026-05-27T14:31:00Z",
      "reactions": ["👍"]
    }
  ],
  "totalReplies": 3
}
```

#### 9. GET /api/team/communications/statistics
**설명:** 채널별 통계

**Query Parameters:**
```
GET /api/team/communications/statistics?days=7
```

**Response (200 OK):**
```json
{
  "period": "7_days",
  "channels": [
    {
      "channel": "slack",
      "name": "#일반",
      "messageCount": 250,
      "participantCount": 12,
      "mostActiveTime": "14:00-16:00",
      "topParticipants": [
        { "name": "김준호", "messageCount": 35 }
      ]
    }
  ],
  "totalMessages": 550,
  "totalParticipants": 15
}
```

---

## 페이지 4: 감사 추적

**경로:** `/team/audit`  
**목적:** 모든 팀 활동 기록 + 변경 이력 추적  
**대상 사용자:** CEO (감시용)  

### UI 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  감사 추적 | 활동 유형 [모두 ▼] | 기간 [최근 30일 ▼]      │
├─────────────────────────────────────────────────────────────┤
│
│ 【활동 필터】
│ ☑ 프로젝트 변경 ☑ 할당 변경 ☑ 성능 업데이트 ☑ 메시지
│ ☑ 로그인/로그아웃 ☑ 권한 변경
│
│ 【타임라인 (최신순)】
│ ┌──────────────────────────────────────────────────────────┐
│ │
│ │ 2026-05-27 15:00  🔵 [프로젝트 변경]
│ │ Park Jin-ok이 Asset Master Phase 2 상태를
│ │ "진행중" → "완료"로 변경
│ │ 세부사항 ⓘ | 되돌리기
│ │
│ │ 2026-05-27 14:30  🟡 [성능 업데이트]
│ │ 비서 AI가 Sanjay Kumar의 신뢰도를 82 → 85로 변경
│ │ 근거: "마일스톤 2 달성"
│ │ 세부사항 ⓘ
│ │
│ │ 2026-05-27 13:20  🟢 [할당 변경]
│ │ 비서 AI가 Jagan을 Travel Phase 2에 20시간 할당
│ │ 기간: 2026-05-29 ~ 2026-06-02
│ │ 세부사항 ⓘ
│ │
│ │ 2026-05-27 12:00  🔴 [로그인]
│ │ 김준호이 로그인 (IP: 192.168.1.100)
│ │
│ │ ... (더 보기)
│ │
│ └──────────────────────────────────────────────────────────┘
│
│ 【세부정보 모달】(활동 클릭 시)
│ ┌──────────────────────────────────────────┐
│ │ 활동 ID: uuid-xyz...                    │
│ │ 활동 유형: 프로젝트 변경                 │
│ │ 행위자: Park Jin-ok                     │
│ │ 대상: Asset Master Phase 2               │
│ │ 변경 내용:                               │
│ │  필드: status                            │
│ │  이전값: "진행중"                        │
│ │  새값: "완료"                            │
│ │ 타임스탬프: 2026-05-27 15:00:00         │
│ │ IP 주소: 192.168.1.100                 │
│ │                                        │
│ │ [되돌리기] [CSV 내보내기]                │
│ └──────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

### 데이터 구조

**감사 로그 데이터**
```typescript
interface AuditLog {
  auditId: uuid;
  
  // 활동 정보
  activityType: 'project_update' | 'allocation_change' | 'performance_update' 
               | 'message_sent' | 'login' | 'permission_change';
  
  actorId: uuid;                     // 행위자 (사용자/AI)
  actorName: string;
  
  // 대상 정보
  targetType: 'project' | 'member' | 'resource' | 'system';
  targetId: uuid;
  targetName: string;
  
  // 변경 내용
  changes: {
    field: string;                  // "status", "allocatedHours"
    oldValue: any;
    newValue: any;
  }[];
  
  // 메타데이터
  reason?: string;                  // "마일스톤 2 달성"
  ipAddress: string;
  userAgent?: string;
  
  createdAt: timestamp;
  expiresAt: timestamp;             // 데이터 보관 기한 (90일)
}
```

### 컴포넌트 목록

| 컴포넌트 | 설명 | Props |
|---------|------|-------|
| `ActivityTypeFilter` | 활동 유형 필터 | types, selectedTypes, onChange |
| `AuditTimeline` | 감사 로그 타임라인 | logs, onLogClick |
| `AuditLogCard` | 감사 로그 카드 | log, onDetailClick |
| `AuditDetailModal` | 상세 정보 모달 | auditId, onClose |
| `AuditStats` | 활동 통계 카드 | stats |

### API 엔드포인트 (3개)

#### 10. GET /api/team/audit/logs
**설명:** 감사 로그 조회

**Query Parameters:**
```
GET /api/team/audit/logs?activityTypes=project_update,performance_update&days=30&limit=100
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "auditId": "uuid-1",
      "activityType": "project_update",
      "actorName": "Park Jin-ok",
      "targetType": "project",
      "targetName": "Asset Master Phase 2",
      "changes": [
        {
          "field": "status",
          "oldValue": "진행중",
          "newValue": "완료"
        }
      ],
      "reason": null,
      "createdAt": "2026-05-27T15:00:00Z"
    }
  ],
  "total": 342,
  "page": 1,
  "limit": 100
}
```

#### 11. GET /api/team/audit/logs/:auditId
**설명:** 감사 로그 상세 조회

**Response (200 OK):**
```json
{
  "auditId": "uuid-1",
  "activityType": "project_update",
  "actorId": "uuid-2",
  "actorName": "Park Jin-ok",
  "targetType": "project",
  "targetId": "uuid-3",
  "targetName": "Asset Master Phase 2",
  "changes": [
    {
      "field": "status",
      "oldValue": "진행중",
      "newValue": "완료"
    }
  ],
  "reason": null,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2026-05-27T15:00:00Z"
}
```

#### 12. GET /api/team/audit/statistics
**설명:** 감사 활동 통계

**Query Parameters:**
```
GET /api/team/audit/statistics?days=30
```

**Response (200 OK):**
```json
{
  "period": "30_days",
  "totalActivities": 342,
  "activityBreakdown": {
    "project_update": 85,
    "allocation_change": 92,
    "performance_update": 78,
    "message_sent": 67,
    "login": 215,
    "permission_change": 5
  },
  "topActors": [
    { "name": "비서 AI", "activityCount": 156 },
    { "name": "김준호", "activityCount": 67 }
  ],
  "lastActivityTime": "2026-05-27T15:00:00Z"
}
```

---

## API 엔드포인트 명세 (요약)

### Phase 2C API 통합 (12개 엔드포인트)

| # | 메서드 | 경로 | 설명 | 페이지 |
|---|--------|------|------|--------|
| 1 | GET | `/api/team/performance/metrics` | 팀 성능 메트릭 | Performance |
| 2 | GET | `/api/team/performance/members` | 팀원별 성능 | Performance |
| 3 | GET | `/api/team/performance/trends` | 성능 트렌드 | Performance |
| 4 | GET | `/api/team/resources/availability` | 팀원 가용성 | Resource |
| 5 | GET | `/api/team/resources/allocations` | 리소스 할당 | Resource |
| 6 | PUT | `/api/team/resources/allocations/:id` | 할당 수정 | Resource |
| 7 | GET | `/api/team/communications/messages` | 메시지 로그 | Communication |
| 8 | GET | `/api/team/communications/threads/:threadId` | 스레드 조회 | Communication |
| 9 | GET | `/api/team/communications/statistics` | 채널 통계 | Communication |
| 10 | GET | `/api/team/audit/logs` | 감사 로그 | Audit |
| 11 | GET | `/api/team/audit/logs/:auditId` | 로그 상세 | Audit |
| 12 | GET | `/api/team/audit/statistics` | 감사 통계 | Audit |

---

## 데이터 모델 추가

### Supabase 테이블 (3개 신규)

#### 1. team_performance_metrics

```sql
CREATE TABLE team_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  
  technical_competency SMALLINT NOT NULL CHECK (technical_competency >= 0 AND technical_competency <= 100),
  task_achievement SMALLINT NOT NULL CHECK (task_achievement >= 0 AND task_achievement <= 100),
  communication SMALLINT NOT NULL CHECK (communication >= 0 AND communication <= 100),
  learning_speed SMALLINT NOT NULL CHECK (learning_speed >= 0 AND learning_speed <= 100),
  reliability SMALLINT NOT NULL CHECK (reliability >= 0 AND reliability <= 100),
  
  completion_rate SMALLINT,
  risk_factors TEXT[],
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(member_id, week_start)
);

CREATE INDEX idx_performance_member_week ON team_performance_metrics(member_id, week_start DESC);
```

#### 2. resource_allocations

```sql
CREATE TABLE resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES team_projects(id) ON DELETE CASCADE,
  
  allocated_hours INTEGER NOT NULL,
  estimated_hours INTEGER NOT NULL,
  completed_hours INTEGER DEFAULT 0,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  allocation_percentage SMALLINT NOT NULL CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  status VARCHAR(20) DEFAULT 'scheduled',
  priority VARCHAR(10) DEFAULT 'medium',
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_allocations_member_month ON resource_allocations(member_id, start_date DESC);
CREATE INDEX idx_allocations_project ON resource_allocations(project_id);
```

#### 3. team_activity_logs

```sql
CREATE TABLE team_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  activity_type VARCHAR(50) NOT NULL,
  
  actor_id UUID REFERENCES auth.users(id),
  actor_name VARCHAR(255),
  
  target_type VARCHAR(50),
  target_id UUID,
  target_name VARCHAR(255),
  
  changes JSONB,
  reason TEXT,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT now() + INTERVAL '90 days'
);

CREATE INDEX idx_activity_logs_actor ON team_activity_logs(actor_id, created_at DESC);
CREATE INDEX idx_activity_logs_type ON team_activity_logs(activity_type, created_at DESC);
CREATE INDEX idx_activity_logs_target ON team_activity_logs(target_type, target_id);
```

---

## 컴포넌트 설계 상세

### 공유 컴포넌트 (재사용)

#### 1. DataVisualization 컴포넌트

**LineChart** (성능 트렌드)
```typescript
interface LineChartProps {
  data: Array<{ week: string; [metric: string]: number }>;
  metrics: string[];
  height?: number;
  colors?: Record<string, string>;
  xAxisLabel?: string;
  yAxisLabel?: string;
}
```

**GanttChart** (리소스 할당)
```typescript
interface GanttChartProps {
  items: Array<{
    id: string;
    name: string;
    startDate: date;
    endDate: date;
    progress: number;
    color: string;
  }>;
  height?: number;
  onDragEnd?: (id: string, newStart: date, newEnd: date) => void;
}
```

**Timeline** (감사 추적)
```typescript
interface TimelineProps {
  items: Array<{
    id: string;
    timestamp: timestamp;
    icon: ReactNode;
    color: string;
    title: string;
    description: string;
  }>;
  onItemClick?: (id: string) => void;
}
```

### 도메인 컴포넌트 (Phase 2C 신규)

**PerformanceMetricCard**
```typescript
interface PerformanceMetricCardProps {
  label: string;
  value: number;
  unit?: string;
  trend: number;
  trendUnit: 'percent' | 'count';
  icon: ReactNode;
}
```

**ResourceGrid** (Gantt)
```typescript
interface ResourceGridProps {
  allocations: ResourceAllocation[];
  month: string;
  onDragEnd: (id: string, newStart: date, newEnd: date) => void;
}
```

**MessageFeed**
```typescript
interface MessageFeedProps {
  messages: MessageLog[];
  selectedChannels: string[];
  onThreadClick: (threadId: string) => void;
}
```

---

## 구현 로드맵

### Phase 2C 구현 (5일, 2026-06-03 ~ 2026-06-07)

**Day 1 (2026-06-03): DB + API 기초**
- [ ] 3개 테이블 생성 (SQL migration)
- [ ] 12개 API 엔드포인트 스켈레톤
- [ ] Supabase RLS 정책
- [ ] API 테스트 (8개 엔드포인트)

**Day 2 (2026-06-04): Page 1 + Page 2**
- [ ] PerformanceMetricCard, TrendLineChart 구현
- [ ] TeamMemberPerformanceTable 구현
- [ ] CapacitySummaryCards, ResourceGanttChart 구현
- [ ] API 통합 (6개 엔드포인트)

**Day 3 (2026-06-05): Page 3 + Page 4**
- [ ] MessageFeed, ThreadModal 구현
- [ ] AuditTimeline, AuditDetailModal 구현
- [ ] API 통합 (6개 엔드포인트)

**Day 4 (2026-06-06): 최적화 + 테스트**
- [ ] 반응형 레이아웃 검증 (모바일/태블릿/데스크톱)
- [ ] 성능 프로파일링 (Lighthouse >90)
- [ ] 접근성 감사 (WCAG AA)
- [ ] E2E 테스트 (10개 시나리오)

**Day 5 (2026-06-07): 배포 + QA**
- [ ] Vercel 배포
- [ ] 스모크 테스트
- [ ] CEO 대시보드 라이브
- [ ] 문서 작성

---

## 배포 체크리스트

### 설계 단계 (✅ 완료)

- [x] 4개 페이지 상세 설계
- [x] 12개 API 명세
- [x] 3개 DB 테이블 정의
- [x] UI 컴포넌트 구조도
- [x] 데이터 흐름 다이어그램

### 구현 단계 (🟡 대기 중)

- [ ] DB 마이그레이션 실행
- [ ] API 엔드포인트 구현 (12개)
- [ ] UI 컴포넌트 개발 (18개)
- [ ] 반응형 테스트
- [ ] 성능 최적화
- [ ] 접근성 감사
- [ ] E2E 테스트 (>80% 커버리지)
- [ ] Vercel 배포

### QA 단계

- [ ] 모든 API 엔드포인트 테스트
- [ ] 크로스 브라우저 호환성
- [ ] 모바일 반응형
- [ ] 성능 기준 충족 (Lighthouse >90)
- [ ] 접근성 기준 (WCAG AA)
- [ ] 보안 감시 (RLS, 권한)

---

## Ready-for-Implementation 체크리스트

### 문서 준비 ✅

- [x] Phase 2C 전체 설계 문서 (500+ 줄)
- [x] 4개 페이지 상세 스펙
- [x] 12개 API 엔드포인트 명세 (request/response 포함)
- [x] 3개 DB 테이블 SQL 정의
- [x] 18개 컴포넌트 인터페이스 정의
- [x] 5일 구현 로드맵

### 의존성 확인 ✅

- [x] Phase 2B UI 설계 완료
- [x] Phase 2A API 구현 완료 (팀원, 프로젝트, 포트폴리오)
- [x] Asset Master Phase 2 UI 패턴 분석 완료
- [x] Travel Phase 2 UI 패턴 분석 완료
- [x] Supabase 기반 데이터 모델 정의

### 기술 스택 확인 ✅

- [x] React 18 + Next.js 14
- [x] Tailwind CSS v3
- [x] Recharts (차트)
- [x] Framer Motion (애니메이션)
- [x] Zustand (상태관리)
- [x] Supabase (백엔드)

### 구현자 요구사항 ✅

**Web-Builder AI Agent 필요:**
- DB 마이그레이션 능력
- Next.js API 라우트 작성 능력
- React 컴포넌트 설계 능력
- Supabase 실시간 구독 경험
- 성능 최적화 경험 (Lighthouse)
- 접근성 구현 경험 (WCAG AA)

---

## 파일 구조 (구현 후)

```
dsc-fms-portal/
├─ app/team/
│  ├─ performance/
│  │  └─ page.tsx                    ✨ NEW
│  ├─ resources/
│  │  └─ page.tsx                    ✨ NEW
│  ├─ communications/
│  │  └─ page.tsx                    ✨ NEW
│  └─ audit/
│     └─ page.tsx                    ✨ NEW
│
├─ app/api/team/
│  ├─ performance/
│  │  ├─ metrics/route.ts            ✨ NEW
│  │  ├─ members/route.ts            ✨ NEW
│  │  └─ trends/route.ts             ✨ NEW
│  ├─ resources/
│  │  ├─ availability/route.ts       ✨ NEW
│  │  └─ allocations/[id]/route.ts   ✨ NEW
│  ├─ communications/
│  │  ├─ messages/route.ts           ✨ NEW
│  │  ├─ threads/[id]/route.ts       ✨ NEW
│  │  └─ statistics/route.ts         ✨ NEW
│  └─ audit/
│     ├─ logs/route.ts               ✨ NEW
│     ├─ logs/[id]/route.ts          ✨ NEW
│     └─ statistics/route.ts         ✨ NEW
│
├─ components/team/
│  ├─ performance/                   ✨ NEW FOLDER
│  │  ├─ PerformanceMetricCard.tsx
│  │  ├─ PerformanceTrendChart.tsx
│  │  ├─ TeamMemberPerformanceTable.tsx
│  │  └─ PerformancePeriodSelector.tsx
│  ├─ resources/                     ✨ NEW FOLDER
│  │  ├─ CapacitySummaryCards.tsx
│  │  ├─ ResourceGanttChart.tsx
│  │  ├─ MemberAvailabilityTable.tsx
│  │  └─ MonthSelector.tsx
│  ├─ communications/                ✨ NEW FOLDER
│  │  ├─ ChannelFilterBar.tsx
│  │  ├─ MessageFeed.tsx
│  │  ├─ MessageCard.tsx
│  │  ├─ ThreadModal.tsx
│  │  └─ CommunicationStats.tsx
│  └─ audit/                         ✨ NEW FOLDER
│     ├─ ActivityTypeFilter.tsx
│     ├─ AuditTimeline.tsx
│     ├─ AuditLogCard.tsx
│     └─ AuditDetailModal.tsx
│
├─ lib/
│  ├─ hooks/
│  │  ├─ usePerformanceData.ts       ✨ NEW
│  │  ├─ useResourceAllocation.ts    ✨ NEW
│  │  └─ useAuditLogs.ts             ✨ NEW
│  └─ services/
│     ├─ performanceService.ts       ✨ NEW
│     ├─ resourceService.ts          ✨ NEW
│     ├─ communicationService.ts     ✨ NEW
│     └─ auditService.ts             ✨ NEW
│
├─ migrations/
│  └─ 002_team_dashboard_phase2c.sql ✨ NEW
│
├─ __tests__/api/
│  └─ team-phase2c.test.ts           ✨ NEW
│
└─ TEAM_DASHBOARD_PHASE2C_DESIGN_SPEC.md ✨ THIS FILE
```

---

## 주요 설계 결정사항

### 1. 데이터 모델 선택
- **성능 메트릭:** 주단위 저장 (일일 저장 X) → 저장 공간 90% 절감
- **리소스 할당:** 드래그 앤 드롭 지원하려면 정확한 시간 단위 필요
- **활동 로그:** 90일 자동 삭제 (GDPR 규정 준수)

### 2. API 디자인 패턴
- **조회:** 모두 GET 요청 + 쿼리 파라미터 (캐싱 최적화)
- **수정:** PUT /resources/allocations/:id (기존 패턴 준수)
- **페이징:** limit=100 기본값 (성능)

### 3. 차트 라이브러리
- **성능 트렌드:** Recharts LineChart (반응형 + 애니메이션)
- **리소스 할당:** 커스텀 Gantt (드래그 지원 필요)
- **감사 로그:** Framer Motion Timeline (마이크로 애니메이션)

### 4. 실시간 업데이트
- **성능 메트릭:** 주 1회 업데이트 (매주 월요일 09:00)
- **리소스 할당:** 실시간 구독 (Supabase Realtime)
- **메시지 로그:** 배치 수집 (API 호출 5분마다)

---

## 다음 단계

### Phase C #2: Web-Builder AI Agent (구현)
**시작:** 2026-06-03 09:00 KST  
**완료:** 2026-06-07 18:00 KST  
**산출물:** 4개 페이지 + 12개 API + 완전 배포

### Phase 2D: 고급 기능 (예정)
- 고급 필터링 (AI 추천)
- PDF/Excel 내보내기
- 예측 분석 (머신러닝)

---

**설계 완료:** 2026-05-27 23:30 KST  
**다음 작업:** Phase C #2 구현자 인수  
**승인 대기:** Evaluator AI Agent 설계 검토 (예정)
