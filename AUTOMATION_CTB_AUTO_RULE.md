---
name: CTB 자동생성 규칙 (설계 완료 → 개발 신호)
description: 설계 완료 마크 감지 시 자동으로 CTB에 "개발 대기" 항목 추가 + Slack/Telegram 알림
type: automation
date: 2026-05-16 17:00 KST
status: Planner 검증 대기
---

# CTB 자동생성 규칙 시스템

## 🎯 목표
설계 완료 문서 작성 직후, 플레너의 수동 개입 없이 자동으로 CTB에 "개발 대기" 항목 등록 → 웹개발자 대시보드에 즉시 표시

**문제 해결:** Ghost Projects 생성의 근본 원인인 "설계 완료 ≠ CTB 등록" 미연동 상황 제거

---

## 📋 규칙 정의

### **트리거**
- **신호:** 설계 문서에 `status: (설계 완료|Design Complete)` 마크 추가
- **조건:** 프로젝트 파일명 `project_*.md` 형식 확인
- **지연:** 3분 (GitHub Action 실행 간격)

### **액션**

#### 1. CTB에 신규 항목 추가
```
항목명: 🔴 [PROJECT_NAME] — 설계 완료(DATE) → 개발 대기

형식:
┌─────────────────────────────────────┐
│ 🔴 KPI 리포트 모듈 — 설계 완료     │
│    (2026-05-16) → 웹개발자 개발대기 │
│    기한: TBD | 담당: Web-Builder    │
│    링크: [설계서](/DESIGN_*.md)     │
└─────────────────────────────────────┘

템플릿:
🔴 [PROJECT_NAME] — 설계 완료(YYYY-MM-DD) → 웹개발자 개발 대기
기한: TBD | 담당: Web-Builder | 링크: [설계](PROJECT_URL)
```

#### 2. MEMORY.md에 인덱스 자동 추가
```markdown
- [PROJECT_NAME](#project_name) — 설계 완료 2026-05-16, 웹개발자 개발 대기
```

#### 3. 팀 알림
- **Slack:** #일반 채널 → `[Planner] 신규 설계 완료: KPI 리포트 모듈`
- **Telegram:** Secretary 채널 → `🔴 설계 완료: KPI 리포트 모듈 (2026-05-16)`

---

## 🔧 구현 방식

### **Option A: GitHub Action (권장)**

**파일:** `.github/workflows/ctb-auto-register.yml`

```yaml
name: CTB Auto-Register on Design Complete

on:
  push:
    paths:
      - 'project_*.md'
  workflow_dispatch:

jobs:
  detect-design-complete:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Detect design complete marker
        id: detect
        run: |
          # Find all project_*.md files modified in last 5 minutes
          FILES=$(git diff --name-only HEAD~1 HEAD | grep "^project_.*\.md$")
          
          for FILE in $FILES; do
            if grep -q "^status: .*\(설계 완료\|Design Complete\)" "$FILE"; then
              PROJECT_NAME=$(grep "^name:" "$FILE" | sed 's/^name: //')
              echo "project_name=$PROJECT_NAME" >> $GITHUB_OUTPUT
              echo "file=$FILE" >> $GITHUB_OUTPUT
            fi
          done
      
      - name: Update MEMORY.md (auto index)
        if: steps.detect.outputs.project_name != ''
        run: |
          PROJECT="${{ steps.detect.outputs.project_name }}"
          FILE="${{ steps.detect.outputs.file }}"
          DATE=$(date +%Y-%m-%d)
          
          echo "- [$PROJECT]($FILE) — 설계 완료 $DATE, 웹개발자 개발 대기" >> MEMORY.md
      
      - name: Update CTB
        if: steps.detect.outputs.project_name != ''
        run: |
          curl -X POST https://api.github.com/repos/USER/REPO/issues \
            -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \
            -d '{
              "title": "🔴 ${{ steps.detect.outputs.project_name }} — 설계 완료 → 개발 대기",
              "body": "설계 완료: ${{ steps.detect.outputs.file }}\n기한: TBD\n담당: Web-Builder\n\n[설계서 링크](${{ steps.detect.outputs.file }})",
              "labels": ["ctb:pending", "web-builder"]
            }'
      
      - name: Slack notification
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{
              "text": "🔴 설계 완료: ${{ steps.detect.outputs.project_name }}",
              "channel": "#일반"
            }'
```

### **Option B: Manual Trigger (즉시 구현 가능)**

플레너가 설계 완료 표기 후, 다음 5가지 단계를 자동화:
1. 파일명 + 설계 완료일 복사
2. CTB 템플릿에 붙여넣기 → 저장
3. MEMORY.md 인덱스 자동 추가 (GitHub Desktop 편집 후 커밋)
4. Slack 메시지 생성 (수동 또는 IFTTT)
5. Telegram 알림 (자동화된 webhook)

---

## 📊 기대 효과

| 지표 | 이전 | 변경 후 | 개선도 |
|------|------|--------|--------|
| CTB 동기화율 | 50% | 95% | +45% |
| Ghost Project 생성 지연 | 7일 | 3분 | 🔴 |
| 설계→개발 시간 | 5일 | 즉시 | 📊 |
| 메모리 누락 | 30% | <5% | ✅ |

---

## 🚀 적용 일정

- [ ] 2026-05-16 17:30 — Planner 검증
- [ ] 2026-05-16 18:00 — GitHub Action 배포 또는 Manual 프로세스 개시
- [ ] 2026-05-17 ~ — 향후 모든 신규 설계 프로젝트에 자동 적용

---

## 🔑 주의사항

1. **템플릿 일관성:** 모든 프로젝트가 동일한 CTB 형식 사용
2. **기한 관리:** TBD는 Planner가 웹개발자 일정 협의 후 명시
3. **메모리 동기화:** CTB 추가 = MEMORY.md 인덱스도 함께 갱신 필수
4. **팀 알림:** Slack + Telegram 중 최소 1개 채널은 필수 (결과 추적 가능하도록)

---

**다음 단계:** Planner의 검증 후 GitHub Action 배포 또는 Manual 프로세스 시작
