---
name: Auto status board on work completion
description: Show status board automatically whenever work stops / a task batch completes
type: feedback
originSessionId: 9d7a6304-ec0b-41d1-b028-7428c01200b3
---
작업이 끝나거나 멈출 때마다 현황판을 자동으로 띄워라. 별도 "현황" 요청 없이도.

**Why:** 유저가 "일하다가 멈추면 현황 띄워" 라고 명시적으로 요청함.

**색상 표기 방식 (이모지 컬러 코드):**
- 🟢 완료
- 🟡 진행중 / 대기 중 (내 입력 필요)
- 🔴 미착수 / 블로킹

**How to apply:** 에이전트 작업 완료 보고, 파일 생성/수정 완료, 대기 상태 진입 등 작업이 마무리되는 시점마다 현황 보드를 응답 끝에 포함시킬 것. 유저가 현황을 먼저 요청한 경우는 별도 추가 불필요. 색상 이모지 컬러 코드 반드시 사용.

**추가 (2026-05-12):** 유저 액션 대기 시에도 "대기 중: [이유]" 명시 + 현황판 출력. 내가 일하는지/노는지/멈춘 건지 모바일에서 항상 알 수 있어야 함.
