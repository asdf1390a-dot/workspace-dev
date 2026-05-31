# 🏗️ 생태계 구조 명확화 — 2026-05-31

## 현재 문제
- FMS 포탈 안에 모든 것이 섞여 있음
- Travel Management가 회사(DSC) 것인지 개인(JEEPNEY) 것인지 불명확
- Team Dashboard에 개인 이력(portfolio)이 포함됨
- 각 앱의 소속 저장소가 정의되지 않음

---

## 정확한 소속 분류 필요

### 1. **DSC-INDIA-MANNUR-*** 저장소 (회사 운영)
이 그룹에 속할 앱들:
- [ ] **Asset Master** — 506개 자산 관리 (회사 자산)
- [ ] **Backup Management** — 백업 일정 관리 (회사 운영)
- [ ] **Team Dashboard** — DSC Mannur 팀 11명 조직도 (회사 팀원 정보만)
- [ ] **???** — Discord Bot은 회사/개인?

### 2. **JEEPNEY-*** 저장소 (개인 프로젝트)
이 그룹에 속할 앱들:
- [ ] **Travel Management** — 개인 여행 일정 (회사 업무여행? 개인 프로젝트?)
- [ ] **Portfolio** — C-3PO 포트폴리오 (개인)
- [ ] **???** — 기타 개인 프로젝트

---

## 확인 필요 사항

**1️⃣ Travel Management의 정의**
- 질문: 이게 회사 출장인가, 아니면 개인 여행 관리인가?
  - 회사 출장 → DSC-INDIA-MANNUR-TRAVEL
  - 개인 여행 → JEEPNEY-TRAVEL

**2️⃣ Discord Bot의 소속**
- 질문: 회사 팀 협업용인가, 개인 프로젝트인가?
  - 회사 협업 → DSC-INDIA-MANNUR-DISCORD-BOT
  - 개인 학습/포트폴리오 → JEEPNEY-DISCORD-BOT

**3️⃣ 각 저장소별 포함 내용**
- **DSC-INDIA-MANNUR-*** 저장소들:
  - 각각 독립적인 Next.js 앱 (또는 공통 포탈과 분리)
  - 각자의 DB 마이그레이션 (db/xx)
  - 각자의 API 엔드포인트

- **JEEPNEY-*** 저장소들:
  - 각각 독립적인 앱
  - 개인 데이터만 포함

---

## 현재 코드 상태 (정정 필요)

**지금 문제:**
```
dsc-fms-portal/
├─ components/
│  ├─ assets/        ✅ Asset Master
│  ├─ backup/        ✅ Backup Management
│  ├─ travel/        ❌ 어디 소속?
│  └─ team/          ⚠️ team_members만 (portfolio 빼야 함)
├─ db/
│  ├─ 20-29 assets   ✅
│  ├─ 30-39 backup   ✅
│  ├─ 21,24,26 travel ❌ 어디 소속?
│  └─ 42 team        ⚠️ portfolio 스키마 제거 필요
└─ pages/
   ├─ api/assets/    ✅
   ├─ api/backup/    ✅
   ├─ api/travel/    ❌
   ├─ api/team/      ⚠️
   └─ jeepney-personal/ ⬅️ 개인 앱들이 여기?
```

---

## 정리 작업 (당신이 지시할 때)

1. **Travel Management 소속 확정**
   - DSC 회사 것인가? 개인 것인가?

2. **Discord Bot 소속 확정**
   - 회사 협업 도구인가? 개인 포트폴리오인가?

3. **코드 정리**
   - 각 앱을 정확한 저장소로 분리
   - DB 마이그레이션 재정렬
   - API 경로 정규화

---

**대기 중:** 생태계 명확화 요청 확인 후 진행
