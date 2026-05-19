---
name: Read all messages first, update status board before working
description: Always read all user messages in order first, update status board, then work — so nothing gets missed
type: feedback
originSessionId: 9d7a6304-ec0b-41d1-b028-7428c01200b3
---
채팅 메시지를 전부 순서대로 읽고 업무현황에 먼저 반영한 뒤 작업을 시작할 것.

**Why:** 유저가 "채팅친거 전부 우선순위로 읽고 업무현황 업데이트 먼저 해놓아야 빼먹었는지 알 수 있다"고 명시적으로 요청. 실제로 PAT 메시지를 놓쳐서 재요청하게 만든 사례 발생.

**How to apply:**
1. 대화에 여러 메시지가 쌓였을 때 → 먼저 전체 메시지 훑기
2. 각 메시지에서 액션 항목 추출 → 현황판에 반영
3. 현황 정리 후 작업 시작
4. 이미 처리된 것과 안 된 것이 명확히 보이게 유지
