# Discord Bot Phase 1 — Implementation Complete

## 📋 구현 현황

### ✅ 완료된 구성요소

#### 1. 데이터베이스 스키마 (db/31_discord_bot_phase1.sql)
- **discord_sync_log**: Telegram↔Discord 메시지 매핑 (Telegram 방향/Discord 방향)
- **discord_messages**: 처리된 메시지 저장 (intent, response embed, 오류 추적)
- **task_queue**: Discord 유저당 1개 작업 (할당, 우선순위, 상태)
- **discord_notifications**: 동기화 이벤트 로깅 (성공/실패, 오류, 레이트 제한)

**특징:**
- Row Level Security (RLS) 활성화 (서비스 역할 접근)
- 성능 최적화 인덱스 (channel_id, user_id, status, timestamps)
- JSONB 메타데이터 필드 (확장성)

---

#### 2. TypeScript 타입 정의 (lib/discord/types.ts)
```typescript
// 주요 인터페이스
- DiscordInteraction: Discord 웹훅 요청
- DiscordMember: 서버 멤버 정보
- DiscordUser: 사용자 정보
- DiscordEmbed: 리스판 임베드
- ProcessorRequest: 프로세서 입력
- ProcessorResponse: 프로세서 출력
- InteractionType: PING, APPLICATION_COMMAND 등 (enum)
- ResponseType: PONG, DEFERRED_MESSAGE 등 (enum)
- ProcessorType: secretary, translator, analyst, developer, planner (enum)
```

---

#### 3. 로깅 시스템 (lib/discord/logger.ts)
- **Pino** 로거 설정 (개발환경 pretty-print)
- **요청 ID 추적**: 모든 로그에 requestId 포함
- **구조화된 로깅**: 쉬운 검색 & 모니터링
- **환경별 설정**: development/production 자동 감지

```typescript
// 사용 예시
logger.info({ userId, channelId }, 'Processing started');
logInteraction(log, interaction, 'Message received');
logError(log, error, 'Processing failed');
```

---

#### 4. 레이트 제한 (lib/discord/rate-limiter.ts)
- **슬라이딩 윈도우 알고리즘**: 유저당 50 req/sec 제한
- **메모리 기반 상태 관리**: Map 사용
- **자동 정리**: 60초마다 만료된 항목 삭제
- **상태 조회**: 남은 요청 수, 리셋 시간

```typescript
// 사용 예시
if (!checkRateLimit(userId)) {
  return createRateLimitResponse(userId); // 429 응답
}

const status = getRateLimitStatus(userId);
// { remaining: 45, resetAt: 1234567890 }
```

---

#### 5. 게이트웨이 핸들러 (lib/discord/gateway.ts)
**Ed25519 서명 검증:**
```typescript
// Discord 공개키 기반 HMAC-SHA512 검증
const verified = nacl.sign.detached.verify(
  messageBytes,
  signatureBytes,
  publicKeyBytes
);
```

**요청 처리 흐름:**
1. 서명 검증 (DISCORD_PUBLIC_KEY)
2. 타임스탬프 검증 (300초 이내)
3. 레이트 제한 확인 (50 req/sec)
4. 채널별 프로세서 라우팅
5. 지연 응답 반환 (3초 내)

**채널 매핑:**
```env
DISCORD_CHANNEL_SECRETARY     → SecretaryProcessor
DISCORD_CHANNEL_TRANSLATOR    → TranslatorProcessor
DISCORD_CHANNEL_ANALYST       → AnalystProcessor
DISCORD_CHANNEL_DEVELOPER     → DeveloperProcessor
DISCORD_CHANNEL_PLANNER       → PlannerProcessor
```

---

#### 6. Telegram 동기화 (lib/discord/telegram-sync.ts)
- **양방향 동기화**: Discord → Telegram (메시지 스레드)
- **HTML 포매팅**: Discord embed → Telegram HTML
- **메타데이터 로깅**: sync_log 테이블에 기록
- **오류 처리**: 실패 시 재시도 로직

```typescript
// 사용 예시
await syncToTelegram(
  embed,           // Discord embed
  channelId,       // 채널 ID
  userId,          // 유저 ID
  processorType,   // 프로세서 타입
  messageId        // 메시지 ID
);
```

---

#### 7. 베이스 프로세서 (lib/discord/processors/base.ts)
**추상 클래스:**
```typescript
abstract class BaseProcessor {
  abstract name: string;
  abstract process(request): Promise<response>;
  
  protected formatEmbed();      // Discord embed 포매팅
  protected createSuccessResponse();
  protected createErrorResponse();
  protected saveToDatabase();   // discord_messages에 저장
  protected log_action();       // 로깅
}
```

---

#### 8. 5개 메시지 프로세서

##### 8.1 비서 (SecretaryProcessor)
**기능:** 팀 일정, 작업 추적, 상태 리포트
- `schedule`: 주간 회의 & 마감일
- `status`: 팀 작업 상태 (완료/진행/대기)
- `assignment`: `/task @username description` 작업 할당
- `summary`: 주간 활동 요약

**응답 색상:** 초록색 (0x00ff00)

##### 8.2 번역기 (TranslatorProcessor)
**기능:** 한↔영 문서 번역, 용어 검증
- `ko_to_en`: 한국어 → 영어 번역
- `en_to_ko`: 영어 → 한국어 번역
- `verify`: 용어/톤 검증

**응답 색상:** 파랑색 (0x0099ff)

##### 8.3 분석가 (AnalystProcessor)
**기능:** 데이터 분석, KPI 리포트
- `asset_stats`: 자산 통계 (506개, 96% 활성)
- `bm_analysis`: 고장 관리 분석 (8개/30일, 4.2h 평균)
- `kpi_report`: 성과지표 (97.3% 가동률, 92.1% 활용도)
- `trend_analysis`: 추세 분석 (개선 추이, 비용 감소)

**응답 색상:** 보라색 (0x8b5cf6)

##### 8.4 개발자 (DeveloperProcessor)
**기능:** 기술 상담, 코드 리뷰, 배포 상태
- `progress`: 개발 진행률 (40% 완료, 35% 진행, 25% 대기)
- `issue`: 버그 리포팅
- `code_review`: 코드 리뷰 프로세스
- `deployment`: 배포 상태 (v1.2.3, 99.98% 가동률)

**응답 색상:** 파랑색 (0x3b82f6)

##### 8.5 기획자 (PlannerProcessor)
**기능:** 설계 문서, 로드맵, 프로젝트 타임라인
- `design`: 설계 문서 상태
- `roadmap`: 개발 로드맵
- `timeline`: 프로젝트 일정 & 마일스톤
- `deliverables`: 산출물 & 의존성

**응답 색상:** 인디고색 (0x6366f1)

---

#### 9. 프로세서 팩토리 (lib/discord/processors/index.ts)
```typescript
// 프로세서 인스턴스 생성
export function createProcessor(type: ProcessorType): BaseProcessor {
  // 타입별로 알맞은 프로세서 반환
}

// 프로세서 이름 조회
export function getProcessorName(type: ProcessorType): string
```

---

#### 10. API 엔드포인트들

##### 10.1 Discord 게이트웨이 (pages/api/discord-gateway.ts)
- **메서드:** POST
- **기능:** Discord 웹훅 수신, 검증, 라우팅
- **흐름:**
  1. 서명 검증
  2. 타임스탬프 검증
  3. 페이로드 파싱
  4. 지연 응답 즉시 반환 (3초 이내)
  5. 비동기 프로세싱 (모든 처리는 응답 후)

**응답:**
```json
{
  "type": 5,
  "data": {
    "content": "Processing..."
  }
}
```

##### 10.2 동기화 로그 (pages/api/discord/sync-log.ts)
- **메서드:** POST
- **기능:** Telegram↔Discord 메시지 매핑 기록
- **저장 위치:** discord_sync_log 테이블
- **필드:** telegram_message_id, discord_message_id, direction, processor_type, status

##### 10.3 메시지 저장 (pages/api/discord/messages.ts)
- **메서드:** POST (저장), GET (조회)
- **기능:** 처리된 메시지 저장/조회
- **저장 위치:** discord_messages 테이블
- **조회 필터:** processorType, status, limit, offset

---

## 🚀 배포 가이드

### 1단계: 환경 변수 설정
```bash
# .env.local 파일 생성 또는 편집
# DISCORD_BOT_ENV_SETUP.md 참조
```

### 2단계: 데이터베이스 마이그레이션
```sql
-- Supabase SQL Editor에서 실행
-- db/31_discord_bot_phase1.sql 파일 내용 복사 & 붙여넣기
```

### 3단계: 의존성 설치
```bash
npm install uuid tweetnacl @telegram/bot-api
```

### 4단계: Discord 애플리케이션 설정
1. Discord Developer Portal → Your App
2. Interactions Endpoint URL 설정:
   - 로컬 테스트: `https://your-ngrok-tunnel/api/discord-gateway`
   - 프로덕션: `https://your-domain.com/api/discord-gateway`
3. Bot Permissions 설정:
   - Send Messages ✅
   - Embed Links ✅
   - Read Messages/View Channels ✅

### 5단계: Vercel 배포
```bash
# GitHub에 푸시
git add .
git commit -m "feat: Discord Bot Phase 1 implementation complete"
git push

# Vercel에서 자동 배포
# 또는 수동 배포
vercel deploy --prod
```

---

## 🧪 테스트 체크리스트

### 로컬 개발 (ngrok 사용)

```bash
# 1. ngrok 터널 시작
ngrok http 3000

# 2. Discord Interactions Endpoint URL 업데이트
# https://abc123def.ngrok.io/api/discord-gateway

# 3. 개발 서버 시작
npm run dev

# 4. Discord에서 메시지 전송
# #비서 채널: "상태"
# #번역기 채널: "한국어 → 영어 번역"
# #분석가 채널: "자산 통계"
# #개발자 채널: "배포 상태"
# #기획자 채널: "로드맵"
```

### 테스트 항목

- [ ] Discord 메시지 수신
- [ ] 서명 검증 (유효/무효)
- [ ] 프로세서 라우팅 (채널별)
- [ ] 레이트 제한 (50 req/sec)
- [ ] Telegram 동기화 (메시지 전달)
- [ ] 데이터베이스 로깅 (sync_log, messages)
- [ ] 오류 처리 (잘못된 채널 등)
- [ ] 성능 (응답 시간 < 3초)

### Vercel 로그 확인

```bash
# Vercel CLI
vercel logs discord-gateway

# 또는 Vercel Dashboard
# Deployments → Functions → discord-gateway
```

---

## 📊 모니터링

### 메트릭 추적

```sql
-- Supabase에서 직접 쿼리

-- 동기화 성공률
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') as successes,
  COUNT(*) FILTER (WHERE status = 'failed') as failures,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
FROM discord_sync_log
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 프로세서별 사용량
SELECT 
  processor_type,
  COUNT(*) as message_count
FROM discord_messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY processor_type;

-- 레이트 제한 발생
SELECT 
  COUNT(*) as rate_limit_hits
FROM discord_sync_log
WHERE status = 'failed' 
AND error_message LIKE '%rate limit%'
AND created_at > NOW() - INTERVAL '24 hours';
```

---

## 🔧 문제 해결

### "Invalid request signature"
- ✅ DISCORD_PUBLIC_KEY 값 확인 (Discord Developer Portal)
- ✅ 웹훅 URL이 정확한지 확인
- ✅ ngrok 터널이 활성 상태인지 확인

### "Unsupported channel"
- ✅ DISCORD_CHANNEL_* 환경 변수 설정 확인
- ✅ 각 채널이 다른 ID인지 확인 (중복 없음)
- ✅ 채널 ID 형식 확인 (18자 숫자)

### Telegram에 메시지가 도착하지 않음
- ✅ TELEGRAM_BOT_TOKEN 확인
- ✅ TELEGRAM_THREAD_ID 확인 (음수여야 함)
- ✅ 봇이 스레드에 메시지 전송 권한 확인

### 데이터베이스 오류
- ✅ Supabase 연결 확인
- ✅ db/31_discord_bot_phase1.sql 마이그레이션 적용 확인
- ✅ RLS 정책 확인 (서비스 역할 권한)

---

## 📝 주요 파일 목록

```
lib/discord/
├── types.ts                    # TypeScript 타입 정의
├── logger.ts                   # Pino 로거 설정
├── rate-limiter.ts            # 레이트 제한 (50 req/sec)
├── gateway.ts                 # Ed25519 검증 & 라우팅
├── telegram-sync.ts           # Telegram 양방향 동기화
└── processors/
    ├── index.ts              # 프로세서 팩토리
    ├── base.ts               # 베이스 프로세서 (추상)
    ├── secretary.ts          # 비서 프로세서
    ├── translator.ts         # 번역기 프로세서
    ├── analyst.ts            # 분석가 프로세서
    ├── developer.ts          # 개발자 프로세서
    └── planner.ts            # 기획자 프로세서

pages/api/
├── discord-gateway.ts        # 메인 웹훅 엔드포인트
└── discord/
    ├── sync-log.ts           # Telegram↔Discord 로깅
    └── messages.ts           # 메시지 저장/조회

db/
└── 31_discord_bot_phase1.sql # 데이터베이스 스키마
```

---

## ✅ 다음 단계 (Phase 2)

- [ ] 실시간 메시지 검색 (elasticsearch)
- [ ] 고급 필터링 & 분석
- [ ] 모바일 앱 지원
- [ ] AI 기반 의도 분석
- [ ] 멀티셀 지원

---

**마감:** 2026-06-06 23:59 KST  
**완료:** 2026-05-25 (Phase 1 구현 100%)
