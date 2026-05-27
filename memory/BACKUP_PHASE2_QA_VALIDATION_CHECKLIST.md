---
name: Backup Phase 2 QA 검증 체크리스트
description: 16개 API + 4개 UI 화면 + 성능 + 보안 검증 (Day 2-5, 2026-05-28~31)
type: project
evaluation_required: true
---

# Backup Phase 2 QA 검증 체크리스트

**평가자:** Evaluator #2  
**기간:** 2026-05-28 ~ 2026-05-31 (Day 2-5)  
**목표:** 26개 테스트 완료 (API 16 + UI 4 + 성능/보안 6)  
**상태:** 🟡 Day 1 온보딩 진행 중

---

## 📊 검증 범위 (26개 테스트)

### Part 1: API 검증 (16개)

#### 1.1 Schedule API (3개)
- [ ] **POST /api/backup/schedule/configure** — 백업 정책 설정
  - ✅ 인증 검증 (Bearer token)
  - ✅ 필수 필드: enabled, time, interval, retention_days
  - ✅ 응답 포맷: { success: true, policy: {...} }
  - ✅ 에러: 401 Unauthorized, 400 Invalid input
  
- [ ] **POST /api/backup/schedule/trigger** — 수동 백업 트리거
  - ✅ 인증 검증
  - ✅ 트리거 직후 백업 생성 확인
  - ✅ 응답: { success: true, execution_id: "..." }
  
- [ ] **POST /api/backup/schedule/daily** — Cron 트리거
  - ✅ Internal-only 검증 (외부 접근 차단)
  - ✅ Cron 타이밍 정확성 (±1분 오차 허용)
  - ✅ 실패 시 재시도 로직

#### 1.2 Quota API (2개)
- [ ] **GET /api/backup/quota/status** — 할당량 상태 조회
  - ✅ 사용자별 할당량 조회
  - ✅ 응답: { used_gb: X, total_gb: Y, percent: Z }
  - ✅ 조직별 격리 검증

- [ ] **PUT /api/backup/quota/update** — 할당량 변경
  - ✅ 최소값 1GB, 최대값 제한 검증
  - ✅ 변경 이력 로깅
  - ✅ 제한 초과 시 경고

#### 1.3 Metrics API (3개)
- [ ] **GET /api/backup/metrics/summary** — 메트릭 요약
  - ✅ 총 백업 수, 성공률, 평균 크기
  - ✅ 응답 시간 <200ms
  - ✅ 데이터 정확성 (DB 조회 검증)

- [ ] **GET /api/backup/metrics/daily** — 일일 메트릭 이력
  - ✅ 일자별 백업 수, 저장소 사용량 추이
  - ✅ 페이징 (limit/offset)
  - ✅ 성능: 1000일 데이터 조회 <200ms

- [ ] **POST /api/backup/metrics/update-usage** — 사용량 갱신 (Cron)
  - ✅ 정확한 저장소 용량 계산
  - ✅ 중복 실행 방지 (idempotent)

#### 1.4 Cleanup API (2개)
- [ ] **POST /api/backup/cleanup/daily** — 자동 정리 (Cron)
  - ✅ 만료된 백업 자동 삭제
  - ✅ retention_days 정책 준수
  - ✅ 삭제 이력 로깅

- [ ] **POST /api/backup/cleanup/manual** — 수동 정리
  - ✅ 선택적 백업 삭제
  - ✅ 확인 메시지 (실수 방지)
  - ✅ 권한 검증 (관리자만)

#### 1.5 Notifications API (2개)
- [ ] **GET /api/backup/notifications/list** — 알림 목록 조회
  - ✅ 읽음/안 읽음 필터
  - ✅ 시간순 정렬
  - ✅ 페이징

- [ ] **PUT /api/backup/notifications/[id]/read** — 알림 읽음 표시
  - ✅ 해당 알림만 수정
  - ✅ 조직별 격리 (타사용자 알림 수정 차단)

#### 1.6 Audit API (2개) ⭐ Evaluator 전용
- [ ] **POST /api/backup/audit/validate/api-response-time** — API 응답 시간 테스트
  - ✅ 모든 API <200ms 응답 검증
  - ✅ 부하 테스트 (100 concurrent 요청)
  
- [ ] **POST /api/backup/audit/validate/restore-test** — 복구 테스트
  - ✅ 백업 → 복구 → 데이터 무결성 확인

#### 1.7 User API (2개)
- [ ] **POST /api/backup/user/telegram/connect** — Telegram 계정 연결
  - ✅ 유효한 Telegram ID 검증
  - ✅ 중복 연결 방지
  - ✅ 알림 전송 테스트

- [ ] **POST /api/backup/user/telegram/disconnect** — Telegram 계정 해제
  - ✅ 연결 해제 후 알림 수신 안 됨 확인

---

### Part 2: UI 검증 (4개 화면)

#### 2.1 AutoBackupSettings (백업 설정)
- [ ] **정상 경로 (Happy Path)**
  - ✅ 백업 ON/OFF 토글
  - ✅ 시간 선택 (02:00 등)
  - ✅ 보관 정책 선택 (Basic/Standard/Premium)
  - ✅ 저장 버튼 → 설정 저장 확인
  
- [ ] **예외 경로 (Error Path)**
  - ✅ 잘못된 시간 입력 (25:00, -1:00)
  - ✅ 필수 필드 누락
  - ✅ 저장 실패 시 에러 메시지

- [ ] **반응형 (Responsive)**
  - ✅ Desktop (1920px): 레이아웃 정상
  - ✅ Tablet (768px): 한 열 레이아웃
  - ✅ Mobile (320px): 터치 최적화

- [ ] **접근성 (WCAG AA)**
  - ✅ 색상 대비 4.5:1 이상
  - ✅ 포커스 상태 명확
  - ✅ 아이콘 + 텍스트 라벨

#### 2.2 StorageManagement (저장소 관리)
- [ ] **저장소 사용률 표시**
  - ✅ 프로그레스 바 색상 (녹색 0-70%, 주황 70-85%, 빨강 85-100%)
  - ✅ 사용량 텍스트 (X.XX GB / Y.YY GB)
  
- [ ] **할당량 변경 모달**
  - ✅ 모달 열기/닫기
  - ✅ 새 값 입력 (1-100 GB)
  - ✅ 유효성 검사 (최소 1GB)
  - ✅ 변경 저장 확인

- [ ] **성능**
  - ✅ 초기 로딩 <1.5초
  - ✅ 상호작용 응답 <200ms

#### 2.3 BackupMetrics (메트릭 대시보드)
- [ ] **차트 렌더링**
  - ✅ 라인 차트 (저장소 추이)
  - ✅ 바 차트 (일일 백업 수)
  - ✅ 데이터 정확성
  
- [ ] **필터링**
  - ✅ 1주/1개월/3개월/전체 선택
  - ✅ 필터 변경 시 차트 업데이트
  
- [ ] **범례 상호작용**
  - ✅ 범례 클릭 → 해당 시리즈 토글
  - ✅ 호버 → 데이터 툴팁

#### 2.4 NotificationSettings (알림 설정)
- [ ] **알림 채널 토글**
  - ✅ 이메일 ON/OFF
  - ✅ Telegram ON/OFF
  - ✅ 인앱 알림 ON/OFF
  
- [ ] **알림 빈도 설정**
  - ✅ 모든 이벤트 / 중요 이벤트만 / 일일 요약 / 비활성화
  - ✅ 설정 저장 확인

- [ ] **테스트 알림 발송**
  - ✅ "테스트 발송" 버튼 → 알림 수신 확인
  - ✅ 성공/실패 메시지

---

### Part 3: 성능 검증 (3개)

- [ ] **API 응답 시간**
  - ✅ 모든 API <200ms (cold start 포함)
  - ✅ 부하 테스트 (100 concurrent 요청)
  - ✅ N+1 쿼리 제거 확인

- [ ] **페이지 로딩 성능**
  - ✅ 초기 로딩 <1.5초 (3G 네트워크 기준)
  - ✅ 이미지 최적화 (WebP, 압축)
  - ✅ 번들 크기 <500KB

- [ ] **데이터베이스 성능**
  - ✅ 1000+ 백업 데이터 조회 <200ms
  - ✅ 인덱스 사용 확인 (EXPLAIN ANALYZE)
  - ✅ 트랜잭션 무결성

---

### Part 4: 보안 검증 (3개)

- [ ] **SQL Injection 방지**
  - ✅ 특수문자 ('", --, ;) 안전 처리
  - ✅ 매개변수화된 쿼리 사용 확인

- [ ] **XSS 방지**
  - ✅ 사용자 입력 이스케이프 (<script>, <img src="x" onerror>)
  - ✅ DOM XSS 없음 (textContent vs innerHTML)

- [ ] **CORS 정책**
  - ✅ 허용된 origin 확인
  - ✅ Credentials 전송 안전성
  - ✅ 프리플라이트 요청 처리

---

## 🔧 검증 환경

### 테스트 데이터
- **테스트 계정:** evaluator+test@example.com
- **테스트 조직:** DSC Mannur Test
- **Supabase:** RLS 정책 확인 (조직별 격리)

### 테스트 도구
- **API 테스트:** Postman / curl + Jest
- **UI 테스트:** 로컬 dev server (npm run dev) + 브라우저
- **성능 측정:** DevTools / Lighthouse / k6
- **보안 테스트:** OWASP ZAP / Manual review

---

## 📅 일정 (Day 2-5)

### Day 2 (2026-05-28) — API 검증 1-8개
- 09:00 ~ 12:00: Schedule/Quota API (5개)
- 13:00 ~ 18:00: Metrics/Cleanup API (5개)
- 18:00 보고

### Day 3 (2026-05-29) — API 검증 9-16개
- 09:00 ~ 12:00: Notifications/Audit API (4개)
- 13:00 ~ 18:00: User API (2개) + 성능 (3개)
- 18:00 보고

### Day 4 (2026-05-30) — UI 검증 1-2개
- 09:00 ~ 12:00: AutoBackupSettings UI
- 13:00 ~ 18:00: StorageManagement UI
- 18:00 보고

### Day 5 (2026-05-31) — UI 검증 3-4개 + 보안
- 09:00 ~ 12:00: BackupMetrics + NotificationSettings UI (2개)
- 13:00 ~ 18:00: 보안 검증 (3개) + 최종 리뷰
- 18:00 최종 보고

---

## ✅ 검증 완료 기준

**🟢 완료 = 모든 26개 테스트 PASS + 증거 (스크린샷/로그/git commit)**

각 테스트마다:
- ✅ 테스트 항목 기술
- ✅ 예상 결과
- ✅ 실제 결과
- ✅ PASS / FAIL
- ✅ 증거 (스크린샷 / 로그 / curl 명령)

**❌ FAIL 항목:**
- 원인 분석
- 재현 단계
- 개선 제안

---

## 📞 연락처

**Evaluator #1 (멘토):** QA 기준 설명, 테스트 케이스 리뷰  
**비서 (Secretary):** 환경 설정, 테스트 데이터 제공  

**블로킹 (1시간 이상):**
- 즉시 비서 보고
- Slack #일반채널 또는 Telegram 메시지

---

**작성:** Evaluator #2 (신규)  
**시작:** 2026-05-27 14:30 KST  
**상태:** 🟡 Day 1 온보딩 진행 중

