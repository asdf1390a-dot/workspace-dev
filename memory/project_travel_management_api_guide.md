---
name: Travel Management API 상세 구현 가이드
description: API 개요, 인증/권한, 엔드포인트 명세, 에러 처리, 정산 알고리즘, 알림 시스템
type: project
relatedFiles: dsc-fms-portal/TRAVEL_MANAGEMENT_API_GUIDE.md
---

# Travel Management API — 상세 구현 가이드

**상태:** API 구현 명세 (웹개발자용)  
**작성일:** 2026-05-14  
**담당:** 플레너 (설계), 웹개발자 (구현)

## 1. API 개요

### 기본 정보
- **기본 URL:** `https://dsc-fms-portal.vercel.app/api`
- **인증:** Supabase JWT Token (Authorization: Bearer {token})
- **요청 형식:** JSON (Content-Type: application/json)
- **응답 형식:** JSON
- **타임존:** UTC (모든 시간은 UTC 저장, 클라이언트에서 지역화)

### Rate Limiting
| 엔드포인트 | 제한 | 기간 |
|-----------|------|------|
| GET 조회 | 100 | 1분 |
| POST 생성 | 50 | 1분 |
| PUT 수정 | 50 | 1분 |
| DELETE 삭제 | 20 | 1분 |

### 응답 형식

**성공 응답 (200, 201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "작업 완료"
}
```

**에러 응답 (4xx, 5xx):**
```json
{
  "success": false,
  "error": {
    "code": "TRAVEL_NOT_FOUND",
    "message": "여행을 찾을 수 없습니다.",
    "details": { ... }
  }
}
```

## 2. 인증 & 권한

### 인증 플로우
```
사용자 로그인 (Supabase Auth)
   ↓
JWT Token 발급 (localStorage 저장)
   ↓
API 요청 시 Authorization 헤더에 토큰 포함
   ↓
백엔드에서 토큰 검증 (Supabase 인증)
   ↓
RLS 정책으로 데이터 접근 제한
```

### 권한 모델

**Role 타입:**
- `organizer` — 여행 생성자, 모든 권한
- `companion` — 동반자, 제한된 권한
- `guest` — 게스트, 읽기만 가능

**권한 매트릭스:**

| 액션 | Organizer | Companion (RW) | Companion (RO) | Guest |
|------|-----------|-------|--------|-------|
| 여행 조회 | ✓ | ✓ | ✓ | ✓ |
| 여행 수정 | ✓ | ✓ | ✗ | ✗ |
| 여행 삭제 | ✓ | ✗ | ✗ | ✗ |
| 멤버 관리 | ✓ | ✗ | ✗ | ✗ |
| 이벤트 추가/수정 | ✓ | ✓ | ✗ | ✗ |
| 비용 등록 | ✓ | ✓ | ✓ (자신만) | ✗ |
| 체크리스트 수정 | ✓ | ✓ | ✗ | ✗ |
| 문서 업로드 | ✓ | ✓ | ✗ | ✗ |
| 알림 설정 | ✓ | ✓ | ✓ (자신만) | ✓ (자신만) |

### RLS 정책 (Supabase)

travels: 본인 또는 멤버인 여행만 조회/수정 가능
```sql
ALTER TABLE travels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or member travels"
  ON travels FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM travel_members
      WHERE travel_members.travel_id = travels.id
        AND travel_members.user_id = auth.uid()
    )
  );
```

## 3. 주요 Endpoint 예제

### Travel 관리 (4개)
- GET /api/travels — 사용자 여행 목록 조회
- POST /api/travels — 새 여행 생성
- GET /api/travels/[id] — 여행 상세 정보 + 관계 데이터
- PUT /api/travels/[id] — 여행 정보 수정
- DELETE /api/travels/[id] — 여행 삭제

### 멤버 관리 (2개)
- POST /api/travels/[id]/members — 멤버 추가
- DELETE /api/travels/[id]/members/[user_id] — 멤버 제거

### 이벤트 관리
- POST /api/travels/[id]/events — 일정 추가
- PUT /api/travels/[id]/events/[event_id] — 일정 수정
- DELETE /api/travels/[id]/events/[event_id] — 일정 삭제

### 비용 관리
- POST /api/travels/[id]/costs — 비용 추가
- PUT /api/travels/[id]/costs/[cost_id] — 비용 수정
- DELETE /api/travels/[id]/costs/[cost_id] — 비용 삭제
- GET /api/travels/[id]/cost-split — 비용 분담 계산

### 체크리스트
- POST /api/travels/[id/checklists — 체크리스트 항목 추가
- PUT /api/travels/[id]/checklists/[item_id] — 체크리스트 수정
- DELETE /api/travels/[id]/checklists/[item_id] — 체크리스트 삭제

## 상태
🟡 설계 완료 → 웹개발자 구현 대기
