# 마이그레이션 최종 사전 체크리스트
## 회사 PC (마이그레이션 시작 전 필수 확인)

**작성:** 2026-06-03  
**점검자:** _________________  
**점검 일시:** _________________  

---

## ✅ SECTION A: 회사 PC 데이터 정리 (필수 - 30분)

### A1. Git 저장소 상태 확인
```bash
cd ~/.openclaw/workspace-dev

# 현재 상태 확인
git status

# 예상 출력: On branch main, nothing to commit (working tree clean)
```

- [ ] **결과:** ⚪ Clean ⚪ 수정 파일 있음 ⚪ 미추적 파일 있음

**조치 필요 시:**
```bash
# 1단계: 미추적 파일 확인
git status --porcelain

# 2단계: 파일 추가 (필요한 것만)
git add <파일명>

# 3단계: 커밋
git commit -m "backup: migration prep - $(date +%Y-%m-%d-%H:%M)"

# 4단계: 푸시
git push origin main
```

---

### A2. 최종 커밋 히스토리 확인
```bash
# 최근 5개 커밋 확인
git log --oneline -5

# 예상 출력:
# abc1234 backup: migration prep - 2026-06-03
# def5678 previous commit...
```

- [ ] **마지막 커밋 메시지:** ___________________________________
- [ ] **마지막 커밋 타임스탬프:** _______________________________

---

### A3. 원격 저장소 동기화 확인
```bash
# 원격 상태 확인
git fetch origin
git status

# 예상 출력: Your branch is up to date with 'origin/main'
```

- [ ] **결과:** ⚪ 동기화됨 ⚪ 뒤처짐 ⚪ 앞서감

**조치 필요 시:**
```bash
# Pull (뒤처진 경우)
git pull origin main

# Push (앞선 경우)
git push origin main
```

---

## ✅ SECTION B: 중요 파일 백업 (필수 - 30분)

### B1. 환경 변수 파일 백업

**필수 파일:**
```
1. ~/.openclaw/workspace-dev/.env.local
2. ~/.openclaw/workspace-dev/dsc-fms-portal/.env.local
3. ~/.openclaw/workspace-dev/dsc-fms-portal/.vercel/.env.development.local
```

```bash
# 각 파일 존재 확인 및 크기 확인
ls -lh ~/.openclaw/workspace-dev/.env*
ls -lh ~/.openclaw/workspace-dev/dsc-fms-portal/.env*

# 예상 출력: 각 파일이 0이 아닌 크기로 표시
```

- [ ] `.env.local` 존재: ⚪ Yes ⚪ No
- [ ] `dsc-fms-portal/.env.local` 존재: ⚪ Yes ⚪ No
- [ ] `dsc-fms-portal/.vercel/.env.development.local` 존재: ⚪ Yes ⚪ No

**백업 방법 (선택):**

#### 옵션 1: 암호화 저장 (권장)
```bash
# 암호화 파일 생성 (비밀번호 설정)
openssl enc -aes-256-cbc -in ~/.openclaw/workspace-dev/.env.local -out ~/env_backup_$(date +%Y%m%d).enc

# 비밀번호 설정 (최소 15자)
# 예: "M!grat!on@2026-Secure"

# 확인
ls -lh ~/env_backup_*.enc

# 복구 방법 (노트북에서):
# openssl enc -aes-256-cbc -d -in env_backup_20260603.enc -out .env.local
```

- [ ] 암호화 백업 파일 생성됨
- [ ] 비밀번호 별도 보관 (물리적/비밀번호 관리자)

#### 옵션 2: GitHub Secret 저장 (가장 안전)
```
1. GitHub: github.com/asdf1390a-dot/workspace-dev
2. Settings > Secrets and variables > Actions
3. "New repository secret" 클릭
4. 각 파일의 내용을 별도 Secret으로 추가
   - ENV_LOCAL (workspace-dev/.env.local 내용)
   - ENV_PORTAL_LOCAL (dsc-fms-portal/.env.local 내용)
   - ENV_VERCEL_LOCAL (vercel/.env.development.local 내용)
```

- [ ] Secret 1 추가됨: _____________________________________
- [ ] Secret 2 추가됨: _____________________________________
- [ ] Secret 3 추가됨: _____________________________________

---

### B2. API 키 유효성 검증

**Anthropic API Key**
```bash
curl https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY" | head -5

# 예상: 모델 목록 반환
```

- [ ] 유효: ⚪ Yes ⚪ No ⚪ 확인 불가

**GitHub Token**
```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user | grep login

# 예상: 사용자 이름 표시
```

- [ ] 유효: ⚪ Yes ⚪ No ⚪ 확인 불가
- [ ] 권한: repo, workflow, read:user, gist

**Supabase (선택 - 필요한 경우만)**
```bash
# .env.local에서 URL 확인
grep "SUPABASE_URL" ~/.openclaw/workspace-dev/.env.local

# 웹 브라우저에서:
# https://app.supabase.com > 로그인 > 프로젝트 확인
```

- [ ] URL 유효: ⚪ Yes ⚪ No ⚪ 확인 불가

---

### B3. Discord/Telegram 토큰 검증

**Telegram Bot Token**
```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | grep -q "ok"

# 예상: "ok":true 포함
```

- [ ] 유효: ⚪ Yes ⚪ No ⚪ 확인 불가
- [ ] 마지막 확인 일시: ___________________________________

**Discord Bot Token**
```bash
# 또는 Discord Developer Portal에서 직접 확인
# https://discord.com/developers/applications
```

- [ ] 유효: ⚪ Yes ⚪ No ⚪ 확인 불가
- [ ] 마지막 확인 일시: ___________________________________

---

## ✅ SECTION C: 메모리 파일 무결성 (필수 - 20분)

### C1. MEMORY.md 최종 상태 확인
```bash
# 파일 크기 확인
ls -lh ~/.openclaw/workspace-dev/memory/MEMORY.md

# 마지막 수정 시간
stat ~/.openclaw/workspace-dev/memory/MEMORY.md | grep Modify

# 행 수 확인 (200줄 이상 예상)
wc -l ~/.openclaw/workspace-dev/memory/MEMORY.md
```

- [ ] 파일 크기: _________________ MB
- [ ] 행 수: _________________ 줄
- [ ] 마지막 수정: _________________________________

### C2. 메모리 파일 체크섬 계산
```bash
# 체크섬 계산 및 기록
cd ~/.openclaw/workspace-dev
sha256sum memory/MEMORY.md > memory_MEMORY_checksum_$(date +%Y%m%d).txt

# 파일 저장 위치
cat memory_MEMORY_checksum_$(date +%Y%m%d).txt
```

- [ ] 체크섬 파일 생성됨: memory_MEMORY_checksum_20260603.txt
- [ ] 체크섬 값: _______________________________________________________________

**이 값을 안전한 장소에 보관하세요. 노트북에서 검증할 때 사용합니다.**

---

### C3. Git에서 메모리 파일 히스토리 확인
```bash
# 최근 메모리 파일 커밋 5개
git log --oneline -5 -- memory/MEMORY.md

# 예상:
# abc1234 update: MEMORY sync
# def5678 fix: memory formatting
# ...
```

- [ ] 최근 커밋 1: ____________________
- [ ] 최근 커밋 2: ____________________
- [ ] 최근 커밋 3: ____________________

---

## ✅ SECTION D: 크리덴셜 및 보안 파일 (필수 - 15분)

### D1. 민감한 파일 목록 확인
```bash
# openclaw.json 검증
ls -lh ~/.openclaw/openclaw.json

# credentials 폴더
ls -lah ~/.openclaw/credentials/

# identity 폴더
ls -lah ~/.openclaw/identity/
```

- [ ] `openclaw.json` 존재: ⚪ Yes ⚪ No
- [ ] `credentials/` 폴더 존재: ⚪ Yes ⚪ No
- [ ] `identity/device.json` 존재: ⚪ Yes ⚪ No

### D2. 파일 크기 확인
```bash
du -sh ~/.openclaw/openclaw.json
du -sh ~/.openclaw/credentials/
du -sh ~/.openclaw/identity/
```

- [ ] openclaw.json 크기: _____________ (예상: 1-2 KB)
- [ ] credentials/ 크기: _____________ (예상: 100 bytes 이상)
- [ ] identity/ 크기: _____________ (예상: 500 bytes 이상)

---

## ✅ SECTION E: 전체 데이터 크기 확인 (필수 - 10분)

### E1. 마이그레이션 대상 폴더 크기
```bash
# 전체 데이터 크기
du -sh ~/.openclaw
du -sh ~/.claude

# 단계별 크기
du -sh ~/.openclaw/workspace-dev
du -sh ~/.openclaw/workspace-dev/BACKUPS  # 선택적
du -sh ~/.openclaw/workspace-dev/memory
```

- [ ] `~/.openclaw` 전체: _____________ GB
- [ ] `~/.claude` 전체: _____________ GB
- [ ] `workspace-dev`: _____________ GB
- [ ] `BACKUPS` (선택): _____________ GB

**노트북 필요 공간:**
```
필수: .openclaw + .claude = ~6GB
권장: 위 + BACKUPS = ~9GB
```

- [ ] 노트북 여유 공간: _____________ GB (최소 50GB 필요)

---

### E2. 압축 백업 생성
```bash
# 옵션 1: 전체 백업 (권장)
cd ~
tar -czf openclaw_migration_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  .openclaw/ \
  .claude/ \
  --exclude=.openclaw/workspace-dev/BACKUPS \
  --exclude=.openclaw/workspace-dev/node_modules

# 생성 확인
ls -lh openclaw_migration_backup_*.tar.gz

# 크기 확인 (압축률: 약 60%)
du -sh openclaw_migration_backup_*.tar.gz
```

- [ ] 백업 파일 생성됨: ____________________________________
- [ ] 파일 크기: _____________ GB
- [ ] 생성 위치: _____________________________________

---

## ✅ SECTION F: Windows 노트북 사전 준비 (필수 - 전화/원격)

**노트북에서 다음을 미리 확인/설치하도록 안내:**

### F1. 시스템 요구사항
```powershell
# PowerShell에서 실행
systeminfo | findstr "OS Name,OS Version,System Manufacture,Processor,Total Physical Memory"

# 예상:
# OS Name: Microsoft Windows 10 Pro
# OS Version: 10.0.19045 Build 19045
# Processor: Intel(R) Core(i5-1135G7)
# Total Physical Memory: 16384 MB
```

- [ ] OS: Windows 10 Pro ⚪ 확인 ⚪ 미확인
- [ ] RAM: 16GB 이상 ⚪ 확인 ⚪ 미확인
- [ ] 여유 공간: 65GB 이상 ⚪ 확인 ⚪ 미확인

### F2. 필수 소프트웨어 사전 설치
- [ ] **Git for Windows** 설치 (https://git-scm.com/download/win)
  ```powershell
  git --version  # v2.30 이상 확인
  ```

- [ ] **Node.js v22.22.2** 설치
  ```powershell
  node --version  # v22.22.2 확인
  npm --version   # 10.9.7 이상 확인
  ```

- [ ] **OpenClaw 설치** (최신 버전)
  ```powershell
  openclaw --version
  ```

### F3. 네트워크 및 방화벽 확인
```powershell
Test-NetConnection -ComputerName github.com -Port 443

# 예상: TCPTestSucceeded: True
```

- [ ] GitHub 접근 가능: ⚪ Yes ⚪ No
- [ ] 인터넷 속도: _____________ Mbps (최소 5Mbps 권장)

---

## ✅ SECTION G: 최종 확인 (필수 - 5분)

### G1. 회사 PC 최종 상태
```bash
cd ~/.openclaw/workspace-dev

# 최종 상태 확인
echo "=== Git 상태 ==="
git status

echo "=== 최근 커밋 ==="
git log --oneline -1

echo "=== 메모리 파일 ==="
ls -lh memory/MEMORY.md

echo "=== 환경 파일 ==="
ls -lh .env.local dsc-fms-portal/.env.local 2>/dev/null | tail -2
```

- [ ] Git 상태: Clean
- [ ] 모든 파일: 정상
- [ ] 환경 변수: 준비됨

### G2. 백업 최종 확인
```bash
# 백업 파일 검증
tar -tzf ~/openclaw_migration_backup_*.tar.gz | head -20

# 예상: .openclaw/, .claude/ 폴더 구조 표시

# 체크섬 확인
tar -tzf ~/openclaw_migration_backup_*.tar.gz | wc -l

# 예상: 1000개 이상의 파일
```

- [ ] 백업 파일 무결성: ⚪ 정상 ⚪ 손상
- [ ] 파일 개수: _____________ 개 (예상: 1000+)

### G3. 서명 및 최종 승인
```
회사 PC 점검 완료 일시: _______________________________
점검자 서명 (또는 이름): _______________________________
```

---

## 📋 마이그레이션 준비 완료 체크리스트

마이그레이션을 시작하기 전에 아래를 모두 확인하세요:

```
=== 데이터 준비 ===
[x] Git 상태 Clean
[x] 최종 커밋 및 push 완료
[x] 백업 파일 생성 및 검증
[x] 체크섬 계산 및 기록

=== 보안 ===
[x] 환경 변수 파일 백업 (암호화 또는 GitHub Secret)
[x] API 키 유효성 검증
[x] Discord/Telegram 토큰 유효성 검증
[x] 민감한 파일 목록 작성

=== 메모리 무결성 ===
[x] MEMORY.md 체크섬 계산
[x] Git 히스토리 확인
[x] 파일 크기 및 상태 확인

=== Windows 준비 ===
[x] 시스템 요구사항 확인
[x] 필수 소프트웨어 사전 설치
[x] 네트워크 연결 확인
[x] 여유 공간 확인 (50GB+)

=== 최종 확인 ===
[x] 모든 데이터 백업 완료
[x] 문서 (이 체크리스트) 검토 완료
[x] 롤백 계획 확인
[x] 24시간 마이그레이션 일정 확보

=> 모두 완료되면 다음 단계로 진행
```

---

## 🆘 문제 발생 시

마이그레이션 중 문제가 발생하면:

1. **즉시 중단** - 추가 변경/커밋 금지
2. **상태 기록** - 오류 메시지 스크린샷 촬영
3. **원인 확인** - 체크리스트에서 누락된 항목 검토
4. **복구 결정** - MIGRATION_RISK_MATRIX.md의 롤백 가이드 참조

**긴급 연락처:**
- GitHub Support: https://support.github.com
- Supabase Support: https://supabase.com/support
- Claude Code Issues: https://github.com/anthropics/...

---

**이 체크리스트를 프린트하고 마이그레이션 중 함께 가지고 다니세요.**  
**각 단계를 완료한 후 체크박스를 표시하세요.**
