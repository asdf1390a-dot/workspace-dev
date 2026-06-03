---
name: Phase 2A Gateway Integration Issue
description: Phase 2A message collection cron blocked by Gateway 404 error
type: project
---

# Phase 2A Gateway Integration Issue (2026-05-28)

## 문제
**표현:** Phase 2A `/api/collect-messages` 엔드포인트가 "Gateway returned 404"로 메시지 수집 실패

**근본 원인:** Phase 2A 서버는 정상 작동하지만, underlying message collection service (Telegram, Discord, GitHub)에 도달하지 못함

## 증상
```json
{
  "error": "Gateway returned 404",
  "code": "COLLECTION_FAILED",
  "timestamp": "2026-05-28T09:21:46.472Z"
}
```

## 조사 결과
- ✅ `/health` 엔드포인트: OK (서비스 실행 중)
- ✅ Service network: OK (localhost:3009 응답)
- ❌ `/api/collect-messages`: FAIL (Gateway 404)

## 가능한 원인
1. **라우팅 미등록:** Gateway에 message collection API 라우트가 정의되지 않음
2. **인증 토큰 누락:** GATEWAY_TOKEN이 설정되지 않았거나 유효하지 않음
3. **경로 설정 오류:** Phase 2A 서버의 GATEWAY_URL이 잘못 구성됨
4. **메시지 소스 불가:** Telegram/Discord/GitHub API 접근 불가능

## 영향도
- **Phase 2A 설계:** ✅ 완료됨 (영향 X)
- **Phase 2A API:** ✅ 구현됨 (영향 X)
- **Phase 2A Cron:** 🔴 작동 불가 (메시지 수집 불가)
- **Phase 2B:** 🟡 부분 블로킹 (설계 진행 가능, 실제 메시지 입력 불가)

## 해결 우선순위
- **P0:** Gateway 라우팅 설정 확인 (Phase 2B/2C 진행 차단)
- **P1:** Phase 2A 서버 환경변수 검증
- **P2:** Message source API 접근성 테스트 (Telegram, Discord, GitHub)

## 담당자
- 비서: CTB 추적 + 상태 보고
- DevOps Engineer (#12): 인프라/Gateway 조사 (배치 예정: 2026-05-28)
- Automation-Specialist #2: Phase 2B 진행 (메시지 수집 모의데이터로 대체)

---
**업데이트:** 2026-05-28 18:21 KST — Phase 2A cron 수동 실행 실패 감지
