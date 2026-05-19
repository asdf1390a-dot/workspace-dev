---
name: 추적 프로세스 개선 설계
description: CTB 해시 추적 표준화 + 팀원 업무 추적 자동화 + Memory 동기화
type: project
relatedFiles: TRACKING_PROCESS_IMPROVEMENT_DESIGN.md
---

# 추적 프로세스 개선 설계

**작성일:** 2026-05-15  
**상태:** 설계 완료 → 구현 대기  
**담당:** 플레너 (프로세스 설계)

## 발견된 5가지 문제점

| # | 문제 | 근본 원인 | 영향 | 심각도 |
|---|------|---------|------|--------|
| 1 | **CTB 해시 혼재** | workspace repo vs dsc-fms-portal submodule 커밋 구분 부재 | 진행률 추적 불명확 | 🔴 높음 |
| 2 | **team_task_tracking.md 지연** | CTB만 갱신, team_task_tracking.md 미반영 | 팀원별 역할 추적 불일치 | 🟡 중간 |
| 3 | **중복 메모리 파일** | status 관련 피드백 파일 3개 이상 | 메모리 일관성 저하 | 🟡 중간 |
| 4 | **블로킹 항목 미해결** | Travel Phase 2 scope 불일치 / Asset Master 구현 대기 | 의존 작업 진행 불가 | 🔴 높음 |
| 5 | **Gateway 재시작 로깅 미흡** | 자동 로그 구조 부재 | 패턴 분석 불가능 | 🔵 낮음 |

## 개선 프로세스 1: 해시 추적 표준화

### 현황
- **workspace repo:** `/home/jeepney/.openclaw/workspace-dev`
  - master 브랜치, 설계/계획 문서 저장
  - SOUL.md, MEMORY.md, 설계서 등
  
- **dsc-fms-portal submodule:** `dsc-fms-portal/`
  - main 브랜치, 실제 코드 저장소
  - API, UI, DB 구현체

### 문제점
CTB (active_work_tracking.md)에서 "마지막 commit" 필드가 모호:
- 어느 repo의 커밋인지 명확하지 않음
- 설계 완료 후 API 구현 시 양쪽 repo 모두 변경 발생

### 개선안: 표기 방식 (표준화)

```
[workspace] <short-hash> — <메시지>      # 설계, 계획 문서 변경
[dsc-fms-portal] <short-hash> — <메시지> # 실제 코드 구현
```

**예시:**
```
마지막 commit (Backup App Phase 2 API):
- [workspace] 4afc5d3 — BACKUP_APP_PHASE2_DESIGN.md 작성 완료
- [dsc-fms-portal] 5658561 — feat: backup schedule API (POST /api/backup/schedule)
```

### CTB 필드 재구성

| 필드명 | 이전 | 신규 | 설명 |
|--------|------|------|------|
| `마지막 commit` | 모호 | `[repo] hash — msg` | repo 명시 + 단축해시 + 메시지 |
| `설계 commit` | 없음 | `[workspace] hash` | 설계 완료 기점 |
| `코드 commit` | 없음 | `[dsc-fms-portal] hash` | 최신 구현 커밋 |

### 프로세스 정의

**1. 설계 완료 시 (플레너)**
- workspace repo에 설계서 commit 생성
- CTB 갱신: `[설계 commit]` 필드에 기록
- 웹개발자에게 위임

**2. 개발 진행 중 (웹개발자)**
- dsc-fms-portal에 코드 commit (DB/API/UI 각 단계)
- 각 commit 후 workspace repo의 CTB 갱신
- 커밋 메시지: `Refs: improve_tracking_process_v1 | Stage: API`

**3. 배포 후 (웹개발자)**
- dsc-fms-portal main branch에 merge
- workspace repo CTB 갱신: `[코드 commit]` = 최신 main 커밋

### 자동화 스크립트

```bash
# 스크립트: update-ctb.sh (각 commit 후 호출)
cd /home/jeepney/.openclaw/workspace-dev

# 1. workspace 최신 커밋
ws_hash=$(git -C . rev-parse --short HEAD)
ws_msg=$(git -C . log -1 --pretty=%s)

# 2. dsc-fms-portal 최신 main 커밋
portal_hash=$(git -C dsc-fms-portal rev-parse --short origin/main 2>/dev/null)
portal_msg=$(git -C dsc-fms-portal log -1 --pretty=%s origin/main 2>/dev/null)

# 3. CTB 해당 항목 업데이트 (수동 또는 자동)
```

## 개선 프로세스 2: 팀원 업무 추적 자동화

### 현황
- CTB (active_work_tracking.md): 중앙 집계 대시보드 ✅
- team_task_tracking.md: 팀원별 업무 목록 (업데이트 지연) ❌

### 개선안

**자동 동기화 워크플로우:**

1. **CTB 핵심 필드** (CTB에서만 관리)
   - 작업명 (Task Name)
   - 상태 (Status: 🟢완료 | 🟡진행중 | 🔴대기)
   - 담당자 (Owner)
   - 설계 커밋 (workspace)
   - 코드 커밋 (dsc-fms-portal)
   - 예상 완료 (ETA)

2. **team_task_tracking.md 자동 업데이트**
   - CTB의 데이터를 기반으로 팀원별로 재구성
   - 각 팀원의 진행 중 / 완료 / 대기 항목 표시
   - 의존성 시각화

**템플릿:**
```markdown
## 웹개발자 (web-builder)

### 🟡 진행 중 (2개)
- [ ] Asset Master Phase 1 실행 (2026-05-16 ~ 18)
  Status: API 개발 진행중
  Last Update: [dsc-fms-portal] 5658561
  
- [ ] Backup Phase 2 UI (2026-05-19 ~ 23)
  Status: UI 설계 완료, 구현 대기
  Last Update: [workspace] 4afc5d3

### 🟢 완료 (8개)
- [x] Backup Phase 2 API (완료: 2026-05-15)
  [dsc-fms-portal] 5658561 — feat: backup schedule API
```

## 개선 프로세스 3: Memory 동기화

### 현황
- memory/*.md 파일들이 자체 상태 정보 보유 (상태, 진행률, 마지막 갱신)
- CTB와 메모리 간 동기화 부재

### 개선안

**Memory 파일 Front Matter 표준화:**

```markdown
---
name: <기능명>
description: <한 줄 설명>
type: project|reference|feedback|user
status: 🟢완료|🟡진행중|🔴대기
lastUpdate: 2026-05-16 (YYYY-MM-DD)
owner: planner|web-builder|evaluator|translator|data-analyst
relatedCTB: Backup App Phase 2 API  # CTB 항목 명시
relatedFiles: <원본 설계 파일>
---
```

**자동 갱신 규칙:**
1. CTB 상태 변경 → Memory 파일 lastUpdate 갱신
2. Memory 파일 status = CTB 상태 (일관성 유지)
3. CTB에 owner 추가 → Memory 파일과 매칭

## 구현 체크리스트

**Phase 1: 해시 표기 표준화**
- [ ] CTB 필드 재구성 ([설계 commit], [코드 commit])
- [ ] 기존 데이터 마이그레이션
- [ ] update-ctb.sh 스크립트 작성

**Phase 2: 팀원 추적 자동화**
- [ ] team_task_tracking.md 템플릿 정의
- [ ] CTB ↔ team_task_tracking 동기화 규칙 작성
- [ ] Cron Job으로 일일 자동 갱신

**Phase 3: Memory 동기화**
- [ ] Memory 파일 Front Matter 표준화
- [ ] Memory 파일 자동 스캔 + Front Matter 갱신 스크립트
- [ ] MEMORY.md 인덱스 자동 재정렬

## 기대 효과

- 커밋 추적의 명확성 100% ↑
- 팀원별 진행률 실시간 반영
- 의존성 분석 자동화
- 메모리 정보 신뢰도 향상

## 상태
🟡 **설계 완료** → 웹개발자 + 플레너 협력 구현
