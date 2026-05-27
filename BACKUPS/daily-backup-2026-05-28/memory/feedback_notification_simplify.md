---
name: Notification simplification
description: 반복된 system notification 최소화, 필요한 정보만 간단히 표시
type: feedback
originSessionId: 8a949884-4c4a-4a6f-8b6e-860a7dd5de3e
---
## 규칙

**System notification이나 체크 결과가 반복되면 한 번만 보여주고, 필요한 핵심만 간단히 전달한다.**

- 예: Vercel 빌드 상태 10번 확인 → 최신 1개만 표시
- 예: deployment status 10개 메시지 → "Preview 배포 중 (예상 2-3분)" 한 줄
- 진행 상황은 필요시만 (대기 상태, 선택 필요 시), 일상적 진행은 조용히

**Why:** 반복 정보는 시각적 소음만 되고, 실제 필요한 건 "지금 뭘 해야 하나" / "언제 준비됨" 같은 actionable 정보뿐.

**How to apply:**
1. System notification 결과 → 최신만 한 번 표시
2. 필요한 정보: 상태 + ETA + 사용자 액션 필요시만
3. 진행 중 자동으로 진행되는 작업 → 완료 후에만 보고

---

**기록날짜:** 2026-05-14 23:29
**출처:** 유저 직접 지시
