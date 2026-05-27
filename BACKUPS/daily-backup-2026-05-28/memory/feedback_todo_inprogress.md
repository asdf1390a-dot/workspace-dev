---
name: 할일 진행중 유지 원칙
description: 미착수 태스크는 즉시 in_progress로 전환, 대기/pending 상태로 두지 말 것
type: feedback
originSessionId: 6a896707-173f-456e-b2a0-8d6570dc4d50
---
미착수(pending) 태스크가 있으면 즉시 in_progress로 전환하고 작업 착수.
0건 진행중인 상태는 허용되지 않음 — 할 일이 있으면 반드시 하나 이상 in_progress 상태여야 함.

**Why:** 유저가 진행중 0건은 말이 안 된다고 명시적으로 지적. 대기/미착수로 두는 것 자체가 잘못된 상태.

**How to apply:** 태스크 생성 즉시 착수 가능한 것은 in_progress로 설정하고 작업 시작. 완료 즉시 다음 pending 태스크를 in_progress로 전환.
