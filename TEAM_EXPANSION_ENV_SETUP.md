# 🔧 팀 확장: 신규 팀원 환경 설정 체크리스트

**일정:** 2026-05-18 ~ 2026-05-19  
**담당:** 비서  
**대상:** QA 평가자, 자동화 전문가

---

## 📋 계정 생성 (2026-05-18)

### 평가자 계정

- [ ] **GitHub 계정**
  - Email: `[평가자 이메일]` (미정)
  - Team: `DSC-FMS-Portal`
  - 권한: `Collaborator` (코드 검증 및 이슈 리뷰)
  - 접근: dsc-fms-portal repo

- [ ] **Supabase 계정**
  - Email: `[평가자 이메일]`
  - Org: `DSC Mannur`
  - Role: `Member`
  - 접근: 테이블 조회 + 레포트 확인 (쓰기 불가)

- [ ] **Discord 계정**
  - 역할: `@평가자`
  - 채널 접근:
    - `#일반` (팀 전체 논의)
    - `#평가자-전담` (일일 업무 + 보고)
    - `#웹개발자-전담` (개발자 연락처)

- [ ] **Telegram Bot**
  - 그룹: `DSC Team` (CEOClaude Agent, 비서, 팀원)
  - 권한: 메시지 수신 + 결과 보고

- [ ] **Portal 접근**
  - URL: `https://dsc-fms-portal.vercel.app`
  - 계정: 관리자 계정 공유 (또는 별도 QA 계정)
  - 권한: 모든 기능 테스트 + 데이터 변경 권한

### 자동화 전문가 계정

- [ ] **GitHub 계정**
  - Email: `[자동화 이메일]` (미정)
  - Team: `DSC-FMS-Portal`
  - 권한: `Collaborator` (자동화 스크립트 커밋)
  - 접근: dsc-fms-portal repo

- [ ] **Supabase 계정**
  - Email: `[자동화 이메일]`
  - Org: `DSC Mannur`
  - Role: `Member` + 자동화 권한
  - 접근: 모든 테이블 (스케줄 작업 생성 권한 필요)

- [ ] **Discord 계정**
  - 역할: `@자동화전문가`
  - 채널 접근:
    - `#일반` (팀 전체 논의)
    - `#자동화-전담` (일일 업무 + 보고)
    - `#분석가-전담` (요청사항 조율)

- [ ] **Telegram Bot**
  - 그룹: `DSC Team`
  - 권한: 메시지 수신 + 결과 보고

- [ ] **자동화 스크립트 실행 권한**
  - Vercel Cron 권한 (백업 & 스케줄 작업)
  - Supabase Edge Functions 배포 권한
  - GitHub Actions 실행 권한

---

## 🔐 권한 부여 (2026-05-18~19)

### 데이터베이스 권한

#### 평가자 (읽기 전용)

```sql
-- Row Level Security 권한
GRANT USAGE ON SCHEMA public TO [평가자_uid];
GRANT SELECT ON ALL TABLES IN SCHEMA public TO [평가자_uid];

-- 특정 테이블만
GRANT SELECT ON assets TO [평가자_uid];
GRANT SELECT ON bm_events TO [평가자_uid];
GRANT SELECT ON weekly_reports TO [평가자_uid];
GRANT SELECT ON asset_audit_log TO [평가자_uid];
```

#### 자동화 (읽기/쓰기)

```sql
-- 테이블 접근
GRANT USAGE ON SCHEMA public TO [자동화_uid];
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO [자동화_uid];

-- 시퀀스 사용
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO [자동화_uid];

-- 함수 실행
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO [자동화_uid];
```

### API 권한

- [ ] **평가자**: Read-only API 토큰 (토큰명: `evaluator-token-[날짜]`)
  - 테스트 결과 조회
  - 버그 리포트 생성 (Issues API)

- [ ] **자동화**: Full API 토큰 (토큰명: `automation-token-[날짜]`)
  - 데이터 읽기/쓰기
  - 스케줄 작업 생성/실행
  - 배포 트리거

### GitHub 권한

- [ ] 2명 모두: `dsc-fms-portal` repo의 Collaborator 추가
- [ ] 평가자: Issue/PR 리뷰 권한
- [ ] 자동화: 자동화 스크립트 파일 쓰기 권한

---

## 📱 도구 접근 설정 (2026-05-19)

### Discord

- [ ] 평가자 계정 초대
  - 역할: `@평가자`
  - 채널: `#일반`, `#평가자-전담`

- [ ] 자동화 계정 초대
  - 역할: `@자동화전문가`
  - 채널: `#일반`, `#자동화-전담`

- [ ] 채널 공지 작성 (환영 메시지 + 일일 업무 규칙)

### Telegram

- [ ] DSC Team 그룹에 초대
- [ ] 개인 DM 테스트 (메시지 송수신 확인)

### Portal (Next.js App)

- [ ] 평가자 계정 생성 (또는 관리자 계정 공유)
- [ ] 자동화 계정 생성 (또는 서비스 계정)
- [ ] 모든 페이지 접근 테스트

---

## 📖 온보딩 자료 제공 (2026-05-17)

### 공통 자료

- [ ] 팀 확장 역할 정의서 (TEAM_EXPANSION_ROLES.md)
- [ ] 일일 업무 흐름도 (협업 규칙 포함)
- [ ] Discord 채널 규칙 (메시지 형식, 보고 시간)
- [ ] Telegram 보고 형식 (결과만 최종 보고)

### 평가자 전용 자료

- [ ] 테스트 케이스 작성 가이드
- [ ] 버그 리포트 템플릿
- [ ] Portal 기능 체크리스트 (스캔용)
- [ ] 첫 주 업무: 기존 기능 전체 테스트

### 자동화 전문가 전용 자료

- [ ] 현재 수동 작업 목록 (분석가 + 웹개발자 제공)
- [ ] 자동화 우선순위 (높음: 경영실적 집계, 백업, 일일 리포트)
- [ ] Python/Node.js 스크립트 템플릿
- [ ] Vercel Cron 설정 가이드
- [ ] 첫 주 업무: 우선순위 1순위 자동화 구현

---

## ✅ 검증 체크리스트 (2026-05-20 시작 전)

### 평가자 준비도

- [ ] GitHub repo 접근 가능
- [ ] Supabase 읽기 가능
- [ ] Discord 채널 모두 접근 가능
- [ ] Portal 로그인 가능
- [ ] Telegram 메시지 송수신 가능

### 자동화 전문가 준비도

- [ ] GitHub repo 접근 가능
- [ ] Supabase 읽기/쓰기 가능
- [ ] Discord 채널 모두 접근 가능
- [ ] Vercel 배포 권한 확인
- [ ] Telegram 메시지 송수신 가능

### 팀 준비도

- [ ] 평가자 ↔ 웹개발자 협업 규칙 확인
- [ ] 자동화 ↔ 분석가 요청 프로세스 확인
- [ ] 모든 팀원 Discord 채널 설정 완료
- [ ] 비서-팀원 Telegram 소통 테스트 완료

---

## 📅 일정 요약

| 날짜 | 담당 | 작업 | 완료 |
|------|------|------|------|
| 2026-05-17 | 비서 | 팀 전체 회의 (역할 설명) | ☐ |
| 2026-05-18 | 비서 | 계정 생성 + GitHub 초대 | ☐ |
| 2026-05-19 | 비서 | Discord/Telegram 초대 + Portal 설정 | ☐ |
| 2026-05-19 | 평가자/자동화 | 모든 도구 접근 테스트 | ☐ |
| 2026-05-20 | 평가자 | 첫 업무: Portal 전체 테스트 시작 | ☐ |
| 2026-05-20 | 자동화 | 첫 업무: 우선순위 1순위 자동화 시작 | ☐ |
| 2026-05-27 | 비서 | 효과 측정 회의 (KPI 달성도 확인) | ☐ |

---

## 📞 연락처

- **비서:** 모든 환경 설정 담당자
- **CEO:** 최종 권한 승인
- **웹개발자:** Portal 기술 지원
- **분석가:** 자동화 요청 업무 정의

---

**준비 상태:** 🔴 준비 단계 (2026-05-17 회의 후 본격 착수)  
**담당자:** 비서 (자율 진행 중)
