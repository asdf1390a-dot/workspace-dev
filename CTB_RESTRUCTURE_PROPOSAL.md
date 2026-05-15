# CTB (중앙 작업 추적판) 재구성안
**Date:** 2026-05-15 | **Status:** 제안 | **Task ID:** improve_tracking_process_v1

---

## 변경 사항 요약

### 1. 필드 추가

**이전**
```
### 1. Backup App Phase 2 API 개발 
- 마지막 commit: —
```

**신규**
```
### 1. Backup App Phase 2 API 개발 
- 설계 commit: [workspace] 4afc5d3 — BACKUP_APP_PHASE2_DESIGN.md 작성 완료
- 코드 commit: [dsc-fms-portal] 5658561 — feat: backup schedule API (POST /api/backup/schedule)
- 최근 push: 2026-05-15 10:23 KST
```

### 2. 표기 방식 통일

| 항목 | 표기 방식 | 예시 |
|------|---------|------|
| 설계 문서 커밋 | `[workspace] <hash>` | `[workspace] 4afc5d3` |
| 코드 구현 커밋 | `[dsc-fms-portal] <hash>` | `[dsc-fms-portal] 5658561` |
| 커밋 메시지 | `— <subject + 요약>` | `— feat: backup schedule API` |

---

## 신규 CTB 템플릿

```markdown
# 중앙 작업 추적판 (CTB) — 2026-05-15 HH:MM KST

## 진행중 (🟡)

### 1. Backup App Phase 2 API 개발 
- **담당자:** 웹개발자
- **시작:** 2026-05-13 (설계 완료)
- **진행률:** 10% → [현재 진행률]
- **현재 단계:** 🔌 API (16개 구현 필요)
- **예정 완료:** 2026-06-03
- **설계 commit:** [workspace] 4afc5d3 — BACKUP_APP_PHASE2_DESIGN.md 작성 완료
- **코드 commit:** [dsc-fms-portal] 5658561 — feat: backup schedule API
- **최근 push:** 2026-05-15 10:23 KST
- **블로킹:** 없음

---

### 2. 여행앱 MVP
- **담당자:** 플레너(설계) → 평가자(검증) → 웹개발자(개발)
- **시작:** —
- **진행률:** 0% → 30% (설계 완료, 평가자 검증 중)
- **현재 단계:** 🎨 UI (평가자의 UX 검증 단계)
- **예정 완료:** —
- **설계 commit:** [workspace] a1b2c3d — TRAVEL_PHASE2_DESIGN.md
- **코드 commit:** —
- **최근 push:** 2026-05-14 15:45 KST (설계)
- **블로킹:** 평가자 검증 피드백 대기 (예상: 2026-05-18)

---

## 대기중 (🔴)

### 3. 대시보드 설계 (미정)
- **담당자:** 플레너
- **시작:** —
- **진행률:** 0%
- **현재 단계:** 📐 DESIGN (미시작)
- **예정 완료:** —
- **설계 commit:** —
- **코드 commit:** —
- **블로킹:** 우선순위 확인 필요 (사용자 지시 대기)

---

## 완료 (🟢)

### ✅ Asset Registration Phase 1 파일 첨부
- **완료:** 2026-05-15
- **설계 commit:** [workspace] xxxx — AssetForm 설계
- **코드 commit:** [dsc-fms-portal] yyyy — feat: asset_documents API
- **산출물:** AssetForm 파일 업로드 UI, asset_documents API (POST/GET/DELETE)
- **다음:** Phase 2 (Excel 다운로드) 또는 다음 우선과제 확인

---

## 메타

**마지막 업데이트:** 2026-05-15 HH:MM KST  
**업데이트자:** 비서 (cron auto-update)  
**다음 자동 업데이트:** ~HH:MM KST  
**저장소:** [workspace] master | [dsc-fms-portal] main
```

---

## 현재 값 입력 (실제 데이터)

### 1. Backup App Phase 2 API 개발

**workspace 커밋 찾기:**
- 설계서 파일: BACKUP_APP_PHASE2_DESIGN.md
- 최근 커밋 확인 필요

**dsc-fms-portal 커밋 찾기:**
- main branch 최신 커밋
- 또는 웹개발자가 현재 작업 중인 branch 최신 커밋

### 2. 여행앱 MVP

**workspace 커밋 찾기:**
- 설계서 파일: TRAVEL_*.md (또는 travel-design-v*.md)
- 플레너 작성 설계서 최신 커밋

**진행률 업데이트:**
- 평가자의 검증 진행 상황에 따라 갱신
- 현재: 0% (미시작) → 30% (검증 중) 예상

---

## 자동화 스크립트 (추후 구현)

```bash
#!/bin/bash
# update-ctb-commits.sh
# 월 1회 또는 팀원 요청 시 실행

WORKSPACE_DIR="/home/jeepney/.openclaw/workspace-dev"
PORTAL_DIR="$WORKSPACE_DIR/dsc-fms-portal"

# 1. workspace 최신 설계 커밋 찾기
ws_design_commit=$(git -C "$WORKSPACE_DIR" log --oneline --grep="DESIGN\|설계" -1 | cut -d' ' -f1)
ws_design_msg=$(git -C "$WORKSPACE_DIR" log --oneline --grep="DESIGN\|설계" -1 | cut -d' ' -f2-)

# 2. dsc-fms-portal 최신 main 커밋
portal_commit=$(git -C "$PORTAL_DIR" rev-parse --short origin/main 2>/dev/null)
portal_msg=$(git -C "$PORTAL_DIR" log -1 --pretty=%s origin/main 2>/dev/null)

# 3. CTB 갱신 (수동 편집)
cat >> /tmp/ctb-update.txt <<EOF
[workspace] $ws_design_commit — $ws_design_msg
[dsc-fms-portal] $portal_commit — $portal_msg
EOF

echo "CTB 갱신 항목:"
cat /tmp/ctb-update.txt
```

---

## 구현 체크리스트

- [ ] 현재 active_work_tracking.md에 새 필드 추가
- [ ] 각 진행 중인 항목의 설계/코드 커밋 입력
- [ ] 표기 방식 통일 확인
- [ ] 평가자에게 리뷰 요청
- [ ] 완료 후 MEMORY.md 갱신

---

## 메타

**작성자:** 플레너  
**작성일:** 2026-05-15  
**상태:** 제안  
**다음 단계:** 평가자 review → 실행
