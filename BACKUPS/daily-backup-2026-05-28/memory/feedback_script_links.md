---
name: 스크립트 링크 제공 방식
description: SQL/스크립트 전달 시 채팅에 코드 붙여넣기 대신 GitHub raw 링크 제공
type: feedback
originSessionId: 6a896707-173f-456e-b2a0-8d6570dc4d50
---
SQL 마이그레이션이나 스크립트 전달 시:
1. **GitHub raw 링크 우선**: https://raw.githubusercontent.com/... (클릭하면 다운로드/보기 가능)
2. **아니면 터미널 복사 명령어**: `cat 파일경로` 명령으로 내용 출력 → 사용자가 마우스 드래그 선택 → Ctrl+C 복사 → Supabase에 Ctrl+V 붙여넣기

채팅에 긴 SQL 코드를 직접 붙여넣기는 절대 X.

**Why:** 유저가 "다운링크"를 원함. 파일 열기 방법을 모를 수 있으므로, 클릭하거나 터미널 명령 하나만 실행하면 되도록 단순화.

**How to apply:** 항상 GitHub 링크(우선) 또는 `cat 명령어` 형태로만 제시. 파일경로 단독으로는 안내하지 말 것.
