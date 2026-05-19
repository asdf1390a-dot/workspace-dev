---
name: Phase 7 Field App MVP 설계
description: Flutter 기반 현장 작업자용 모바일 앱 — 오프라인 지원, 실시간 작업 입력, 이미지/QR 통합
type: design
owner: 모바일개발자
stage: DESIGN
deadline: 2026-06-02
date: 2026-05-19
---

# Phase 7: Field Technician Mobile App (MVP 설계)

**프로젝트:** DSC FMS 생태계 확장 Phase 7-2  
**기간:** 2026-06-02 ~ 2026-07-31 (총 8주)  
**목표:** 현장 작업자(생산/기술/보전)의 실시간 작업 관리 및 즉시 보고

---

## 📱 MVP 범위

### 타겟 사용자
- **생산팀:** 일일 생산 현황 조회, 결함 입력
- **기술팀:** 설비 상태 조회, BM(장비 고장) 즉시 보고
- **보전팀:** 유지보수 작업 지시 수신, 완료 기록

### 핵심 기능 (v1.0)
1. **설비 상태 대시보드** — 실시간 가용성, BM 발생 현황
2. **BM(장비 고장) 보고** — 사진/영상 캡처, 실패코드 선택, 위치 정보
3. **부품 재고 조회** — QR 스캔 또는 SKU 검색
4. **작업 지시 수신** — 푸시 알림, 오프라인 캐싱
5. **오프라인 모드** — 인터넷 끊김 시 자동 로컬 저장 후 동기화

### 제외 항목 (Phase 2+)
- 예측 모델, 이상 탐지, 다국어(HI 미포함)
- 소셜 피드, 팀 채팅

---

## 🎯 주요 기능 상세 설계

### 1. 로그인 & 인증

**기술:** Supabase Auth + 생체인증(Face/Touch)

```
Flow:
1. 초기 로그인 → Supabase (이메일/비번 또는 SSO)
2. 로컬 저장 → RefreshToken + AccessToken
3. 다음 실행 → 로컬 토큰으로 자동 로그인
4. 오프라인 → 마지막 유효 토큰 사용 (최대 72시간)

UI 흐름:
[SplashScreen(3s)] 
  → [LoginScreen(이메일/비번 OR 생체)] 
  → [DashboardScreen]
```

**권한 관리:**
- `role = 'technician' | 'supervisor' | 'admin'` (Supabase JWT 토큰에 포함)
- 역할별 화면 가시성 제어

---

### 2. 설비 상태 대시보드

**UI:** Bento Grid 레이아웃 (반응형)

**카드 1: 실시간 가용성**
```
┌─ Asset Status Overview ────────┐
│ 🟢 정상: 24/30 설비 (80%)     │
│ 🟡 주의: 4/30 설비 (13%)      │
│ 🔴 다운: 2/30 설비 (7%)       │
└────────────────────────────────┘
```

**카드 2: 오늘의 BM 발생**
```
┌─ Today's Breakdowns ───────────┐
│ [09:15] Line2 모터 과열        │
│ [11:42] Line4 컨베이어 정지   │
│ [14:20] Line1 센서 오류        │
│ 새로운 보고 → [+] 버튼        │
└────────────────────────────────┘
```

**카드 3: 내 작업 할당**
```
┌─ My Assignments ───────────────┐
│ [01] Line2 모터 점검 (진행중) │
│ [02] 부품 교체 완료 (대기)    │
│ [03] 정기검사 (예정)           │
└────────────────────────────────┘
```

**데이터 소스:** Supabase RLS, 실시간 구독
```sql
SELECT * FROM asset_status 
WHERE (assigned_to = current_user_id OR role = 'supervisor')
AND date = TODAY();
```

---

### 3. BM(장비 고장) 보고 화면

**Input Form (5단계)**

**Step 1: 설비 선택**
```
[설비 검색/선택 드롭다운]
├─ Line 1 (Stamping)
├─ Line 2 (Assembly)
├─ Line 3 (Welding)
└─ ...

또는 QR 코드 스캔 → 자동 입력
```

**Step 2: 실패 코드 선택 (Glossary 기반)**
```
[실패 카테고리 선택]
├─ 기계적 고장
│  ├─ 모터 고장 [CODE: MECH_MOTOR]
│  ├─ 베어링 손상 [CODE: MECH_BEARING]
│  └─ ...
├─ 전기 고장
│  ├─ 센서 오류 [CODE: ELEC_SENSOR]
│  └─ ...
└─ 기타
   └─ 미분류 [CODE: OTHER]

선택 후 → AI 추천 해결책 표시
(예: "일반적 해결 시간: 45분, 비용: 125 INR")
```

**Step 3: 증거 자료 수집**
```
┌────────────────┐
│ 📸 [사진 촬영]  │  (기본 5장)
│ 🎥 [영상 촬영]  │  (최대 1분)
│ 📍 [위치 고정]  │  (GPS 또는 수동)
└────────────────┘

오프라인 시 → 로컬 저장, 네트워크 복구 후 자동 업로드
```

**Step 4: 상세 기술**
```
[텍스트 입력 또는 음성 메모]
"모터에서 이상한 소음 + 온도 상승"

음성 입력 → 텍스트 변환 (Speech-to-Text API)
```

**Step 5: 확인 & 제출**
```
[요약 검토]
- 설비: Line 2 (Assembly)
- 코드: MECH_MOTOR
- 사진: 3장
- 위치: 40.123°N, 75.456°E
- 설명: 모터에서 이상한 소음...

[제출] → Supabase 저장 (오프라인이면 로컬 큐)
```

**데이터 저장:**
```sql
INSERT INTO bm_events (
  asset_id, failure_code, 
  photos, video_url, location,
  description, created_by, created_at
) VALUES (...)
```

---

### 4. 부품 재고 조회

**UI: 검색 + 스캔**

```
[QR 스캔 버튼] [검색창: SKU 또는 이름]
         ↓
    [결과 목록]
    ┌─────────────┐
    │ SKU: 1001   │
    │ 이름: 모터  │
    │ 위치: A2    │
    │ 수량: 45/50│
    │ 상태: OK    │
    └─────────────┘
```

**Query:**
```sql
SELECT sku, name, location, quantity, reorder_level
FROM parts_inventory
WHERE status = 'active'
ORDER BY location;
```

---

### 5. 작업 지시 수신

**푸시 알림 (FCM)**
```
알림 페이로드:
{
  "title": "새로운 작업 지정",
  "body": "Line2 모터 점검 — 긴급",
  "task_id": "TASK_2026_0521_001",
  "priority": "high"
}

→ 앱에서 수신 → NotificationScreen 표시
→ 사용자 탭 → TaskDetailScreen (오프라인 캐시)
```

**작업 목록 화면:**
```
[상태 필터] 
├─ 📌 진행 중 (3)
├─ ⏳ 예정 (7)
└─ ✅ 완료 (24)

[작업 카드]
┌──────────────────┐
│ 모터 점검        │
│ 우선순위: 높음  │
│ 지정자: 감독자   │
│ ETA: 14:30      │
│ [시작] [상세]    │
└──────────────────┘
```

---

### 6. 오프라인 동기화

**로컬 저장 (Hive or SQLite)**
```
- BM 보고 임시 저장
- 작업 목록 캐시
- 설비 상태 스냅샷
- 사진/영상 (로컬 임시 디렉토리)
```

**동기화 전략:**
```
인터넷 복구 감지 → 
  1. 오프라인 큐 확인
  2. 사진/영상 업로드 (다중 부분)
  3. 메타데이터 동기화
  4. 충돌 해결 (타임스탬프 기준)
  5. 로컬 캐시 갱신

실패 시 → 사용자 알림 + 재시도 옵션
```

---

## 🏗️ Flutter 아키텍처

### 폴더 구조
```
lib/
├── main.dart
├── config/
│   ├── env.dart (API 엔드포인트, Firebase 키)
│   ├── theme.dart (색상, 타이포그래피)
│   └── constants.dart
├── models/
│   ├── user.dart
│   ├── asset.dart
│   ├── bm_event.dart
│   ├── task.dart
│   └── part.dart
├── providers/
│   ├── auth_provider.dart (Supabase Auth)
│   ├── asset_provider.dart (실시간 구독)
│   ├── bm_provider.dart (오프라인 큐)
│   ├── sync_provider.dart (동기화 상태)
│   └── offline_provider.dart (로컬 저장)
├── services/
│   ├── supabase_service.dart
│   ├── firebase_service.dart (FCM + Analytics)
│   ├── camera_service.dart
│   ├── location_service.dart
│   ├── storage_service.dart (Hive)
│   └── sync_service.dart
├── screens/
│   ├── splash_screen.dart
│   ├── login_screen.dart
│   ├── dashboard_screen.dart
│   ├── bm_report_screen/ (5단계 폼)
│   │   ├── step1_asset_selection.dart
│   │   ├── step2_failure_code.dart
│   │   ├── step3_media_capture.dart
│   │   ├── step4_description.dart
│   │   └── step5_review.dart
│   ├── inventory_screen.dart
│   ├── task_list_screen.dart
│   ├── notifications_screen.dart
│   └── settings_screen.dart
├── widgets/
│   ├── app_bar.dart
│   ├── bento_grid.dart
│   ├── status_card.dart
│   ├── task_card.dart
│   ├── offline_indicator.dart
│   └── sync_progress.dart
└── utils/
    ├── validators.dart
    ├── formatters.dart
    ├── camera_utils.dart
    └── error_handler.dart
```

### 상태 관리 (Riverpod 권장)
```dart
// 예시: BM 오프라인 큐
final bmQueueProvider = StateNotifierProvider<BmQueueNotifier, List<BmEvent>>((ref) {
  return BmQueueNotifier(ref.watch(storageServiceProvider));
});

class BmQueueNotifier extends StateNotifier<List<BmEvent>> {
  final StorageService _storage;
  
  BmQueueNotifier(this._storage) : super([]) {
    _loadQueue();
  }
  
  Future<void> addToQueue(BmEvent event) async {
    state = [...state, event];
    await _storage.saveBmEvent(event);
  }
  
  Future<void> syncQueue(SupabaseService supabase) async {
    for (var event in state) {
      try {
        await supabase.createBmEvent(event);
        state = state.where((e) => e.id != event.id).toList();
      } catch (e) {
        // 재시도 로직
      }
    }
  }
}
```

---

## 📡 백엔드 API 요구사항

### 웹개발자(백엔드) 협력 항목

**1. 실시간 구독**
```graphql
subscription OnAssetStatus {
  asset_status(where: { assigned_to: { _eq: "user_id" } }) {
    id, asset_id, status, updated_at
  }
}
```

**2. BM 생성 API**
```
POST /api/bm-events
{
  "asset_id": "ASSET_001",
  "failure_code": "MECH_MOTOR",
  "photos": ["s3://...", ...],
  "video_url": "s3://...",
  "location": { "lat": 40.123, "lng": 75.456 },
  "description": "모터에서 이상한 소음"
}
→ { "id": "BM_20260519_001", "status": "created" }
```

**3. 작업 목록 API**
```
GET /api/tasks?user_id=USER_123&status=pending,in_progress
→ [ { "id": "TASK_001", "title": "...", "priority": "high", ... } ]
```

**4. 부품 조회 API**
```
GET /api/parts?sku=1001
→ { "sku": "1001", "location": "A2", "quantity": 45, ... }
```

**5. 사진/영상 업로드**
```
POST /api/media/upload (multipart/form-data)
Content-Type: image/jpeg (또는 video/mp4)
→ { "url": "s3://...", "thumbnail": "s3://..." }
```

**6. Glossary (실패코드) 조회**
```
GET /api/glossary?type=failure_codes
→ [
  { "code": "MECH_MOTOR", "label_ko": "모터 고장", "typical_duration": 45 },
  ...
]
```

---

## 🎨 UI 디자인 가이드

### 색상 팔레트 (DSC FMS 준수)
- **Primary:** #2563EB (파란색)
- **Success:** #10B981 (초록색)
- **Warning:** #F59E0B (주황색)
- **Error:** #EF4444 (빨간색)
- **Background:** #F9FAFB

### 타이포그래피
- **Heading 1 (Title):** 20pt, Bold
- **Heading 2 (Section):** 16pt, Semibold
- **Body:** 14pt, Regular
- **Caption:** 12pt, Regular

### 간격 (8px 그리드)
- `xs: 4px`, `sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`

### 반응형 브레이크포인트
- Mobile: 360px ~ 599px
- Tablet: 600px ~ 1023px

---

## 📋 개발 로드맵

### Week 1-2 (2026-06-02 ~ 06-15)
1. 프로젝트 초기화 (Flutter + Riverpod + Firebase)
2. 인증 시스템 (Supabase Auth + 로컬 저장)
3. 기본 네비게이션 (Bottom Tab Bar)

**산출물:** GitHub repo + local build ✅

### Week 3-4 (2026-06-16 ~ 06-29)
1. 대시보드 UI (Bento Grid, 실시간 구독)
2. BM 보고 폼 (Step 1-5 구현)
3. 카메라/갤러리 통합

**산출물:** APK/IPA 베타 빌드

### Week 5-6 (2026-06-30 ~ 07-13)
1. 부품 조회 + QR 스캔
2. 작업 목록 + FCM 알림
3. 오프라인 동기화

**산출물:** 내부 테스트용 TestFlight/Google Play 등록

### Week 7-8 (2026-07-14 ~ 07-31)
1. 성능 최적화 (이미지 압축, 번들 크기 감소)
2. 테스트 자동화 (Unit + Widget + Integration)
3. 배포 (App Store + Google Play)

**산출물:** v1.0 Public Release

---

## ✅ 성공 기준

### 기능
- [ ] 모든 코어 기능(대시보드, BM 보고, 재고, 작업) 완전히 구현
- [ ] 오프라인 동기화 100% 작동 (데이터 손실 0%)
- [ ] QR 스캔 정확도 ≥99%

### 성능
- [ ] 앱 시작: <2초
- [ ] 대시보드 로드: <1초
- [ ] 앱 크기: <100MB

### UX
- [ ] 권한 요청 명확함 (카메라, 위치, 알림)
- [ ] 에러 메시지 명확함 (사용자가 다음 단계 알 수 있음)
- [ ] 현장 작업자 만족도: ≥4.0/5

### 보안
- [ ] 모든 API 호출 HTTPS 인증 사용
- [ ] 로컬 토큰 암호화 저장
- [ ] 민감한 데이터(좌표 등) Supabase RLS로 보호

---

## 📚 참고 자료

**기존 DSC FMS 포탈:**
- Tech Stack: Next.js 14 + Supabase + Vercel
- Glossary 아키텍처: field_key → label_ko → UI
- RLS 예시: `auth.uid() = assigned_to`

**Flutter 가이드:**
- Supabase Flutter Client: https://pub.dev/packages/supabase_flutter
- Riverpod: https://pub.dev/packages/riverpod
- Firebase (FCM + Analytics): https://pub.dev/packages/firebase_core

---

## 📞 연락 및 협력

**플레너(설계):** `-` (이 문서)  
**모바일개발자(구현):** `@모바일개발자` (GitHub 리뷰 전)  
**웹개발자(백엔드 API):** `@웹개발자` (API 스펙 협의)  
**평가자(QA):** `@평가자` (테스트 계획, 성능 검증)

---

**다음 단계:** 모바일개발자 검토 후 → 웹개발자에게 API 스펙 전달 → 2026-06-02 개발 시작
