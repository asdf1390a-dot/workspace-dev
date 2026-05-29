# 신뢰도 점수 계산기 — 테스트 케이스 명세
# Trust Score Calculator — Test Cases Specification

**버전:** 2C-1.0  
**작성일:** 2026-05-29  
**총 테스트 케이스:** 100개  
**대상 시스템:** Memory Automation Phase 2C — Trust Score Calculator (PORT 3011)  
**공식:** `Trust Score = SC×0.40 + CD×0.25 + VS×0.20 + RF×0.15`

---

## 목차

1. [단위 테스트 — C1: 출처 신뢰도 (SC)](#단위-테스트--c1-출처-신뢰도)
2. [단위 테스트 — C2: 내용 풍부도 (CD)](#단위-테스트--c2-내용-풍부도)
3. [단위 테스트 — C3: 검증 일관성 (VS)](#단위-테스트--c3-검증-일관성)
4. [단위 테스트 — C4: 최신성 (RF)](#단위-테스트--c4-최신성)
5. [통합 테스트 — 다중 컴포넌트 조합](#통합-테스트--다중-컴포넌트-조합)
6. [엣지 케이스 테스트](#엣지-케이스-테스트)

---

## 단위 테스트 — C1: 출처 신뢰도

**채널별 기본 점수:**
- `telegram_ceo_personal`: 90
- `telegram_team_channel`: 85
- `discord_meeting`: 85
- `telegram_direct`: 80
- `discord_general`: 65
- `discord_random`: 40
- `unknown`: 20

**역할별 조정:**
- CEO: +10 (최대 100)
- Manager: +5
- Team Member: 0
- External: -15

### TC-SC-001: CEO 개인 Telegram 채널

```json
{
  "testId": "TC-SC-001",
  "category": "source_credibility",
  "description": "CEO가 개인 Telegram 채널에서 보낸 메시지",
  "input": {
    "channel": "telegram_ceo_personal",
    "senderRole": "CEO",
    "verificationCount": 0,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 100,
    "note": "기본 90 + CEO 보정 +10 = 100 (상한선)"
  }
}
```

### TC-SC-002: 팀 채널 매니저 메시지

```json
{
  "testId": "TC-SC-002",
  "category": "source_credibility",
  "description": "매니저가 팀 Telegram 채널에서 보낸 메시지",
  "input": {
    "channel": "telegram_team_channel",
    "senderRole": "Manager",
    "verificationCount": 0,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 90,
    "note": "기본 85 + Manager 보정 +5 = 90"
  }
}
```

### TC-SC-003: Discord 일반 채널 팀원

```json
{
  "testId": "TC-SC-003",
  "category": "source_credibility",
  "description": "팀원이 Discord 일반 채널에서 보낸 메시지",
  "input": {
    "channel": "discord_general",
    "senderRole": "TeamMember",
    "verificationCount": 0,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 65,
    "note": "기본 65 + TeamMember 보정 0 = 65"
  }
}
```

### TC-SC-004: 외부인 Discord 메시지

```json
{
  "testId": "TC-SC-004",
  "category": "source_credibility",
  "description": "외부인이 Discord 채널에서 보낸 메시지",
  "input": {
    "channel": "discord_general",
    "senderRole": "External",
    "verificationCount": 0,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 50,
    "note": "기본 65 + External 보정 -15 = 50"
  }
}
```

### TC-SC-005: 검증 횟수 보너스 (5회)

```json
{
  "testId": "TC-SC-005",
  "category": "source_credibility",
  "description": "팀원이 5회 검증된 Discord 미팅 채널",
  "input": {
    "channel": "discord_meeting",
    "senderRole": "TeamMember",
    "verificationCount": 5,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 90,
    "note": "기본 85 + TeamMember 0 + 검증 5회 +5 = 90"
  }
}
```

### TC-SC-006: 검증 횟수 보너스 최대 (20회 이상)

```json
{
  "testId": "TC-SC-006",
  "category": "source_credibility",
  "description": "20회 이상 검증된 경우 최대 +20 보너스",
  "input": {
    "channel": "telegram_team_channel",
    "senderRole": "TeamMember",
    "verificationCount": 25,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 100,
    "note": "기본 85 + TeamMember 0 + 최대 보너스 +20 = 105 → 상한 100"
  }
}
```

### TC-SC-007: 모순 기록 패널티 (1건)

```json
{
  "testId": "TC-SC-007",
  "category": "source_credibility",
  "description": "1건 모순 기록이 있는 CEO 메시지",
  "input": {
    "channel": "telegram_ceo_personal",
    "senderRole": "CEO",
    "verificationCount": 0,
    "contradictionCount": 1
  },
  "expected": {
    "sourceCredibility": 90,
    "note": "기본 90 + CEO +10 - 모순 1건 -10 = 90"
  }
}
```

### TC-SC-008: 모순 기록 패널티 (3건)

```json
{
  "testId": "TC-SC-008",
  "category": "source_credibility",
  "description": "3건 모순 기록이 있는 팀원 메시지",
  "input": {
    "channel": "telegram_team_channel",
    "senderRole": "TeamMember",
    "verificationCount": 0,
    "contradictionCount": 3
  },
  "expected": {
    "sourceCredibility": 55,
    "note": "기본 85 + 0 - 3×10 = 55"
  }
}
```

### TC-SC-009: 알 수 없는 채널

```json
{
  "testId": "TC-SC-009",
  "category": "source_credibility",
  "description": "미등록 채널 소스",
  "input": {
    "channel": "some_unknown_channel",
    "senderRole": "TeamMember",
    "verificationCount": 0,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 20,
    "note": "unknown 채널 기본 20"
  }
}
```

### TC-SC-010: Discord random 채널 외부인

```json
{
  "testId": "TC-SC-010",
  "category": "source_credibility",
  "description": "외부인이 Discord random 채널에서 메시지",
  "input": {
    "channel": "discord_random",
    "senderRole": "External",
    "verificationCount": 0,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 25,
    "note": "기본 40 - External -15 = 25"
  }
}
```

### TC-SC-011: 검증 + 모순 동시 존재

```json
{
  "testId": "TC-SC-011",
  "category": "source_credibility",
  "description": "5회 검증 + 1건 모순이 동시에 있는 경우",
  "input": {
    "channel": "discord_meeting",
    "senderRole": "Manager",
    "verificationCount": 5,
    "contradictionCount": 1
  },
  "expected": {
    "sourceCredibility": 85,
    "note": "85 + Manager +5 + 검증 +5 - 모순 -10 = 85"
  }
}
```

### TC-SC-012: 최저 점수 시나리오

```json
{
  "testId": "TC-SC-012",
  "category": "source_credibility",
  "description": "모든 패널티 최대 적용",
  "input": {
    "channel": "discord_random",
    "senderRole": "External",
    "verificationCount": 0,
    "contradictionCount": 10
  },
  "expected": {
    "sourceCredibility": 0,
    "note": "40 - 15 - 100 = -75 → 하한 0"
  }
}
```

### TC-SC-013: Telegram 직접 메시지 CEO

```json
{
  "testId": "TC-SC-013",
  "category": "source_credibility",
  "input": {
    "channel": "telegram_direct",
    "senderRole": "CEO",
    "verificationCount": 3,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 100,
    "note": "80 + CEO +10 + 검증 3회(만 5 미만, 0 보너스) = 90 아님 — 5의 배수만 적용, 3회는 보너스 0"
  }
}
```

### TC-SC-014: 검증 10회 보너스

```json
{
  "testId": "TC-SC-014",
  "category": "source_credibility",
  "input": {
    "channel": "telegram_team_channel",
    "senderRole": "TeamMember",
    "verificationCount": 10,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 95,
    "note": "85 + 0 + 검증 10회 +10 = 95"
  }
}
```

### TC-SC-015: 채널명 대소문자 처리

```json
{
  "testId": "TC-SC-015",
  "category": "source_credibility",
  "description": "채널명 대소문자 정규화 확인",
  "input": {
    "channel": "TELEGRAM_CEO_PERSONAL",
    "senderRole": "CEO",
    "verificationCount": 0,
    "contradictionCount": 0
  },
  "expected": {
    "sourceCredibility": 100,
    "note": "대소문자 정규화 후 telegram_ceo_personal 동일 처리"
  }
}
```

---

## 단위 테스트 — C2: 내용 풍부도

**신호별 점수:**
- `hasText` (완전한 문장): +15
- `hasActionKeyword` (액션 항목): +20
- `hasLinks` (2개 이상 링크): +15
- `hasTimestamp` (타임스탬프): +15
- `hasTeamMention` (팀 멘션): +10
- `hasCode` (코드/스크립트): +15
- `hasReference` (참고 자료): +10
- `hasMetrics` (지표/숫자, 각각): +10
- `hasIssueRef` (이슈 추적): +10
- **최대:** 100점

### TC-CD-001: 모든 신호 있음

```json
{
  "testId": "TC-CD-001",
  "category": "context_depth",
  "description": "모든 신호가 있는 풍부한 메시지",
  "input": {
    "content": "회의록: 2026-05-29 14:00 @팀원 참조. 다음 PR #123 처리 필요. 링크: https://a.com https://b.com. 코드: `git commit -m`. 지표: 달성률 95%, 응답시간 200ms.",
    "signals": {
      "hasText": true,
      "hasActionKeyword": true,
      "hasLinks": true,
      "hasTimestamp": true,
      "hasTeamMention": true,
      "hasCode": true,
      "hasReference": true,
      "hasMetrics": 2,
      "hasIssueRef": true
    }
  },
  "expected": {
    "contextDepth": 100,
    "note": "15+20+15+15+10+15+10+20+10 = 130 → 상한 100"
  }
}
```

### TC-CD-002: 텍스트만 있음

```json
{
  "testId": "TC-CD-002",
  "category": "context_depth",
  "description": "완전한 문장만 있는 메시지",
  "input": {
    "signals": {
      "hasText": true,
      "hasActionKeyword": false,
      "hasLinks": false,
      "hasTimestamp": false,
      "hasTeamMention": false,
      "hasCode": false,
      "hasReference": false,
      "hasMetrics": 0,
      "hasIssueRef": false
    }
  },
  "expected": {
    "contextDepth": 15
  }
}
```

### TC-CD-003: 액션 키워드 + 텍스트

```json
{
  "testId": "TC-CD-003",
  "category": "context_depth",
  "input": {
    "signals": {
      "hasText": true,
      "hasActionKeyword": true,
      "hasLinks": false,
      "hasTimestamp": false,
      "hasTeamMention": false,
      "hasCode": false,
      "hasReference": false,
      "hasMetrics": 0,
      "hasIssueRef": false
    }
  },
  "expected": {
    "contextDepth": 35,
    "note": "15 + 20 = 35"
  }
}
```

### TC-CD-004: 빈 메시지 (신호 없음)

```json
{
  "testId": "TC-CD-004",
  "category": "context_depth",
  "description": "내용이 없는 빈 메시지",
  "input": {
    "signals": {
      "hasText": false,
      "hasActionKeyword": false,
      "hasLinks": false,
      "hasTimestamp": false,
      "hasTeamMention": false,
      "hasCode": false,
      "hasReference": false,
      "hasMetrics": 0,
      "hasIssueRef": false
    }
  },
  "expected": {
    "contextDepth": 0
  }
}
```

### TC-CD-005: 링크 1개 (2개 미만)

```json
{
  "testId": "TC-CD-005",
  "category": "context_depth",
  "description": "링크가 1개인 경우 hasLinks 미충족",
  "input": {
    "content": "참고: https://example.com",
    "signals": {
      "hasText": true,
      "hasLinks": false,
      "hasMetrics": 0
    }
  },
  "expected": {
    "contextDepth": 15,
    "note": "링크 1개는 hasLinks 조건(2개 이상) 불충족"
  }
}
```

### TC-CD-006: 지표 3개

```json
{
  "testId": "TC-CD-006",
  "category": "context_depth",
  "description": "숫자/지표 3개가 있는 경우",
  "input": {
    "signals": {
      "hasText": true,
      "hasMetrics": 3
    }
  },
  "expected": {
    "contextDepth": 45,
    "note": "hasText +15, 지표 3개 ×10 = +30, 합계 45"
  }
}
```

### TC-CD-007: 코드 + 참고 자료

```json
{
  "testId": "TC-CD-007",
  "category": "context_depth",
  "input": {
    "signals": {
      "hasText": false,
      "hasCode": true,
      "hasReference": true,
      "hasMetrics": 0
    }
  },
  "expected": {
    "contextDepth": 25,
    "note": "hasCode +15 + hasReference +10 = 25"
  }
}
```

### TC-CD-008: 타임스탬프 + 팀 멘션

```json
{
  "testId": "TC-CD-008",
  "category": "context_depth",
  "input": {
    "signals": {
      "hasText": true,
      "hasTimestamp": true,
      "hasTeamMention": true,
      "hasMetrics": 0
    }
  },
  "expected": {
    "contextDepth": 40,
    "note": "15 + 15 + 10 = 40"
  }
}
```

### TC-CD-009: 이슈 참조 있음

```json
{
  "testId": "TC-CD-009",
  "category": "context_depth",
  "input": {
    "signals": {
      "hasText": true,
      "hasIssueRef": true,
      "hasMetrics": 1
    }
  },
  "expected": {
    "contextDepth": 35,
    "note": "15 + 10 + 10 = 35"
  }
}
```

### TC-CD-010: 상한 검증 (130 → 100)

```json
{
  "testId": "TC-CD-010",
  "category": "context_depth",
  "description": "합산 결과가 100 초과 시 상한 100 적용",
  "input": {
    "signals": {
      "hasText": true,
      "hasActionKeyword": true,
      "hasLinks": true,
      "hasTimestamp": true,
      "hasTeamMention": true,
      "hasCode": true,
      "hasReference": true,
      "hasMetrics": 5,
      "hasIssueRef": true
    }
  },
  "expected": {
    "contextDepth": 100,
    "note": "합산 175 → 상한 100"
  }
}
```

### TC-CD-011: 링크 정확히 2개

```json
{
  "testId": "TC-CD-011",
  "category": "context_depth",
  "description": "링크 정확히 2개 — hasLinks 경계값",
  "input": {
    "content": "참고: https://a.com 및 https://b.com",
    "signals": {
      "hasText": true,
      "hasLinks": true,
      "hasMetrics": 0
    }
  },
  "expected": {
    "contextDepth": 30,
    "note": "15 + 15 = 30"
  }
}
```

### TC-CD-012: 액션 키워드 없이 이슈 참조

```json
{
  "testId": "TC-CD-012",
  "category": "context_depth",
  "input": {
    "signals": {
      "hasText": true,
      "hasIssueRef": true,
      "hasMetrics": 0
    }
  },
  "expected": {
    "contextDepth": 25,
    "note": "15 + 10 = 25"
  }
}
```

### TC-CD-013: 지표 0개

```json
{
  "testId": "TC-CD-013",
  "category": "context_depth",
  "input": {
    "signals": {
      "hasText": true,
      "hasMetrics": 0
    }
  },
  "expected": {
    "contextDepth": 15
  }
}
```

### TC-CD-014: 링크만 있음 (텍스트 없음)

```json
{
  "testId": "TC-CD-014",
  "category": "context_depth",
  "input": {
    "signals": {
      "hasText": false,
      "hasLinks": true,
      "hasMetrics": 0
    }
  },
  "expected": {
    "contextDepth": 15,
    "note": "hasLinks만 +15"
  }
}
```

### TC-CD-015: 팀 멘션만 있음

```json
{
  "testId": "TC-CD-015",
  "category": "context_depth",
  "input": {
    "signals": {
      "hasTeamMention": true,
      "hasMetrics": 0
    }
  },
  "expected": {
    "contextDepth": 10
  }
}
```

---

## 단위 테스트 — C3: 검증 일관성

**분류 기준:**
- `VERIFIED`: 100점
- `PARTIALLY_VERIFIED`: 50점
- `UNVERIFIED`: 0점

**자동 격리 규칙:**
- 미검증 7일 후 → 자동 격리
- 부분 검증 30일 후 → 재검증 알림

### TC-VS-001: 검증 완료

```json
{
  "testId": "TC-VS-001",
  "category": "verification_status",
  "description": "완전 검증된 메모리 항목",
  "input": {
    "verificationStatus": "VERIFIED",
    "verifiedAt": "2026-05-28T10:00:00Z",
    "verificationSource": ["CEO", "Manager"]
  },
  "expected": {
    "verificationScore": 100
  }
}
```

### TC-VS-002: 부분 검증

```json
{
  "testId": "TC-VS-002",
  "category": "verification_status",
  "description": "부분적으로 검증된 항목",
  "input": {
    "verificationStatus": "PARTIALLY_VERIFIED",
    "verifiedAt": "2026-05-27T10:00:00Z",
    "verificationSource": ["TeamMember"]
  },
  "expected": {
    "verificationScore": 50
  }
}
```

### TC-VS-003: 미검증

```json
{
  "testId": "TC-VS-003",
  "category": "verification_status",
  "description": "검증되지 않은 항목",
  "input": {
    "verificationStatus": "UNVERIFIED",
    "verifiedAt": null,
    "verificationSource": []
  },
  "expected": {
    "verificationScore": 0
  }
}
```

### TC-VS-004: 미검증 7일 경과 → 자동 격리

```json
{
  "testId": "TC-VS-004",
  "category": "verification_status",
  "description": "미검증 상태로 7일 경과 시 자동 격리 플래그",
  "input": {
    "verificationStatus": "UNVERIFIED",
    "createdAt": "2026-05-22T00:00:00Z",
    "currentDate": "2026-05-29T00:00:00Z"
  },
  "expected": {
    "verificationScore": 0,
    "autoQuarantine": true,
    "quarantineReason": "미검증 7일 초과"
  }
}
```

### TC-VS-005: 부분 검증 30일 경과 → 재검증 알림

```json
{
  "testId": "TC-VS-005",
  "category": "verification_status",
  "description": "부분 검증 30일 경과 시 재검증 알림",
  "input": {
    "verificationStatus": "PARTIALLY_VERIFIED",
    "verifiedAt": "2026-04-29T10:00:00Z",
    "currentDate": "2026-05-29T00:00:00Z"
  },
  "expected": {
    "verificationScore": 50,
    "reverifyAlert": true
  }
}
```

### TC-VS-006: 검증 완료 후 모순 발견

```json
{
  "testId": "TC-VS-006",
  "category": "verification_status",
  "description": "VERIFIED 상태이지만 이후 모순 발견 — 재평가 필요",
  "input": {
    "verificationStatus": "VERIFIED",
    "contradictionDetected": true,
    "contradictionSource": "Phase 2B Duplicate Detection"
  },
  "expected": {
    "verificationScore": 50,
    "note": "모순 발견 시 VERIFIED → PARTIALLY_VERIFIED 강등",
    "downgradeTriggered": true
  }
}
```

### TC-VS-007: 검증 소스 없음 (VERIFIED 주장)

```json
{
  "testId": "TC-VS-007",
  "category": "verification_status",
  "description": "검증 소스 없이 VERIFIED 주장하는 경우",
  "input": {
    "verificationStatus": "VERIFIED",
    "verificationSource": []
  },
  "expected": {
    "verificationScore": 50,
    "note": "소스 없는 VERIFIED는 PARTIALLY_VERIFIED로 취급"
  }
}
```

### TC-VS-008: 알 수 없는 상태값

```json
{
  "testId": "TC-VS-008",
  "category": "verification_status",
  "input": {
    "verificationStatus": "PENDING"
  },
  "expected": {
    "verificationScore": 0,
    "note": "알 수 없는 상태 → UNVERIFIED 취급"
  }
}
```

### TC-VS-009: null 상태

```json
{
  "testId": "TC-VS-009",
  "category": "verification_status",
  "input": {
    "verificationStatus": null
  },
  "expected": {
    "verificationScore": 0,
    "note": "null → UNVERIFIED 기본값"
  }
}
```

### TC-VS-010: 다중 검증 소스

```json
{
  "testId": "TC-VS-010",
  "category": "verification_status",
  "description": "3명 이상 검증 소스 — 신뢰도 추가 보너스",
  "input": {
    "verificationStatus": "VERIFIED",
    "verificationSource": ["CEO", "Manager", "TeamMember", "External"],
    "verifiedAt": "2026-05-29T10:00:00Z"
  },
  "expected": {
    "verificationScore": 100,
    "note": "다중 소스라도 VERIFIED 상한 100"
  }
}
```

---

## 단위 테스트 — C4: 최신성

**시간 감쇠 테이블:**
- < 1일: 100점
- 1-3일: 90점
- 4-7일: 80점
- 8-14일: 70점
- 15-30일: 50점
- 31-60일: 30점
- 61-90일: 15점
- 91일+: 5점
- 타임스탬프 없음: 50점 (기본값)

### TC-RF-001: 방금 생성 (0일)

```json
{
  "testId": "TC-RF-001",
  "category": "recency_freshness",
  "description": "방금 생성된 메모리 항목",
  "input": {
    "timestamp": "2026-05-29T14:00:00Z",
    "currentTime": "2026-05-29T14:05:00Z"
  },
  "expected": {
    "recencyScore": 100,
    "ageDays": 0.003
  }
}
```

### TC-RF-002: 1일 경과

```json
{
  "testId": "TC-RF-002",
  "category": "recency_freshness",
  "input": {
    "timestamp": "2026-05-28T10:00:00Z",
    "currentTime": "2026-05-29T10:00:00Z"
  },
  "expected": {
    "recencyScore": 90,
    "ageDays": 1
  }
}
```

### TC-RF-003: 3일 경과

```json
{
  "testId": "TC-RF-003",
  "category": "recency_freshness",
  "input": {
    "ageDays": 3
  },
  "expected": {
    "recencyScore": 90
  }
}
```

### TC-RF-004: 4일 경과 (경계값)

```json
{
  "testId": "TC-RF-004",
  "category": "recency_freshness",
  "description": "4일 경계값 — 90 → 80 전환",
  "input": {
    "ageDays": 4
  },
  "expected": {
    "recencyScore": 80
  }
}
```

### TC-RF-005: 7일 경과

```json
{
  "testId": "TC-RF-005",
  "category": "recency_freshness",
  "input": {
    "ageDays": 7
  },
  "expected": {
    "recencyScore": 80
  }
}
```

### TC-RF-006: 8일 경과 (경계값)

```json
{
  "testId": "TC-RF-006",
  "category": "recency_freshness",
  "description": "8일 경계값 — 80 → 70 전환",
  "input": {
    "ageDays": 8
  },
  "expected": {
    "recencyScore": 70
  }
}
```

### TC-RF-007: 14일 경과

```json
{
  "testId": "TC-RF-007",
  "category": "recency_freshness",
  "input": {
    "ageDays": 14
  },
  "expected": {
    "recencyScore": 70
  }
}
```

### TC-RF-008: 15일 경과 (경계값)

```json
{
  "testId": "TC-RF-008",
  "category": "recency_freshness",
  "description": "15일 경계값 — 70 → 50 전환",
  "input": {
    "ageDays": 15
  },
  "expected": {
    "recencyScore": 50
  }
}
```

### TC-RF-009: 30일 경과

```json
{
  "testId": "TC-RF-009",
  "category": "recency_freshness",
  "input": {
    "ageDays": 30
  },
  "expected": {
    "recencyScore": 50
  }
}
```

### TC-RF-010: 31일 경과 (경계값)

```json
{
  "testId": "TC-RF-010",
  "category": "recency_freshness",
  "description": "31일 경계값 — 50 → 30 전환",
  "input": {
    "ageDays": 31
  },
  "expected": {
    "recencyScore": 30
  }
}
```

### TC-RF-011: 60일 경과

```json
{
  "testId": "TC-RF-011",
  "category": "recency_freshness",
  "input": {
    "ageDays": 60
  },
  "expected": {
    "recencyScore": 30
  }
}
```

### TC-RF-012: 61일 경과 (경계값)

```json
{
  "testId": "TC-RF-012",
  "category": "recency_freshness",
  "description": "61일 경계값 — 30 → 15 전환",
  "input": {
    "ageDays": 61
  },
  "expected": {
    "recencyScore": 15
  }
}
```

### TC-RF-013: 90일 경과

```json
{
  "testId": "TC-RF-013",
  "category": "recency_freshness",
  "input": {
    "ageDays": 90
  },
  "expected": {
    "recencyScore": 15
  }
}
```

### TC-RF-014: 91일 이상 (경계값)

```json
{
  "testId": "TC-RF-014",
  "category": "recency_freshness",
  "description": "91일+ — 최소값 5",
  "input": {
    "ageDays": 91
  },
  "expected": {
    "recencyScore": 5
  }
}
```

### TC-RF-015: 1년 경과

```json
{
  "testId": "TC-RF-015",
  "category": "recency_freshness",
  "input": {
    "ageDays": 365
  },
  "expected": {
    "recencyScore": 5,
    "note": "최소값 5 — 아무리 오래되어도"
  }
}
```

---

## 통합 테스트 — 다중 컴포넌트 조합

**공식:** `Trust Score = SC×0.40 + CD×0.25 + VS×0.20 + RF×0.15`  
**판정 기준:** ≥60 ACCEPT / 40-59 QUARANTINE / <40 REJECT

### TC-INT-001: 최고 품질 메모리 (ACCEPT)

```json
{
  "testId": "TC-INT-001",
  "category": "integration",
  "description": "모든 컴포넌트 최고 점수 — 명백한 ACCEPT",
  "input": {
    "sourceCredibility": 100,
    "contextDepth": 100,
    "verificationStatus": "VERIFIED",
    "ageDays": 0
  },
  "expected": {
    "SC": 100,
    "CD": 100,
    "VS": 100,
    "RF": 100,
    "rawScore": 100.0,
    "finalScore": 100,
    "decision": "ACCEPT"
  }
}
```

### TC-INT-002: 최저 품질 메모리 (REJECT)

```json
{
  "testId": "TC-INT-002",
  "category": "integration",
  "description": "모든 컴포넌트 최저 점수 — 명백한 REJECT",
  "input": {
    "sourceCredibility": 0,
    "contextDepth": 0,
    "verificationStatus": "UNVERIFIED",
    "ageDays": 365
  },
  "expected": {
    "SC": 0,
    "CD": 0,
    "VS": 0,
    "RF": 5,
    "rawScore": 0.75,
    "finalScore": 1,
    "decision": "REJECT"
  }
}
```

### TC-INT-003: 경계값 — 정확히 60점 (ACCEPT 하한)

```json
{
  "testId": "TC-INT-003",
  "category": "integration",
  "description": "최종 점수 정확히 60 — ACCEPT 최소값",
  "input": {
    "SC": 60,
    "CD": 60,
    "VS": 60,
    "RF": 60
  },
  "expected": {
    "rawScore": 60.0,
    "finalScore": 60,
    "decision": "ACCEPT"
  }
}
```

### TC-INT-004: 경계값 — 59점 (QUARANTINE 상한)

```json
{
  "testId": "TC-INT-004",
  "category": "integration",
  "description": "최종 점수 59 — QUARANTINE 상한",
  "input": {
    "SC": 59,
    "CD": 59,
    "VS": 59,
    "RF": 59
  },
  "expected": {
    "rawScore": 59.0,
    "finalScore": 59,
    "decision": "QUARANTINE"
  }
}
```

### TC-INT-005: SC 높음 / CD 낮음 — 혼합

```json
{
  "testId": "TC-INT-005",
  "category": "integration",
  "description": "출처 신뢰도 높고 내용 빈약한 경우",
  "input": {
    "SC": 90,
    "CD": 20,
    "VS": "VERIFIED",
    "ageDays": 2
  },
  "expected": {
    "SC_score": 90,
    "CD_score": 20,
    "VS_score": 100,
    "RF_score": 90,
    "rawScore": 90*0.40 + 20*0.25 + 100*0.20 + 90*0.15,
    "finalScore": 70,
    "decision": "ACCEPT",
    "note": "36 + 5 + 20 + 13.5 = 74.5 → 75"
  }
}
```

### TC-INT-006: SC 낮음 / CD 높음 — 혼합

```json
{
  "testId": "TC-INT-006",
  "category": "integration",
  "description": "출처 낮고 내용 풍부한 경우",
  "input": {
    "SC": 20,
    "CD": 100,
    "VS_score": 50,
    "RF_score": 100
  },
  "expected": {
    "rawScore": 20*0.40 + 100*0.25 + 50*0.20 + 100*0.15,
    "finalScore": 63,
    "decision": "ACCEPT",
    "note": "8 + 25 + 10 + 15 = 58 → QUARANTINE 경계"
  }
}
```

### TC-INT-007: 미검증 + 오래된 메모리

```json
{
  "testId": "TC-INT-007",
  "category": "integration",
  "description": "검증 안 됨 + 60일 경과",
  "input": {
    "SC": 85,
    "CD": 60,
    "VS_score": 0,
    "RF_score": 30
  },
  "expected": {
    "rawScore": 85*0.40 + 60*0.25 + 0*0.20 + 30*0.15,
    "finalScore": 53,
    "decision": "QUARANTINE",
    "note": "34 + 15 + 0 + 4.5 = 53.5 → 54"
  }
}
```

### TC-INT-008: CEO 메시지 + 최신 + 미검증

```json
{
  "testId": "TC-INT-008",
  "category": "integration",
  "description": "CEO 최신 메시지이지만 검증 미완료",
  "input": {
    "SC": 100,
    "CD": 50,
    "VS_score": 0,
    "RF_score": 100
  },
  "expected": {
    "rawScore": 100*0.40 + 50*0.25 + 0*0.20 + 100*0.15,
    "finalScore": 68,
    "decision": "ACCEPT",
    "note": "40 + 12.5 + 0 + 15 = 67.5 → 68"
  }
}
```

### TC-INT-009: 외부인 오래된 메시지

```json
{
  "testId": "TC-INT-009",
  "category": "integration",
  "description": "외부인이 보낸 91일 지난 미검증 메시지",
  "input": {
    "SC": 25,
    "CD": 30,
    "VS_score": 0,
    "RF_score": 5
  },
  "expected": {
    "rawScore": 25*0.40 + 30*0.25 + 0*0.20 + 5*0.15,
    "finalScore": 18,
    "decision": "REJECT",
    "note": "10 + 7.5 + 0 + 0.75 = 18.25 → 18"
  }
}
```

### TC-INT-010: 부분 검증 + 중간 나이

```json
{
  "testId": "TC-INT-010",
  "category": "integration",
  "description": "부분 검증 + 14일 경과 + 중간 출처",
  "input": {
    "SC": 70,
    "CD": 65,
    "VS_score": 50,
    "RF_score": 70
  },
  "expected": {
    "rawScore": 70*0.40 + 65*0.25 + 50*0.20 + 70*0.15,
    "finalScore": 65,
    "decision": "ACCEPT",
    "note": "28 + 16.25 + 10 + 10.5 = 64.75 → 65"
  }
}
```

### TC-INT-011: 배치 처리 — 1000개 항목

```json
{
  "testId": "TC-INT-011",
  "category": "integration",
  "description": "배치 처리 1000개 항목 성능 테스트",
  "input": {
    "batchSize": 1000,
    "chunkSize": 50
  },
  "expected": {
    "totalItems": 1000,
    "chunksProcessed": 20,
    "maxDurationMs": 2000,
    "note": "50개씩 20청크, 총 2초 이내"
  }
}
```

### TC-INT-012: Phase 2A → 2C 파이프라인

```json
{
  "testId": "TC-INT-012",
  "category": "integration",
  "description": "Phase 2A 메시지 수집 → 2C 신뢰도 점수 파이프라인",
  "input": {
    "phase2a_message": {
      "channel": "telegram_ceo_personal",
      "sender": "CEO_User",
      "content": "내일 회의 취소. @팀 모두 공지.",
      "timestamp": "2026-05-29T09:00:00Z"
    }
  },
  "expected": {
    "pipelineSteps": ["Phase2A 수신", "Phase2B 중복 확인", "Phase2C 점수 계산"],
    "finalDecision": "ACCEPT",
    "minScore": 70
  }
}
```

### TC-INT-013: Phase 2B 중복 감지 후 점수 조정

```json
{
  "testId": "TC-INT-013",
  "category": "integration",
  "description": "Phase 2B에서 중복 감지 시 VS 점수 조정",
  "input": {
    "SC": 85,
    "CD": 70,
    "VS_score": 100,
    "RF_score": 90,
    "duplicateDetected": true,
    "duplicateSimilarity": 0.92
  },
  "expected": {
    "VS_adjusted": 50,
    "rawScore": 85*0.40 + 70*0.25 + 50*0.20 + 90*0.15,
    "finalScore": 75,
    "decision": "ACCEPT",
    "note": "중복 감지로 VS 100→50 강등"
  }
}
```

### TC-INT-014: LRU 캐시 히트

```json
{
  "testId": "TC-INT-014",
  "category": "integration",
  "description": "동일 sourceId 재요청 시 캐시에서 반환",
  "input": {
    "sourceId": "telegram_ceo_personal_userId123",
    "firstRequest": true
  },
  "expected": {
    "cacheHit": true,
    "cacheLayer": "L1_source_scores",
    "ttl": 3600,
    "note": "두 번째 요청부터 캐시 반환, DB 조회 없음"
  }
}
```

### TC-INT-015: 동시 요청 처리 (Promise.all)

```json
{
  "testId": "TC-INT-015",
  "category": "integration",
  "description": "4개 컴포넌트 병렬 계산 검증",
  "input": {
    "parallelComponents": ["SC", "CD", "VS", "RF"],
    "concurrencyMode": "Promise.all"
  },
  "expected": {
    "executionOrder": "parallel",
    "maxDurationMs": 50,
    "note": "순차 처리 대비 3-4배 빠름"
  }
}
```

### TC-INT-016: 가중치 합 검증

```json
{
  "testId": "TC-INT-016",
  "category": "integration",
  "description": "4개 가중치 합이 항상 1.0인지 확인",
  "input": {
    "weights": {
      "SC": 0.40,
      "CD": 0.25,
      "VS": 0.20,
      "RF": 0.15
    }
  },
  "expected": {
    "weightSum": 1.0,
    "assertion": "SC_weight + CD_weight + VS_weight + RF_weight === 1.0"
  }
}
```

### TC-INT-017: 최종 점수 반올림

```json
{
  "testId": "TC-INT-017",
  "category": "integration",
  "description": "소수점 점수 반올림 처리",
  "input": {
    "SC": 73,
    "CD": 68,
    "VS_score": 50,
    "RF_score": 80
  },
  "expected": {
    "rawScore": 73*0.40 + 68*0.25 + 50*0.20 + 80*0.15,
    "rawScoreCalc": 29.2 + 17.0 + 10.0 + 12.0,
    "rawScoreValue": 68.2,
    "finalScore": 68,
    "decision": "ACCEPT"
  }
}
```

### TC-INT-018: JSONL 직렬화

```json
{
  "testId": "TC-INT-018",
  "category": "integration",
  "description": "신뢰도 결과 JSONL 저장 형식 확인",
  "input": {
    "scoreId": "ts_20260529_abc123",
    "finalScore": 87,
    "decision": "ACCEPT"
  },
  "expected": {
    "outputFile": "trust_scores.jsonl",
    "format": "single_line_json",
    "requiredFields": ["schemaVersion", "scoreId", "trustScore", "decision", "components", "calculatedAt"]
  }
}
```

### TC-INT-019: 거부 항목 격리 로그

```json
{
  "testId": "TC-INT-019",
  "category": "integration",
  "description": "REJECT 판정 시 reject_log.jsonl에 기록",
  "input": {
    "finalScore": 25,
    "decision": "REJECT"
  },
  "expected": {
    "outputFile": "reject_log.jsonl",
    "requiredFields": ["scoreId", "finalScore", "rejectReason", "rejectedAt"]
  }
}
```

### TC-INT-020: Supabase 동기화

```json
{
  "testId": "TC-INT-020",
  "category": "integration",
  "description": "JSONL → Supabase trust_scores 테이블 동기화",
  "input": {
    "localJsonlCount": 100,
    "syncMode": "upsert"
  },
  "expected": {
    "supabaseRowCount": 100,
    "duplicatesHandled": true,
    "rlsApplied": true
  }
}
```

### TC-INT-021: 가중치 동적 조정 이후 재계산

```json
{
  "testId": "TC-INT-021",
  "category": "integration",
  "description": "월간 가중치 조정 후 기존 항목 재계산",
  "input": {
    "oldWeights": {"SC": 0.40, "CD": 0.25, "VS": 0.20, "RF": 0.15},
    "newWeights": {"SC": 0.42, "CD": 0.23, "VS": 0.20, "RF": 0.15},
    "SC": 80,
    "CD": 70,
    "VS_score": 100,
    "RF_score": 90
  },
  "expected": {
    "oldScore": 80*0.40 + 70*0.25 + 100*0.20 + 90*0.15,
    "newScore": 80*0.42 + 70*0.23 + 100*0.20 + 90*0.15,
    "delta": "신가중치 적용 시 약 +1.0"
  }
}
```

### TC-INT-022: API POST /api/v1/trust-score 응답 구조

```json
{
  "testId": "TC-INT-022",
  "category": "integration",
  "description": "신뢰도 점수 API 응답 구조 확인",
  "input": {
    "endpoint": "POST /api/v1/trust-score",
    "body": {
      "content": "테스트 메시지",
      "channel": "telegram_team_channel",
      "senderRole": "TeamMember",
      "timestamp": "2026-05-29T10:00:00Z"
    }
  },
  "expected": {
    "statusCode": 200,
    "responseStructure": {
      "success": true,
      "scoreId": "string",
      "trustScore": "number (0-100)",
      "decision": "ACCEPT|QUARANTINE|REJECT",
      "components": "object",
      "processingTimeMs": "number (<50)"
    }
  }
}
```

### TC-INT-023: 성능 — 단일 항목 50ms 이내

```json
{
  "testId": "TC-INT-023",
  "category": "integration",
  "description": "단일 항목 신뢰도 점수 계산 성능 목표",
  "input": {
    "singleItem": true,
    "cacheWarm": false
  },
  "expected": {
    "maxProcessingMs": 50,
    "p99MaxMs": 100,
    "note": "목표: 50ms 이내, SLA: 100ms"
  }
}
```

### TC-INT-024: 메모리 항목 업데이트 후 재계산

```json
{
  "testId": "TC-INT-024",
  "category": "integration",
  "description": "메모리 항목 내용 수정 시 신뢰도 자동 재계산",
  "input": {
    "itemId": "mem_001",
    "updateType": "content_edit",
    "oldScore": 75,
    "newContent": "더 상세한 내용 추가됨"
  },
  "expected": {
    "recalculationTriggered": true,
    "newScore": "gte_75",
    "note": "내용 풍부 → CD 점수 상승 → 전체 점수 상승 예상"
  }
}
```

### TC-INT-025: 동시 100개 요청 처리

```json
{
  "testId": "TC-INT-025",
  "category": "integration",
  "description": "동시 100개 요청 처리 안정성",
  "input": {
    "concurrentRequests": 100,
    "requestIntervalMs": 0
  },
  "expected": {
    "allResponded": true,
    "errorRate": 0,
    "maxTotalDurationMs": 5000
  }
}
```

### TC-INT-026: QUARANTINE 항목 알림

```json
{
  "testId": "TC-INT-026",
  "category": "integration",
  "description": "QUARANTINE 판정 시 알림 발송 확인",
  "input": {
    "finalScore": 55,
    "decision": "QUARANTINE",
    "notificationEnabled": true
  },
  "expected": {
    "notificationSent": true,
    "notificationType": "quarantine_alert",
    "outputFile": "quarantine_log.jsonl"
  }
}
```

### TC-INT-027: 가중치 이력 저장

```json
{
  "testId": "TC-INT-027",
  "category": "integration",
  "description": "가중치 변경 시 weight_history.jsonl에 기록",
  "input": {
    "weightChangeEvent": true,
    "newWeights": {"SC": 0.42, "CD": 0.23, "VS": 0.20, "RF": 0.15}
  },
  "expected": {
    "outputFile": "weight_history.jsonl",
    "requiredFields": ["changedAt", "oldWeights", "newWeights", "changeReason"]
  }
}
```

### TC-INT-028: GET /api/v1/trust-report 응답

```json
{
  "testId": "TC-INT-028",
  "category": "integration",
  "description": "신뢰도 리포트 API 응답 구조",
  "input": {
    "endpoint": "GET /api/v1/trust-report",
    "params": {"period": "weekly"}
  },
  "expected": {
    "statusCode": 200,
    "responseStructure": {
      "period": "string",
      "totalItems": "number",
      "acceptCount": "number",
      "quarantineCount": "number",
      "rejectCount": "number",
      "averageScore": "number",
      "items": "array"
    }
  }
}
```

### TC-INT-029: PATCH /api/v1/trust-score/{id} 검증 상태 업데이트

```json
{
  "testId": "TC-INT-029",
  "category": "integration",
  "description": "검증 상태 업데이트 후 점수 재계산",
  "input": {
    "endpoint": "PATCH /api/v1/trust-score/mem_001",
    "body": {"verificationStatus": "VERIFIED"}
  },
  "expected": {
    "statusCode": 200,
    "recalculated": true,
    "oldDecision": "QUARANTINE",
    "newDecision": "ACCEPT"
  }
}
```

### TC-INT-030: 헬스체크 엔드포인트

```json
{
  "testId": "TC-INT-030",
  "category": "integration",
  "description": "GET /health 응답 확인",
  "input": {
    "endpoint": "GET /health"
  },
  "expected": {
    "statusCode": 200,
    "body": {
      "status": "healthy",
      "service": "trust-score-calculator",
      "port": 3011,
      "version": "2C-1.0"
    }
  }
}
```

---

## 엣지 케이스 테스트

### TC-EDGE-001: 새로 생성된 메모리 (brand-new)

```json
{
  "testId": "TC-EDGE-001",
  "category": "edge_cases",
  "description": "방금 생성된 메모리 — 최신성 최고, 검증 없음",
  "input": {
    "SC": 85,
    "CD": 40,
    "VS_score": 0,
    "RF_score": 100,
    "ageDays": 0,
    "verificationStatus": "UNVERIFIED"
  },
  "expected": {
    "rawScore": 85*0.40 + 40*0.25 + 0*0.20 + 100*0.15,
    "finalScore": 59,
    "decision": "QUARANTINE",
    "note": "34 + 10 + 0 + 15 = 59 — QUARANTINE 상한"
  }
}
```

### TC-EDGE-002: 오래된 메모리 (stale)

```json
{
  "testId": "TC-EDGE-002",
  "category": "edge_cases",
  "description": "1년 이상 된 미검증 메모리",
  "input": {
    "SC": 80,
    "CD": 70,
    "VS_score": 0,
    "RF_score": 5,
    "ageDays": 400
  },
  "expected": {
    "rawScore": 80*0.40 + 70*0.25 + 0*0.20 + 5*0.15,
    "finalScore": 50,
    "decision": "QUARANTINE",
    "note": "32 + 17.5 + 0 + 0.75 = 50.25 → 50"
  }
}
```

### TC-EDGE-003: 일관성 없는 업데이트 (inconsistent updates)

```json
{
  "testId": "TC-EDGE-003",
  "category": "edge_cases",
  "description": "짧은 시간 내 반복 수정 — 불일치 신호",
  "input": {
    "updateCount": 5,
    "updateWindowMinutes": 10,
    "inconsistencyDetected": true
  },
  "expected": {
    "VS_adjusted": 0,
    "inconsistencyFlag": true,
    "note": "10분 내 5회 수정 → 불일치 → VS 0으로 강등"
  }
}
```

### TC-EDGE-004: 충돌하는 소스 (conflicting sources)

```json
{
  "testId": "TC-EDGE-004",
  "category": "edge_cases",
  "description": "두 고신뢰 소스가 상충하는 정보 제공",
  "input": {
    "source1": {"channel": "telegram_ceo_personal", "content": "회의 내일 오전 10시"},
    "source2": {"channel": "telegram_team_channel", "senderRole": "Manager", "content": "회의 내일 오후 2시"},
    "conflictDetected": true
  },
  "expected": {
    "bothScores_VS_adjusted": 50,
    "conflictFlag": true,
    "resolution": "QUARANTINE until manual verification",
    "note": "충돌 시 양쪽 모두 PARTIALLY_VERIFIED 취급"
  }
}
```

### TC-EDGE-005: null 타임스탬프

```json
{
  "testId": "TC-EDGE-005",
  "category": "edge_cases",
  "description": "타임스탬프 없는 메시지 처리",
  "input": {
    "timestamp": null,
    "SC": 70,
    "CD": 60,
    "VS_score": 100
  },
  "expected": {
    "RF_score": 50,
    "note": "타임스탬프 없음 → RF 기본값 50"
  }
}
```

### TC-EDGE-006: undefined 입력값

```json
{
  "testId": "TC-EDGE-006",
  "category": "edge_cases",
  "description": "컴포넌트 값이 undefined인 경우",
  "input": {
    "SC": undefined,
    "CD": 60,
    "VS_score": 100,
    "RF_score": 80
  },
  "expected": {
    "SC_fallback": 20,
    "note": "undefined → unknown 채널 기본값 20"
  }
}
```

### TC-EDGE-007: NaN 점수 입력

```json
{
  "testId": "TC-EDGE-007",
  "category": "edge_cases",
  "description": "NaN 값 입력 시 안전 처리",
  "input": {
    "SC": NaN,
    "CD": NaN,
    "VS_score": NaN,
    "RF_score": NaN
  },
  "expected": {
    "finalScore": 0,
    "decision": "REJECT",
    "errorHandled": true,
    "note": "NaN → 0으로 안전 처리"
  }
}
```

### TC-EDGE-008: 음수 입력값

```json
{
  "testId": "TC-EDGE-008",
  "category": "edge_cases",
  "description": "음수 점수 입력 — 하한 0 클램프",
  "input": {
    "SC": -10,
    "CD": -50,
    "VS_score": -100,
    "RF_score": -200
  },
  "expected": {
    "SC_clamped": 0,
    "CD_clamped": 0,
    "VS_clamped": 0,
    "RF_clamped": 0,
    "finalScore": 0,
    "decision": "REJECT"
  }
}
```

### TC-EDGE-009: 100 초과 입력값

```json
{
  "testId": "TC-EDGE-009",
  "category": "edge_cases",
  "description": "100 초과 점수 입력 — 상한 100 클램프",
  "input": {
    "SC": 150,
    "CD": 200,
    "VS_score": 110,
    "RF_score": 999
  },
  "expected": {
    "SC_clamped": 100,
    "CD_clamped": 100,
    "VS_clamped": 100,
    "RF_clamped": 100,
    "finalScore": 100,
    "decision": "ACCEPT"
  }
}
```

### TC-EDGE-010: 미래 타임스탬프

```json
{
  "testId": "TC-EDGE-010",
  "category": "edge_cases",
  "description": "미래 시간으로 설정된 타임스탬프",
  "input": {
    "timestamp": "2027-01-01T00:00:00Z",
    "currentTime": "2026-05-29T00:00:00Z"
  },
  "expected": {
    "RF_score": 100,
    "note": "미래 타임스탬프 → ageDays < 0 → RF 100"
  }
}
```

### TC-EDGE-011: 빈 content 문자열

```json
{
  "testId": "TC-EDGE-011",
  "category": "edge_cases",
  "description": "빈 문자열 content",
  "input": {
    "content": "",
    "channel": "telegram_team_channel"
  },
  "expected": {
    "CD_score": 0,
    "note": "빈 content → 모든 신호 false → CD 0"
  }
}
```

### TC-EDGE-012: 매우 긴 content

```json
{
  "testId": "TC-EDGE-012",
  "category": "edge_cases",
  "description": "10,000자 이상 매우 긴 메시지",
  "input": {
    "content": "A".repeat(10000),
    "channel": "telegram_team_channel"
  },
  "expected": {
    "processingTimeMs_max": 50,
    "errorOccurred": false,
    "note": "긴 content도 50ms 이내 처리"
  }
}
```

### TC-EDGE-013: 특수문자 포함 content

```json
{
  "testId": "TC-EDGE-013",
  "category": "edge_cases",
  "description": "SQL injection 시도가 포함된 content",
  "input": {
    "content": "'; DROP TABLE trust_scores; --",
    "channel": "telegram_team_channel"
  },
  "expected": {
    "sanitized": true,
    "injectionBlocked": true,
    "errorOccurred": false
  }
}
```

### TC-EDGE-014: 동시 같은 항목 쓰기

```json
{
  "testId": "TC-EDGE-014",
  "category": "edge_cases",
  "description": "동일 itemId 동시 업데이트 — 경쟁 조건",
  "input": {
    "itemId": "mem_concurrent_001",
    "concurrentUpdates": 5
  },
  "expected": {
    "dataIntegrity": true,
    "finalStateConsistent": true,
    "note": "마지막 쓰기 승리 또는 낙관적 잠금"
  }
}
```

### TC-EDGE-015: Phase 2B 서비스 다운 시 폴백

```json
{
  "testId": "TC-EDGE-015",
  "category": "edge_cases",
  "description": "Phase 2B (중복 감지 서비스, PORT 3010) 다운 시",
  "input": {
    "phase2b_available": false,
    "fallbackMode": true
  },
  "expected": {
    "VS_fallback": 50,
    "processingContinued": true,
    "note": "Phase 2B 불가 시 VS 기본값 50으로 폴백"
  }
}
```

### TC-EDGE-016: 소수점 경계 반올림

```json
{
  "testId": "TC-EDGE-016",
  "category": "edge_cases",
  "description": "정확히 59.5점 — 반올림 결과 60 ACCEPT",
  "input": {
    "rawScore": 59.5
  },
  "expected": {
    "finalScore": 60,
    "decision": "ACCEPT",
    "note": "59.5 반올림 → 60 → ACCEPT"
  }
}
```

### TC-EDGE-017: 채널 null 입력

```json
{
  "testId": "TC-EDGE-017",
  "category": "edge_cases",
  "description": "채널 정보 null",
  "input": {
    "channel": null,
    "senderRole": "TeamMember"
  },
  "expected": {
    "SC_base": 20,
    "note": "null 채널 → unknown 기본값 20"
  }
}
```

### TC-EDGE-018: senderRole 대소문자

```json
{
  "testId": "TC-EDGE-018",
  "category": "edge_cases",
  "description": "senderRole 대소문자 정규화",
  "input": {
    "channel": "telegram_team_channel",
    "senderRole": "ceo"
  },
  "expected": {
    "SC": 95,
    "note": "소문자 'ceo' → CEO 정규화 → +10 보정 적용"
  }
}
```

### TC-EDGE-019: 검증 횟수 소수점

```json
{
  "testId": "TC-EDGE-019",
  "category": "edge_cases",
  "description": "검증 횟수가 소수점인 경우 (잘못된 입력)",
  "input": {
    "verificationCount": 5.7
  },
  "expected": {
    "verificationCount_used": 5,
    "note": "소수점 버림 → 정수 처리"
  }
}
```

### TC-EDGE-020: 전체 파이프라인 오류 복구

```json
{
  "testId": "TC-EDGE-020",
  "category": "edge_cases",
  "description": "계산 중간 오류 발생 시 부분 점수 반환 금지",
  "input": {
    "SC": 80,
    "CD_throws": true,
    "VS_score": 100,
    "RF_score": 90
  },
  "expected": {
    "errorHandled": true,
    "partialScoreReturned": false,
    "responseStatusCode": 500,
    "note": "중간 오류 시 전체 실패 처리, 부분 점수 반환 금지"
  }
}
```

---

## 테스트 케이스 요약

| 카테고리 | 케이스 수 | 범위 |
|---------|----------|------|
| C1 출처 신뢰도 단위 테스트 | 15 | 채널, 역할, 보너스, 패널티 |
| C2 내용 풍부도 단위 테스트 | 15 | 신호 조합, 상한 처리 |
| C3 검증 일관성 단위 테스트 | 10 | 3-tier, 격리 규칙, 모순 |
| C4 최신성 단위 테스트 | 15 | 시간 감쇠 전 구간 |
| 통합 테스트 | 30 | 다중 컴포넌트, API, 파이프라인 |
| 엣지 케이스 | 20 | null, NaN, 음수, 충돌, 경쟁 |
| **합계** | **105** | **전 범위 커버리지** |

---

**작성자:** Memory System Specialist (Phase C #13)  
**검토자:** Evaluator AI Agent (QA Specialist — Phase C #14)  
**마감:** 2026-05-30 18:00 KST
