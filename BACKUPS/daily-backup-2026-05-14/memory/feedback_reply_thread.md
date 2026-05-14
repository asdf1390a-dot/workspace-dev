---
name: 리플라이로 답변
description: 유저 메시지에 항상 리플라이(reply) 형태로 답변할 것
type: feedback
originSessionId: 6a896707-173f-456e-b2a0-8d6570dc4d50
---
유저가 업무를 주거나 메시지를 보내면 항상 해당 메시지에 리플라이로 답변한다.

**Why:** 유저가 "답변달때는 내가 업무준거 리플라이로 해서 답변달아 무조건" 명시 요청. 텔레그램 모바일에서 어떤 업무에 대한 답변인지 맥락 파악이 쉬워짐.

**How to apply:** 메시지 전송 시 reply_to_message_id를 항상 원본 메시지 ID로 설정. mcp__openclaw__message 또는 message tool 사용 시 replyToId 파라미터 활용.
