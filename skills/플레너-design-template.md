---
name: 플레너 설계 청사진 템플릿
description: 기능 설계 시 자동 활성화되는 design blueprint (428 LOC learnings 기반)
version: 1.0
activation: 모든 UI/DB/아키텍처 설계 작업 시 자동 삽입
---

# 플레너 — 설계 청사진 표준 템플릿 (learnings.md 기반)

**이 템플릿은 기능 설계, DB 스키마, 컴포넌트 구조 설계 시 자동으로 로드됩니다.**

---

## 🎯 설계 우선순위 순서 (반드시 이 순서)

```
1️⃣ 용어 합의 (Glossary) 
   ↓
2️⃣ DB 스키마 확정 
   ↓
3️⃣ UI 컴포넌트 설계
   ↓
4️⃣ API 엔드포인트 설계
   ↓
5️⃣ 배포/검증 전략
```

**중요:** 이 순서를 지켜야 UI·DB·번역 세 레이어가 일관성을 유지합니다. 역순으로 진행하면 각 단계 간 마찰이 반복됩니다.

---

## 1️⃣ 용어 합의 — Glossary 단일 소스 (SSOT)

### 📋 Glossary 표준 구조

모든 드롭다운 필드는 다음 4-column 구조로 `glossary` 마스터 테이블에 정의:

```sql
CREATE TABLE glossary (
  id SERIAL PRIMARY KEY,
  field_key VARCHAR(50),          -- 'failure_code', 'event_type', 'priority'
  label_ko VARCHAR(100),           -- 한국어 라벨 (현장 표시)
  label_en VARCHAR(100),           -- 영어 라벨 (분석/번역 기준)
  source_system VARCHAR(30),       -- 'ui', 'analysis', 'translation' 출처 표시
  created_at TIMESTAMP DEFAULT NOW()
);

-- 예시
INSERT INTO glossary VALUES 
  (1, 'failure_code', '모터 소손', 'Motor burnt out', 'translation', now()),
  (2, 'failure_code', '모터 소손', 'Motor burnt out', 'ui', now()),
  (3, 'priority', '긴급', 'Urgent', 'translation', now()),
  (4, 'priority', '긴급', 'Urgent', 'ui', now());
```

### ✅ 체크리스트: 설계 단계에서 확인

```
[ ] 핵심 드롭다운 필드 3개 이상 식별? 
    예: failure_code, event_type, priority
    
[ ] 각 필드의 선택지를 한글 + 영어로 정의?
    예: "모터 소손" = "Motor burnt out"
    
[ ] 번역가·분석가·개발자가 동일한 선택지를 보는가?
    ✅ 한글 라벨 = 현장 UI
    ✅ 영어 라벨 = 분석 기준 & 번역 원문
    
[ ] 드롭다운 옵션 수가 합리적? (일반적으로 5~15개)
    너무 많으면 UI 스크롤 필요 → UX 저하
    너무 적으면 현장 용어 미포함 → 자유 입력 유혹
```

---

## 2️⃣ DB 스키마 설계 — Glossary 연동 구조

### 📊 핵심 원칙: Schema = 팀 커뮤니케이션 구조

**DB 스키마는 데이터 정규화가 아니라 팀이 어떻게 소통할 것인가를 구조화하는 설계입니다.**

### 설계 패턴: Glossary Foreign Key 연동

```sql
-- 예: BM 이벤트 테이블
CREATE TABLE bm_events (
  id SERIAL PRIMARY KEY,
  asset_id VARCHAR(50) NOT NULL,
  failure_code_id INT NOT NULL REFERENCES glossary(id),  -- 자유 입력 금지
  event_type_id INT NOT NULL REFERENCES glossary(id),
  priority_id INT NOT NULL REFERENCES glossary(id),
  started_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 드롭다운 fetch 쿼리 (UI 컴포넌트가 사용)
SELECT id, label_ko as label FROM glossary 
WHERE field_key = 'failure_code' 
ORDER BY id;
```

### ✅ 체크리스트: DB 설계 확인

```
[ ] 각 드롭다운 필드가 glossary ID로 참조되는가? (FOREIGN KEY)
    - 자유 텍스트 입력 경로 차단 확인
    
[ ] Primary Key 설정 정상?
    - 모든 테이블에 id SERIAL PRIMARY KEY
    
[ ] Foreign Key 제약 일관성?
    - asset_id → assets.id
    - failure_code_id → glossary.id
    
[ ] NOT NULL 제약이 필수 필드만?
    - 필수: asset_id, failure_code, priority
    - 선택: notes, completed_by
    
[ ] 타임스탬프 필드 자동 채움?
    - started_at: BM 폼 진입 시 기본값 NOW() (수정 가능)
    - resolved_at: "완료" 버튼 클릭 시 자동 기록
    - created_at: INSERT 트리거
```

---

## 3️⃣ UI 컴포넌트 설계 — 4가지 핵심 패턴

### 패턴1️⃣: Progressive Disclosure (필수 필드 우선 노출)

**모바일 폼은 현장 작업자가 30초 안에 완료할 수 있어야 합니다.**

```
화면 구조:
┌─────────────────────┐
│ [설비명 + 위치]      │  ← 컨텍스트 헤더 (고정)
│ (현재 화면 확인용)   │
├─────────────────────┤
│ 필수 필드 (폼 열림)  │  ← Phase 1: 30초 목표
│ • 설비 선택          │
│ • 증상 (AI 제안)     │
│ • 긴급도 배지        │
├─────────────────────┤
│ 추가 정보 ▼          │  ← Phase 2: 선택사항
│ (클릭 시 펼침)       │
└─────────────────────┘

펼침 상태:
┌─────────────────────┐
│ 추가 정보 ▲          │
├─────────────────────┤
│ • 담당자 (선택)      │
│ • 메모 (선택)        │
│ • 사진 첨부 (선택)   │
└─────────────────────┘
```

### 패턴2️⃣: 컨텍스트 헤더 (화면 착오 방지)

폼 진입 시점에 현장 작업자가 "이게 맞는 화면인가?" 확인할 수 있어야 합니다.

```
BM 폼:
┌─────────────────────┐
│ 설비: DCMI-ABC-001  │  ← 2줄 고정 헤더
│ 위치: 생산 1라인    │     (스크롤 시에도 고정)
├─────────────────────┤
│ [필수 필드들...]     │
└─────────────────────┘
```

### 패턴3️⃣: 드롭다운 + 설명 라벨 (UI = 교육)

```jsx
// 컴포넌트 구조
<Select 
  label="발생 현상"
  options={[
    { 
      id: 1, 
      label: "모터 소손",
      description: "Motor burnt out — 모터 기능 완전 상실"  ← 추가 설명
    },
    { 
      id: 2, 
      label: "유압 누출",
      description: "Hydraulic leak — 유체 손실 감지"
    }
  ]}
/>
```

### 패턴4️⃣: AI 제안 + 검증 게이트

현장 작업자가 AI 첫 추천을 무조건 선택하는 것을 방지:

```jsx
// BM 폼의 failure_code 필드
<AIAssistantField
  assetId={selectedAsset}
  symptomKeyword={symptom}
  suggestions={[
    { id: 1, label: "모터 소손", confidence: 92%, reason: "최근 3건 유사" }
  ]}
  confirmRequired={true}  // 선택 전 확인 필수
/>
```

### ✅ 체크리스트: UI 설계 확인

```
필수 필드 노출 (Phase 1):
[ ] 필수 필드 3개 이상 5개 이하?
[ ] 각 필드가 glossary 드롭다운 연동?
[ ] 저장 버튼이 필드 완성도 기반으로 활성화?

선택 필드 숨김 (Phase 2):
[ ] "추가 정보" 섹션이 기본 접혀있음?
[ ] 모바일에서 스크롤 최소화?

컨텍스트 헤더:
[ ] "설비명 + 위치" 2줄 고정 배치?
[ ] 화면 스크롤 시에도 항상 보임?

드롭다운 설명:
[ ] 각 옵션에 한국어 설명 병기?
[ ] 영어 원문도 함께 표시?
[ ] 터치 영역이 최소 44px?

모바일 최적화:
[ ] 버튼 클릭 수 3회 이내?
[ ] 글자 크기 16px 이상?
[ ] 입력 필드 너비가 전체 화면 너비?
```

---

## 4️⃣ UI 패턴 선택 (현장 관찰 기반)

**AI는 패턴 목록을 나열할 수 있지만, 최종 선택은 플레너가 현장 물리적 환경을 고려해 결정합니다.**

### 📍 선택 기준표

| 현장 상황 | 추천 패턴 | 이유 |
|---------|---------|------|
| 장갑 착용 | 풀스크린 폼 (커다란 터치 영역) | 정밀 조작 어려움 |
| 한 손 조작 | 세로 스텝퍼 (다음→완료 단계적) | 양손 필요 없음 |
| 시끄러운 환경 | 시각적 피드백 강조 (색상, 아이콘) | 사운드 피드백 불가 |
| 좁은 화면 (5인치 폰) | 모달보다 풀스크린 | 모달은 답답함 |
| 관리자 데스크톱 | 테이블 + 필터 조합 | 복잡한 조회 가능 |

### ✅ 체크리스트: 패턴 결정

```
[ ] 현장 물리적 환경 직접 확인?
    - 장갑 착용 여부
    - 한 손/양손 조작
    - 주변 소음 수준
    - 폰 화면 크기
    
[ ] 대상 사용자 역할 확인?
    - 현장 작업자 (빠른 입력)
    - 감독자 (복잡한 조회)
    - 관리자 (집계 분석)
    
[ ] 최종 패턴 선택 근거 문서화?
    예: "현장 장갑 착용 관찰 → 풀스크린 폼 채택"
```

---

## 🌐 CLAUDE.md 계층 구조 설계

### 📂 폴더 구조 + 로컬 CLAUDE.md 분리

```
/home/jeepney/.openclaw/workspace-dev/
├── CLAUDE.md                          ← 루트 전역 규칙
│   • AI 코딩 원칙 (과도한 추상화 금지)
│   • 문서화 기준
│   • 에러 처리 방식
│
├── pages/
│   ├── CLAUDE.md                      ← 페이지 규칙
│   │   • ISR 사용 조건
│   │   • 데이터 페칭 패턴
│   │   • 라우팅 컨벤션
│   │
│   └── api/
│       └── CLAUDE.md                  ← API 라우트 규칙
│           • 권한 체크 위치
│           • 에러 응답 형식
│           • 요청 검증 방식
│
└── components/
    └── CLAUDE.md                      ← 컴포넌트 규칙
        • Props 인터페이스
        • 상태 관리 방식
        • 이벤트 핸들러 패턴
```

### 작성 원칙

```markdown
# CLAUDE.md — [폴더명] 설계 규칙

## 이 폴더의 목적
한 문장으로: 이 폴더의 코드가 해결하는 문제는?

## 핵심 패턴
- **패턴1**: [설명] — [적용 조건]
- **패턴2**: [설명] — [적용 조건]

## 금지 사항
- ❌ [패턴]: 왜 하면 안 되는가?
- ❌ [패턴]: 왜 하면 안 되는가?

## 검증 방법
[ ] [확인 항목]
[ ] [확인 항목]
```

---

## 5️⃣ 컴포넌트 구조 설계 — 의존 관계 매핑

### 📐 설계 산출물: 컴포넌트 의존도 다이어그램

```
BM 등록 폼 (bm-form/)
├── BM 입력 필드 (bm-input-fields/)
│   ├── 설비 선택 (asset-selector/)
│   │   └── asset-search + asset-qr-scanner
│   ├── 증상 입력 (symptom-input/)
│   │   └── AI 추천 드롭다운
│   ├── 긴급도 배지 (priority-badge/)
│   │   └── 선택 값에 따라 색상 변경
│   └── 폼 저장 버튼 (form-submit/)
│       └── 필드 완성도 기반 활성화 제어
│
├── 추가 정보 섹션 (advanced-section/)
│   ├── 담당자 (assignee-picker/)
│   └── 메모 (notes-editor/)
│
└── 완료 확인 화면 (completion-dialog/)
    └── BM ID + 타임스탬프 표시
```

### ✅ 체크리스트: 의존 관계 설계

```
[ ] 컴포넌트 간 Props 흐름 명시?
    부모 → 자식 데이터 흐름 다이어그램
    
[ ] 상태 관리 경계 명확?
    React Context / 상위 state / 로컬 state 분리
    
[ ] 재사용 가능 단위로 분해?
    asset-selector가 BM 폼 외에 다른 곳에도 쓰일 수 있는가?
    
[ ] 디렉토리 레이아웃이 의존 관계를 반영?
    깊은 중첩 (5단계 이상) → 재구조화 검토
```

---

## 6️⃣ 데이터 흐름 시각화 (팀 공유 문서)

**"내가 입력하는 값이 어떤 DB 컬럼을 거쳐 어떤 분석 출력으로 나오는가"를 팀이 함께 이해해야 합니다.**

### 📊 데이터 흐름 다이어그램 (예시)

```
사용자 입력
├── failure_code 드롭다운 선택
│   └─ glossary.id = 42
│      └─ bm_events.failure_code_id = 42 (FK)
│         └─ 분석 쿼리: SELECT COUNT(*) FROM bm_events WHERE failure_code_id=42
│            └─ 대시보드 표시: "모터 소손" 발생 건수 = 8건
│
├── priority 배지 선택
│   └─ glossary.id = 15
│      └─ bm_events.priority_id = 15 (FK)
│         └─ 알림 트리거: IF priority_id IN (15,16) THEN send_urgent_notification()
│
└── started_at 타임스탬프 (자동)
   └─ bm_events.started_at = NOW()
      └─ MTBF 계산: (resolved_at - started_at) in hours
         └─ KPI 대시보드: "평균 수리 시간" = 2.5시간
```

### 설계 산출물 체크리스트

```
[ ] 데이터 흐름 다이어그램 작성 완료?
    입력 → DB 컬럼 → 분석 결과 단계 명시
    
[ ] 각 단계의 책임 주체 명시?
    UI 컴포넌트 / DB 트리거 / 분석 쿼리 / 대시보드 표시
    
[ ] 에러 케이스도 포함?
    NULL 입력 → 저장 버튼 비활성화
    중복 입력 → 경고 메시지 표시
    
[ ] 비개발자(번역가, 분석가)도 이해 가능한 수준?
    기술 용어 최소화, 시각적 화살표로 흐름 표시
```

---

## 🔄 설계 검증 체크리스트 (최종 확인)

### 단계 1: 용어 합의 ✅

```
[ ] Glossary 4-column (field_key, label_ko, label_en, source_system) 정의?
[ ] 번역가·분석가·개발자 사인오프?
[ ] 각 필드 선택지 5~15개 범위?
```

### 단계 2: DB 스키마 ✅

```
[ ] Glossary 외래키 FK 모두 설정?
[ ] Primary Key 및 NOT NULL 제약 확인?
[ ] 타임스탐프 필드 자동 채움 로직 명시?
[ ] 데이터 정합성 검증 규칙 문서화?
```

### 단계 3: UI 컴포넌트 ✅

```
[ ] Progressive Disclosure (필수 3개, 추가 > 접음)?
[ ] 컨텍스트 헤더 (설비명 + 위치 고정)?
[ ] 드롭다운 설명 라벨 병기?
[ ] 모바일 터치 영역 44px 이상?
[ ] 버튼 클릭 3회 이내 완료?
```

### 단계 4: 컴포넌트 구조 ✅

```
[ ] 의존도 다이어그램 작성?
[ ] Props 인터페이스 정의?
[ ] 상태 관리 경계 명시?
```

### 단계 5: 배포 계획 ✅

```
[ ] 데이터 흐름 다이어그램 공유?
[ ] 팀 간 순서 합의 (glossary → DB → UI)?
[ ] QA 검증 기준 명시?
[ ] 배포 후 spot check 일정 수립?
```

---

## 📋 설계 산출물 템플릿

### 기능 설계 명세서

```markdown
# [기능명] 설계 명세

## 1. 목적
한 문장: 이 기능이 풀어야 할 현장 문제는?

## 2. Glossary (용어 합의)
| field_key | label_ko | label_en | 선택지 수 |
|-----------|----------|----------|---------|
| failure_code | 발생 현상 | Failure Code | 12 |
| priority | 긴급도 | Priority | 3 |

## 3. DB 스키마
- 테이블 이름: bm_events
- 주요 컬럼: asset_id, failure_code_id (FK), priority_id (FK)
- 제약: asset_id NOT NULL, failure_code_id NOT NULL

## 4. UI 레이아웃 (Progressive Disclosure)
**Phase 1 (필수, 30초):**
- 설비 선택
- 증상 + AI 제안
- 긴급도 배지

**Phase 2 (선택):**
- 담당자 지정
- 메모

## 5. 데이터 흐름
[데이터 흐름 다이어그램]

## 6. 검증 기준
- 모든 필드 glossary 드롭다운 연동
- 필수 필드 미입력 시 저장 버튼 비활성화
- 배포 후 1개월 spot check (10 샘플)
```

---

## 🔗 참고 문서

**완전 가이드**: `/home/jeepney/.openclaw/workspace-dev/skills/플레너-learnings.md`

**핵심 원칙:**
- **설계 순서:** 용어 → DB 스키마 → UI 컴포넌트 (순서 고정)
- **DB = 팀 커뮤니케이션:** Schema가 팀 간 협업 구조를 결정함
- **입력 폼 = Upstream:** 폼 설계가 번역·분석·대시보드 전체 품질을 결정
- **현장 관찰 필수:** UI 패턴 선택은 물리적 환경(장갑, 소음, 폰 크기)을 직접 고려해야 함

---

**마지막 업데이트:** 2026-06-05 02:40 KST  
**자동 활성화:** 설계 작업 시작 시 (기능 명세, DB 스키마, UI 설계)
