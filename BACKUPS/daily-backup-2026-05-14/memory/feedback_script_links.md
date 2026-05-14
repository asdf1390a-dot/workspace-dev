---
name: 스크립트 링크 제공 방식
description: SQL/스크립트 전달 시 채팅에 코드 붙여넣기 대신 GitHub raw 링크 제공
type: feedback
originSessionId: 6a896707-173f-456e-b2a0-8d6570dc4d50
---
SQL 마이그레이션이나 스크립트 전달 시:
- 채팅에 전체 코드 붙여넣기 X
- GitHub raw 링크 제공: https://raw.githubusercontent.com/asdf1390a-dot/dsc-fms-portal/main/db/파일명.sql
- Supabase SQL Editor에서는 URL로 직접 불러올 수 없으므로, 링크 + "다운로드 후 붙여넣기" 안내
- 또는 파일 경로만 안내하고 WSL 터미널에서 클립보드로 복사하는 명령어 제공

**Why:** 긴 SQL을 채팅에 붙여넣으면 읽기 불편하고, 유저가 파일 링크나 저장된 스크립트를 선호함.

**How to apply:** DB 마이그레이션 안내 시 항상 GitHub 링크 또는 파일 경로 + 복사 명령어로 제공.
