---
name: 신규 지시 수신 프로토콜
description: 지시 받으면 즉시 active_work_tracking.md 동기화 및 확인 (Context Loss 방지)
type: feedback
originSessionId: 8a949884-4c4a-4a6f-8b6e-860a7dd5de3e
---
## 프로토콜

### 1단계: 지시 수신
- 사용자 메시지 읽음

### 2단계: 즉시 동기화
**해야 할 것:**
- active_work_tracking.md 열기
- 🟡🔴 해당 섹션에 신규 항목 추가
- 기존 항목과의 우선순위/의존성 재평가
- memory 관련 파일 업데이트 (user_role, project_*, feedback_*)

**금지:**
- 지시를 받았는데 나중에 추가하기 (절대 금지)
- 지시를 까먹기

### 3단계: 명시적 확인
- 지시 내용 + 우선순위 + 예상 시간 summary 출력
- 사용자 확인 대기 또는 즉시 진행

### 4단계: 정기 검증
- 매 메시지 끝: "현황판 확인됨 (X개 항목)" 표기
- 주 1회: 빠진 지시 없는지 double-check

## Why
- 이전: NH증권 프로젝트 → 사용자가 말할 때까지 forgot
- 손실: 시간 낭비 + 사용자 신뢰 저하
- 해결: 지시→즉시→memory→확인

## How to apply
- 모든 신규 지시마다 이 프로토콜 실행
- Telegram/Discord/File upload 모두 동일
- 단순 질문과 지시 구분: 지시 = "해줘", "진행해", "개선해" etc.
