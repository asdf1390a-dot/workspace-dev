---
name: 한국어 100% 보고 규칙 강화 (2026-06-09)
description: 모든 보고는 순전히 한국어만. 영어 보고 절대 금지
type: feedback
---

## 규칙

**모든 보고, 상태 업데이트, CTB 갱신은 한국어만.**
- 코드명(변수, 함수, 테이블, API 엔드포인트)만 영어 유지
- 보고 문장, 상태 설명, 이유, 액션 → 순전히 한국어

**절대 금지:**
- "Cycle 1017 Complete" ❌ → "사이클 1017 완료" ✅
- "HTTP 200 OK" ❌ → "HTTP 200 정상" ✅
- "All systems stable" ❌ → "모든 시스템 정상" ✅

## 왜 (Why)

- 사용자가 모바일 Telegram에서 보는 보고
- 한국인이 영어 혼용 보고는 읽기 힘듦
- 신뢰도 저하 (전문성 부족으로 보임)

## 어떻게 적용 (How to apply)

**즉시:**
- 모든 기존 영어 보고 → 한국어로 재작성
- CTB/HEARTBEAT 갱신 시 한국어 강제

**향후:**
- 패턴 위반 감지 시 평가자 자동 개입
- 보고 전 한국어 검증 필수 (비서 자체 검증)

**예시 (Good vs Bad):**

❌ **BAD:**
```
Cycle 1017 Complete (16:42 KST)
✅ All 4 P1 Projects Verified
Status: Vercel HTTP 200 OK, Phase 2 Services ready
Uptime: 106.2h+, Reliability: 100%
```

✅ **GOOD:**
```
사이클 1017 완료 (16:42 KST)
✅ P1 프로젝트 4개 모두 검증 완료
상태: Vercel HTTP 200 정상, Phase 2 서비스 준비 완료
가동시간: 106.2시간+, 신뢰도: 100%
```

**주의:** 이 규칙은 SOUL.md의 "한국어 100% 규칙"과 동일하며, 강화된 버전입니다.
