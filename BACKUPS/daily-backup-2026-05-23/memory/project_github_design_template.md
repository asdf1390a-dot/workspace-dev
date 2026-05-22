---
name: GitHub 설계 문서 템플릿
description: 새 기능/프로젝트 문서화 표준 템플릿 + 저장소 구조 가이드 + DESIGN.md 섹션별 양식
type: reference
relatedFiles: GITHUB_DESIGN_TEMPLATE.md
---

# GitHub 설계 문서 템플릿

**목적:** 새로운 기능, 프로젝트, 또는 주요 변경사항을 GitHub 저장소에 문서화하기 위한 표준 템플릿

**사용 대상:** 설계자, Planner AI Agent, 기술 리더  
**문서 위치:** `/docs/design/` 또는 Wiki 폴더  
**대상 읽자:** 개발자, QA, PM, 이해관계자

## 저장소 문서 구조 (표준)

```
your-repo/
├── README.md                    ← 프로젝트 소개 (시작점)
├── ARCHITECTURE.md              ← 기술 아키텍처
├── DESIGN.md                    ← 메인 설계 문서
├── docs/
│   ├── setup.md                 ← 개발 환경 설정
│   ├── design/
│   │   ├── ui-system.md         ← 디자인 시스템
│   │   ├── components.md        ← 컴포넌트 명세
│   │   ├── pages.md             ← 페이지 와이어프레임
│   │   └── user-flows.md        ← 사용자 흐름
│   ├── api/
│   │   ├── endpoints.md         ← API 문서
│   │   └── schemas.md           ← 데이터 스키마
│   └── deployment/
│       └── deployment.md        ← 배포 가이드
├── .github/
│   ├── CONTRIBUTING.md          ← 기여 가이드
│   ├── CODE_OF_CONDUCT.md       ← 행동 강령
│   └── ISSUE_TEMPLATE/          ← 이슈 템플릿
└── wiki/
    ├── Home.md                  ← Wiki 홈
    ├── Roadmap.md               ← 로드맵
    └── FAQ.md                   ← 자주 묻는 질문
```

## DESIGN.md 헤더 정보

```markdown
# [프로젝트명] 설계 문서

> **상태:** 초안 | 검토 중 | 최종 | 보관  
> **작성일:** YYYY-MM-DD  
> **마지막 수정:** YYYY-MM-DD  
> **담당자:** @github-username  
> **리뷰어:** @reviewer1, @reviewer2
```

## 목차 및 섹션 구조

표준 8개 섹션:
1. **개요** (Overview)
2. **요구사항** (Requirements)
3. **아키텍처** (Architecture)
4. **설계** (Design)
5. **구현** (Implementation)
6. **테스트** (Testing)
7. **배포** (Deployment)
8. **부록** (Appendix)

## 섹션별 양식

### 1. 개요 (Overview)
- **목표 (Goals):** 3-5개 핵심 목표 체크리스트
- **핵심 가치:** 테이블 형식 (항목 | 설명)
- **범위 (Scope):**
  - 포함사항: 기능 A, B, C
  - 제외사항: 기능 X (향후 Phase 2), 기능 Y (기술적 제약)
- **성공 기준:** 측정 가능한 체크리스트 (Lighthouse 80+, 응답시간 <500ms 등)

### 2. 요구사항 (Requirements)
- **기능 요구사항 (FR):** ID + 설명 + 우선순위 + 수용 조건 (BDD 형식)
- **비기능 요구사항 (NFR):** 성능, 보안, 확장성, 접근성
- **제약사항:** 기술적, 일정, 예산 제약

### 3. 아키텍처 (Architecture)
- **시스템 다이어그램:** 컴포넌트 간 상호작용
- **데이터 흐름:** ETL 또는 메시지 흐름 다이어그램
- **기술 스택:** 언어, 프레임워크, 라이브러리 목록
- **확장성 전략:** 트래픽 증가 시 대응 방안

### 4. 설계 (Design)
- **데이터 모델:** DB 스키마, ERD
- **API 설계:** 엔드포인트 목록 (메서드, 경로, 설명, 응답 예제)
- **UI 설계:** 페이지 목록, 컴포넌트 구조, 와이어프레임
- **보안:** 인증, 인가, 데이터 암호화 방식

### 5. 구현 (Implementation)
- **개발 순서:** 단계별 구현 로드맵
- **디렉토리 구조:** 소스 코드 폴더 구성
- **주의사항:** 함정, 엣지 케이스, 성능 최적화 팁

### 6. 테스트 (Testing)
- **테스트 전략:** 단위, 통합, E2E 테스트
- **테스트 케이스:** 주요 시나리오 목록
- **성능 목표:** 응답시간, 처리량, 안정성 지표

### 7. 배포 (Deployment)
- **배포 환경:** 개발, 스테이징, 프로덕션
- **배포 절차:** 단계별 체크리스트
- **롤백 전략:** 문제 발생 시 복구 방안
- **모니터링:** 배포 후 메트릭 추적 방법

### 8. 부록 (Appendix)
- **참고 자료:** 외부 링크, 관련 문서
- **용어 정의:** 도메인 용어 정의
- **추가 고려사항:** 향후 개선, Phase 2+ 계획

## 문서 작성 가이드

### 포맷팅
- 마크다운 GitHub Flavor 준수
- 코드 블록은 ``` 메시지와 함께 언어 지정 (```typescript, ```sql 등)
- 이미지는 상대 경로로 docs/images/ 폴더에 저장

### 체크리스트
- [ ] 체크박스 형식으로 진행상황 추적
- 완료 항목은 [x]로 마크

### 테이블
- 항목 | 설명 형식으로 일관성 있게
- 최소 3개 열 이상 권장

### 링크
- 내부 링크: [섹션명](#섹션명)
- 외부 링크: [텍스트](URL)
- 상대 경로: ./docs/api/endpoints.md

## 상태
✅ **참고 문서** → 모든 설계 프로젝트에 적용
