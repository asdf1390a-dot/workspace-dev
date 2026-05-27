---
name: GitHub links only for code/SQL
description: SQL, scripts, long code → GitHub raw link only, never inline messages
type: feedback
originSessionId: 3d83e2e0-bc8b-44b4-8c6c-7689fe5a9214
---
**Rule:** 긴 코드/SQL/스크립트는 GitHub raw 링크로만 제공, 메시지 본문 삽입 금지.

**Why:** 메시지가 여러 부분으로 나뉘면 사용자가 전체를 복사할 수 없음. 반복적으로 같은 문제 발생.

**How to apply:** 
- SQL/스크립트 → GitHub raw 링크만 제공
- 파일 경로 + curl 명령어 제안 가능
- 메시지 본문에 코드 붙여넣기 절대 금지

**Example:**
❌ 안 함: [메시지에 450줄 SQL 붙여넣기]
✅ 함: https://raw.githubusercontent.com/asdf1390a-dot/dsc-fms-portal/main/db/23_backup_module_phase2.sql
