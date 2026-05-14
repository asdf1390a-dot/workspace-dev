# model-router

업무 유형에 따라 모델을 자동 선택하는 라우팅 기준.

## 모델 선택 기준

| 유형 | 모델 | 해당 업무 |
|---|---|---|
| **Haiku** | claude-haiku-4-5 | 단순 질문, 날씨/날짜 확인, 현황판 출력, 짧은 번역, 예/아니오 판단 |
| **Sonnet** | claude-sonnet-4-6 | 일반 대화, 문서 요약, 중간 복잡도 코드 수정, 이메일 작성, 현황 분석 |
| **Opus** | claude-opus-4-7 | 복잡한 코딩·개발, DB 스키마 설계, 시스템 아키텍처, 심층 분석, 다중 파일 리팩터링 |

## 적용 방법

비서(나)가 요청을 받으면 먼저 유형 판단:

1. **즉답 가능한 단순 질문** → Haiku로 직접 답변 (tool 최소화)
2. **중간 복잡도** → Sonnet (현재 기본값, 대부분 여기 해당)
3. **코딩·분석 위임** → 해당 팀원 서브에이전트 호출 시 Opus 사용
   - web-builder → `subagent_type=web-builder` (Opus)
   - data-analyst → `subagent_type=data-analyst` (Opus)
   - evaluator → `subagent_type=evaluator` (Opus)
   - planner → `subagent_type=planner` (Sonnet)
   - translator → `subagent_type=translator` (Sonnet)

## 판단 기준 예시

```
"현황" → Haiku (현황판 출력)
"이 PPT 번역해줘" → translator (Sonnet)
"BM 이력 모듈 만들어줘" → web-builder (Opus)
"어제 가동률 알려줘" → data-analyst (Opus)
"날씨 어때?" → Haiku
"설비 마스터 페이지 설계해줘" → planner (Sonnet)
"이 기능 QA 해줘" → evaluator (Opus)
```
