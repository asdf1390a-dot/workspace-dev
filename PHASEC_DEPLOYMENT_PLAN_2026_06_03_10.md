# Phase C 스킬 배포 계획 (2026-06-03 ~ 2026-06-10)

**배포 대상:** Phase C 확장팀 (5명)  
**배포 기간:** 2026-06-03 ~ 2026-06-10 (8일)  
**일일 배포:** 1명씩 순차 배포  
**완료 기한:** 2026-06-10 18:00 KST

---

## 📋 Phase C 팀원 (5명)

### 1️⃣ Design Specialist (디자인 전문가)
- **배포 일시:** 2026-06-03 08:00 ~ 09:00
- **필수 스킬:** superpowers, agentmemory, claude-video
- **선택 스킬:** understand-anything
- **역할:** UI/UX 설계, 팀 대시보드 P2 UI 설계 진행 중 (ETA 06-10)

### 2️⃣ DevOps Engineer (DevOps 엔지니어)
- **배포 일시:** 2026-06-04 08:00 ~ 09:00
- **필수 스킬:** andrej-karpathy-skills, agentmemory, understand-anything
- **선택 스킬:** superpowers
- **역할:** 인프라 모니터링 설계 (ETA 06-05)

### 3️⃣ Memory System Specialist (메모리 시스템 전문가)
- **배포 일시:** 2026-06-05 08:00 ~ 09:00
- **필수 스킬:** agentmemory (전문가), superpowers
- **선택 스킬:** understand-anything
- **역할:** 메모리 자동화 관리 + 신뢰도 점수 운영

### 4️⃣ QA Specialist (QA 전문가)
- **배포 일시:** 2026-06-06 08:00 ~ 09:00
- **필수 스킬:** claude-video, agentmemory, superpowers
- **선택 스킬:** andrej-karpathy-skills
- **역할:** 통합 테스트 전략 수립 (ETA 06-02)

### 5️⃣ Project Planner (프로젝트 플래너)
- **배포 일시:** 2026-06-07 08:00 ~ 09:00
- **필수 스킬:** agentmemory, superpowers, understand-anything
- **선택 스킬:** claude-video
- **역할:** 크로스프로젝트 조율 (ETA 06-02)

---

## 🗓️ 일일 배포 일정

| 날짜 | 팀원 | 시간 | 스킬 | 상태 |
|------|------|------|------|------|
| 06-03 (월) | 디자인 전문가 | 08:00~09:00 | 3+1 | 🔴 대기 |
| 06-04 (화) | DevOps 엔지니어 | 08:00~09:00 | 3+1 | 🔴 대기 |
| 06-05 (수) | 메모리 시스템 전문가 | 08:00~09:00 | 2+1 | 🔴 대기 |
| 06-06 (목) | QA 전문가 | 08:00~09:00 | 3+1 | 🔴 대기 |
| 06-07 (금) | 프로젝트 플래너 | 08:00~09:00 | 3+1 | 🔴 대기 |
| 06-08 (토) | — | — | — | 🔴 예비일 |
| 06-09 (일) | — | — | — | 🟡 검증 및 정리 |
| 06-10 (월) | — | 18:00 | — | ✅ 완료 확인 |

---

## ✅ 배포 체크리스트 (일일)

각 팀원마다 다음 단계 순차 진행:

### 단계 1: 사전 점검 (10분)
```bash
node --version      # v18+ 확인
npm --version       # npm 최신 확인
lsof -i :13311      # port 13311 가용성
```

### 단계 2: 플러그인 설치 (각 15분)
- claude-video: `/plugin install claude-video`
- andrej-karpathy-skills: 두 가지 방법 중 택일
- superpowers: `/plugin install superpowers@claude-plugins-official`
- understand-anything: `/plugin install understand-anything`

### 단계 3: agentmemory 설치 (20분)
```bash
npm install -g @agentmemory/agentmemory
agentmemory start
agentmemory demo      # 샘플 검증
agentmemory connect claude-code
```

### 단계 4: 검증 (10분)
- Help → Plugins에서 설치된 플러그인 확인
- curl http://localhost:13311/health (agentmemory 상태)
- Auto Mode 활성화 (superpowers: shift+tab)

---

## 📊 배포 성공 기준

### 개인별 (각 팀원)
- ✅ 필수 스킬 전수 설치
- ✅ agentmemory 서버 실행 중
- ✅ 플러그인 활성화
- ✅ 샘플 데모 통과

### 팀 전체 (5명)
- ✅ 배포율: 5/5 = 100%
- ✅ agentmemory 서버: 5개 모두 운영 중
- ✅ 플러그인 활성화율: 95% 이상
- ✅ 팀 메모 시스템 연결: 100%

---

## 🔧 트러블슈팅 (기본)

### EACCES 권한 에러
```bash
sudo npm install -g @agentmemory/agentmemory
```

### Port 13311 충돌
```bash
# 기존 프로세스 확인 및 종료
lsof -i :13311
kill -9 <PID>

# 재시작
agentmemory start
```

### npm 캐시 문제
```bash
rm -rf ~/.npm/_cacache/_npx
/plugin install <plugin-name>
```

### Claude Code 플러그인 마켓플레이스 접근 불가
- VPN/프록시 설정 확인
- npm registry 연결 확인: `npm ping`
- GitHub raw URL 접근 가능 여부 확인

---

## 📞 지원 연락처

### Phase 0/A/B 배포 담당자
- **비서 에이전트:** 배포 감독 및 팀 조율
- **평가자 에이전트:** 검증 및 문제 진단
- **웹개발자:** 기술 지원

### 즉시 지원 (08:00 ~ 18:00)
- 설치 문제: 웹개발자 또는 자동화전문가
- 포트/시스템 설정: 자동화전문가
- 검증: 평가자 에이전트

### 지원 에스컬레이션
1. **Tier 1 (15분):** 자가 진단 + 비서 상담
2. **Tier 2 (30분):** 평가자 검증 + 기술 지원
3. **Tier 3 (1시간):** CEO 검토

---

## 📈 진행상황 보고 양식

각 팀원이 배포 완료 후 다음 기록 제출:

```
[팀원명]: [배포 날짜]
배포 시간: 08:00 ~ 09:15 (75분)

설치 결과:
  - ✅ 필수 스킬 3개 (superpowers, agentmemory, claude-video)
  - ✅ 선택 스킬 1개 (understand-anything)
  - ✅ agentmemory 서버 (port 13311 실행 중)

검증 결과:
  - ✅ 플러그인 활성화 (Help → Plugins 확인)
  - ✅ agentmemory demo 통과
  - ✅ Auto Mode 활성화 (superpowers)

상태: 🟢 배포 완료
체크포인트: 4/4 통과
```

---

## 🔐 품질 보증

### 배포 후 품질 검증 (06-09 일요일)
- [ ] 5명 모두 agentmemory 서버 운영 중 확인
- [ ] 플러그인 중복 설치 점검
- [ ] 메모리 시스템 일관성 검증
- [ ] 팀 메모 동기화 확인

### 최종 확인 (06-10 월요일 18:00)
- [ ] 전체 배포 완료도: 5/5
- [ ] agentmemory 신뢰도: 95% 이상
- [ ] 팀 활용도: 100%
- [ ] 문제 해결율: 100%

---

## 📌 주의사항

1. **순차 배포:** 일일 1명씩만 배포 (동시 배포 금지)
2. **사전 점검:** port 13311 이전 팀원과 충돌 없음 확인
3. **npm 버전:** 각자 npm 최신 버전 유지
4. **인터넷 연결:** GitHub raw 링크 접근 가능 필수
5. **기록:** 배포 완료 후 즉시 보고서 제출

---

**배포 책임자:** CEO (김경태), 비서 에이전트  
**감독 기한:** 2026-06-10 18:00 KST  
**최종 보고:** 2026-06-10 19:00 KST  
**다음 단계:** 2026-06-11 — 팀 전체 스킬 활용 시작

---

**준비 상태:** 🟢 준비 완료 (2026-06-02)  
**예정 시작:** 2026-06-03 08:00 KST
