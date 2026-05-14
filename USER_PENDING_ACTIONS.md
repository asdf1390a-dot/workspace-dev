# 사용자 액션 항목 추적 시스템

**목적:** Kyeongtae Na가 해야 할 직접 액션을 자동으로 추적하고, 새 팬딩이 생길 때마다 전체 목록을 정렬해서 표시.

---

## 📋 현재 팬딩 액션

**마지막 업데이트:** 2026-05-14

### 🔴 즉시 필요 (Critical)

#### 1. Team Status Dashboard 설계 검토 & 승인
- **기한:** 2026-05-15 (내일, 개발 착수 전)
- **상세:** 팀 현황판 대시보드 설계가 완료됨. 웹개발자가 개발을 시작하기 전에 설계 방향(기능, UI, API) 검토 후 승인 필요.
- 📍**접속:** https://github.com/asdf1390a-dot/dsc-fms-portal/tree/main/docs
- 📄**파일:** https://raw.githubusercontent.com/asdf1390a-dot/dsc-fms-portal/main/docs/TEAM_STATUS_SUMMARY.md
- ⚙️**방법:** 
  1) GitHub 링크 열기 → docs 폴더 내 위 파일들 확인
  2) TEAM_STATUS_SUMMARY.md 읽고 주요 기능·기한 확인
  3) 필요시 TEAM_STATUS_DASHBOARD_DESIGN.md의 와이어프레임·API 검토
  4) 승인 시 Telegram 리플라이로 "팀 현황판 설계 OK, 개발 시작" 이라고 말하기

#### 2. Travel Management 설계 검토 & 승인
- **기한:** 2026-05-15 (내일)
- **상세:** 베트남 여행 관리 모듈 설계 완료. 호치민 출발(2026-05-15)을 앞두고 설계 검토 후 개발 스타트 필요.
- 📍**접속:** https://github.com/asdf1390a-dot/dsc-fms-portal/blob/main/TRAVEL_MANAGEMENT_SUMMARY.md
- 📄**파일:** https://raw.githubusercontent.com/asdf1390a-dot/dsc-fms-portal/main/TRAVEL_MANAGEMENT_SUMMARY.md
- ⚙️**방법:**
  1) GitHub 링크 열기
  2) TRAVEL_MANAGEMENT_SUMMARY.md 읽고 기능 확인
  3) 여행 일정(2026-05-15 ~ 05-24), 기능 범위 검토
  4) 승인 시 Telegram 리플라이로 "여행앱 설계 OK, 개발 시작" 이라고 말하기

### 🟡 이번 주 (High)

#### 3. Team Status Dashboard DB 마이그레이션 실행
- **기한:** 2026-05-16 (금요일 이전)
- **상세:** Team Status Dashboard 설계 승인 후, Supabase SQL Editor에서 DB 스키마 마이그레이션을 실행해야 함. (테이블 4개 + RLS 정책 + 인덱싱)
- 📍**접속:** https://pzkvhomhztikhkgwgqzr.supabase.co/projects/pzkvhomhztikhkgwgqzr/sql (Supabase SQL Editor)
- 📄**파일:** https://raw.githubusercontent.com/asdf1390a-dot/dsc-fms-portal/main/db/24_team_status_dashboard.sql
- ⚙️**방법:**
  1) Supabase 접속 링크 열기 → SQL Editor 창 열기
  2) 위 파일 링크(raw GitHub)에서 전체 코드 복사
  3) SQL Editor에 붙여넣기
  4) "RUN" 버튼 클릭하여 실행
  5) 완료 후 Telegram 리플라이로 "팀 현황판 DB 마이그레이션 완료" 라고 확인

#### 4. Travel Management DB 마이그레이션 실행
- **기한:** 2026-05-16 (금요일 이전, 여행 출발 전)
- **상세:** Travel Management 설계 승인 후, Supabase에서 여행 관리 모듈의 DB 스키마를 실행해야 함. (테이블: travels, travel_events, travel_members, travel_costs 등)
- 📍**접속:** https://pzkvhomhztikhkgwgqzr.supabase.co/projects/pzkvhomhztikhkgwgqzr/sql (Supabase SQL Editor)
- 📄**파일:** https://raw.githubusercontent.com/asdf1390a-dot/dsc-fms-portal/main/db/24_create_travel_tables.sql
- ⚙️**방법:**
  1) Supabase SQL Editor 열기 (위 링크)
  2) 파일 링크(raw GitHub)에서 전체 코드 복사
  3) SQL Editor에 붙여넣기
  4) "RUN" 버튼 클릭하여 실행
  5) 완료 후 Telegram 리플라이로 "여행앱 DB 마이그레이션 완료" 라고 확인

#### 5. Backup App Phase 2 설계 검토 & 승인
- **기한:** 2026-05-18 (금요일, 개발 착수 전)
- **상세:** 백업 앱 Phase 2 설계 완료. 자동 백업, 저장소 할당량, 모니터링 기능 포함. 웹개발자가 개발(예상 완료 2026-06-03)을 시작하기 전에 설계 승인 필요.
- 📍**접속:** https://github.com/asdf1390a-dot/dsc-fms-portal/blob/main/BACKUP_APP_PHASE2_SUMMARY.md
- 📄**파일:** https://raw.githubusercontent.com/asdf1390a-dot/dsc-fms-portal/main/BACKUP_APP_PHASE2_SUMMARY.md
- ⚙️**방법:**
  1) GitHub 링크 열기 (SUMMARY 문서)
  2) 핵심 설계 결정(자동화 일정·보관기간·저장소·알림) 확인
  3) 필요시 DESIGN.md의 상세 내용, API_GUIDE.md의 16개 엔드포인트 검토
  4) 승인 시 Telegram 리플라이로 "백업앱 Phase 2 설계 OK, 개발 시작" 이라고 말하기

### 🔵 다음 주 이후 (Medium/Low)

#### 6. Backup App Phase 2 DB 마이그레이션 실행
- **기한:** 2026-05-20 (설계 승인 후 2일 내)
- **상세:** Backup Phase 2 설계 승인 후, Supabase에서 DB 마이그레이션을 실행해야 함. (신규 테이블 4개: backup_policies, backup_storage_quotas, backup_notifications, backup_metrics)
- 📍**접속:** https://pzkvhomhztikhkgwgqzr.supabase.co/projects/pzkvhomhztikhkgwgqzr/sql (Supabase SQL Editor)
- 📄**파일:** https://raw.githubusercontent.com/asdf1390a-dot/dsc-fms-portal/main/db/23_backup_module_phase2.sql
- ⚙️**방법:**
  1) Supabase SQL Editor 열기 (위 링크)
  2) 파일 링크(raw GitHub)에서 전체 코드 복사
  3) SQL Editor에 붙여넣기
  4) "RUN" 버튼 클릭하여 실행
  5) 완료 후 Telegram 리플라이로 "백업앱 Phase 2 DB 마이그레이션 완료" 라고 확인

---

## 🔧 시스템 규칙

### 1. 액션 항목 추가 조건
다음 중 하나가 발생하면 **새 액션을 추가**:
- SMS 인증, 카드 결제 등 물리적·외부 확인 필요
- 외부 팀원(벤더, 협력사, HQ)의 응답 대기
- 사용자의 비즈니스 판단·승인 필요
- 서명, 이메일 송신 등 사용자만 할 수 있는 작업

### 2. 액션 항목 제거 조건
다음 중 하나가 완료되면 **항목 제거**:
- 사용자가 "완료했어", "했어" 등으로 완료 보고
- 외부 응답이 도착하면 자동 정리
- 기한이 지나거나 우선순위 변경

### 3. 알림 방식
새 액션이 추가될 때마다:
```
【사용자 액션 필요】

🔴 즉시 필요 (N개)
 • 액션 1 — [상세] — [링크]
 • 액션 2 — [상세] — [링크]

🟡 이번 주 (N개)
 • 액션 3 — [상세] — [링크]

🔵 다음 주 (N개)
 • 액션 4 — [상세] — [링크]

【완료되기 전에는 이 목록이 계속 표시됨】
```

### 4. 액션 항목 형식
각 항목은 다음 정보 포함:
- **제목** — 1줄 요약
- **우선순위** — 🔴 / 🟡 / 🔵
- **기한** — 구체적 날짜 (예: 2026-05-20)
- **상세** — 왜 필요한가, 뭘 해야 하는가
- **링크/파일** — 관련 참고자료 (있으면)

### 5. 자동 갱신 규칙
- 매 대화 시작 시: 팬딩 목록 확인
- 새 액션 추가: 즉시 전체 목록 출력
- 액션 완료: 해당 항목 제거 + 남은 목록 출력

---

## 📝 예시

### 추가 전
```
API 개발 완료. 
테스트를 위해 테스트 계정 3개가 필요한데, 
IT팀에 요청해주실 수 있나요?
```

### 추가 후
```
【사용자 액션 필요】

🔴 즉시 필요 (1개)
 • IT팀 테스트 계정 3개 요청
   상세: DSC FMS Portal 테스트용 계정 (이름: test01, test02, test03)
   기한: 2026-05-16 (개발 완료 후 2일 내)
   참고: IT팀 연락처는 IT_TEAM.md 참고

🟡 이번 주 (0개)

🔵 다음 주 (0개)
```

### 완료 후
```
사용자: "IT팀에서 계정 줬어"

시스템: 
🟢 완료됨 — IT팀 테스트 계정 3개 요청

남은 팬딩:
🟡 이번 주 (2개)
 • VPN 설정 확인 — 2026-05-17
 • 보안 감사 사인 — 2026-05-20
```

---

## 🎯 적용 범위

**포함됨:**
- 외부 API key / 환경변수 입력 (사용자만 가능)
- 벤더/협력사 응답 대기
- 경영진 승인
- SMS/이메일 확인
- 계약 서명
- 데이터 검증 (사용자 의사결정)

**포함 안 됨:**
- 개발자/분석가/번역가 업무 (이들은 자율 수행)
- 기술적 검토 (코드리뷰 등)
- 내부 팀 커뮤니케이션 (자동 진행)

---

## 📌 Memory 연동

이 규칙은 Memory에 저장됨:
- `feedback_user_pending_actions_system.md` — 이 규칙 파일

매 대화마다:
1. Memory 확인: 현재 팬딩 목록 로드
2. 새 항목 발생: Memory 즉시 업데이트
3. 완료 보고: 항목 제거 + Memory 업데이트

---

## 🔗 관련 정책

- [자율 진행 원칙](feedback_autonomous_proceed.md) — 컨펌 없이 즉시 진행, 사용자 직접 액션만 모아서 안내
- [Immediate reporting](feedback_immediate_reporting.md) — 사용자 액션 필요하면 기다리지 말고 즉시 보고
- [Confirmation protocol](feedback_confirmation_protocol.md) — Telegram에서 리플라이로 보고

---

## ✅ 체크리스트

설정 시:
- [ ] 이 파일을 Memory `feedback_user_pending_actions_system.md`로 저장
- [ ] MEMORY.md에 링크 추가
- [ ] SOUL.md 행동 규칙 섹션에 "사용자 액션 필요시 즉시 보고" 반영
- [ ] 첫 팬딩 항목 생길 때 이 형식으로 출력 테스트
