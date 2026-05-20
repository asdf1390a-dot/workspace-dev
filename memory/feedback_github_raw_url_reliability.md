---
name: GitHub Raw URL 신뢰성 문제
description: Raw CDN이 404를 반환하는 경우 발생 — 웹페이지는 작동하는 현상 (2026-05-20)
type: feedback
---

## 규칙

**GitHub raw URL이 404를 반환할 경우가 있다.**

## 현상

2026-05-20 15:07 시점:
- 파일: `db/14_technicians_team_migration.sql`
- 저장소: `asdf1390a-dot/dsc-fms-portal` (Public)
- Git: 파일 존재 ✅, Commit 존재 ✅, GitHub API 확인 ✅
- **Raw URL:** `https://raw.githubusercontent.com/.../main/db/14_technicians_team_migration.sql` → HTTP 404
- **웹페이지:** `https://github.com/.../blob/main/db/14_technicians_team_migration.sql` → HTTP 200 OK

## Why

- GitHub CDN이 지연되거나 캐시 이슈 발생
- Push 직후 raw CDN에 파일이 미포함될 수 있음

## How to apply

**대안 순서 (raw URL 404 시):**

1. **웹페이지 링크 제시** (항상 작동)
   ```
   https://raw.githubusercontent.com/asdf1390a-dot/dsc-fms-portal/main/db/14_technicians_team_migration.sql
   ```
   → 사용자가 "Raw" 버튼 클릭 가능

2. **또는 Git 명령어 제시** (로컬에서 직접 적용)
   ```bash
   git show HEAD:db/14_technicians_team_migration.sql
   ```

3. **Raw URL은 5분 대기 후 재시도** (CDN 동기화 필요)

## 규칙 변경 필요

기존: "SQL/스크립트는 GitHub raw 링크로만"  
→ 현실: raw 링크가 항상 작동하지 않음

**새로운 규칙 필요:**
- [ ] Raw 링크 + 웹페이지 URL 둘 다 제시?
- [ ] Git 명령어로 변경?
- [ ] Raw URL 5분 대기 후 제시?

---

**발견:** 2026-05-20 15:07 KST  
**검증 방법:** curl -I https://raw.githubusercontent.com/.../...
