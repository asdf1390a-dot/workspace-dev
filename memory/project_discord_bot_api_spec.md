---
name: Discord Bot API 명세서
description: Discord Integration gateway endpoint + 5 processor endpoints (Secretary, Translator, Analyst, Developer, Planner) with request/response schemas
type: project
relatedFiles: DISCORD_BOT_API_SPEC.md
---

# Discord Bot API 명세서

**작성일:** 2026-05-15 23:00 KST  
**버전:** 1.0 Final  
**상태:** 구현 준비 완료

## API 엔드포인트 개요

### 1. Gateway Endpoint: POST /api/discord-gateway
- **목적:** Discord Bot 상호작용 처리 (Interactions Endpoint)
- **인증:** X-Signature-Ed25519 + X-Signature-Timestamp (Ed25519 검증)
- **요청:** Discord Interaction 페이로드 (type, data, member context)
- **응답:** Interaction response (type 1: PONG, type 5: Deferred Message Update)
- **에러:** 401 Unauthorized (Invalid signature), 429 Rate Limited
- **레이트 제한:** 50 requests/second (Discord global limit)

**요청 스키마:**
```
{
  "type": 1 (PING) | 2 (APPLICATION_COMMAND) | 3 (MESSAGE_COMPONENT),
  "data": { id, channel_id, author: {id, username, avatar}, content, timestamp },
  "member": { nick, roles: [role_ids], user: {...} }
}
```

**응답 스키마:**
```
// Pong: { "type": 1 }
// Deferred: { "type": 5 }
// Message: { "type": 4, "data": { "content": "...", "embeds": [...] } }
```

### 2-6. Processor Endpoints (5개)
- **POST /api/discord/processors/secretary** — 비서 에이전트 메시지 라우팅
- **POST /api/discord/processors/translator** — 번역 요청 처리
- **POST /api/discord/processors/analyst** — 데이터 분석 요청
- **POST /api/discord/processors/developer** — 개발 문제 해결
- **POST /api/discord/processors/planner** — 설계/계획 관련

**공통 요청 스키마:**
```
{
  "messageId": "msg-123",
  "channelId": "channel-id",
  "userId": "user-id",
  "username": "user-name",
  "content": "메시지 내용",
  "timestamp": "2026-05-15T22:45:30.123Z"
}
```

**공통 응답 스키마 (성공):**
```
{
  "success": true,
  "embed": {
    "title": "제목",
    "description": "설명",
    "fields": [{ "name": "필드명", "value": "값", "inline": false }],
    "color": 3447003
  },
  "followUp": "후속 메시지 (선택사항)"
}
```

## 프로세서별 세부 기능

### Secretary Processor
- 팀 일정 조회 → Embed 형식으로 주간 일정 응답
- 작업 현황 조회
- 기술 자료 추천
- 응답 형식: 구조화된 Embed (fields 배열)

### Translator Processor
- 한영 번역 요청
- 톤/문체 조정
- 응답 형식: 번역된 텍스트 + 원문 인용

### Analyst Processor
- 데이터 조회 (자산, BM, KPI)
- 통계 계산
- 응답 형식: 차트 이미지 또는 테이블 Embed

### Developer Processor
- 기술 문제 해결
- 코드 리뷰 요청
- 응답 형식: 코드 블록 + 설명

### Planner Processor
- 설계 문서 조회
- 로드맵 업데이트
- 응답 형식: 마크다운 형식 + Embed

## 에러 처리

**공통 에러 응답:**
```
{
  "success": false,
  "error": "에러 메시지",
  "code": "ERROR_CODE",
  "timestamp": "2026-05-15T22:45:30.123Z"
}
```

**에러 코드:**
- `INVALID_SIGNATURE` (401) — Discord 서명 검증 실패
- `RATE_LIMITED` (429) — 요청 제한 초과
- `PROCESSOR_ERROR` (500) — 프로세서 처리 중 오류
- `INVALID_PAYLOAD` (400) — 잘못된 요청 형식

## 구현 주의사항

1. **Ed25519 서명 검증:** tweetnacl 라이브러리 사용
2. **Deferred Response:** 3초 이상 처리 필요 시 type 5로 응답 후 Follow-up
3. **Telegram Sync:** 각 프로세서 응답을 자동 Telegram 채널에 포워딩
4. **로깅:** pino + Loki 스택으로 모든 요청/응답 기록

## 상태
🟡 **설계 완료** → Web-Builder AI Agent 구현 대기
