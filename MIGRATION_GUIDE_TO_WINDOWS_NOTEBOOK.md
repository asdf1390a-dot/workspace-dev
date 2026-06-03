# OpenClaw/Claude Code 마이그레이션 가이드
## 회사 게이트웨이 → Windows 개인 노트북 (완벽 이전)

**작성 일시:** 2026-06-03  
**목표:** 100% 오류 없는 완벽한 마이그레이션  
**예상 소요 시간:** 약 3-4시간  

---

## 📋 마이그레이션 체크리스트

### 📌 PHASE 0: 사전 준비 (30분)

#### 0-1. 대상 노트북 환경 검증
- [ ] Windows 10 Pro 설치 확인
- [ ] 디스크 여유 공간 확인: **최소 50GB 필요** (현재: 65GB)
  ```powershell
  # Windows PowerShell에서 실행
  Get-Volume C: | Select-Object SizeRemaining
  ```
- [ ] 인터넷 연결 안정성 확인 (10Mbps 이상)

#### 0-2. 필수 소프트웨어 설치 (노트북)
- [ ] **Git for Windows** 설치
  - 다운로드: https://git-scm.com/download/win
  - 기본 옵션으로 설치
  - 설치 후 확인:
    ```powershell
    git --version
    ```

- [ ] **Node.js v22.22.2** 설치 (정확한 버전)
  - 다운로드: https://nodejs.org/en/download (LTS 최신)
  - 또는 nvm-windows 사용 권장
  - 설치 후 확인:
    ```powershell
    node --version  # v22.22.2 이상
    npm --version   # 10.9.7 이상
    ```

- [ ] **OpenClaw/Claude Code** 설치 (최신 버전)
  - 공식 설치 문서: https://github.com/anthropics/anthropic-sdk-python
  - 설치 후 확인:
    ```powershell
    openclaw --version
    ```

#### 0-3. 회사 PC 데이터 백업
- [ ] 현재 작업 상태 커밋 (Git)
  ```bash
  cd ~/.openclaw/workspace-dev
  git status
  git add .
  git commit -m "backup: migration prep - 2026-06-03"
  git push origin main
  ```

- [ ] 민감한 파일 확인 및 안전 보관
  - [ ] `.env.local` 파일 복사 (GitHub 비밀 저장소에 업로드 또는 암호화된 저장소)
  - [ ] `openclaw.json` (텔레그램/Discord 토큰 포함)
  - [ ] 크리덴셜 파일들

---

### 📌 PHASE 1: 데이터 추출 및 준비 (1시간)

#### 1-1. 폴더 구조 파악
**마이그레이션 대상 폴더 (총 ~6.1GB):**
```
~/.openclaw/            (4.7GB) ← 전체
  ├── workspace-dev/    (4.6GB) ← 프로젝트 핵심
  ├── openclaw.json     (1.9KB) ← 설정
  ├── credentials/      (보안)
  ├── identity/         (보안)
  └── ... (기타)

~/.claude/              (1.4GB) ← 설정 + 메모리
  ├── settings.json
  ├── keybindings.json  (있으면)
  ├── projects/
  └── ... (캐시/히스토리)
```

#### 1-2. 필수 데이터 백업 (회사 PC)
**방법 A: 압축 백업 (권장 - 안전)**
```bash
# Linux/Mac에서 실행
cd ~
tar -czf openclaw_migration_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  .openclaw/ \
  .claude/ \
  .config/  (있으면)

# USB나 클라우드에 복사
ls -lh openclaw_migration_backup_*.tar.gz
```

**방법 B: 폴더 직접 복사 (Windows 도구 권장)**
```powershell
# Windows PowerShell (관리자 모드)
# 또는 WinRAR/7-Zip 등으로 압축
```

#### 1-3. 민감한 파일 분류
**CRITICAL (반드시 이전):**
- [ ] `~/.openclaw/openclaw.json` - Discord/Telegram 토큰 포함
- [ ] `~/.openclaw/credentials/` - 모든 파일
- [ ] `~/.openclaw/identity/device.json`
- [ ] `~/.openclaw/workspace-dev/.env.local` - API 키
- [ ] `~/.openclaw/workspace-dev/dsc-fms-portal/.env.local` - 데이터베이스 설정
- [ ] `~/.claude/projects/-home-jeepney--openclaw-workspace-dev/memory/` - 중요 메모리

**SHOULD (메모리/성능):**
- [ ] `~/.openclaw/workspace-dev/memory/` (26MB) - 자동 메모리
- [ ] `~/.claude/` 전체 (1.4GB) - 설정 + 히스토리

**OPTIONAL (재설정 가능):**
- [ ] `~/.openclaw/workspace-dev/BACKUPS/` (3GB) - 백업 본본
  - 필요시 선택적으로 이전

---

### 📌 PHASE 2: Windows 노트북 기본 설정 (45분)

#### 2-1. 디렉토리 구조 생성
```powershell
# PowerShell에서 실행
New-Item -ItemType Directory -Path "$env:USERPROFILE\.openclaw" -Force
New-Item -ItemType Directory -Path "$env:USERPROFILE\.claude" -Force

# 확인
ls $env:USERPROFILE\.openclaw
ls $env:USERPROFILE\.claude
```

#### 2-2. 파일 전송 (추천 순서)

**Step 1: 압축 파일 전송**
```powershell
# 회사 PC에서 생성한 tar.gz를 Windows로 복사
# USB, OneDrive, Google Drive, 또는 scp 사용

# 예: USB에서 복사
Copy-Item "D:\openclaw_migration_backup_*.tar.gz" -Destination "$env:USERPROFILE\"
```

**Step 2: 압축 해제**
```powershell
# 7-Zip 또는 WinRAR 사용
# 또는 WSL + tar 명령 사용
wsl tar -xzf ~/openclaw_migration_backup_*.tar.gz
```

**Step 3: 선택적 복사 (대용량 백업 제외)**
```powershell
# BACKUPS 폴더는 필수 아님 (필요시 나중에 복사)
```

#### 2-3. Git 설정
```powershell
cd $env:USERPROFILE\.openclaw\workspace-dev

# Git 사용자 설정 (회사 PC와 동일)
git config --global user.name "Claude Bot"
git config --global user.email "bot@dsc-fms.local"

# 로컬 설정 확인
git config --local user.name
git config --local user.email

# 원격 저장소 확인
git remote -v

# 현재 상태 확인
git status
```

---

### 📌 PHASE 3: OpenClaw/Claude Code 재설정 (1시간)

#### 3-1. 설정 파일 검증 및 수정

**파일 1: openclaw.json**
```powershell
# 위치: $env:USERPROFILE\.openclaw\openclaw.json

# 내용 예시 (자신의 파일 확인):
# {
#   "gateway": { "mode": "local" },
#   "agents": { "defaults": { "model": { "primary": "..." } } },
#   "channels": { "telegram": { "enabled": true }, ... }
# }

# 검증 사항:
# ✓ 게이트웨이 모드 확인 ("local" 또는 설정된 모드)
# ✓ Discord/Telegram 토큰 있는지 확인
# ✓ workspace 경로가 맞는지 확인
```

**파일 2: ~/.claude/settings.json**
```powershell
# 위치: $env:USERPROFILE\.claude\settings.json

# 내용 (기본):
# {
#   "theme": "dark",
#   "autoCompactEnabled": true,
#   "autoCompactWindow": 120000
# }
```

**파일 3: 환경 변수 설정**
```powershell
# PowerShell 프로필 편집
notepad $PROFILE

# 아래 환경 변수 추가:
$env:PATH += ";C:\Program Files\Git\cmd"
$env:NODE_ENV = "production"  # 필요시

# 저장 후 PowerShell 재시작
```

#### 3-2. 환경 변수 및 API 키 재설정

**Step 1: .env.local 파일 복원**
```powershell
# 회사 PC에서 비밀 저장소에 업로드된 파일들을 복사

# 필수 .env 파일:
# 1. $env:USERPROFILE\.openclaw\workspace-dev\.env.local
# 2. $env:USERPROFILE\.openclaw\workspace-dev\dsc-fms-portal\.env.local

# 각 파일에 포함되어야 하는 키:
# - ANTHROPIC_API_KEY (Claude API)
# - GITHUB_TOKEN / GH_PAT (GitHub)
# - SUPABASE_* (데이터베이스)
# - VERCEL_* (배포)
# - DISCORD_BOT_TOKEN
# - TELEGRAM_BOT_TOKEN
```

**Step 2: API 키 확인 목록**
- [ ] ANTHROPIC_API_KEY (https://console.anthropic.com)
- [ ] GITHUB_TOKEN (https://github.com/settings/tokens)
  - 권한: repo, workflow, read:user, gist
- [ ] SUPABASE_URL, SUPABASE_KEY (프로젝트 설정)
- [ ] VERCEL_TOKEN (배포용)
- [ ] DISCORD_BOT_TOKEN (Discord Developer Portal)
- [ ] TELEGRAM_BOT_TOKEN (BotFather)

**Step 3: GitHub 원격 저장소 인증 설정**
```powershell
# 방법 A: GitHub CLI 사용 (권장)
# 1. GitHub CLI 설치: https://cli.github.com
# 2. 인증:
gh auth login
# 프롬프트에 따라 Token 또는 OAuth 선택

# 방법 B: Git Credential Manager 사용
git config --global credential.helper manager-core

# 방법 C: Personal Access Token 직접 사용
git remote set-url origin https://<token>@github.com/asdf1390a-dot/workspace-dev.git
```

#### 3-3. Node.js 의존성 설치
```powershell
cd $env:USERPROFILE\.openclaw\workspace-dev

# 기존 node_modules 제거 (선택)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# 새로운 의존성 설치
npm install

# 또는 청정 설치
npm ci
```

#### 3-4. OpenClaw 서비스 시작 (로컬 모드)
```powershell
# OpenClaw 시작
openclaw start

# 또는 백그라운드에서 실행 (Windows)
Start-Process openclaw -ArgumentList "start"

# 상태 확인
openclaw status
```

---

### 📌 PHASE 4: 데이터 정합성 검증 (45분)

#### 4-1. Git 저장소 상태 확인
```powershell
cd $env:USERPROFILE\.openclaw\workspace-dev

# 상태 확인
git status

# 브랜치 목록
git branch -a

# 최근 커밋 5개 확인
git log --oneline -5

# 원격 동기화 확인
git fetch origin
git status  # "up to date" 확인
```

#### 4-2. 메모리 파일 검증
```powershell
# MEMORY.md 파일 확인
ls $env:USERPROFILE\.openclaw\workspace-dev\memory\

# 크기 확인 (약 26MB 예상)
(Get-ChildItem -Recurse $env:USERPROFILE\.openclaw\workspace-dev\memory | Measure-Object -Property Length -Sum).Sum / 1MB

# 링크 검증 (선택)
# memory/MEMORY.md 파일 열어서 깨진 링크 확인
```

#### 4-3. 프로젝트 빌드 테스트
```powershell
cd $env:USERPROFILE\.openclaw\workspace-dev

# 의존성 확인
npm list --depth=0

# DSC FMS Portal 빌드 테스트 (선택)
cd dsc-fms-portal
npm run build

# 기타 중요 프로젝트 테스트
cd memory-automation
npm test  # 있으면
```

#### 4-4. Claude Code 기능 테스트
```powershell
# Claude Code 실행
claude

# 테스트 명령어:
# /help - 명령어 확인
# /status - 상태 확인
# /edit <filename> - 파일 편집 테스트
# /run echo "test" - 간단한 스크립트 실행
```

#### 4-5. Discord/Telegram 연결 테스트
```powershell
# 콘솔에서 상태 확인
# 또는 Discord/Telegram에서 메시지 전송 후 응답 확인

# Discord: #비서-secretary 채널에서 테스트
# Telegram: @bot_name에 메시지 전송
```

---

### 📌 PHASE 5: 자동화 및 스케줄 재설정 (30분)

#### 5-1. Cron Job 마이그레이션
```powershell
# Windows에서 Task Scheduler로 전환

# OpenClaw Cron 목록 확인 (회사 PC에서)
# $env:USERPROFILE\.openclaw\workspace-dev\crons\

# 각 크론 작업을 Windows Task Scheduler로 등록:
# 1. 주간 메모리 정리 (월요일 09:09)
# 2. 월간 메모리 검토 (매달 1일 09:09)
# 3. 자동화 감시 (4시간 주기)
```

**Windows Task Scheduler 설정 예시:**
```powershell
# PowerShell (관리자 모드)
$taskName = "OpenClaw-Weekly-Cleanup"
$scriptPath = "$env:USERPROFILE\.openclaw\workspace-dev\memory\.automation\memory_weekly_cleanup.sh"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9:09AM
$action = New-ScheduledTaskAction -Execute "pwsh.exe" -Argument "-File `"$scriptPath`""
$settings = New-ScheduledTaskSettingsSet -RunOnlyIfNetworkAvailable
Register-ScheduledTask -TaskName $taskName -Trigger $trigger -Action $action -Settings $settings
```

#### 5-2. 24/7 서비스 설정 (선택)
```powershell
# Windows 시작 시 OpenClaw 자동 실행 설정

# 방법 A: 작업 스케줄러
# 시작 이벤트 → openclaw start 실행

# 방법 B: 시작 폴더에 단축키 추가
# C:\Users\<사용자명>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup

# 방법 C: nssm (Non-Sucking Service Manager) 사용
# https://nssm.cc/download
nssm install OpenClaw "C:\Program Files\Node.js\node.exe" "openclaw start"
nssm start OpenClaw
```

#### 5-3. 백업 자동화 설정
```powershell
# Windows Task Scheduler로 일일 백업

# 추천:
# - 시간: 매일 자정 (00:00)
# - 대상: $env:USERPROFILE\.openclaw\workspace-dev
# - 저장소: 외부 드라이브 또는 OneDrive
```

---

### 📌 PHASE 6: 최종 검증 및 테스트 (1시간)

#### 6-1. 통합 기능 테스트
- [ ] Claude Code CLI 실행 확인
- [ ] 프로젝트 파일 편집 가능 확인
- [ ] Git push/pull 동작 확인
- [ ] API 호출 (Anthropic, GitHub, Supabase) 동작 확인
- [ ] Discord 봇 실행 확인
- [ ] Telegram 연동 확인

#### 6-2. 성능 및 안정성 테스트
```powershell
# 장시간 실행 테스트 (최소 2시간)
# Claude Code 백그라운드 실행 중 안정성 확인

# 메모리 사용량 모니터링
Get-Process | Where-Object Name -like "*node*" | Select-Object Name, WorkingSet

# CPU 사용량 확인
Get-Process | Where-Object Name -like "*openclaw*" | Select-Object Name, CPU
```

#### 6-3. 데이터 무결성 검증
```powershell
# MEMORY.md 마지막 갱신 시간 확인
(Get-Item "$env:USERPROFILE\.openclaw\workspace-dev\memory\MEMORY.md").LastWriteTime

# Git 커밋 히스토리 확인
cd $env:USERPROFILE\.openclaw\workspace-dev
git log --oneline | head -10

# 중요 파일 체크섬 비교 (회사 PC 값과 비교)
Get-FileHash "$env:USERPROFILE\.openclaw\openclaw.json"
```

#### 6-4. 롤백 테스트 (선택)
- [ ] 회사 PC에서 작은 변경 커밋 후 노트북에서 pull 확인
- [ ] 노트북에서 작은 변경 커밋 후 회사 PC에서 pull 확인
- [ ] 양쪽 모두 동기화되는지 확인

---

## 🚨 리스크 분석 및 완화 방안

| # | 리스크 | 영향도 | 가능성 | 완화 방안 |
|---|--------|--------|--------|---------|
| R1 | 데이터 전송 중 손실 | **높음** | 낮음 | USB/암호화 저장소 사용, 체크섬 검증 |
| R2 | API 키 노출 | **높음** | 낮음 | `.env` 파일 분리 저장, 권한 관리 |
| R3 | Git 충돌 발생 | 중간 | 중간 | 마이그레이션 중 변경 없음, 브랜치 분리 |
| R4 | Node.js 호환성 문제 | 중간 | 낮음 | 정확한 v22.22.2 설치, npm ci 사용 |
| R5 | 네트워크 지연 | 낮음 | 높음 | 로컬 모드 설정, 오프라인 테스트 우선 |
| R6 | Telegram/Discord 토큰 만료 | 중간 | 낮음 | 토큰 갱신 확인, 재설정 절차 준비 |
| R7 | 메모리 파일 손상 | **높음** | 낮음 | 수동 백업, Git 이력 보존 |
| R8 | 권한 문제 (폴더 접근) | 중간 | 낮음 | 관리자 모드로 설치, 폴더 권한 설정 |

---

## 🔄 롤백 가이드

### 롤백 시나리오 1: 전체 마이그레이션 실패
```powershell
# 1단계: 백업에서 원본 파일 복구
tar -xzf openclaw_migration_backup_*.tar.gz -C $env:USERPROFILE

# 2단계: 회사 PC 원본 확인
# 회사 PC에서: git reset --hard origin/main

# 3단계: 노트북에서 재시도 또는 회사 PC 계속 사용
```

### 롤백 시나리오 2: 특정 파일 손상
```powershell
# 1단계: Git에서 복구
cd $env:USERPROFILE\.openclaw\workspace-dev
git checkout HEAD~1 -- <손상된_파일>

# 2단계: 또는 백업에서 복구
Copy-Item "backup_path\<파일>" -Destination "<대상_경로>"
```

### 롤백 시나리오 3: API 키 오류
```powershell
# 1단계: 원본 .env.local 확인 (회사 PC)
# 2단계: 새 노트북에서 파일 수동 편집 또는 재전송
notepad $env:USERPROFILE\.openclaw\workspace-dev\.env.local
```

---

## 📊 소요 시간 추정

| 단계 | 작업 | 예상 시간 |
|-----|------|---------|
| **PHASE 0** | 사전 준비 | **30분** |
| PHASE 1 | 데이터 추출 및 백업 | 30분 |
| PHASE 2 | Windows 기본 설정 | 45분 |
| PHASE 3 | OpenClaw 재설정 | 1시간 |
| PHASE 4 | 정합성 검증 | 45분 |
| PHASE 5 | 자동화 재설정 | 30분 |
| PHASE 6 | 최종 검증 | 1시간 |
| **합계** | | **~4시간** |

**분석 노트:**
- 네트워크 속도에 따라 ±30분 변동 가능
- 4.7GB 데이터 전송: ~10-15분 (USB 300MB/s 기준)
- npm install: ~20-30분 (첫 설치 시)
- 최종 테스트: 2시간 이상 권장

---

## ✅ 마이그레이션 후 확인사항

### 첫 주 (1-7일)
- [ ] Claude Code 일일 1회 이상 실행 (안정성 확인)
- [ ] 메모리 자동 정리 cron 실행 확인
- [ ] Discord/Telegram 메시지 송수신 테스트
- [ ] Git push/pull 동작 확인

### 첫 달 (1-30일)
- [ ] 주간 메모리 정리 스크립트 실행 확인
- [ ] API 호출 성능 비교 (회사 PC vs 노트북)
- [ ] 자동 백업 정상 작동 확인
- [ ] 네트워크 안정성 모니터링

### 이후
- [ ] 월간 데이터 백업 (외부 저장소)
- [ ] 주요 암호 갱신 (분기별)
- [ ] Node.js 버전 업데이트 (필요시)

---

## 📞 문제 해결

### Q1: "Git 인증 오류" 발생
```powershell
# 해결:
git config --global credential.helper manager-core
git remote set-url origin https://github.com/asdf1390a-dot/workspace-dev.git
git pull  # 다시 시도
```

### Q2: "npm install 실패"
```powershell
# 해결:
npm cache clean --force
npm install --legacy-peer-deps  # 필요시
```

### Q3: "OpenClaw 시작 안 됨"
```powershell
# 해결:
openclaw --version  # 설치 확인
openclaw doctor  # 진단
$env:DEBUG = "*"  # 디버그 모드
openclaw start
```

### Q4: "Discord/Telegram 응답 없음"
```powershell
# 해결:
# 1. openclaw.json 토큰 확인
# 2. Discord Developer Portal/BotFather에서 토큰 갱신
# 3. openclaw restart
```

### Q5: "메모리 파일이 비어있음"
```powershell
# 해결:
# Git에서 복구
cd $env:USERPROFILE\.openclaw\workspace-dev
git checkout HEAD -- memory/MEMORY.md
git pull origin main
```

---

## 🎯 완료 체크리스트

마이그레이션이 완료되면 아래 항목을 모두 확인하세요:

```powershell
# 체크리스트
[x] Windows 노트북 에서 Claude Code 정상 실행
[x] Git 저장소 동기화 완료 (origin/main과 일치)
[x] 모든 .env 파일 복원 및 API 키 검증
[x] npm install 완료 (node_modules 설치됨)
[x] Discord/Telegram 정상 응답
[x] 메모리 파일 무결성 확인
[x] 24/7 서비스 설정 완료 (자동 실행)
[x] 일일 백업 설정 완료
[x] 2시간 이상 안정성 테스트 통과

=> 모두 완료되면 회사 PC 사용 중단 가능
```

---

## 📎 첨부: 중요 파일 목록

**반드시 이전해야 하는 파일:**
```
~/.openclaw/openclaw.json (1.9KB) - 핵심 설정
~/.openclaw/credentials/ - 민감 정보
~/.openclaw/identity/device.json - 디바이스 식별
~/.openclaw/workspace-dev/ (4.6GB) - 프로젝트 전체
~/.claude/ (1.4GB) - 설정 + 메모리
```

**선택적 이전 (필요시):**
```
~/.openclaw/workspace-dev/BACKUPS/ (3GB) - 일일 백업
~/.openclaw/workspace-dev/logs/ - 로그 파일
```

---

**마이그레이션 시작 전 이 가이드를 완전히 읽고, 각 PHASE를 순서대로 진행하세요.**  
**모든 체크리스트 항목을 완료할 때까지 이전 시스템을 종료하지 마세요.**
