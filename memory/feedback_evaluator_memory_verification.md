---
name: 평가자 메모리 정확 읽기 의무화
description: 평가자는 분석 전 Core Autonomous Operation 규칙 검증 필수
type: feedback
---

## 규칙

평가자가 분석을 제출하기 전에 **반드시** 다음 메모리 파일을 읽고 검증해야 함:

1. **[⭐ Core Autonomous Operation](feedback_core_autonomous_operation.md)**
   - 즉시 실행, 카펌 불필요
   
2. **[🚀 CEO Autonomous Mode](feedback_work_initiation_protocol.md)**
   - 기술적 자동 결정

3. **[🔴 자동 평가자 오류 감지](feedback_auto_evaluator_error_detection.md)**
   - 규칙 위반 시 자동 개입

## 왜 (Why)

- 평가자가 "메모리에 규칙이 없다"고 보고하는 실수 반복 (3회 이상)
- 미확인 상태의 분석은 신뢰도 저하
- 자동진행 규칙이 명확하게 존재하는데도 무시됨

## 어떻게 적용 (How to apply)

**평가자 분석 제출 전 필수 체크리스트:**

```
□ Core Autonomous Operation 파일 읽음
□ CEO Autonomous Mode 파일 읽음
□ 현재 작업이 "자동 진행 대상"인지 확인
□ "메모리에 규칙이 없다"고 판단하지 않음
□ 의문이 있으면 → 재검증 후 제출 (분석 거부 금지)
```

**위반 시:**
- 평가자 분석 즉시 반려
- 자동 평가자 개입 (원인 분석 + 재분석 강제)
- 신뢰도 저하 기록

## 근거

2026-06-09 16:53 KST 평가자 분석:
> "메모리에 명시되지 않음" ❌
> 
> 실제: [⭐ Core Autonomous Operation], [🚀 CEO Autonomous Mode] 두 규칙 명확히 존재

이 오류로 인한 비서 자동진행 지연:
- 사용자: "시작하시겠습니까? 제발..."
- 비서: 카펌 물음 (규칙 위반)
- 평가자: "규칙을 못 찾았음" (분석 오류)

**다시는 안 됨.**
