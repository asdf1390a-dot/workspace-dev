---
name: 모바일 개발자 온보딩 패키지
description: Flutter 기반 Phase 7 Field App 개발자를 위한 완전한 온보딩 가이드 — 팀 구조, 프로젝트 배경, 코딩 패턴, 협력 프로토콜
type: reference
owner: 비서
date: 2026-05-19
---

# 모바일 개발자 온보딩 패키지

**시작 날짜:** 2026-05-19 (Day 1 온보딩)  
**첫 산출물:** PHASE7_FIELD_APP_MVP_DESIGN.md 검토 → 개발 시작 (2026-06-02)  
**담당 주기:** 매주 월요일 08:00 체크인, 금요일 18:00 주간 리포트

---

## 📍 1단계: 팀 및 프로젝트 구조 이해 (2시간)

### 1.1 팀 구성 (4명 → 6명 확장 중)

| 역할 | 이름/Agent | 역할 | 협력 방식 |
|------|-----------|------|---------|
| **CEO** | 사용자 (Kyeongtae Na) | 경영진결정 | Telegram 최종 승인 |
| **플레너** | Planner Agent | 설계문서 작성 | GitHub 리뷰 요청 |
| **웹개발자** | Web-Builder Agent | 백엔드 API + 포탈 | 협력 API 스펙 정의 |
| **평가자** | Evaluator Agent | QA + 배포 게이트 | 성능 검증 후 릴리즈 |
| **번역가** | Translator Agent | 한영 번역 | 필요시 호출 |
| **모바일개발자** | **너(새 팀원)** | **Flutter 앱 개발** | **이 패키지** |

### 1.2 프로젝트 생태계

```
DSC FMS v1.0 (2026-05-16 ~ 06-27)
├── Backup App Phase 2 (6월 완료)
├── Asset Master v2 (6월 진행 중)
└── Travel Management (6월 진행 중)

Phase 7 (2026-07-01 ~ 09-30) — 너의 담당 영역
├── 7-1: Data Platform 설계 (데이터분석가)
└── 7-2/3: Field App v1 개발 (너) ← 지금부터 설계 검토
```

### 1.3 회사 배경
- **DSC Mannur**: 인도 타밀나두 주의 자동차 부품 제조사 (Tier 2)
- **4개 부서**: 생산(Production), 기술(Engineering), 보전(Maintenance), 생산관리(Planning)
- **현재 과제**: 4개 부서의 수동 작업 자동화

---

## 📚 2단계: 기존 프로젝트 코드 패턴 학습 (4시간)

### 2.1 백엔드 아키텍처 (웹개발자의 작업)

**Tech Stack:** Next.js 14 + Supabase + Vercel

**핵심 패턴 1: Server Component 인증**
```typescript
// app/(authenticated)/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, ..., {
    cookies: { getAll: () => cookieStore.getAll(), ... }
  });
  
  const { data: user } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  // 사용자별 데이터 조회 (RLS 자동 적용)
  const { data } = await supabase
    .from('assets')
    .select('*')
    .eq('assigned_to', user.id);
  
  return <Dashboard assets={data} />;
}
```

**중요:** `getUser()` 아님 → `getClaims()` (캐시됨, 네트워크 불필요)

**핵심 패턴 2: Supabase RLS (행 보안)**
```sql
-- assets 테이블 정책
CREATE POLICY "users_select_assigned_assets" ON assets
  FOR SELECT
  USING (auth.uid() = assigned_to OR auth.role() = 'admin');

-- 결과: 사용자는 자신에게 할당된 자산만 조회 가능
```

**핵심 패턴 3: Glossary (다국어 + 동적 드롭다운)**
```sql
CREATE TABLE glossary (
  field_key VARCHAR PRIMARY KEY,      -- "failure_code"
  label_ko VARCHAR,                   -- "모터 고장"
  label_en VARCHAR,                   -- "Motor Failure"
  source_system VARCHAR,              -- "bm_events"
  display_order INT
);

-- 사용: 스키마는 code만 저장, UI는 glossary에서 레이블 조회
ALTER TABLE bm_events ADD COLUMN failure_code VARCHAR REFERENCES glossary(field_key);
```

### 2.2 모바일(너의 작업) 대응 아키텍처

**Flutter에서 같은 패턴 구현:**

```dart
// lib/services/supabase_service.dart
class SupabaseService {
  final SupabaseClient client;
  
  // 인증된 사용자 가져오기
  Future<User?> getUser() async {
    final session = client.auth.currentSession;
    return session?.user;
  }
  
  // 사용자가 할당받은 자산만 조회 (RLS 자동 적용)
  Future<List<Asset>> getAssignedAssets() async {
    final user = await getUser();
    if (user == null) throw Exception('Not authenticated');
    
    final response = await client
        .from('assets')
        .select()
        .eq('assigned_to', user.id);
    
    return (response as List).map((e) => Asset.fromJson(e)).toList();
  }
  
  // 실시간 구독 (작업 목록 자동 갱신)
  Stream<List<Task>> watchAssignedTasks() {
    return client
        .from('tasks')
        .stream(primaryKey: ['id'])
        .eq('assigned_to', getUser()!.id)
        .map((events) => events.map((e) => Task.fromJson(e)).toList());
  }
}
```

### 2.3 필수 학습 자료

**읽어야 할 파일:**
1. `memory/work_history_package.md` (웹개발자 코드 패턴 5개)
2. `memory/team_capacity_matrix_final.md` (팀 구조)
3. `SOUL.md` (비서 작동 방식 및 팀 협력 규칙)

**라이브러리 문서:**
- [Supabase Flutter Client](https://pub.dev/packages/supabase_flutter)
- [Riverpod](https://pub.dev/packages/riverpod) (상태관리)
- [Firebase](https://pub.dev/packages/firebase_core) (FCM + Analytics)

---

## 🔧 3단계: Phase 7 Field App 설계 검토 (3시간)

### 3.1 설계 문서 읽기
**파일:** `PHASE7_FIELD_APP_MVP_DESIGN.md`

**체크리스트:**
- [ ] MVP 범위 이해 (5개 핵심 기능)
- [ ] UI 플로우 (대시보드 → BM 보고 → 동기화)
- [ ] Flutter 폴더 구조
- [ ] 상태관리 패턴 (Riverpod)
- [ ] 백엔드 API 요구사항 (웹개발자 협력)

### 3.2 기술적 결정사항

**Q: 왜 Flutter인가? (React Native 아님)**
- A: 성능 (앱 시작 <2초), 오프라인 지원, iOS/Android 동시 배포

**Q: 오프라인 동기화 어떻게?**
- A: Hive (로컬 DB) + Riverpod (상태관리) + 충돌해결 (타임스탬프)

**Q: 사진 업로드 어떻게?**
- A: Supabase Storage (S3 호환) + multipart/form-data + 다중 재시도

**Q: 권한 관리는?**
- A: Supabase RLS + JWT 토큰의 `role` 클레임

---

## 💬 4단계: 팀 협력 프로토콜 (1시간)

### 4.1 주간 체크인

**시간:** 매주 월요일 08:00 KST (5분)  
**형식:** Telegram 메시지

```
【모바일개발자 주간 리포트】
지난주: [완료 작업 3개] + [블로킹 1개]
이번주: [예정 작업 3개]
ETA: 2026-06-XX
```

### 4.2 코드 리뷰 흐름

```
1. GitHub PR 생성 (staging 브랜치)
2. 플레너 검토 (설계 준수 확인)
3. 평가자 검토 (성능/보안 테스트)
4. 머지 (staging → main)
5. Vercel 자동 빌드/배포

⏱️ 예상 시간: 4-6시간
```

### 4.3 웹개발자 협력 (API)

**흐름:**
```
너의 설계 완료 (Step 1-5 UI)
  ↓
필요한 API 목록 정의
  ↓
웹개발자에게 API 스펙 요청 (GitHub issue)
  ↓
웹개발자가 API 구현 (2-3일)
  ↓
너가 모바일 앱에서 호출 테스트
```

**예시 요청:**
```
【API 요청】 BM 보고 생성
엔드포인트: POST /api/bm-events
입력: { asset_id, failure_code, photos[], location, description }
출력: { id, created_at, status }
타임라인: 2026-06-10까지 필요
```

### 4.4 충돌 해결

**상황 1: API가 늦어짐**
→ 너는 Mock API로 먼저 UI 완성, 나중에 Real API 연결

**상황 2: 설계 변경 필요**
→ 플레너에게 GitHub issue 올리기, 사용자 승인 후 설계 갱신

**상황 3: 버그 발생**
→ Discord #general 채널에 보고, 평가자가 디버깅 지원

---

## 📋 5단계: 초기 환경 설정 (2시간)

### 5.1 로컬 환경

```bash
# 1. Flutter 설치 (버전 3.24+)
flutter --version

# 2. 프로젝트 초기화
flutter create dsc_field_app
cd dsc_field_app

# 3. 의존성 추가
flutter pub add supabase_flutter riverpod firebase_core firebase_messaging image_picker camera geolocator

# 4. GitHub 클론 (설계 저장소)
git clone https://github.com/jeepney/dsc-fms-portal.git
cd mobile-app  # 또는 새 브랜치 생성

# 5. 환경 변수 설정
cp .env.example .env
# 다음 항목 입력:
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_ANON_KEY=xxx
# FIREBASE_PROJECT_ID=xxx
```

### 5.2 개발 도구

**필수:**
- [Android Studio](https://developer.android.com/studio) (Android 에뮬레이터)
- [Xcode](https://developer.apple.com/xcode/) (iOS 에뮬레이터) — Mac만

**권장:**
- [Flutter DevTools](https://flutter.dev/docs/development/tools/devtools)
- [VS Code](https://code.visualstudio.com/) + Flutter/Dart 확장

**테스트 기기:**
- Android 12+ (물리 기기 또는 에뮬레이터)
- iOS 14+ (물리 기기 또는 시뮬레이터)

### 5.3 Git 브랜치 전략

```
main (배포용, 보호됨)
  ↓
staging (개발/리뷰)
  ↓
feature/bm-report, feature/dashboard, ... (너의 기능)

커밋 메시지:
feat(bm): BM 보고 폼 Step 1-2 구현

Refs: PHASE7_001
Stage: DESIGN → API
```

---

## 🎯 6단계: 첫 주 일정 (Day 1-5)

### Day 1 (월요일, 2026-05-19)
- [ ] 이 패키지 읽기 (2시간)
- [ ] 기존 프로젝트 코드 검토 (2시간)
- [ ] GitHub 저장소 설정 (1시간)

**체크인:** 18:00 비서에게 "환경 설정 완료" 보고

### Day 2 (화요일, 2026-05-20)
- [ ] 설계 문서 상세 검토 (3시간)
- [ ] 기술 결정사항 확인 (1시간)
- [ ] Q&A 정리 (1시간)

**체크인:** 18:00 설계 문서 검토 완료 보고

### Day 3 (수요일, 2026-05-21)
- [ ] Supabase 프로젝트 액세스 요청
- [ ] Firebase 프로젝트 설정
- [ ] 로컬 프로젝트 셋업 (flutter create)

**체크인:** 18:00 환경 준비 완료 보고

### Day 4 (목요일, 2026-05-22)
- [ ] Mock API 설계 (Step 1: 검색창, Step 2: 드롭다운)
- [ ] 기본 네비게이션 폴더 구조

**체크인:** 18:00 초기 빌드 성공 보고

### Day 5 (금요일, 2026-05-23)
- [ ] 첫 스크린 구현 (Splash + Login)
- [ ] 팀 피드백 수집 (Discord)

**주간 리포트:** 18:00 (5분, Telegram)

---

## 🔗 7단계: 리소스 링크

### 내부 문서 (GitHub)
- **팀 구조:** [`memory/team_capacity_matrix_final.md`](memory/team_capacity_matrix_final.md)
- **프로젝트 배경:** [`memory/project_ecosystem_vision.md`](memory/project_ecosystem_vision.md)
- **작업 추적:** [`memory/active_work_tracking.md`](memory/active_work_tracking.md)

### 설계 문서 (GitHub)
- **Phase 7 Field App MVP:** [`PHASE7_FIELD_APP_MVP_DESIGN.md`](PHASE7_FIELD_APP_MVP_DESIGN.md) ← 지금 검토하세요
- **웹개발자 패턴:** [`memory/work_history_package.md`](memory/work_history_package.md)

### 외부 문서 (공개)
- [Flutter 공식 가이드](https://docs.flutter.dev)
- [Supabase Flutter Docs](https://supabase.com/docs/reference/flutter/introduction)
- [Riverpod 가이드](https://riverpod.dev)

### 팀 커뮤니케이션
- **Telegram:** `@Kyeongtae` (사용자, 최종 결정)
- **Discord:** `#일반` (팀 공지), `#모바일-앱` (기술 논의, 새로 생성 예정)
- **GitHub:** Issues/PRs (코드 리뷰)

---

## ⏰ 8단계: 중요 일정

| 날짜 | 마일스톤 | 담당 |
|------|---------|------|
| 2026-05-19 | 온보딩 완료 | 모바일개발자 |
| 2026-05-23 | 첫 주 리포트 | 모바일개발자 |
| 2026-06-02 | **개발 시작** (Phase 7-2) | 모바일개발자 |
| 2026-06-15 | Week 2-3 마일스톤 (UI 50%) | 모바일개발자 |
| 2026-06-29 | Week 4 마일스톤 (UI 100%) | 모바일개발자 |
| 2026-07-13 | Week 6 마일스톤 (테스트) | 모바일개발자 + 평가자 |
| 2026-07-31 | **v1.0 배포** | 모바일개발자 + 평가자 |

---

## 🆘 8단계: 문제 해결

### 설치 문제
**Q: Flutter 설치 안 됨?**
→ https://docs.flutter.dev/get-started/install 참고 후 Discord `#모바일-앱` 에 스크린샷 올리기

### API 스펙 불명확
**Q: 웹개발자가 API 스펙을 안 줌?**
→ GitHub issue 생성: "API: /api/bm-events spec needed" → 플레너가 중재

### 성능 문제
**Q: 대시보드 로드가 느림?**
→ DevTools 성능 분석 후 Discord `#모바일-앱` 에서 평가자와 상의

### 데이터 동기화 실패
**Q: 오프라인 모드 테스트가 안 됨?**
→ Android Emulator: 네트워크 끄기 → 플레너에게 보고 (설계 재검토 필요할 수 있음)

---

## ✅ 온보딩 체크리스트

- [ ] **Day 1:** 이 패키지 완독 + 환경 설정 시작
- [ ] **Day 2:** 설계 문서 검토 완료 + Q&A 정리
- [ ] **Day 3:** GitHub 저장소 설정 + Supabase 액세스
- [ ] **Day 4:** 초기 프로젝트 생성 + Mock API 설계
- [ ] **Day 5:** 첫 스크린 (Splash/Login) 구현 + 주간 리포트
- [ ] **2026-05-23:** 모든 온보딩 완료 → 2026-06-02부터 본격 개발 시작

---

**다음 단계:**
1. 이 패키지를 읽은 후 Telegram에서 "온보딩 패키지 검토 완료" 보고
2. `PHASE7_FIELD_APP_MVP_DESIGN.md` 설계 검토 (3시간)
3. GitHub 저장소 setup 시작 (Day 3)
4. 주간 체크인 (매주 월요일 08:00)

**문의사항:** Discord `#모바일-앱` 채널에서 언제든 질문하세요.

환영합니다! 🚀
