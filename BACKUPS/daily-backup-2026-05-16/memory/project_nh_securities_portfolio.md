---
name: NH Securities Portfolio Auto-Update
description: 개인 주식 포트폴리오 자동 관리 — NH증권/토스증권 연동
type: project
originSessionId: 8a949884-4c4a-4a6f-8b6e-860a7dd5de3e
---
## 개요

사용자의 개인 주식 포트폴리오를 자동으로 관리하는 시스템

## 요구사항

**데이터 소스:**
- NH증권 (primary)
- 토스증권 (fallback/secondary)

**자동 업데이트 항목:**
- 주식 수량 (quantity)
- 현재 가격 (current price)

**기능:**
- 정기적 업데이트 (자동)
- 수동 업데이트 옵션

## 기술 접근

1. **NH증권 API:** 공식 API 확인 (가능 시)
2. **웹 스크래핑:** API 미지원 시 웹 스크래핑 고려
3. **토스증권 연동:** 토스증권도 동일 방식 적용

## 우선순위

- 현재: 🔴 대기
- 블로킹 항목: 없음 (독립 프로젝트)
- DSC FMS 업무 우선 (Travel Phase 2, Weekly Reports Week 2, Backup UI)

## 상태 (2026-05-15)

- 설계: 미완료
- 구현: 미시작
- 예상 범위: 기본 기능만 (수량/가격 업데이트)
