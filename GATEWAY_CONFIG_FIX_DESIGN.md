# Gateway Configuration Fix Design
**Date:** 2026-05-15  
**Status:** 설계 완료  
**Scope:** Gateway 설정 오류 진단 및 올바른 구현 가이드

---

## 문제 상황

### 발생한 오류
- **시각:** 02:30 KST (2026-05-15)
- **오류:** "Unrecognized option" 에러로 Gateway startup 실패
- **원인:** openclaw.json gateway 섹션에 유효하지 않은 필드 3개 추가됨
  - `autoHealthCheck: false` ❌
  - `deploymentMonitoring: false` ❌
  - `systemNotifications: false` ❌

### 현재 상태 (2026-05-15)
현재 openclaw.json의 gateway 섹션은 정상:
```json
"gateway": {
  "auth": {
    "mode": "token",
    "token": "51632ed3ee6310e0fa0f234a2548e3aae490fd5857d48692"
  },
  "mode": "local"
}
```
이 필드들이 이미 제거된 상태. 하지만 향후 동일한 실수를 방지하기 위해 올바른 방법 정의 필요.

---

## 목표 달성

### 1. 게이트웨이 설정 스키마 검토 ✅
**유효한 Gateway 설정 필드:** (TypeScript interface 기준)

#### 포트 & 바인드 설정
| 필드 | 타입 | 설명 |
|------|------|------|
| `port` | number | Gateway WS + HTTP 포트 (기본값: 18789) |
| `mode` | "local" \| "remote" | 게이트웨이 모드 |
| `bind` | "auto" \| "lan" \| "loopback" \| "tailnet" \| "custom" | 바인드 주소 정책 (기본값: loopback) |
| `customBindHost` | string | bind="custom" 일 때 IP 지정 |

#### 제어 UI 설정
| 필드 | 타입 | 설명 |
|------|------|------|
| `controlUi.enabled` | boolean | Control UI 활성화 여부 (기본값: true) |
| `controlUi.basePath` | string | Control UI 기본 경로 (예: "/openclaw") |
| `controlUi.allowExternalEmbedUrls` | boolean | 외부 http(s) URL embed 허용 |

#### 인증 설정
| 필드 | 타입 | 설명 |
|------|------|------|
| `auth.mode` | "none" \| "token" \| "password" \| "trusted-proxy" | 인증 방식 (기본값: token) |
| `auth.token` | SecretInput | 토큰 (token 모드 필수) |
| `auth.password` | SecretInput | 비밀번호 (password 모드 필수) |
| `auth.rateLimit.maxAttempts` | number | 최대 시도 횟수 (기본값: 10) |
| `auth.rateLimit.windowMs` | number | 슬라이딩 윈도우 (기본값: 60000ms) |
| `auth.rateLimit.lockoutMs` | number | 잠금 기간 (기본값: 300000ms) |

#### 채널 헬스 모니터링 ⭐ (우리에게 해당)
| 필드 | 타입 | 설명 |
|------|------|------|
| `channelHealthCheckMinutes` | number | 헬스 체크 간격 분 (기본값: 5) |
| `channelStaleEventThresholdMinutes` | number | 정체된 소켓 임계값 분 (기본값: 30) |
| `channelMaxRestartsPerHour` | number | 시간당 최대 재시작 횟수 (기본값: 10) |

#### TLS 설정
| 필드 | 타입 | 설명 |
|------|------|------|
| `tls.enabled` | boolean | TLS 활성화 |
| `tls.autoGenerate` | boolean | 자가서명 인증서 자동 생성 (기본값: true) |
| `tls.certPath` | string | PEM 인증서 경로 |
| `tls.keyPath` | string | PEM 개인키 경로 |

#### HTTP 설정
| 필드 | 타입 | 설명 |
|------|------|------|
| `http.endpoints.chatCompletions.enabled` | boolean | /v1/chat/completions 활성화 |
| `http.securityHeaders.strictTransportSecurity` | string \| false | HSTS 헤더 |

#### 기타 설정
| 필드 | 타입 | 설명 |
|------|------|------|
| `tailscale.mode` | "off" \| "serve" \| "funnel" | Tailscale 노출 모드 |
| `handshakeTimeoutMs` | number | WebSocket 핸드셰이크 타임아웃 (기본값: 15000ms) |
| `trustedProxies` | string[] | 신뢰할 수 있는 리버스 프록시 IP |

---

### 2. Vercel 배포 알림 비활성화 방법

#### 문제: "Vercel 배포 알림을 자동으로 비활성화하고 싶음"

#### 분석
- Gateway 설정만으로는 Vercel 배포 이벤트를 직접 제어할 수 없음
- Vercel은 외부 서비스이며, Discord/Telegram 채널로 알림이 전달됨
- 올바른 접근: 채널별 health monitor 설정 + cron job 활용

#### ✅ 올바른 방법

##### **Option A: 채널별 Health Monitor 비활성화 (권장)**

Discord 채널에서만 health monitor 비활성화:
```json
"channels": {
  "discord": {
    "enabled": true,
    "token": "...",
    "healthMonitor": {
      "enabled": false
    },
    "guilds": { ... }
  }
}
```

효과:
- Discord 채널의 health-monitor 자동 재시작 비활성화
- 배포 중 Gateway 재시작으로 인한 Discord 알림 감소
- 전역 gateway health monitor는 유지 (다른 영향 최소화)

---

##### **Option B: 전역 Health Monitor 설정 조정**

Gateway 수준에서 health monitor 정책 변경:
```json
"gateway": {
  "mode": "local",
  "channelHealthCheckMinutes": 15,          // 5분 → 15분으로 확장
  "channelMaxRestartsPerHour": 3,           // 10 → 3으로 축소
  "channelStaleEventThresholdMinutes": 60   // 30 → 60분으로 완화
}
```

효과:
- 전체 재시작 빈도 감소
- 정상적인 배포 관련 재시작도 함께 감소
- Vercel 배포 중 일시적 connectivity 문제도 더 관용적으로 처리

---

##### **Option C: 시간대별 Health Monitor 비활성화 (고급)**

환경변수 + cron으로 배포 시간(02:00 KST)에 자동 비활성화:
```bash
# .env.local 또는 start script
OPENCLAW_HEALTH_CHECK_ENABLED=false (배포 전)
OPENCLAW_HEALTH_CHECK_ENABLED=true  (배포 후 복구)
```

효과:
- 가장 효과적이나 자동화 인프라 필요
- 추후 Vercel deploy webhook과 연동 시 구현 권장

---

### 3. 추천 전략

현재 상황에서 **즉시 적용 권장안:**

```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "51632ed3ee6310e0fa0f234a2548e3aae490fd5857d48692"
    },
    "mode": "local",
    "channelHealthCheckMinutes": 10,
    "channelMaxRestartsPerHour": 5
  },
  "channels": {
    "discord": {
      "enabled": true,
      "healthMonitor": {
        "enabled": false
      }
    },
    "telegram": {
      "enabled": true
    }
  }
}
```

**이유:**
1. Discord는 배포 알림이 자주 발생하므로 health monitor 비활성화
2. Telegram은 활성 유지 (중요 메시지용)
3. 전역 health monitor는 적절한 값으로 조정
4. 영구 저장 가능 (환경변수 의존 안 함)

---

## 게이트웨이 초기화 전 체크리스트

### ✅ 사전 확인 (Pre-Flight)

```yaml
설정 검증:
  - [ ] openclaw.json 파일 문법 검증 (JSON 유효성)
  - [ ] 모든 필드명이 위 스키마에 명시되어 있는지 확인
  - [ ] 필드 타입이 명시된 타입과 일치하는지 확인
  
버전 호환성:
  - [ ] OpenClaw 버전 확인: v2026.5.6 이상?
  - [ ] Gateway 관련 최신 업데이트 적용 여부
  
채널 상태:
  - [ ] Discord token 유효성 확인
  - [ ] Telegram bot token 유효성 확인
  - [ ] 각 채널 접근성 테스트
  
인증:
  - [ ] Gateway auth token 비교 (현재 파일과 실행 환경 일치?)
  - [ ] auth.rateLimit 설정이 너무 제한적이지 않은지 확인
```

### ✅ Gateway 재시작 전 단계

```bash
# 1단계: 설정 파일 백업
cp /home/jeepney/.openclaw-dev/openclaw.json \
   /home/jeepney/.openclaw-dev/openclaw.json.bak.$(date +%s)

# 2단계: 설정 파일 검증 (문법 확인)
jq empty /home/jeepney/.openclaw-dev/openclaw.json && echo "✅ Valid JSON"

# 3단계: Gateway 상태 확인
openclaw gateway status

# 4단계: 로그 확인 (이전 오류 패턴)
journalctl -u openclaw-gateway -n 50

# 5단계: 안전한 재시작 (또는 gateway 개별 재구성)
openclaw gateway restart
```

---

## 웹개발자 구현 체크리스트

### Phase 1: 설정 적용
- [ ] GATEWAY_CONFIG_FIX_DESIGN.md 전체 리뷰
- [ ] 현재 openclaw.json 상태 확인
- [ ] 위 "추천 전략" 섹션의 설정을 적용할지 확인받기

### Phase 2: 설정 검증
- [ ] JSON 문법 검증 (jq 사용)
- [ ] gateway.channelHealthCheckMinutes = 10 (증가)
- [ ] gateway.channelMaxRestartsPerHour = 5 (감소)
- [ ] channels.discord.healthMonitor.enabled = false (추가)

### Phase 3: 재시작 테스트
- [ ] 설정 적용 후 `openclaw gateway restart`
- [ ] 30초 내 Gateway 재시작 완료 확인
- [ ] Discord 채널에서 정상 응답 테스트
- [ ] Telegram 채널에서 정상 응답 테스트

### Phase 4: 모니터링
- [ ] 향후 1시간 동안 Gateway crash 없는지 모니터링
- [ ] 배포 전/후 health monitor 동작 확인
- [ ] 로그에 "Unrecognized option" 에러 없는지 확인

### Phase 5: 문서화
- [ ] 적용한 설정 변경사항 기록
- [ ] 변경 사유 (Vercel 배포 알림 최소화) 기록
- [ ] 향후 유사 오류 방지를 위한 설정 검증 스크립트 작성 고려

---

## 유효하지 않은 필드들이 왜 들어왔을까?

### 분석: 3개 필드의 출처 추정

| 필드 | 추정 | 이유 |
|------|------|------|
| `autoHealthCheck` | 사용자 추측 또는 외부 참고 | Gateway config에는 health monitor 제어만 가능하며, "auto"는 OpenClaw 용어가 아님 |
| `deploymentMonitoring` | 추측 | Vercel 배포 알림과 health monitor를 혼동한 것으로 보임 |
| `systemNotifications` | 추측 | "notifications" 라는 필드가 채널/메시지 레벨에 존재하나, gateway 수준에는 없음 |

### 근본 원인
1. Gateway 공식 설정 스키마에 대한 명확한 참고자료 부재
2. Health monitor와 배포 알림을 혼동
3. 채널 레벨 설정 vs Gateway 레벨 설정 혼동

### 예방 조치
- ✅ 이 문서 작성 (공식 참고)
- ✅ 설정 검증 스크립트 자동화 고려
- ✅ 웹개발자를 위한 명확한 구현 가이드 제공

---

## 참고자료

### OpenClaw 소스 코드
- **Gateway 타입 정의:** `/home/jeepney/OpenClaw/src/config/types.gateway.ts`
- **채널 설정:** `/home/jeepney/OpenClaw/src/config/types.channels.ts`
- **설정 검증:** `/home/jeepney/OpenClaw/src/commands/configure.gateway.ts`

### 관련 설정 파일
- **현재 설정:** `/home/jeepney/.openclaw-dev/openclaw.json`
- **백업 위치:** `/home/jeepney/.openclaw-dev/openclaw.json.bak.*`

### Health Monitor 제어 방법
```
전역 레벨:       gateway.channelHealthCheckMinutes
채널별 레벨:     channels.<provider>.healthMonitor.enabled
```

---

## 결론

✅ **설정 오류 진단 완료**  
- 3개 필드가 Gateway 설정 스키마에 존재하지 않음 확인
- 현재 openclaw.json은 정상 상태

✅ **올바른 해결책 설계 완료**  
- Option A (Discord health monitor 비활성화) 권장
- Option B (전역 health monitor 완화) 병행 권장
- Option C (시간대별 자동화) 향후 고급 옵션

✅ **웹개발자 가이드 제공**  
- 사전 체크리스트
- 단계별 구현 절차
- 검증 방법

다음 단계: 웹개발자가 위 "추천 전략" 섹션의 설정을 적용하여 테스트

