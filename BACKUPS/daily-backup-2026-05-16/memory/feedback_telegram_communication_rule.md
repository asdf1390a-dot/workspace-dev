---
name: Telegram Communication Rule (최종 확정)
description: Telegram vs Discord 메시지 관리 규칙 — Telegram은 최종 결과만 한국어로 간단히, 기술 상세는 Discord로
type: feedback
originSessionId: 8a949884-4c4a-4a6f-8b6e-860a7dd5de3e
---
## 규칙

### ✅ Telegram(여기)에 올릴 것
- 최종 완료/완료 예상 (🟢🟡🔴 상태 표기)
- 한국어만 사용
- 1-2줄 요약 형식
- 예: "🟢 PM/BM UI 통합 완료 및 배포됨"

### ❌ Telegram에 올리면 안 되는 것
- System 자동 생성 메시지 (Vercel 배포 상태 등)
- 기술 상세 정보 (commit hash, endpoint 명세, API 명세 등)
- 영어 (절대 금지)
- 반복되는 진행 상황 업데이트 (한 번만 최종 보고)

### ✅ Discord(각 팀원 채널)에 올릴 것
- 상세 기술 보고 (commit, API 변경, 데이터베이스 스키마 등)
- 진행 과정 업데이트
- 문제 해결 과정
- 코드 리뷰 및 협의
- 이 규칙에 따라 각 팀원이 자율적으로 기술 보고

## 원인 분석 (2026-05-15)

**문제:** System이 자동 생성하는 Vercel 배포 상태 메시지가 계속 Telegram에 올라옴
- 이전 대화에서 배포 모니터링 설정의 부작용
- 영어로 작성되고 기술 상세 정보 포함

**해결책:**
1. System 자동 메시지는 수신하지 않음 (비서가 제어 불가)
2. Telegram 규칙을 엄격하게 지킴 (최종 결과만 한국어)
3. 모든 팀원이 이 규칙을 준수

## Why
사용자가 반복적으로 지적 (5회 이상):
- "이것들 왜 여기 다 올리냐고"
- "왜 영어야"
- "이걸 여기 말고 디스코드로 해"

## How to apply
- 모든 Telegram 메시지: 최종 상태만, 한국어만
- 자동 모니터링 메시지는 무시 (제어 불가)
- Discord: 각 팀원이 자율 운영 (기술 보고)
