# Memory Phase 2A — 설계 명세서 전달

**전달일:** 2026-06-20 KST  
**담당:** Web App Designer/Planner  
**대상:** Web Developer (Backend + Frontend)  
**상태:** ✅ Design Complete — Ready for Implementation  

---

## 📦 전달 산출물 (4개 문서)

### 1. **MEMORY_MESSAGE_COLLECTION_API_DESIGN_SPEC.md** (32 KB)

**내용:** API 설계의 모든 것

- ✅ 개요 및 목적 (메모리 지식베이스 수집의 핵심 인프라)
- ✅ 기능 명세 (8개 Requirement)
- ✅ 화면 구성 (4개 페이지: Dashboard, API Status, Queue, Logs)
- ✅ 사용자 흐름 (3가지 시나리오: 수동, Cron, 개발자)
- ✅ **API 명세 (8개 엔드포인트)**
  - GET /health
  - POST /api/collect-messages
  - POST /api/collect-memory
  - POST /api/batch-collect
  - POST /api/tag-messages (향후)
  - GET /api/search-by-tag (향후)
  - GET /api/status
  - POST /api/cron/trigger
- ✅ 데이터 스키마 (4가지: Message, MemoryFile, QueueItem, Postgres)
- ✅ 인증 방식 (Bearer Token)
- ✅ Rate Limiting (Token Bucket Algorithm)
- ✅ 의존성 및 통합 (Gateway, Phase 2B/2C, Supabase)
- ✅ 엣지 케이스 (8가지 처리 방안)
- ✅ 배포 체크리스트 (Pre/Deployment/Post)

**구현자 체크리스트:**
- [ ] 8개 엔드포인트 구현
- [ ] 데이터 포맷 정확히 따르기
- [ ] Rate limiting 추가
- [ ] 에러 응답 코드/메시지 정확히
- [ ] 재시도 로직 (3회, exponential backoff)

---

### 2. **MEMORY_ADMIN_DASHBOARD_DESIGN.md** (21 KB)

**내용:** Frontend UI/UX 설계

- ✅ 개요 및 원칙 (mobile-first, real-time, dark mode)
- ✅ 화면 구조 (4개 페이지)
- ✅ **Page 1: Messages Dashboard** (/admin/messages)
  - KPI Cards (4개: Total, Today, Success Rate, Last Collection)
  - Source Distribution 차트 (Pie chart)
  - Recent Collections 테이블 (소스, 시간, 수, 상태)
  - Action 버튼 (Collect Now, Batch, View Logs, Settings)
  
- ✅ **Page 2: API Status** (/admin/api-status)
  - Response Time 차트 (Line, 24h)
  - Endpoint Performance 테이블
  - Server Health 신호등
  
- ✅ **Page 3: Queue Management** (/admin/queue-management)
  - Queue Status 요약 (4개 상태)
  - Pending Items 테이블
  - Failed Items with Retry
  - Bulk Action 버튼
  
- ✅ **Page 4: Error Logs** (/admin/logs)
  - 날짜 범위 필터
  - 에러 타입별 집계
  - CSV 내보내기

- ✅ 컴포넌트 명세 (KPICard, StatusBadge, DataTable, Chart)
- ✅ 상태 관리 (Redux/Zustand 구조)
- ✅ API 연동 (초기 로드, 폴링, WebSocket)
- ✅ 모바일 반응형 (Desktop/Tablet/Mobile)
- ✅ 접근성 (WCAG 2.1 AA)
- ✅ 구현 로드맵 (4주)

**구현자 체크리스트:**
- [ ] 4개 페이지 레이아웃 구현
- [ ] 차트 라이브러리 선정 (Recharts/Chart.js)
- [ ] 실시간 폴링 구현 (30초)
- [ ] 필터링 & 정렬 추가
- [ ] 모바일 반응형 테스트
- [ ] 접근성 검사

---

### 3. **MEMORY_PHASE2A_QUICK_START.md** (12 KB)

**내용:** 개발자 Quick Reference

- ✅ 요구사항 요약 (P0/P1/P2)
- ✅ 시스템 아키텍처 (다이어그램)
- ✅ 데이터 흐름 (4단계)
- ✅ 설치 및 실행 (4단계)
- ✅ API 빠른 참고 (curl 예시)
- ✅ 테스트 방법 (단위, 통합, 성능)
- ✅ 모니터링 및 디버깅 (로그, 상태, 에러 처리)
- ✅ 보안 체크리스트 (6항목)
- ✅ 배포 방법 (로컬, Vercel, Docker)
- ✅ Cron 자동화 (스크립트 예시)
- ✅ 배포 전후 체크리스트
- ✅ FAQ (8가지 질문 및 답변)

**구현자 체크리스트:**
- [ ] 환경변수 설정 (.env)
- [ ] npm install 및 npm start
- [ ] curl로 모든 엔드포인트 테스트
- [ ] 에러 로그 확인
- [ ] Cron job 등록

---

### 4. **이 문서 (DELIVERY_SUMMARY.md)** (This file)

**내용:** 전체 설계 요약 및 구현 로드맵

---

## 🎯 핵심 요구사항 정리

### API Endpoints (최우선 구현)

| # | Endpoint | 메서드 | 용도 | 필수 | 상태 |
|---|----------|--------|------|------|------|
| 1 | `/health` | GET | 헬스 체크 | ✅ | 구현 필요 |
| 2 | `/api/collect-messages` | POST | Gateway 메시지 수집 | ✅ | 구현 필요 |
| 3 | `/api/collect-memory` | POST | 파일 기반 메모리 수집 | ✅ | 구현 필요 |
| 4 | `/api/batch-collect` | POST | 다중 소스 동시 수집 | ✅ | 구현 필요 |
| 5 | `/api/status` | GET | 통계 및 메트릭 | ⭐ | 권장 |
| 6 | `/api/cron/trigger` | POST | 수동 Cron 실행 | ⭐ | 권장 |
| 7 | `/api/tag-messages` | POST | 메시지 태깅 | ⭐ | 선택 (향후) |
| 8 | `/api/search-by-tag` | GET | 태그 검색 | ⭐ | 선택 (향후) |

---

## 📐 데이터 스키마 (최우선 정확성)

### Message Schema (핵심)

```typescript
{
  messageId: string;          // UUID
  timestamp: ISO8601;         // "2026-06-20T10:15:30.123Z"
  author: string;             // "user@example.com"
  role: "user" | "assistant";
  content: string;            // 메시지 본문 (최대 100KB)
  tokens: number;             // 추정 토큰
  source: "gateway" | "file" | "telegram" | ...
  toolCalls?: Array;          // Tool 호출 기록
  tags?: object;              // 메타데이터
  status?: "pending" | "deduped" | "scored" | "indexed"
}
```

### Queue Item Schema (중요)

```typescript
{
  queueId: string;            // 큐 항목 ID
  type: "message" | "memory";
  data: Message | MemoryFile;
  enqueuedAt: ISO8601;
  status: "pending" | "processing" | "completed" | "failed"
  retryCount: number;
  nextRetryTime?: ISO8601;
}
```

---

## 🔌 API 응답 형식 (Template)

### 성공 응답 (200 OK)

```json
{
  "success": true,
  "count": 50,
  "enqueued": 50,
  "messages": [
    {
      "messageId": "...",
      "timestamp": "...",
      ...
    }
  ],
  "collectedAt": "2026-06-20T10:30:45.123Z",
  "processingTime": 245
}
```

### 에러 응답 (400/401/403/500)

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "timestamp": "2026-06-20T10:30:45.123Z"
}
```

**중요:** 모든 응답에 `timestamp` 필드 포함 (서버 시간 검증용)

---

## 🛡️ 보안 요구사항

### 필수 구현

1. **Bearer Token 인증**
   ```
   Authorization: Bearer {GATEWAY_TOKEN}
   ```
   - 모든 엔드포인트 적용 (/health 제외 선택)

2. **경로 검증** (Directory Traversal 방지)
   ```javascript
   const resolvedPath = path.resolve(MEMORY_DIR, filePath);
   if (!resolvedPath.startsWith(MEMORY_DIR)) {
     return 403 Forbidden;
   }
   ```

3. **입력 검증**
   - `sessionKey` 길이 제한
   - `limit` 최대값 (1000)
   - `path` 상대 경로만 허용

4. **에러 메시지**
   - 민감정보(파일 경로, 토큰) 노출 금지
   - 상세 스택 트레이스는 서버 로그만

---

## 🔄 의존성 연쇄

```
현재 (Phase 2A) → Phase 2B (중복 제거) → Phase 2C (신뢰도) → Postgres
                    (6시간마다)        (매시간)         (선택)
```

- **Input:** 큐 파일 (`queue/message-*.json`)
- **Output:** 중복 표시 (`duplicateOf`), 신뢰도 점수 (`trustScore`)

---

## 📊 성능 목표

| 메트릭 | 목표 | 허용치 |
|--------|------|-------|
| 응답 시간 (평균) | <500ms | <2s |
| 응답 시간 (p95) | <1.5s | <3s |
| 가용성 | 99.5% | 99.0% |
| 에러율 | <0.5% | <1% |
| 처리량 | 1000 msg/min | 500 msg/min |

---

## 📅 구현 로드맵

### Week 1: Core APIs (Backend)

**일정:**
- Day 1-2: 환경 설정, 프로젝트 구조
- Day 3-4: 4개 핵심 엔드포인트 구현
  - `/health`
  - `/api/collect-messages`
  - `/api/collect-memory`
  - `/api/batch-collect`
- Day 5: 에러 처리, 재시도, 로깅

**완료 기준:**
- ✅ 모든 엔드포인트 curl로 테스트 성공
- ✅ 에러 응답 정확히 맞춤
- ✅ Rate limiting 구현
- ✅ 로그 로테이션 작동

---

### Week 2: Analytics & Dashboard (Frontend)

**일정:**
- Day 1-2: Admin Dashboard 기본 레이아웃
- Day 3-4: 4개 페이지 구현
  - Messages Dashboard
  - API Status
  - Queue Management
  - Error Logs
- Day 5: 실시간 폴링, 필터링

**완료 기준:**
- ✅ 4개 페이지 렌더링 성공
- ✅ API 연동 (GET /api/status 폴링)
- ✅ 모바일 반응형 테스트
- ✅ 접근성 검사 통과

---

### Week 3: 통합 및 배포

**일정:**
- Day 1-2: Backend + Frontend 통합 테스트
- Day 3-4: Cron job 등록 및 자동화
- Day 5: 프로덕션 배포 (Vercel)

**완료 기준:**
- ✅ E2E 테스트 성공
- ✅ 첫 Cron 실행 성공 (로그 확인)
- ✅ Admin dashboard 실시간 업데이트
- ✅ Telegram 알림 작동

---

### Week 4: 최적화 & 모니터링

**일정:**
- Day 1-2: 성능 최적화 (응답 시간, 메모리)
- Day 3-4: 모니터링 설정 (Sentry, Datadog)
- Day 5: 문서화 및 운영 가이드

**완료 기준:**
- ✅ 응답 시간 <500ms (평균)
- ✅ 메모리 사용 안정화
- ✅ 알림 시스템 작동
- ✅ 운영 매뉴얼 작성

---

## ✅ 구현자 체크리스트

### Pre-Implementation (설계 리뷰)

- [ ] 3개 설계 문서 정독 (API, Dashboard, Quick Start)
- [ ] 기존 구현 코드 검토 (`phase2a-message-collection.js`)
- [ ] 질문/피드백 웹 디자이너에게 전달
- [ ] 개발 환경 준비 (Node.js, npm, Git)

### Implementation (개발)

**Backend:**
- [ ] 프로젝트 구조 설정
- [ ] 4개 핵심 엔드포인트 구현
- [ ] 인증 미들웨어 추가
- [ ] Rate limiting 구현
- [ ] 에러 처리 + 로깅
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 성능 벤치마크

**Frontend:**
- [ ] React 프로젝트 생성
- [ ] 상태 관리 설정 (Redux/Zustand)
- [ ] 4개 페이지 컴포넌트 구현
- [ ] API 연동 (fetch/axios)
- [ ] 실시간 폴링 또는 WebSocket
- [ ] 차트 라이브러리 통합
- [ ] 모바일 반응형 테스트
- [ ] 접근성 검사

### Post-Implementation (배포)

- [ ] E2E 테스트 수행
- [ ] 보안 코드 리뷰
- [ ] 성능 프로파일링
- [ ] Cron job 등록
- [ ] 모니터링 대시보드 설정
- [ ] 프로덕션 배포
- [ ] 운영 가이드 작성

---

## 🤝 웹 디자이너와 개발자 간 커뮤니케이션

### 질문이 있을 때

**예시 1: API 응답 형식 불명확**
```
질문: "batch-collect 응답에서 errors 필드가 없으면 어떻게 하나?"
답변: 설계 명세 Page 104 "부분 실패 응답" 섹션 참고.
      continueOnError=true일 때만 errors 필드 포함.
```

**예시 2: 특정 엣지 케이스 처리**
```
질문: "10,000개 메시지 한 번에 수집하면?"
답변: 설계 명세 "Case 5: 메모리 부족" 섹션.
      청크 처리 + 클라이언트에게 pagination 권장.
```

### 변경이 필요할 때

1. **사소한 변경** (에러 코드, 필드명)
   - 웹 디자이너와 협의 후 설계 문서 업데이트
   - 구현자에게 변경사항 공지

2. **주요 변경** (엔드포인트 추가, 데이터 구조 변경)
   - 웹 디자이너와 함께 검토
   - 모든 관련 문서 업데이트
   - 다른 팀원 공지

3. **발견된 이슈** (성능 문제, 보안 위험)
   - 즉시 웹 디자이너에게 보고
   - 해결 방안 함께 수립
   - 설계 문서 업데이트

---

## 📞 지원 및 피드백

**웹 디자이너 (이 설계서 작성자):**
- 역할: 설계 문서 유지보수, 이슈 해결, 변경 관리
- 통신: Slack / GitHub Issues
- 응답 시간: 1시간 이내

**관련 문서:**
- Phase 2B 설계: 2026-06-22 준비 예정
- Phase 2C 설계: 2026-06-23 준비 예정
- Cron 설계: 완료됨 (CRON_DESIGN_SPEC.md)

---

## 📝 문서 버전 관리

**현재 버전:** 1.0  
**작성일:** 2026-06-20 11:50 KST  
**상태:** ✅ Final (구현 시작 가능)

**변경 기록:**
| 버전 | 날짜 | 변경사항 | 담당자 |
|------|------|--------|-------|
| 1.0 | 2026-06-20 | 초안 완성 (4 문서) | Web Designer |
| (향후) | - | 구현 중 변경사항 | TBD |

---

## 🚀 시작하기

**개발자는 여기서 시작하세요:**

1. **Quick Start 읽기** (12 KB, 5분)
   ```
   MEMORY_PHASE2A_QUICK_START.md
   ```

2. **API 설계서 정독** (32 KB, 20분)
   ```
   MEMORY_MESSAGE_COLLECTION_API_DESIGN_SPEC.md
   - 섹션 "API 명세" 중점 읽기
   - "엣지 케이스" 섹션 특히 주의
   ```

3. **Dashboard 설계 이해** (21 KB, 15분)
   ```
   MEMORY_ADMIN_DASHBOARD_DESIGN.md
   - 페이지 레이아웃 섹션 중심
   - 컴포넌트 명세 참고
   ```

4. **기존 구현 검토** (20분)
   ```
   memory-automation/phase2a-message-collection.js
   - 현재 기능 이해
   - 개선할 점 파악
   ```

5. **개발 시작!** 🎉
   ```bash
   cd memory-automation
   npm install
   # ... 설계 문서에 따라 구현
   ```

---

## 🎓 학습 자료

**관련 기술:**
- Node.js/Express API 개발
- File I/O 및 디렉토리 구조
- HTTP 에러 처리 및 재시도
- Rate limiting (Token Bucket)
- React 상태 관리
- 실시간 데이터 업데이트 (Polling/WebSocket)

**추천 리소스:**
- Express.js 공식 가이드
- React Hooks 패턴
- OAuth 2.0 Bearer Token (인증)

---

**이 문서는 설계 완료를 의미합니다.**
**구현 시작하실 수 있습니다!**

---

**문서 상태:** ✅ Ready for Development  
**최종 검수:** 2026-06-20 11:55 KST  
**담당:** Web App Designer / Platform Team
