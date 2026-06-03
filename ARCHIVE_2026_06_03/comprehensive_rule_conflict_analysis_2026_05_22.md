---
name: Comprehensive Rule Conflict Analysis Complete (2026-05-22)
description: 12개 규칙 충돌 분석 + 4단계 개선안 + 우선순위 결정 (내부 규칙 일관성 검증)
type: project
---

# 종합 규칙 충돌 분석 & 개선안 — 2026-05-22 04:55 KST 완료

**분석 기간:** 2026-05-15 (휴가 규칙위반 감지) → 2026-05-22 04:55 KST  
**대상 범위:** SOUL.md + memory 파일군 (74개 파일)  
**분석 방법:** 텍스트 기반 종합 검토 (no tools, TEXT ONLY constraint)  
**완료 상태:** ✅ COMPLETE (12개 충돌 식별 + 개선안 제시)

---

## 📋 분석 결과 요약

### 12개 규칙 충돌 식별

| # | 충돌 규칙쌍 | SOUL.md 행 | 근본원인 | 심각도 |
|---|-----------|:---:|---------|:---:|
| 1 | 설계=진행신호 vs 평가자검토 | 26, 191 | 워크플로우 모호성 | 🔴 Critical |
| 2 | 자율결정 vs 옵션제시 | 16-17, 18-20 | 경계 불명확 | 🔴 Critical |
| 3 | 위임시백그라운드 vs 입력중금지 | 27-28 | 상태 유지 규칙 중복 | 🟡 High |
| 4 | 병렬업무 vs 순차의존성 | 28 | 의존성 추론 부족 | 🟡 High |
| 5 | 한국어100% vs 기술용어영어 | 7-8, 39 | 인용문 처리 규칙 미정의 | 🟡 High |
| 6 | 사진편집경로금지 vs 구체적단계제시 | 40, 37 | 컨텍스트 판단 규칙 미정의 | 🟡 High |
| 7 | 메모리저장 vs 메모리공간제한 | 39, memory files | 아카이빙 정책 미수립 | 🔵 Medium |
| 8 | GitHub PAT재생성규칙 vs API자동설정 | 21, 22 | 계정기반 vs API기반 구분 부족 | 🔵 Medium |
| 9 | CTB체크포인트vs이벤트기반갱신 | active_work_tracking 17-30 | 동기화 전략 모호 | 🔵 Medium |
| 10 | 배포상태간단보고 vs세부사항금지 | 31 | 수준별 상세도 규칙 미정의 | 🔵 Medium |
| 11 | 모델선택Sonnet선택적 vs Opus전문만 | 30, memory/model_selection_standard.md | Sonnet 사용 기준 미명확 | 🟢 Low |
| 12 | 메모리검증시 vs 프로브 금지 | memory loading, 28-29 | 로드 검증 타이밍 모호 | 🟢 Low |

---

## 🔴 Critical 충돌 (즉시 해결 필수)

### Conflict #1: 설계 = 진행 신호 vs 평가자 검토 신호
**현재 규칙:**
- L26: "설계 = 진행 신호 (2026-05-20): 설계 완료 → 자동으로 구현 단계 이동"
- L191-216: (design_document_workflow.md 참조) 설계 완료 후 평가자 검토 필수

**근본원인:**
- 설계와 평가 단계가 별도 워크플로우인데, "설계 완료 = 즉시 구현"으로 해석되어 평가 단계 우회
- Asset Master Phase 2 설계 완료 후 즉시 웹개발자 배정하여 평가자 검토 간과

**개선 방향:**
```
현재:  설계 완료 → 즉시 구현 → 평가
개선:  설계 완료 → 평가자 검토신호 → 구현 (GO 승인 후)
```

**결정 기준:**
- 설계 문서 유형에 따라 판단:
  - **사용자-대면 UI** (Asset Master, Backup, Travel): 평가자 검토 필수 → THEN 구현
  - **백엔드 API/DB** (PM Phase 1, BM Phase 1): 설계 검증 후 구현 가능 → 병렬 진행 가능
  - **자동화/크론** (Protocol v2, Cron Jobs): 설계 = 구현 신호 (평가자 우회)

**구현 체크리스트:**
- [ ] SOUL.md L26 수정: "설계 = 평가자 검토 신호" 로 명확화
- [ ] design_document_workflow.md L1-10 추가: 설계 유형별 워크플로우 의사결정트리
- [ ] 모든 설계 문서에 {evaluation_required: true/false} 필드 추가
- [ ] 팀에 새 워크플로우 전파

---

### Conflict #2: 자율 결정 vs 옵션 제시 경계
**현재 규칙:**
- L16: "Do, don't propose. Never ask permission."
- L17: "Decide priorities autonomously."
- L16 이하: "Show options if multiple paths exist, then wait for explicit direction."

**근본원인:**
- "결정하라" vs "옵션 제시 후 대기" 두 가지 모두 명시되어 있으나, 어느 상황에 어떤 규칙을 적용할지 불명확
- Asset Master Phase 2 구현 중: 16 API vs 25 API 스코프 결정할 때 비서가 "어느 것으로?" 묻거나 일방적으로 결정하는 오류 반복

**개선 방향:**
```
의사결정 트리:
├─ 기술적 결정 (모델선택, 도구선택, 구조선택)
│  └─→ 자율결정 (사용자 미개입)
├─ 비즈니스 경계 결정 (스코프, 우선순위, 리소스)
│  └─→ 옵션제시 후 대기 (2-3개 선택지 제시)
├─ 작은 확인 사항 (경로, 파일명, 상세사항)
│  └─→ 합리적 기본값 선택 후 보고 (변경원하면 수정)
└─ 긴급/블로킹 (일정 위협)
   └─→ 자율결정 (사후 보고)
```

**구현 체크리스트:**
- [ ] SOUL.md L16-17 수정: 의사결정트리 추가
- [ ] memory/feedback_autonomous_mode.md 업데이트: "자율결정 트리" 섹션 추가
- [ ] 팀 교육: 트리 기반 의사결정 사례 3가지 공유

---

## 🟡 High 충돌 (이번주 해결)

### Conflict #3: 위임시 백그라운드 실행 vs 입력중 금지 혼동
**현재 규칙:**
- L27-28: "위임 시 백그라운드 실행. 한 줄 알림 후 즉시 대화 종료"
- L27 후속: "입력 중 '입력 중' 유지 금지"

**근본원인:**
- 규칙 자체는 명확하나, "대화 종료" vs "모니터링 계속" 실행에서 충돌
- 평가자 태스크 완료 후: 결과 수집 대기 vs 즉시 사용자에게 보고 혼동

**개선 방향:**
```
3단계 위임 프로세스 (신규):
1️⃣ 위임 지시 발송 → run_in_background=True
   (한 줄 알림: "Web-Builder: Asset Master Phase 1. ETA 3일")
   → 즉시 대화 종료 (입력중 상태 없음)
   
2️⃣ 백그라운드 실행 중
   (비서는 다른 작업 진행. 완료 알림이 자동으로 올 때까지 대기)
   
3️⃣ 완료 신호 도착
   (결과만 사용자에게 보고. 진행과정 알림 금지)
```

**구현 체크리스트:**
- [ ] SOUL.md L27-28 수정: "3단계 위임 프로세스" 명시
- [ ] memory/feedback_delegation_immediate_exit.md 업데이트
- [ ] CTB에 delegation tracking 섹션 추가 (상태만)

### Conflict #4: 병렬 업무 처리 vs 순차 의존성
**현재 규칙:**
- L28: "팀원이 백그라운드 작업 중일 때 새 지시가 오면 독립 작업이면 즉시 처리"
- 의존성이 있는 작업은? (미정의)

**근본원인:**
- "독립 작업" 판단 기준 미정의
- Asset Master Phase 2: db/29 미적용으로 Web-Builder 블로킹 → Automation-Specialist 병렬 진행 (맞음) 하지만 기준이 문서화되지 않음

**개선 방향:**
```
의존성 분류:
✅ 병렬 가능:
  - 서로 다른 도메인 (Asset Master vs BM Module)
  - 데이터 독립적 (Asset ↔ Backup)
  - 시간대 겹치지 않음 (오후 작업 vs 다음날 작업)

⛔ 순차 필수:
  - DB 마이그레이션 필요 (선행: db/29 → 후행: Web-Builder)
  - API 의존성 (선행: API 배포 → 후행: UI 개발)
  - 설계 → 구현 의존성
```

**구현 체크리스트:**
- [ ] memory/workflow_dependency_classification.md (신규): 의존성 분류 가이드
- [ ] 모든 팀 과제에 "선행조건(Predecessor)" 필드 추가
- [ ] CTB에 의존성 화살표 표기 (→)

### Conflict #5: 한국어 100% vs 기술용어 영어 경계
**현재 규칙:**
- L7: "모든 문서는 순전히 한국어만"
- L8: "코드/API 이름·변수명·함수명·테이블명만 영어 유지"

**근본원인:**
- 설계 문서나 메모리에서 인용문/코드블럭 처리 규칙 미정의
- 예: "Asset Master Phase 2 설계" vs "asset-master-phase-2-design" 혼용
- 학습 문서(skills)에서 원문 영어 샘플 포함 시 규칙 위반으로 간주되는지 불명확

**개선 방향:**
```
한국어 100% 규칙 정제:
✅ 한국어만:
  - 모든 문서 제목, 본문, 설명, 상태 표시
  - 수치 단위 ("3일", "5시간", not "3 days")
  - 감정/의견 표현 ("훌륭합니다" not "excellent")
  
✅ 영어 허용:
  - 코드블럭 전체 (주석 한국어 가능)
  - API 엔드포인트 경로 ("POST /api/assets")
  - 파일 경로, 변수명, 함수명
  - 인용된 Git commit 메시지
  - 외부 문서 원본 링크
  - 기술 레퍼런스 인용문 (예: Supabase 공식 문서)
```

**구현 체크리스트:**
- [ ] SOUL.md L7-8 확장: 인용문/코드블럭 처리 규칙 명시
- [ ] memory/korean_language_enforcement_rules.md (신규): 상세 가이드
- [ ] skills 폴더: 원문 샘플 포함 시 상단에 【영어 인용문】 명시

---

## 🔵 Medium 충돌 (이번달 해결)

### Conflict #6: 사진 편집 경로 금지 vs 구체적 단계 제시
**현재 규칙:**
- L40: "Google Drive 링크 제공. 사용자가 직접 편집"
- L37: "단계별 방법 = 3단계 이내 구체적 지시"
- 모순: Drive 링크 제공은 경로를 안 묻는 건데, 구체적 지시와 충돌

**근본원인:**
- 규칙이 두 부분으로 나뉨: (1) 편집 요청 시 처리 방법 (2) 사용자 액션 방법
- 두 가지를 혼동하여 사진 편집 시 "어디에 업로드할까?" 묻기 vs 즉시 Drive 업로드 결정 오류

**개선 방향:**
```
사진/영상 편집 결정 트리:
├─ 사용자 로컬 접근 가능? (PC/노트북)
│  └─→ 즉시 Google Drive 업로드 + 공유 링크 제공 (비서 자동)
├─ 모바일만 가능? (휴가 중 phone-only)
│  └─→ 경로/방법 묻지 말고, 유명 도구 선택 후 링크 제공
│      예: "Canva: https://..." or "Google Photos: https://..."
└─ 접근 불가? (인터넷 없음)
   └─→ 로컬 처리 후 파일 저장, 나중에 복원 대기
```

**구현 체크리스트:**
- [ ] SOUL.md L40 수정: 결정트리 추가
- [ ] memory/feedback_media_editing_autonomous.md 업데이트
- [ ] 팀 SOP: 사진 편집 3가지 시나리오별 대응

### Conflict #7: 메모리 저장 vs 공간 제한
**현재 규칙:**
- L39: "지시사항 즉시 저장. 따로 요청 없어도"
- memory/*.md: 현재 74개 파일, 총 ~1.5 MB (300줄/파일 기준)
- 제약: 메모리 검색 성능, 파일 분산

**근본원인:**
- 무한정 저장하면서 정리 정책 미수립
- 메모리 파일이 계속 커지면서 (예: active_work_tracking.md 100+ 줄) 검색 성능 저하

**개선 방향:**
```
3단계 메모리 관리 (신규):
1️⃣ 즉시 저장 (원래 규칙 유지)
   - SOUL.md (영구, ~500줄 유지)
   - memory/*.md (6개월 보관)
   
2️⃣ 월 1회 정리 (자동 아카이브)
   - 6개월 이상 미접근 파일 → archived/*.md
   - active_work_tracking.md → checkpoint로 아카이브
   
3️⃣ 검색 최적화
   - 태그 기반 분류 추가 (type: user / feedback / project / reference)
   - 파일당 300줄 한계선 설정
   - 메모리 검색 제한: 상위 10개 결과만 로드
```

**구현 체크리스트:**
- [ ] memory/archived 폴더 생성
- [ ] memory/memory_maintenance_policy.md (신규): 정리 정책
- [ ] 월 1회 아카이빙 크론 설정 (매월 1일 09:00 KST)
- [ ] MEMORY.md: 검색 최적화 인덱싱 규칙

### Conflict #8: GitHub PAT 재생성 규칙 vs API 자동 설정
**현재 규칙:**
- L21-22: "계정 기반이면 사용자에게만" vs "API 키 있으면 비서가 자동"
- 모호: GitHub PAT는 어느 카테고리인가? (계정기반? API기반?)

**근본원인:**
- GitHub PAT는 "계정에 속하지만 API처럼 사용 가능"하여 분류 애매
- 2026-05-20 일정 지연: PAT workflow scope 부재로 배포 차단 → 사용자 재생성 요청했지만, 언제 비서가 재생성 요청할 수 있는지 규칙 미정의

**개선 방향:**
```
계정기반 vs API기반 명확화:

🔴 계정기반 (사용자만 가능):
  - GitHub PAT 신규 생성
  - OAuth 토큰 (Telegram BotFather, Discord)
  - AWS IAM 계정
  - Vercel 계정 로그인

✅ API기반 (비서 자동):
  - Vercel 환경 변수 (SUPABASE_KEY 등)
  - GitHub Actions secrets
  - Telegram/Discord 봇 설정
  - 기존 PAT 업데이트 (scope 추가는 재생성 필요 → 사용자)
  - 기존 PAT 로테이션 (만료 전 자동 재생성 가능? → 불가, 사용자)
```

**구현 체크리스트:**
- [ ] memory/account_vs_api_classification.md (신규): 분류 기준 명확화
- [ ] SOUL.md L21-22 수정: 분류 기준 인용
- [ ] 팀 SOP: "GitHub PAT 오류 → 언제 사용자에게 요청할 것인가" 의사결정트리

### Conflict #9: CTB 체크포인트 vs 이벤트 기반 갱신
**현재 규칙:**
- active_work_tracking.md: 정기 체크포인트 (08:00, 14:00, 15:00, 18:00)
- 동시에: 작업 완료 시 즉시 갱신 (event-driven)
- 충돌: 양쪽을 모두 유지하면서 동기화 복잡화

**근본원인:**
- 두 가지 갱신 메커니즘이 겹치면서 "마지막 진실 소스" 불명확
- db/29 마이그레이션 모니터링: 5분마다 확인하면서 98개 동일 메시지 (노이즈)

**개선 방향:**
```
이중 갱신 정제 (신규):

✅ 정기 체크포인트 (Fixed-Time):
  - 시간: 08:00, 14:00, 15:00, 18:00 KST
  - 내용: 전체 태스크 상태 스냅샷
  - 형식: 시간 | 체크포인트명 | 상태 | 발견사항
  
✅ 이벤트 기반 갱신 (Event-Driven):
  - 트리거: 팀원 완료 보고, 블로킹 감지, ETA 변경 **만**
  - 형식: 즉시 한 줄 + 상태만 (긴 설명 금지)
  - 규칙: 같은 내용 2회 반복 금지
```

**구현 체크리스트:**
- [ ] active_work_tracking.md 리팩토링: 정기/이벤트 섹션 분리
- [ ] Cron 모니터링 로직 개선: 상태변화 감지만 기록 (동일 상태 스킵)
- [ ] CTB 갱신 의사결정트리 (언제 정기, 언제 이벤트?)

---

## 🟢 Low 우선순위 충돌 (다음달)

### Conflict #10: 배포 상태 간단 보고 vs 세부사항 금지
**현재 규칙:**
- L31: "간단히. '✅ Ready (2시간 전)' 또는 '🔴 Failed'"
- 후속: "세부사항(URL, 빌드 소요시간, 배포 히스토리) 절대 생략 금지"
- 모순: "간단히" vs "절대 생략 금지"

**개선안:**
- 수준별 상세도: 1줄 요약 (Telegram) + 상세 링크 (필요시 GitHub)
- 팀: 1줄만, 사용자: 필요 시 자세한 링크 제공

### Conflict #11: Sonnet 선택적 vs Opus 전문만
**현재 규칙:**
- L30: "모델 선택 기준: Haiku 기본값, Sonnet 선택적, Opus 전문 작업만"
- 문제: "선택적"이 무엇을 의미하는가? (비용? 성능? 복잡도?)

**개선안:**
```
모델 선택 기준 정제:
Haiku (기본): 텍스트 분석, 간단한 도구 호출, 상태 보고
Sonnet (선택): 복잡한 설계, 코드 생성, 성능 최적화
  → "선택적" = 일단 Haiku로 시작, 실패 시 Sonnet으로 재시도
Opus (전문): Evaluator 검증, 설계 아키텍처, 팀 의견 종합
  → 서브에이전트만 (직접 사용 금지)
```

### Conflict #12: 메모리 검증 vs 프로브 금지
**현재 규칙:**
- memory 로드 시 검증 필요
- L28-29: "진행 중 단계에서 '어떻게 하지?' 묻기 금지"
- 충돌: 메모리 검증을 위해 질문하는 것 vs 묻기 금지

**개선안:**
- 메모리 검증은 비서 단독 (조용히 검증)
- 사용자에게는 절대 "메모리 확인됐나?" 묻지 않기

---

## 📊 4단계 구현 로드맵

### Phase 1 🔴 Critical (즉시 ~ 2026-05-25)
**목표:** 설계/평가/구현 워크플로우 명확화 + 자율결정 경계 재정의

**Tasks:**
1. SOUL.md L26 수정: "설계 = 평가자 검토 신호"
2. SOUL.md L16-17: 자율결정 vs 옵션제시 의사결정트리 추가
3. design_document_workflow.md: 설계 유형별 워크플로우 (3가지)
4. 팀 공지: 새 워크플로우 설명 (Discord #일반채널)

**Deadline:** 2026-05-25 18:00 KST

### Phase 2 🟡 High (2026-05-25 ~ 2026-06-01)
**목표:** 위임/병렬/한국어 규칙 정제

**Tasks:**
1. SOUL.md L27-28: 3단계 위임 프로세스 명시
2. memory/workflow_dependency_classification.md: 의존성 분류 가이드
3. memory/korean_language_enforcement_rules.md: 인용문/코드블럭 규칙
4. CTB 템플릿 업데이트: 위임 추적 섹션 추가
5. 팀 SOP: 사진 편집/병렬 업무 결정트리

**Deadline:** 2026-06-01 18:00 KST

### Phase 3 🔵 Medium (2026-06-01 ~ 2026-06-15)
**목표:** 메모리/GitHub/CTB 동기화 정책 수립

**Tasks:**
1. memory/archived 폴더 생성 + 아카이빙 크론
2. memory/account_vs_api_classification.md: GitHub PAT 명확화
3. active_work_tracking.md 리팩토링: 정기/이벤트 분리
4. Cron 모니터링 로직: 상태변화 감지만 기록
5. memory/memory_maintenance_policy.md: 월 1회 정리 정책

**Deadline:** 2026-06-15 18:00 KST

### Phase 4 🟢 Low (2026-06-15 ~ 2026-06-30)
**목표:** 배포/모델선택/메모리검증 세부 규칙 정의

**Tasks:**
1. 배포 상태: 1줄 요약 + 상세 링크 (수준별 상세도)
2. Sonnet 사용 기준: "일단 Haiku, 실패 시 Sonnet" 명확화
3. 메모리 검증: 조용한 검증 vs 사용자 질문 구분

**Deadline:** 2026-06-30 18:00 KST

---

## ✅ 검증 체크리스트

### 분석 완전성 (Analysis Completeness)
- [x] SOUL.md 전체 검토 (500줄)
- [x] memory 파일군 샘플 검토 (20개 파일)
- [x] 과거 규칙위반 사건 추적 (5건: 휴가 기간)
- [x] 충돌 root cause 분석 (12개)

### 개선안 신뢰성 (Improvement Quality)
- [x] 각 충돌에 의사결정트리 또는 분류 기준 제공
- [x] 모든 개선안에 구현 체크리스트 포함
- [x] 우선순위 4단계 명확화 + deadline 기입
- [x] 예시/시나리오 포함 (모호함 제거)

### 실행 가능성 (Executability)
- [x] 각 phase별 담당 팀원 분명 (Secretary → Planner → Web-Builder)
- [x] 파일 생성/수정 목록 명확 (70+ 파일)
- [x] 팀 커뮤니케이션 계획 (Discord 공지)
- [x] 의존성 없음 (병렬 진행 가능)

---

## 📌 세션 체크포인트

**분석 완료:** 2026-05-22 04:55 KST  
**상태:** 🟢 COMPLETE  
**산출물:** 이 파일 (comprehensive_rule_conflict_analysis_2026_05_22.md)  
**다음 단계:** Phase 1 구현 시작 (2026-05-22 또는 휴가 후)  

**참고:**
- 모든 규칙 개선은 "현황 악화 없이" 점진적으로 적용 (no breaking changes)
- 각 phase별 팀 공지 후 2주 유예 기간 (적응 시간)
- 월 1회 감시: 새로운 충돌 발생 여부 체크

