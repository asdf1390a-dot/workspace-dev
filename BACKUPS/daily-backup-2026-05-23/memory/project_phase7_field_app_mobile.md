---
name: Phase 7 Field App 모바일 개발 (모바일개발자)
description: Flutter 기반 현장 작업자 앱 — 설계, 온보딩, 마일스톤, 팀 협력
type: project
owner: 모바일개발자
date: 2026-05-19
---

# Phase 7: Field Technician Mobile App — 모바일 개발자 프로젝트

**프로젝트 ID:** PHASE7_MOBILE_001  
**기간:** 2026-05-19 (온보딩) → 2026-07-31 (v1.0 배포)  
**담당:** 모바일개발자 (신규팀원)  
**협력:** Web-Builder AI Agent(API), Evaluator AI Agent(QA), Planner AI Agent(설계 검증)

---

## 📋 온보딩 현황

**상태:** 🟢 완료 (2026-05-19 16:30)

**산출물:**
1. ✅ `PHASE7_FIELD_APP_MVP_DESIGN.md` (완전 설계 문서)
2. ✅ `MOBILE_DEVELOPER_ONBOARDING_PACKAGE.md` (온보딩 가이드)

**다음 단계:**
- Day 1-5 (2026-05-19 ~ 2026-05-23): 온보딩 완료 → 환경 설정
- Week 1-8 (2026-06-02 ~ 2026-07-31): 본격 개발 시작

---

## 🎯 MVP 범위 (최종 확정)

### 핵심 기능 (5개)
1. **대시보드** — 실시간 설비 상태 + 오늘의 BM 발생 + 내 작업 할당
2. **BM(장비 고장) 보고** — 5단계 폼 (설비 선택 → 실패코드 → 증거 자료 → 기술 → 검토)
3. **부품 재고 조회** — QR 스캔 또는 SKU 검색
4. **작업 지시 수신** — FCM 푸시 알림 + 오프라인 캐싱
5. **오프라인 동기화** — 인터넷 끊김 시 자동 로컬 저장 → 복구 후 자동 동기화

### 제외 항목 (Phase 2+)
- 예측 모델, 이상 탐지
- 다국어 (HI 미포함, v1.0은 KO/EN만)
- 팀 채팅, 소셜 피드

---

## 🏗️ 기술 스택

**언어/프레임워크:**
- Flutter 3.24+
- Dart 3.4+

**상태 관리:**
- Riverpod (권장)

**백엔드:**
- Supabase (인증 + 실시간 구독 + RLS)
- Firebase (FCM + Analytics)

**로컬 저장:**
- Hive (오프라인 DB)
- SQLite (대안)

**미디어:**
- image_picker (사진/갤러리)
- camera (카메라 촬영)
- video_player (영상 재생)

**위치/QR:**
- geolocator (GPS)
- mobile_scanner (QR 스캔)

---

## 📅 개발 로드맵 (8주)

### Week 1-2: 기초 (2026-06-02 ~ 06-15)
- [ ] 프로젝트 초기화 (Flutter + Riverpod + Firebase)
- [ ] 인증 시스템 (Supabase Auth + 로컬 토큰)
- [ ] 기본 네비게이션 (Bottom Tab Bar)
- **산출물:** GitHub repo + local build ✅

### Week 3-4: UI (2026-06-16 ~ 06-29)
- [ ] 대시보드 UI (Bento Grid, 실시간 구독)
- [ ] BM 보고 폼 (Step 1-5 완전 구현)
- [ ] 카메라/갤러리 통합
- **산출물:** APK/IPA 베타 빌드

### Week 5-6: 기능 (2026-06-30 ~ 07-13)
- [ ] 부품 조회 + QR 스캔
- [ ] 작업 목록 + FCM 알림
- [ ] 오프라인 동기화 (Hive + 충돌해결)
- **산출물:** 내부 테스트 버전 (TestFlight/Google Play 내부 테스트)

### Week 7-8: 배포 (2026-07-14 ~ 07-31)
- [ ] 성능 최적화 (번들 크기 <100MB, 시작 <2초)
- [ ] 자동화 테스트 (Unit + Widget + Integration)
- [ ] App Store + Google Play 배포
- **산출물:** v1.0 Public Release

---

## 🔗 API 협력 (Web-Builder AI Agent)

**필요 API (6개):**

| 번호 | API | 타입 | 우선순위 | 필요 시점 |
|------|-----|------|---------|---------|
| 1 | BM 생성 | POST /api/bm-events | P0 | Week 3-4 |
| 2 | 작업 목록 | GET /api/tasks | P0 | Week 5-6 |
| 3 | 부품 조회 | GET /api/parts | P0 | Week 5-6 |
| 4 | 사진/영상 업로드 | POST /api/media/upload | P0 | Week 3-4 |
| 5 | Glossary (실패코드) | GET /api/glossary | P1 | Week 2-3 |
| 6 | 실시간 구독 | GraphQL: asset_status | P0 | Week 1-2 |

**API 스펙 정의:** 모바일 개발자 → Web-Builder AI Agent (2026-06-10)  
**API 구현:** Web-Builder AI Agent (2026-06-10 ~ 06-20)  
**Real API 통합:** 모바일 개발자 (Week 5-6)

---

## ✅ 성공 기준

### 기능
- [ ] 5개 핵심 기능 100% 구현
- [ ] 오프라인 동기화 100% 작동 (데이터 손실 0%)
- [ ] QR 스캔 정확도 ≥99%

### 성능
- [ ] 앱 시작: <2초
- [ ] 대시보드 로드: <1초
- [ ] 앱 크기: <100MB (Android), <80MB (iOS)

### UX/보안
- [ ] 권한 요청 명확함 (카메라, 위치, 알림)
- [ ] 에러 메시지 명확함
- [ ] 로컬 토큰 암호화 저장
- [ ] 모든 API 호출 HTTPS 인증

### 테스트
- [ ] Unit 테스트: 80% 커버리지
- [ ] Widget 테스트: 핵심 UI 5개
- [ ] Integration 테스트: BM 보고 엔드투엔드

---

## 📞 팀 협력 규칙

### 주간 체크인
**시간:** 매주 월요일 08:00 KST (5분)  
**형식:** Telegram 메시지

```
【모바일개발자 주간 리포트】
지난주: [완료 작업] | [블로킹]
이번주: [예정 작업] (3개)
ETA: 2026-06-XX
진행률: XX%
```

### 코드 리뷰 흐름
```
1. GitHub PR (staging 브랜치)
2. Planner AI Agent 검토 (설계 준수)
3. Evaluator AI Agent 검토 (성능/보안)
4. 머지 (staging → main)
5. Vercel 자동 배포
⏱️ 예상: 4-6시간
```

### API 협력 (Web-Builder AI Agent)
```
- 모바일 개발자: API 스펙 요청 (GitHub issue)
- Web-Builder AI Agent: API 구현 (2-3일)
- 모바일 개발자: Mock API → Real API 전환
- Evaluator AI Agent: 성능 검증 (응답 시간, 데이터 정확성)
```

### 문제 해결
| 상황 | 해결책 | 담당 |
|------|------|------|
| API 늦어짐 | Mock API로 먼저 UI 완성 | 모바일개발자 |
| 설계 변경 필요 | GitHub issue → Planner AI Agent 승인 | Planner AI Agent |
| 버그 발생 | Discord #모바일-앱 | Evaluator AI Agent 지원 |
| 성능 문제 | DevTools 분석 + 팀 상의 | 모바일개발자 + Evaluator AI Agent |

---

## 📚 참고 자료

**내부 문서:**
- `PHASE7_FIELD_APP_MVP_DESIGN.md` — 완전 설계 문서
- `MOBILE_DEVELOPER_ONBOARDING_PACKAGE.md` — 온보딩 가이드
- `memory/work_history_package.md` — Web-Builder AI Agent 코드 패턴

**외부 문서:**
- [Flutter Docs](https://docs.flutter.dev)
- [Supabase Flutter](https://supabase.com/docs/reference/flutter/introduction)
- [Riverpod Guide](https://riverpod.dev)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

## 🎓 학습 자료 (온보딩 완료 후)

**Week 1 숙제 (Day 5 이후):**
1. Supabase RLS 패턴 3가지 습득 (3시간)
2. Riverpod StateNotifier 구현 (2시간)
3. Flutter 오프라인 동기화 패턴 (2시간)

**Week 2+ 지속:**
- 매주 Evaluator AI Agent와 성능 회고 (1시간)
- 월간 팀 전체 기술 공유 (1시간)

---

## 🔔 중요 일정

| 날짜 | 마일스톤 | 예상 진행률 |
|------|---------|-----------|
| 2026-05-23 | 온보딩 완료 + 환경 설정 | 0% 코드 |
| 2026-06-02 | 개발 시작 | 0% → 10% |
| 2026-06-15 | UI 50% | 10% → 50% |
| 2026-06-29 | UI 100% + 기본 API | 50% → 75% |
| 2026-07-13 | 오프라인 완성 + 테스트 | 75% → 95% |
| 2026-07-31 | v1.0 배포 (AppStore + Play) | 95% → 100% |

---

**다음 액션:**
1. 모바일개발자: PHASE7_FIELD_APP_MVP_DESIGN.md + MOBILE_DEVELOPER_ONBOARDING_PACKAGE.md 검토 (5시간)
2. 모바일개발자: 설계 검토 완료 후 Telegram 보고
3. Planner AI Agent: 설계 피드백 수집 (Discord #모바일-앱)
4. Web-Builder AI Agent: API 스펙 정의 대기 (Week 3-4)
