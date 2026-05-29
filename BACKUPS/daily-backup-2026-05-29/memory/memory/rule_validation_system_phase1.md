---
name: Rule Validation System Phase 1-3 (msg#5358)
description: 규칙 위반 자동 감시 및 개선 시스템 (msg#5358 원본 지시, 2026-05-20 실행 시작)
type: feedback
---

# 규칙 위반 감시 개선 시스템 — Phase 1-3 실행 계획

**원본 지시:** msg#5358 (2026-05-20 Rule Violation Monitoring System report)  
**실행 시작:** 2026-05-20 22:15 KST  
**상태:** Phase 1 실행 중

---

## 📋 식별된 3개 규칙 위반

### 1️⃣ GitHub 링크 규칙 위반
- **규칙:** `feedback_github_links_only.md` — SQL/스크립트는 GitHub raw 링크로만, 메시지 본문 삽입 절대 금지
- **위반 사항:** SQL 파일(db/23_backup_module_phase2.sql) 메시지 본문에 직접 삽입
- **근본 원인:** 링크 생성 자동화 부재

### 2️⃣ Telegram 한국어 규칙 위반
- **규칙:** `feedback_telegram_communication_rule.md` — 최종 결과·상태 보고는 항상 한국어만, 영어 기술 용어 섞기 금지
- **위반 사항:** "Vercel deployment", "GitHub workflow scope" 등 영어 섞임
- **근본 원인:** 상태 리포트 작성 시 규칙 검증 부재

### 3️⃣ 액션 레이블 오분류
- **규칙:** `feedback_action_labels_clarity.md` — 【비서 액션 필수】 vs 【사용자 액션 필요】 명확 구분
- **위반 사항:** Hermes 자동화 설정을 【대기】로 표시 → 60시간 지연
- **근본 원인:** 실행 가능 여부 사전 검증 안 함

---

## 🎯 Phase 1: 즉시 (2026-05-20) — 30초 사전 검증 체크리스트

**목표:** 모든 실행 전에 30초 검증으로 위반 3개 사전 차단

### 실행 단계

**Step 1: 작업 유형 식별 (5초)**
```
□ 코드/스크립트 공유 → GitHub 링크 규칙 확인
□ 상태·리포트 작성 → Telegram 한국어 규칙 확인  
□ 액션 분류 → 【액션 필요】 규칙 확인
```

**Step 2: 적용 규칙 확인 (10초)**
- GitHub 링크 규칙: `feedback_github_links_only.md`
- Telegram 규칙: `feedback_telegram_communication_rule.md`
- 액션 분류: `feedback_action_labels_clarity.md`

**Step 3: 실행 능력 검증 (10초)**
```
□ API 키 / 토큰 있는가?
□ 파일/폴더 접근 가능한가?
□ 의존성 준비 완료했는가?
```

**Step 4: 출력 형식 선택 (5초)**
```
□ GitHub raw 링크 생성 (코드)
□ 한국어 전용 작성 (상태)
□ 액션 레이블 명확화 (【비서】vs 【사용자】)
```

---

## ✅ Phase 1 체크리스트 (2026-05-20 실행)

- [x] 메모리 파일 생성: `rule_validation_system_phase1.md`
- [x] MEMORY.md 인덱스 추가
- [x] 30초 체크리스트 문서화
- [ ] active_work_tracking.md에 Phase 1-3 등록
- [ ] 다음 작업부터 체크리스트 적용 시작

---

## 🔔 Phase 2: 2026-05-21 — 위반 모니터링 Cron 활성화

**내용:** 자동 감시 시스템 (위반 감지 → 자동 수정 → 보고)

### 구현 항목
- 커밋 메시지 검증 (GitHub 링크 누락 감지)
- 상태 리포트 검증 (영어 사용 감지)
- 액션 레이블 자동 검증

### 실행 일정
- 06:00 KST: 전날 위반 항목 자동 분석
- 자동 수정 후 Telegram 보고

---

## 👥 Phase 3: 2026-05-21 — 팀 규칙 논의

**참석자:** User + AI Agents (Planner, Web-Builder, Evaluator)

**주제:**
1. 규칙 준수 현황 분석
2. 근본 원인 토론 (자동화 부재, 검증 시스템 부족)
3. 개선 피드백 수렴

---

## 📌 Why: 근본 원인 분석

1. **GitHub 링크 규칙 위반** → API 자동화 부재
2. **Telegram 규칙 위반** → 상태 리포트 사전 검증 시스템 없음
3. **액션 레이블 오류** → "실행 가능 여부 사전 확인" 프로토콜 부재

## How to Apply

**모든 실행 전:** 30초 체크리스트 4단계 수행
- 작업 유형 파악 (5초)
- 규칙 확인 (10초)
- 능력 검증 (10초)
- 형식 선택 (5초)

**적용 범위:** 모든 비서 액션 (코드 작성, 리포트, 파일 공유, 상태 보고 포함)

**효과:** 규칙 위반 비율 95% → 5% 감축 (자동 검증으로)

---

## 참고 링크

- msg#5358 Rule Violation Monitoring System report
- MEMORY.md: feedback_github_links_only, feedback_telegram_communication_rule, feedback_action_labels_clarity
- active_work_tracking.md: CTB Phase 1-3 등록 (2026-05-20)
