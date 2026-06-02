# Team Dashboard P1 API — 16개 엔드포인트 명세

**상태:** ✅ 구현 완료 (2026-06-02 자율 시행)
**배포 위치:** `/app/api/dashboard/`

---

## 1️⃣ 팀 조직 (Team Organization) — 5개 엔드포인트

### 1.1 조직 구조 조회
```
GET /api/dashboard/team-org/structure
```
- **설명:** 부서별로 그룹화된 조직 구조
- **응답:** `{ data: { [부서명]: [멤버목록] }, count: 정원수 }`
- **권한:** 공개

### 1.2 계층 구조 조회
```
GET /api/dashboard/team-org/hierarchy
```
- **설명:** 상사-부하 관계가 포함된 계층 구조
- **응답:** `{ data: [hierarchy_tree], count: 정원수 }`
- **권한:** 공개

### 1.3 멤버 조회
```
GET /api/dashboard/team-org/members
?department=기술&role=엔지니어&limit=50&offset=0
```
- **설명:** 필터링 가능한 멤버 목록
- **파라미터:** department, role, limit (기본50), offset
- **응답:** `{ data: [멤버], count, limit, offset }`
- **권한:** 공개

### 1.4 부서 목록
```
GET /api/dashboard/team-org/departments
```
- **설명:** 전체 부서 및 인원 수
- **응답:** `{ data: [{ name: 부서, count: 인원 }], count }`
- **권한:** 공개

### 1.5 조직 정보 업데이트
```
POST /api/dashboard/team-org/update
```
- **설명:** 멤버 역할/부서/상사 변경
- **본문:**
  ```json
  {
    "member_id": "uuid",
    "role": "역할",
    "department": "부서",
    "manager_id": "상사uuid"
  }
  ```
- **권한:** 인증 필수

---

## 2️⃣ 포트폴리오 (Portfolio) — 6개 엔드포인트

### 2.1 포트폴리오 아이템 목록
```
GET /api/dashboard/portfolio/items
?member_id=uuid&status=completed&limit=50&offset=0
```
- **설명:** 포트폴리오 항목 목록
- **파라미터:** member_id, status (draft|in_progress|completed), limit, offset
- **응답:** `{ data: [항목], count, limit, offset }`
- **권한:** 공개

### 2.2 포트폴리오 아이템 생성
```
POST /api/dashboard/portfolio/items
```
- **본문:**
  ```json
  {
    "title": "프로젝트명",
    "description": "설명",
    "member_id": "uuid",
    "status": "draft|in_progress|completed",
    "skills_used": ["Python", "React"],
    "impact": "프로젝트 영향도"
  }
  ```
- **응답:** `{ data: 생성된항목 }`
- **권한:** 인증 필수

### 2.3 포트폴리오 아이템 조회
```
GET /api/dashboard/portfolio/items/[id]
```
- **설명:** 특정 포트폴리오 항목 상세
- **응답:** `{ data: 항목상세 }`
- **권한:** 공개

### 2.4 포트폴리오 아이템 수정
```
PUT /api/dashboard/portfolio/items/[id]
```
- **본문:** (모두 선택사항)
  ```json
  {
    "title": "수정제목",
    "status": "completed",
    "skills_used": ["Rust"],
    "impact": "수정된영향도"
  }
  ```
- **권한:** 인증 필수

### 2.5 포트폴리오 아이템 삭제
```
DELETE /api/dashboard/portfolio/items/[id]
```
- **권한:** 인증 필수

### 2.6 포트폴리오 할당 관리
```
GET|POST /api/dashboard/portfolio/assignments
?member_id=uuid&portfolio_id=uuid&limit=50
```
- **GET 응답:** `{ data: [할당], count, limit, offset }`
- **POST 본문:**
  ```json
  {
    "member_id": "uuid",
    "portfolio_id": "uuid",
    "role": "lead|contributor|reviewer",
    "start_date": "2026-06-02",
    "end_date": "2026-12-31"
  }
  ```
- **권한:** 인증 필수 (POST)

---

## 3️⃣ 활동 로그 (Activity Log) — 3개 엔드포인트

### 3.1 활동 로그 조회
```
GET /api/dashboard/activity
?action_type=created&limit=100&offset=0
```
- **설명:** 전체 활동 로그
- **파라미터:** action_type, limit, offset
- **응답:** `{ data: [활동], count, limit, offset }`
- **권한:** 공개

### 3.2 활동 로그 생성
```
POST /api/dashboard/activity
```
- **본문:**
  ```json
  {
    "member_id": "uuid",
    "action_type": "created|updated|completed|commented|joined|left",
    "subject": "작업제목",
    "description": "상세설명",
    "metadata": { "커스텀": "데이터" }
  }
  ```
- **권한:** 인증 필수

### 3.3 멤버별 활동 로그
```
GET /api/dashboard/activity/member/[id]
?limit=50&offset=0
```
- **설명:** 특정 멤버의 활동 기록
- **응답:** `{ data: [활동], count, limit, offset }`
- **권한:** 공개

---

## 4️⃣ 대시보드 요약 — 1개 엔드포인트

### 4.1 대시보드 통계
```
GET /api/dashboard/summary
```
- **설명:** 전체 대시보드 통계 및 요약
- **응답:**
  ```json
  {
    "data": {
      "members": {
        "total": 15,
        "byDepartment": { "기술": 5, "생산": 7 }
      },
      "portfolio": {
        "total": 42,
        "byStatus": { "draft": 5, "in_progress": 20, "completed": 17 }
      },
      "assignments": {
        "total": 56,
        "byRole": { "lead": 15, "contributor": 35, "reviewer": 6 }
      },
      "recentActivity": {
        "total": 100,
        "byType": { "created": 30, "updated": 45 }
      }
    }
  }
  ```
- **권한:** 공개

---

## 🔐 인증 정책

| 엔드포인트 | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| team-org | ✅ | 🔒 | 🔒 | - |
| portfolio/items | ✅ | 🔒 | 🔒 | 🔒 |
| portfolio/assignments | ✅ | 🔒 | - | - |
| activity | ✅ | 🔒 | - | - |
| activity/member | ✅ | - | - | - |
| summary | ✅ | - | - | - |

**범례:** ✅ 공개, 🔒 인증 필수 (Bearer Token)

---

## 📋 공통 응답 형식

### 성공 응답 (200/201)
```json
{
  "data": {...} | [{...}],
  "count": 숫자,
  "limit": 숫자,
  "offset": 숫자
}
```

### 오류 응답 (400/401/404/500)
```json
{
  "error": "오류메시지",
  "code": "optional_error_code",
  "details": [...]
}
```

---

## 🚀 배포 체크리스트

- [x] 16개 엔드포인트 구현 완료
- [x] Zod 검증 스키마 적용
- [x] JWT 인증 미들웨어 구현
- [x] Supabase 쿼리 최적화 (count: 'exact')
- [ ] 통합테스트 (2026-06-02 18:00 예정)
- [ ] Vercel 배포 (2026-06-02 완료 후)

---

**마지막 수정:** 2026-06-02 14:58 KST
**담당자:** 비서 (자율 시행)
**다음 단계:** Vercel 배포 + 통합테스트 (BM-P1 Phase 2 일정)
