---
name: Discord Bot Phase 1 상세 테스트 계획
description: 양방향 동기화 메시지 시스템 테스트 43개 케이스
type: qa-testplan
owner: QA Specialist
date: 2026-05-29
---

# Discord Bot Phase 1 테스트 계획

**프로젝트:** Discord Bot Phase 1 (양방향 동기화)  
**기한:** 2026-05-31 18:00 KST  
**핵심 위험:** Telegram ↔ Discord 메시지 손실, 중복 전송  

---

## 1. Unit Tests (20개)

### 1.1 Message Mapper (5개)
- [ ] 텔레그램 메시지 → Discord 포맷 변환 (기본)
- [ ] Discord 메시지 → 텔레그램 포맷 변환 (기본)
- [ ] 특수문자 + 이모지 처리
- [ ] 매우 긴 메시지 (>2000자) 분할
- [ ] null/undefined 메시지 핸들링

### 1.2 User Sync (3개)
- [ ] Telegram UID → Discord UID 매핑 생성
- [ ] Discord 사용자 캐시 업데이트
- [ ] 알 수 없는 사용자 처리

### 1.3 Processors (5개) — 각 Processor 1개씩
- [ ] SecretaryProcessor: 명령어 파싱 (예: /task)
- [ ] TranslatorProcessor: 번역 API 호출 모킹
- [ ] AnalystProcessor: 데이터 집계 로직
- [ ] DeveloperProcessor: 코드 리뷰 요청 처리
- [ ] DefaultProcessor: 일반 메시지 라우팅

### 1.4 Error Handling (4개)
- [ ] API 오류 시 재시도 로직
- [ ] 타임아웃 처리 (5초)
- [ ] 인증 실패 (invalid token)
- [ ] 네트워크 끊김 모의

### 1.5 Logging (3개)
- [ ] 메시지 전송 로그 저장
- [ ] 에러 로그 기록
- [ ] 성능 메트릭 수집

---

## 2. Integration Tests (15개)

### 2.1 Discord API (5개)
- [ ] Discord Bot 연결 (WebSocket)
- [ ] 메시지 전송 (text-only)
- [ ] 이미지 첨부 전송
- [ ] 반응(Reaction) 수신
- [ ] 채널 권한 검증

### 2.2 Telegram API (3개)
- [ ] Telegram Bot 연결 (longpoll)
- [ ] 메시지 수신 (text + 파일)
- [ ] 사용자 정보 조회

### 2.3 Database Integration (4개)
- [ ] 메시지 이력 저장 (user_id, timestamp, platform)
- [ ] 중복 감지 (같은 메시지 2회 저장 방지)
- [ ] 사용자 프로필 저장
- [ ] 에러 로그 저장

### 2.4 Sync Logic (3개)
- [ ] Telegram 메시지 → Discord 즉시 전송
- [ ] Discord 메시지 → Telegram 즉시 전송
- [ ] 동시 메시지 처리 (순서 보장)

---

## 3. E2E Tests (8개) — 3회 반복

### 3.1 Happy Path (3회 반복)
**Iteration 1: 정상 경로**
- [ ] 1회차: Telegram에서 메시지 입력 → Discord 수신 확인
- [ ] 1회차: Discord에서 반응 → Telegram 표시 확인
- [ ] 1회차: 스크린샷 + 타임스탬프 기록

**Iteration 2: 다른 사용자 + 시간대**
- [ ] 2회차: 다른 사용자로 Telegram 메시지 → Discord 동기화
- [ ] 2회차: 사용자 프로필 정보 일치 확인
- [ ] 2회차: 메시지 순서 유지 확인

**Iteration 3: 반복 검증**
- [ ] 3회차: 같은 시나리오 재실행
- [ ] 3회차: 중복 메시지 없음 확인
- [ ] 3회차: 최종 승인 기록

### 3.2 Image Attachment (1회)
- [ ] Telegram PNG 이미지 → Discord 전송
- [ ] 파일 크기 검증 (<5MB)
- [ ] 이미지 표시 확인

### 3.3 Permission Denied (1회)
- [ ] 권한 없는 사용자 메시지 거부
- [ ] 에러 메시지 전달
- [ ] 로그 기록 확인

### 3.4 Network Recovery (1회)
- [ ] 인터넷 끊김 모의 → 재연결 시 메시지 복구
- [ ] 큐 대기 메시지 확인
- [ ] 순서 유지 검증

### 3.5 Load Test (1회)
- [ ] 10명 동시 메시지 전송
- [ ] 응답시간 ≤500ms 확인
- [ ] 메시지 손실 0개 확인

---

## 4. 성능 & 접근성

### 4.1 성능
- [ ] 메시지 지연시간: ≤500ms (Telegram → Discord)
- [ ] 메시지 지연시간: ≤500ms (Discord → Telegram)
- [ ] 메모리 사용량: <100MB (안정 상태)

### 4.2 접근성
- [ ] 스크린 리더 지원 (Discord 기본값)
- [ ] 명령어 도움말 텍스트 제공
- [ ] 이모지 대체 텍스트 (ARIA label)

---

## 5. 테스트 환경 & 도구

### 5.1 환경 설정
- **Discord Test Server:** 테스트용 Discord 서버 (비공개)
- **Telegram Test Bot:** 테스트용 Telegram 봇 계정
- **Test Database:** Supabase 테스트 DB (별도)
- **Mock API:** Telegram/Discord API 모킹 (Unit 전용)

### 5.2 테스트 도구
- **Jest:** Unit 테스트
- **supertest:** API 통합 테스트
- **Discord.js:** Discord 클라이언트
- **Telethon:** Telegram 클라이언트 (E2E 자동화)

---

## 6. 실패 기준 (No-Go)

| 항목 | 임계값 |
|------|--------|
| Unit Test Pass Rate | <95% |
| Integration Test Pass Rate | <90% |
| E2E 3회 반복 통과 | 모두 통과 필수 |
| 메시지 중복 | 0개 초과 시 fail |
| 메시지 손실 | 1개 초과 시 fail |
| 응답시간 | >1000ms = fail |

---

## 7. 서명 및 승인

- **테스트 작성:** QA Specialist (2026-05-29)
- **개발팀 검토:** Web-Builder (예정)
- **최종 승인:** Evaluator (2026-05-31 18:00)

**상태:** 🟡 진행 예정 (2026-05-29 09:00)
