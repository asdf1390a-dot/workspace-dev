---
name: DevOps Engineer Onboarding Checklist
type: team_onboarding
date: 2026-05-19 KST
duration: 1일 (Day 1 준비)
---

# DevOps Engineer Onboarding Checklist (2026-05-19)

**Status:** 🔴 PENDING (팀원 배정 대기)  
**Start Date:** 2026-05-19 09:00 KST (또는 팀원 합류 시간)  
**Duration:** 1일 (온보딩) + 11일 (프로젝트 수행)  
**Deadline:** 2026-05-30 17:00 KST (Phase 1 완료)

---

## 📋 Day 1 온보딩 체크리스트

### **A. 환경 설정 (1시간)**

- [ ] **GitHub 계정 설정**
  - Repository access: dsc-fms-portal, backup-app, travel-management
  - SSH key 생성 및 등록
  - Personal Access Token 생성 (scope: repo, admin:repo_hook)

- [ ] **Vercel 계정 설정**
  - Team 멤버 초대
  - 3개 프로젝트 액세스 권한 부여:
    - dsc-fms-portal (메인)
    - backup-app (배포)
    - travel-app (배포)
  - 환경변수 읽기 권한

- [ ] **Supabase 계정 설정**
  - Organization member 초대
  - SQL 편집기 액세스
  - Database 백업 권한
  - API 토큰 생성 (scope: database, storage)

- [ ] **로컬 환경 구성**
  - Node.js v18+ 설치
  - npm/yarn/pnpm (프로젝트 매니저)
  - 데이터베이스 클라이언트 (psql, DBeaver)
  - Git 설정 (user.name, user.email)
  - 환경변수 파일 (.env.local)

---

### **B. 코드베이스 이해 (2시간)**

- [ ] **프로젝트 구조 학습**
  - `dsc-fms-portal/` — Next.js 메인 앱
    - `/pages` — API routes + UI pages
    - `/components` — React components
    - `/lib` — Utilities (database, auth)
    - `/public` — Static assets
  - `backup-app/` — 백업 모듈 (통합)
  - `travel-app/` — 여행 관리 앱 (통합)

- [ ] **빌드 프로세스 이해**
  - `npm run dev` — 로컬 개발
  - `npm run build` — 프로덕션 빌드
  - `npm run start` — 프로덕션 실행
  - Vercel 배포 자동화 (GitHub push → Vercel deploy)

- [ ] **데이터베이스 스키마 검토**
  - 주요 테이블: assets, backups, travel_requests, users
  - 관계도 및 인덱스 확인
  - RLS 정책 검증

- [ ] **배포 파이프라인 이해**
  - Vercel → GitHub integration
  - Preview deployments (PR)
  - Production deployments (main branch)
  - Environment-specific variables

---

### **C. 팀 소개 및 협력 (1시간)**

- [ ] **팀원 소개 및 연락처**
  - [ ] 웹개발자: [이름, 역할, 연락처]
  - [ ] 데이터분석가: [이름, 역할, 연락처]
  - [ ] 평가자(QA): [이름, 역할, 연락처]
  - [ ] 플레너(비서): asdf1390a@gmail.com

- [ ] **커뮤니케이션 채널 설정**
  - [ ] Discord 서버 가입 (채널: #devops, #일반, #배포)
  - [ ] Telegram 그룹 추가 (팀 공지)
  - [ ] Slack 또는 유사 도구 (선택)

- [ ] **일일 리포팅 규칙 확인**
  - 매일 17:00 KST Telegram/Discord에 진도 리포트
  - 형식: [프로젝트명] XX% | 완료 사항 | 다음 단계
  - 블로킹 요소 즉시 보고

- [ ] **주간 회의 일정 확인**
  - 매주 금요일 17:00 KST (30분)
  - 참석: DevOps + 웹개발자 + 평가자 + 플레너

---

### **D. 프로젝트 계획 검토 (1시간)**

- [ ] **Phase 1 전체 로드맵 검토**
  - 기준 문서: `project_devops_engineer_phase1_assignment.md`
  - 3개 프로젝트 개요
  - 일정 및 산출물 확인

- [ ] **Project 1 (Vercel) 상세 계획 검토**
  - 빌드 최적화 목표 (5분 → 2-3분)
  - Edge Functions 구현 대상 (3개)
  - 캐싱 전략 (SSG/ISR)
  - 성능 측정 방법

- [ ] **Project 2 (Supabase) 상세 계획 검토**
  - 인덱스 최적화 대상 (3개 테이블)
  - 자동 백업 정책 (매일 02:00 KST)
  - Read Replica 구현 (보고서 쿼리)
  - RLS 검증 범위

- [ ] **Project 3 (Monitoring) 상세 계획 검토**
  - 메트릭 정의 (응답시간, 에러율)
  - 대시보드 도구 선택 (Vercel Analytics, Prometheus, 커스텀)
  - 알림 규칙 설정 (Telegram/Discord)

---

### **E. 성공 기준 및 험 관리 확인 (30분)**

- [ ] **각 프로젝트 성공 기준 명확화**
  - Project 1: 빌드 < 3분, 콜드스타트 < 1초, 3개+ Edge Functions
  - Project 2: 쿼리 20% 개선, 백업 자동화, RLS 100% 검증
  - Project 3: 대시보드 배포, 알림 3개+, SOP 문서

- [ ] **리스크 항목 검토**
  - 데이터베이스 백업 전략 (Day 2 웹개발자와 협의)
  - 모니터링 도구 선택 (CEO 승인 대기)
  - Vercel 빌드 호환성 (스테이징에서 먼저 테스트)

- [ ] **블로킹 요소 해결 계획**
  - 각 블로킹 요소별 담당자 및 예상 해결 시간 기록
  - 긴급 연락처 (CEO): Telegram 또는 이메일

---

### **F. 도구 및 문서 설정 (30분)**

- [ ] **모니터링/측정 도구 설정**
  - Vercel Analytics: https://vercel.com/dashboard → [project] → Analytics
  - Google Lighthouse: CLI 설치 (`npm i -g lighthouse`)
  - Supabase Database Stats: https://supabase.com/ → [project] → Database → Statistics
  - Custom metrics 수집 준비

- [ ] **공유 문서 액세스**
  - [ ] Google Drive / Notion / GitHub Wiki 팀 폴더
  - [ ] 주간 리포트 템플릿 (공유 시트 또는 마크다운)
  - [ ] 성능 기준선 데이터 (이전 측정값)

- [ ] **Slack/Discord 채널 구독**
  - [ ] #devops (주요 공지)
  - [ ] #일반 (팀 전체 공지)
  - [ ] #배포 (배포 로그)
  - [ ] #긴급 (블로킹 요소, 심각한 이슈)

---

## 📅 Day 1 시간표

| 시간 | 작업 | 담당 | 소요시간 |
|------|------|------|----------|
| 09:00 | 온보딩 시작 + 환경 설정 | 플레너 | 1h |
| 10:00 | 코드베이스 투어 + 질문 세션 | 웹개발자 | 1.5h |
| 11:30 | 프로젝트 계획 설명 | 플레너 | 1h |
| 12:30 | 점심시간 | — | 1h |
| 13:30 | 팀 협력 체계 + 리스크 관리 | 평가자 | 1h |
| 14:30 | 도구 설정 + 액세스 권한 확인 | 플레너 | 1h |
| 15:30 | 자유 시간 (질문, 환경 마무리) | DevOps | 1.5h |
| 17:00 | 일일 리포트 (Day 1 완료) | DevOps | 30m |

**예상 완료:** 2026-05-19 17:30 KST

---

## ✅ 온보딩 완료 기준

DevOps 팀원이 아래 모든 항목을 완료하면 **Day 1 완료**로 간주:

- ✅ GitHub/Vercel/Supabase 계정 설정 완료
- ✅ 로컬 환경 (node, git, db client) 구성 완료
- ✅ 메인 Repository clone 및 로컬 빌드 성공
- ✅ 3개 프로젝트 개요 이해 + 질문사항 해결
- ✅ 일일 리포팅 규칙, 팀 연락처, 협력 체계 확인
- ✅ 첫 리포트 작성 (Day 1 완료 보고)

---

## 🚨 문제 해결

### **자주 묻는 질문 (FAQ)**

**Q1: GitHub SSH key 생성 방법?**
```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# ~/.ssh/id_ed25519.pub 내용을 GitHub Settings → SSH Keys에 추가
```

**Q2: Vercel 빌드 실패 시 어디서 로그를 확인?**
```
https://vercel.com/dashboard → [project] → Deployments → [failed deployment] → Logs
```

**Q3: Supabase RLS 정책 확인 방법?**
```sql
SELECT * FROM pg_policies WHERE tablename = 'assets';
```

**Q4: 로컬 빌드 오류 시?**
```bash
npm ci  # 정확한 의존성 설치
npm run build  # 상세 에러 메시지 확인
```

### **블로킹 요소 대응**

**즉시 대응 (1시간 내):**
- 액세스 권한 오류 (GitHub, Vercel, Supabase)
- 환경변수 누락 (로컬 또는 클라우드)
- 로컬 빌드 실패

**당일 대응 (4시간 내):**
- 도구 설치 문제
- 코드베이스 이해 필요
- 팀 협력 체계 확인

**주간 대응 (2-3일):**
- 성능 최적화 전략 결정
- 리스크 관리 계획 조정

---

## 🔗 참고 문서

### **프로젝트 문서**
- `project_devops_engineer_phase1_assignment.md` — 전체 로드맵 + 산출물 정의
- `ACTIVE_WORK_TRACKING.md` — 팀 전체 현황판

### **기술 문서**
- `project_backup_phase2_completion_report.md` — Supabase 아키텍처
- `project_discord_bot_phase1.md` — Telegram/Discord API 통합
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

### **팀 문서**
- SOUL.md — 팀 문화, 커뮤니케이션 스타일
- memory/active_work_tracking.md — CTB (Central Task Board)

---

**Document Version:** 1.0  
**Created:** 2026-05-19 13:00 KST  
**Status:** READY FOR ONBOARDING
