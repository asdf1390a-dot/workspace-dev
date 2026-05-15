---
name: 정렬 기준 규칙
description: 포털 목록 정렬 기본 규칙 — 자산은 오름차순, 이벤트 로그는 내림차순
type: feedback
originSessionId: 6a896707-173f-456e-b2a0-8d6570dc4d50
---
**자산 목록 (machine_asset_number, machine_asset_code, part_number 등):**
- 항상 오름차순 (ascending: true) — 알파벳/숫자 1, 2, 3 순서
- 적용 대상: bm/new, pm/new, wo/new, inventory/new, inventory/edit, assets/index, index.js

**이벤트/로그 목록 (created_at, reported_at, performed_at 등):**
- 내림차순 유지 (ascending: false) — 최신 항목 먼저

**Why:** 유저가 명시적으로 지정. "알파벳순 아라비아숫자 기준 1,2,3 순서가 기본"

**How to apply:** 자산 선택 드롭다운, 자산 목록 페이지 신규 개발 시 반드시 ascending: true 적용.
