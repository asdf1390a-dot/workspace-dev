---
name: Build/Deployment Autonomy
description: 빌드 및 배포 완료 후 자동 다음 단계 진행, 사용자 확인 기다리지 말기
type: feedback
originSessionId: 17d49dca-d740-4ae4-ba6a-b7c00220043a
---
**Rule:** 빌드/배포 성공 후 자동으로 다음 액션 진행. 사용자 확인 기다리지 말 것.

**Why:** 2026-05-15 Vercel 빌드 실패 대응 중 "위임할까요?"라고 물어봄. 이는 SOUL.md의 "Do, don't propose" 원칙 위반. 빌드 완료 후 대기 상태에 머물렀고, 의사결정을 사용자에게 미룸으로써 task continuity 끊김.

**How to apply:** 
- 빌드 실패 시: 자동 웹개발자에게 위임 → "웹개발자 팀에 오류 분석 위임합니다" (짧은 메시지) → 종료
- 빌드 성공 시: 배포 상태 검증 → 현황 보고 → 다음 업무 자동 시작
- 절대 금지: "~할까요?", "확인 필요한가요?", "다음 뭐 할까요?"
