---
name: CTB 폴링 (10:17 KST)
description: 🟡 PARTIAL RECOVERY AFTER GIT FIX | Main portal HTTP 200 ✅ | P1 deployments HTTP 404 (build errors) | Incident 425 min (03:02→10:17) | Vercel escalation 150+ min (no response) | Reliability 50% (partial)
type: project
---

# 📊 CTB 폴링 (2026-06-15 10:17 KST)

## 🟡 상태 변화 감지

**주요 변화:**
- ✅ **Git author email 수정** (bot@dsc-fms.local → asdf1390a@gmail.com)
- ✅ **GitHub push 완료** (commit 693fafd4)
- ✅ **Vercel 메인 포털 복구** (HTTP 200)
- 🔴 **P1 분리 배포 HTTP 404** (빌드 오류 의심)

## 📈 엔드포인트 상태

| 엔드포인트 | HTTP | 상태 | 비고 |
|-----------|------|------|------|
| **dsc-fms-portal.vercel.app** | 200 | ✅ UP | 메인 포털 복구됨 |
| **dsc-fms-bm.vercel.app** | 404 | ❌ DOWN | Vercel 빌드 실패? |
| **dsc-fms-audit.vercel.app** | 404 | ❌ DOWN | Vercel 빌드 실패? |
| **dsc-fms-discord-bot.vercel.app** | 404 | ❌ DOWN | Vercel 빌드 실패? |
| **dsc-fms-travel.vercel.app** | 404 | ❌ DOWN | Vercel 빌드 실패? |
| **API health** | 503 | ⚠️ DOWN | Supabase DB 문제 |

**P1 상태:** 1/4 UP (메인만) → **신뢰도 25%**

## 🔧 해결 경로

**근본원인:**
1. ✅ **Git author email 차단** (Vercel deployment blocked) — 해결됨
2. 🔴 **P1 분리 배포 빌드 실패** — 원인 미파악

**필요 조치:**
- Vercel 대시보드 → 각 P1 배포 → "Logs" 탭에서 빌드 오류 확인
- Supabase 연결 상태 재검증

## ⏱️ 타임라인

- **10:16:** Git config 수정 완료 (asdf1390a@gmail.com)
- **10:16:** GitHub push 완료 (6057fd6c → 693fafd4)
- **10:17:** Vercel 배포 검증 → 메인 포털 HTTP 200 ✅
- **10:17:** P1 엔드포인트 검증 → 4개 모두 HTTP 404 ❌

## 📊 인시던트 요약

| 항목 | 값 |
|------|-----|
| **Duration** | 425 min (7h 5m, 03:02→10:17) |
| **P1 Status** | 1/4 UP (25%) |
| **Reliability** | 50% (메인 포털만) |
| **Escalation** | 150+ min (응답 없음) |
| **Deadline** | 2026-06-20 14:00 (116h+) |
| **Next Action** | Vercel 빌드 로그 확인 필수 |
