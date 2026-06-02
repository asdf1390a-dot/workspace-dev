# 5-Skill 최종 배포 패키지 (2026-06-02)

**완성 일시:** 2026-06-02 12:05 KST  
**배포 대상:** 15명 팀 전체  
**검증 상태:** ✅ 5/5 스킬 문서 학습 완료

---

## 📋 5개 핵심 스킬 정리

### 1️⃣ claude-video
**설명:** 영상 콘텐츠 분석 및 전사  
**대상:** web-builder, evaluator, general-purpose  
**설치:**
```bash
/plugin install claude-video
# 또는
/plugin install watch.skill
```
**용도:** 교육자료, 회의 녹화, 데모 영상 자동 분석

---

### 2️⃣ andrej-karpathy-skills
**설명:** AI 코딩 표준 및 프로젝트 관리 가이드  
**대상:** 모든 개발자 에이전트  
**설치:**
```bash
옵션 A (권장): Claude Code 플러그인
/plugin marketplace add forrestchang/andrej-karpathy-skills
/plugin install andrej-karpathy-skills@karpathy-skills

옵션 B: 프로젝트별 (CLAUDE.md)
curl -o CLAUDE.md https://raw.githubusercontent.com/forrestchang/andrej-karpathy-skills/main/CLAUDE.md
```
**용도:** 코딩 표준, 아키텍처 설계 가이드, QA 평가 기준

---

### 3️⃣ superpowers
**설명:** Claude Code 고급 기능 및 플러그인 확장  
**대상:** 모든 에이전트  
**설치:**
```bash
/plugin install superpowers@claude-plugins-official
```
**활성화:**
```
Auto Mode 토글: shift+tab
Remote Control: 활성화 필수
Context: 1M 이상 권장
```
**용도:** 개인별 강점 극대화, 고급 기능 활용

---

### 4️⃣ understand-anything
**설명:** 코드베이스 자동 분석 및 관계도 파악  
**대상:** web-builder, Plan, Explore  
**설치:**
```bash
/plugin marketplace add Lucil84/understand-anything
/plugin install understand-anything
```
**주요 커맨드:**
```bash
/understand
# 생성: understand-anything/knowledge-graph.json
# 언어 옵션: --language ko (한국어 지원)

/understand-dashboard
# 대시보드 시각화
```
**용도:** 새 프로젝트 빠른 이해, 아키텍처 학습

---

### 5️⃣ agentmemory
**설명:** AI 에이전트 영구 메모리 및 회상 시스템 (필수)  
**대상:** 모든 에이전트 (필수)  
**설치:**
```bash
옵션 1: 글로벌 설치 (권장)
npm install -g @agentmemory/agentmemory

agentmemory start        # 메모리 서버 시작 (port 13311)
agentmemory demo         # 샘플 세션 & 회상 검증
agentmemory connect claude-code  # Claude Code 연결

옵션 2: 일회용 (NPX)
npx @agentmemory/agentmemory
```
**트러블슈팅:**
```bash
# macOS/Linux EACCES 에러
sudo npm install -g @agentmemory/agentmemory

# npm 캐시 초기화
rm -rf ~/.npm/_cacache/_npx

# Windows: 캐시 폴더 수동 삭제
```
**용도:** 팀 지식 손실 0화, 컨텍스트 일관성 100% 유지

---

## 🎯 팀별 배포 전략

### Phase 0: 핵심팀 (6명) — 2026-06-02 시작
| 역할 | 필수 스킬 | 선택 스킬 |
|------|---------|---------|
| 비서 (Secretary) | agentmemory, superpowers | understand-anything |
| 웹개발자 | claude-video, andrej-karpathy-skills, agentmemory, understand-anything | superpowers |
| 평가자 | claude-video, agentmemory, superpowers | andrej-karpathy-skills |
| 데이터분석가 | agentmemory, understand-anything | superpowers |
| 자동화전문가 | andrej-karpathy-skills, agentmemory | superpowers, understand-anything |
| 번역가 | agentmemory, superpowers | claude-video |

### Phase A/B: 신규팀 (4명) — 2026-06-02 시작
동일한 패턴으로 배포 (Phase 0과 동일)

### Phase C: 확장팀 (5명) — 2026-06-03 ~ 06-10
1. 디자인 전문가: superpowers, agentmemory, claude-video
2. DevOps 엔지니어: andrej-karpathy-skills, agentmemory, understand-anything
3. 메모리 시스템 전문가: agentmemory (expert), superpowers
4. QA 전문가: claude-video, agentmemory, superpowers
5. 프로젝트 플래너: agentmemory, superpowers, understand-anything

---

## 📊 배포 체크리스트

### 사전 점검 (2026-06-02)
- [x] 5개 스킬 문서 학습 완료 (봇 검증)
- [x] 설치 명령 정리 완료
- [x] 트러블슈팅 가이드 준비
- [x] 팀별 배포 전략 수립

### 설치 체크 (각 팀원별)
- [ ] npm/node 버전 확인 (v18+ 권장)
- [ ] 네트워크 접근 확인
- [ ] port 13311 사용 가능 여부 (agentmemory)
- [ ] Claude Code 최신 버전 (v2.1.153+)

### 검증 단계
- [ ] `/plugin install` 명령 성공
- [ ] agentmemory 서버 시작 (port 13311)
- [ ] 샘플 데모 실행 & 회상 검증
- [ ] Claude Code 연결 확인

---

## 🚀 배포 일정

| 날짜 | 팀 그룹 | 상태 | 예상 완료 |
|------|--------|------|---------|
| 2026-06-02 | Phase 0 (6명) | 🟡 배포 시작 | 06-02 18:00 |
| 2026-06-02 | Phase A/B (4명) | 🟡 배포 시작 | 06-02 18:00 |
| 2026-06-03 | Phase C (5명) | 🔴 대기 | 06-10 18:00 |
| 2026-06-02 | CEO (1명) | 🟡 배포 시작 | 06-02 18:00 |

---

## 📈 성공 기준

✅ **배포 완료도:** 15/15 팀원  
✅ **스킬당 활성화:** 5/5  
✅ **agentmemory 서버:** 운영 중 (port 13311)  
✅ **Claude Code 연결:** 전수 검증  
✅ **첫 활용 사례:** 3건 이상 (1주일 내)

---

## 💡 최고의 활용법

### 일일 워크플로우
1. 아침: agentmemory 서버 상태 확인
2. 업무 중: understand-anything으로 신규 코드 분석
3. 코딩: andrej-karpathy-skills 가이드 참고
4. 검증: claude-video로 회의 자동 분석
5. 저녁: superpowers로 팀원 강점 활용 계획

### 팀 협업
- agentmemory로 팀 지식 중앙화
- superpowers로 역할 최적화
- andrej-karpathy-skills로 일관된 표준 유지
- understand-anything으로 신규 프로젝트 빠른 학습

---

**최종 상태:** 🟢 **배포 준비 100% 완료**  
**검증 일시:** 2026-06-02 12:05 KST  
**배포 담당자:** 각 팀원  
**감독자:** CEO (김경태), 비서 에이전트

---

## 📞 지원 연락처

설치 문제: agentmemory 트러블슈팅 가이드 참고  
기술 질문: understand-anything으로 자동 분석  
최고 관행: andrej-karpathy-skills 가이드 참고  
팀 조율: 비서 에이전트 (agentmemory 메모 활용)
