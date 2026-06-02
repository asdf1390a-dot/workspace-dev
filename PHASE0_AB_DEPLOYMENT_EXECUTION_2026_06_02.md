# Phase 0/A/B 스킬 배포 실행 계획 (2026-06-02)

**배포 일시:** 2026-06-02 08:00 ~ 18:00 KST  
**대상:** Phase 0 (6명) + Phase A/B (4명) + CEO (1명) = 11명  
**배포 담당:** 각 팀원 자가 설치 + 비서 에이전트 감독  
**완료 기준:** 시간당 체크포인트 통과, 18:00까지 전원 설치 완료

---

## 📋 배포 순서 (11명)

### Phase 0: 핵심팀 (6명)
1. **비서 (Secretary)** — 08:00 시작
   - 필수: agentmemory, superpowers
   - 선택: understand-anything
   - 역할: 배포 진행 감독 및 팀 조율

2. **웹개발자 (Web-Builder)** — 08:15 시작
   - 필수: claude-video, andrej-karpathy-skills, agentmemory, understand-anything
   - 선택: superpowers
   
3. **평가자 (Evaluator)** — 08:30 시작
   - 필수: claude-video, agentmemory, superpowers
   - 선택: andrej-karpathy-skills

4. **데이터분석가 (Data-Analyst)** — 08:45 시작
   - 필수: agentmemory, understand-anything
   - 선택: superpowers

5. **자동화전문가 (Automation-Specialist)** — 09:00 시작
   - 필수: andrej-karpathy-skills, agentmemory
   - 선택: superpowers, understand-anything

6. **번역가 (Translator)** — 09:15 시작
   - 필수: agentmemory, superpowers
   - 선택: claude-video

### Phase A/B: 신규팀 (4명)
7. **신규팀 #1** — 09:30 시작
8. **신규팀 #2** — 09:45 시작
9. **신규팀 #3** — 10:00 시작
10. **신규팀 #4** — 10:15 시작

### CEO
11. **CEO (김경태)** — 10:30 시작
    - 필수: agentmemory, superpowers, understand-anything
    - 선택: claude-video

---

## 🔧 각 팀원별 설치 단계

### 단계 1: 사전 점검 (각 10분)
```bash
# Node.js 버전 확인
node --version  # v18+ 필요

# npm 버전 확인
npm --version

# Claude Code 버전 확인 (Help → About)
# v2.1.153+ 필요

# Port 13311 사용 가능 여부 확인
lsof -i :13311  # 응답 없음 = 사용 가능
```

### 단계 2: 플러그인 설치 (각 15분)
**명령어 (Claude Code 내에서 실행):**
```bash
# 1. claude-video (필요시)
/plugin install claude-video

# 2. andrej-karpathy-skills (필요시)
/plugin marketplace add forrestchang/andrej-karpathy-skills
/plugin install andrej-karpathy-skills@karpathy-skills

# 3. superpowers (필요시)
/plugin install superpowers@claude-plugins-official

# 4. understand-anything (필요시)
/plugin marketplace add Lucil84/understand-anything
/plugin install understand-anything
```

### 단계 3: agentmemory 설치 (필수, 20분)
```bash
# npm 전역 설치
npm install -g @agentmemory/agentmemory

# 메모리 서버 시작
agentmemory start

# 별도 터미널에서 샘플 데모 실행
agentmemory demo

# Claude Code 연결
agentmemory connect claude-code
```

### 단계 4: 검증 (각 10분)
```bash
# 1. Claude Code에서 플러그인 확인
# Help → Plugins에서 설치된 플러그인 목록 확인

# 2. agentmemory 서버 상태 확인
curl http://localhost:13311/health

# 3. Auto Mode 활성화 (superpowers)
# shift+tab 토글 확인

# 4. 메모리 시스템 연결 확인
# agentmemory demo 성공 여부
```

---

## 📊 배포 일정표

| 시간 | 담당자 | 작업 | 체크포인트 |
|------|--------|------|----------|
| 08:00 | 비서 | 단계 1-2-3-4 | ✅ agentmemory 서버 실행 |
| 08:15 | 웹개발자 | 단계 1-2-3-4 | ✅ 4개 플러그인 + agentmemory |
| 08:30 | 평가자 | 단계 1-2-3-4 | ✅ 3개 플러그인 + agentmemory |
| 08:45 | 데이터분석가 | 단계 1-2-3-4 | ✅ 2개 플러그인 + agentmemory |
| 09:00 | 자동화전문가 | 단계 1-2-3-4 | ✅ 2개 플러그인 + agentmemory |
| 09:15 | 번역가 | 단계 1-2-3-4 | ✅ 2개 플러그인 + agentmemory |
| 09:30 | Phase A #1 | 단계 1-2-3-4 | ✅ 배포 완료 |
| 09:45 | Phase A #2 | 단계 1-2-3-4 | ✅ 배포 완료 |
| 10:00 | Phase B #1 | 단계 1-2-3-4 | ✅ 배포 완료 |
| 10:15 | Phase B #2 | 단계 1-2-3-4 | ✅ 배포 완료 |
| 10:30 | CEO | 단계 1-2-3-4 | ✅ 배포 완료 |
| 11:00 | 전체 | 종합 검증 | ✅ 11/11 성공 |
| 13:00 | 비서 + 평가자 | 문제 해결 | ⚠️ EACCES/포트 에러 |
| 15:00 | 전체 | 최종 확인 | ✅ 완료 또는 🔴 에스컬레이션 |

---

## 🔴 트러블슈팅 (발생 시 대응)

### EACCES 에러 (권한 문제)
```bash
# 해결: sudo 사용
sudo npm install -g @agentmemory/agentmemory
```

### Port 13311 이미 사용 중
```bash
# 확인
lsof -i :13311

# 기존 프로세스 종료 후 재시작
kill -9 <PID>
agentmemory start
```

### Claude Code 플러그인 설치 실패
```bash
# npm 캐시 초기화
rm -rf ~/.npm/_cacache/_npx

# 다시 시도
/plugin install <plugin-name>
```

### 네트워크 문제
- VPN/프록시 설정 확인
- npm registry 연결 확인: `npm ping`
- GitHub raw 링크 접근 확인

---

## ✅ 성공 기준

### 개인별 (각 팀원)
- [x] 전체 필수 스킬 설치 완료
- [x] agentmemory 서버 실행 중 (port 13311)
- [x] 플러그인 활성화 확인 (Help → Plugins)
- [x] 샘플 데모 통과 (agentmemory demo)

### 팀 전체 (11명)
- [x] 배포율: 11/11 = 100%
- [x] agentmemory 서버: 11개 모두 실행 중
- [x] 플러그인 평균 활성화율: 95% 이상
- [x] 첫 회상 테스트 성공: 90% 이상

### 품질 지표
- ✅ 배포 시간: 총 3시간 이내
- ✅ 에러율: 5% 이하
- ✅ 재설치 필요: 0건
- ✅ 에스컬레이션: 0건 (자가 해결)

---

## 📞 지원 체계

### 즉시 지원 (08:00 ~ 18:00)
- **비서 에이전트:** 배포 진행 감독, 팀 조율
- **평가자 에이전트:** 검증 및 문제 진단
- **웹개발자:** 기술 지원 (플러그인 설치)
- **자동화전문가:** 포트/시스템 설정 지원

### 에스컬레이션 (문제 발생 시)
1. **Tier 1 (15분):** 자가 진단 + 비서 상담
2. **Tier 2 (30분):** 평가자 검증 + 웹개발자 기술 지원
3. **Tier 3 (1시간):** CEO 검토 + 최종 결정

---

## 📋 배포 기록 양식

각 팀원이 완료 후 다음을 기록:

```
[팀원명]
배포 시간: 08:00 ~ 08:45 (45분)
설치 스킬:
  - ✅ agentmemory (port 13311 실행 중)
  - ✅ claude-video
  - ✅ andrej-karpathy-skills
  - ⚠️ superpowers (자동모드 미활성화, 확인 필요)
상태: 🟢 완료 (필수 3/3, 선택 2/2)
체크포인트: ✅ 모두 통과
```

---

**배포 책임자:** CEO (김경태), 비서 에이전트  
**감독 기한:** 2026-06-02 18:00 KST  
**최종 보고:** 2026-06-02 19:00 KST
