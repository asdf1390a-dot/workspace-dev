---
name: Gateway Configuration Fix Design
description: openclaw.json 게이트웨이 섹션 설정 스키마 검토 및 올바른 구현 가이드
type: project
relatedFiles: GATEWAY_CONFIG_FIX_DESIGN.md
---

# Gateway Configuration Fix Design

**작성일:** 2026-05-15  
**상태:** 설계 완료  
**Scope:** Gateway 설정 오류 진단 및 올바른 구현 가이드

## 문제 상황

### 발생한 오류
- **시각:** 02:30 KST (2026-05-15)
- **오류:** "Unrecognized option" 에러로 Gateway startup 실패
- **원인:** openclaw.json gateway 섹션에 유효하지 않은 필드 3개 추가됨
  - `autoHealthCheck: false` ❌
  - `deploymentMonitoring: false` ❌
  - `systemNotifications: false` ❌

### 현재 상태 (2026-05-15)
현재 openclaw.json의 gateway 섹션은 정상 상태이지만, 향후 동일한 실수를 방지하기 위해 올바른 방법 정의 필요.

## 유효한 Gateway 설정 필드

### 포트 & 바인드 설정
| 필드 | 타입 | 기본값 |
|------|------|--------|
| `port` | number | 18789 |
| `mode` | "local" \| "remote" | - |
| `bind` | "auto" \| "lan" \| "loopback" \| "tailnet" \| "custom" | loopback |
| `customBindHost` | string | - |

### 제어 UI 설정
| 필드 | 타입 | 기본값 |
|------|------|--------|
| `controlUi.enabled` | boolean | true |
| `controlUi.basePath` | string | "/openclaw" |
| `controlUi.allowExternalEmbedUrls` | boolean | false |

### 인증 설정
| 필드 | 타입 | 기본값 |
|------|------|--------|
| `auth.mode` | "none" \| "token" \| "password" \| "trusted-proxy" | token |
| `auth.token` | SecretInput | - |
| `auth.password` | SecretInput | - |
| `auth.rateLimit.maxAttempts` | number | 10 |
| `auth.rateLimit.windowMs` | number | 60000ms |
| `auth.rateLimit.lockoutMs` | number | 300000ms |

### 채널 헬스 모니터링 ⭐
| 필드 | 타입 | 기본값 |
|------|------|--------|
| `channelHealthCheckMinutes` | number | 5 |
| `channelStaleEventThresholdMinutes` | number | 30 |
| `channelMaxRestartsPerHour` | number | 10 |

### TLS 설정
| 필드 | 타입 | 기본값 |
|------|------|--------|
| `tls.enabled` | boolean | - |
| `tls.autoGenerate` | boolean | true |
| `tls.certPath` | string | - |
| `tls.keyPath` | string | - |

## 권장 설정 샘플

```json
{
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "51632ed3ee6310e0fa0f234a2548e3aae490fd5857d48692"
    },
    "channelHealthCheckMinutes": 5,
    "controlUi": {
      "enabled": true,
      "basePath": "/openclaw"
    }
  }
}
```

## 상태
✅ **설정 정상화 완료** — 향후 신규 필드 추가 시 스키마 검증 필수
