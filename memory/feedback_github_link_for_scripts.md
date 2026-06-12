---
name: GitHub 링크 전용 규칙 (스크립트/SQL)
description: SQL 스크립트나 긴 코드는 메시지 본문에 직접 제공하지 말고 GitHub 링크로만 제공
type: feedback
---

## 규칙

SQL 스크립트, 마이그레이션, 코드 스니펫 등 길이가 긴 스크립트는 메시지 본문에 직접 붙여넣지 말고 **GitHub 저장소 링크로만 제공**.

## Why

- 메시지 가독성 저하
- Telegram 모바일에서 스크롤 과다
- 사용자가 링크로 바로 접근하는 것이 효율적

## How to apply

1. SQL 스크립트 작성 완료 → GitHub에 커밋
2. Raw 링크 또는 GitHub 링크 복사
3. 메시지에 링크만 제시 (설명 1-2줄 + 링크)
4. 예: "Phase 3-5 SQL 파일: https://github.com/.../db/52.sql"

예외: 짧은 코드 스니펫 (5줄 이하)는 본문 OK
