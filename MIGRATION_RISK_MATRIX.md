# OpenClaw 마이그레이션 리스크 분석 및 완화 전략

**문서 버전:** 1.0  
**작성 일시:** 2026-06-03  
**마이그레이션 대상:** 회사 게이트웨이 → Windows 개인 노트북  

---

## 📊 리스크 매트릭스

### 범례
- **영향도 (Impact):** 높음(3) > 중간(2) > 낮음(1)
- **가능성 (Probability):** 높음(3) > 중간(2) > 낮음(1)
- **위험도 (Risk Score):** 영향도 × 가능성 (1~9)
- **우선순위:** 위험도 내림차순 + 영향도 기준

---

## 🔴 High-Risk 항목 (위험도 6 이상)

### R1: 메모리 파일 손상/손실
```
영향도:   높음(3) - 기존 26개월 기록 모두 손실
가능성:   낮음(1) - 매우 드문 사건
위험도:   3 × 1 = 3 (낮음) ← 하지만 영향도가 높아서 별도 취급
```

**세부 리스크:**
- 데이터 전송 중 손상 (압축/해제 오류)
- Git 충돌로 인한 덮어쓰기
- 파일 인코딩 변환 오류 (CRLF/LF)
- 메모리 프로세스 중단으로 인한 부분 쓰기

**완화 방안:**
1. **사전 예방:**
   - 회사 PC에서 최신 커밋 상태로 정리
   ```bash
   cd ~/.openclaw/workspace-dev
   git status  # Clean 상태 확인
   git log --oneline memory/MEMORY.md | head -5
   ```
   - 메모리 파일 체크섬 계산 및 기록
   ```bash
   sha256sum memory/MEMORY.md > memory_MEMORY_checksum.txt
   ```

2. **전송 중:**
   - 신뢰성 높은 전송 방법 선택
     - ✅ USB 드라이브 (USB 3.0+)
     - ✅ 암호화 클라우드 (Google Drive, OneDrive)
     - ✅ SCP/SFTP (네트워크 전송)
     - ❌ 이메일 (크기 제한)
   - 압축 방법 표준화
   ```bash
   # 회사 PC: 압축 시
   tar -czf backup.tar.gz --exclude=BACKUPS --exclude=node_modules .openclaw .claude
   
   # 노트북: 해제 시
   tar -tzf backup.tar.gz | head -10  # 검증
   tar -xzf backup.tar.gz
   ```

3. **전송 후:**
   - 체크섬 재검증
   ```powershell
   # Windows PowerShell
   (Get-FileHash "$env:USERPROFILE\.openclaw\workspace-dev\memory\MEMORY.md").Hash
   # 회사 PC의 sha256sum 값과 비교
   ```
   - Git 무결성 확인
   ```powershell
   cd $env:USERPROFILE\.openclaw\workspace-dev
   git verify-pack -v .git/objects/pack/*.idx | tail -20
   ```

4. **사후 복구:**
   - Git 히스토리에서 복구 가능
   ```powershell
   git log --diff-filter=D --summary memory/MEMORY.md
   git checkout <commit>~1 -- memory/MEMORY.md
   ```
   - 또는 회사 PC에서 재전송

**테스트 시나리오:**
```bash
# 회사 PC에서 테스트
cd /tmp
cp -r ~/.openclaw/workspace-dev/memory /tmp/test_memory
tar -czf test.tar.gz test_memory/
tar -xzf test.tar.gz
diff -r test_memory memory  # 동일성 확인
```

---

### R2: API 키/크리덴셜 노출 또는 손실
```
영향도:   높음(3) - 보안 침해, 서비스 중단
가능성:   낮음(1) - 신중한 관리로 방지 가능
위험도:   3 × 1 = 3 (낮음) ← 영향도 높아서 별도 취급
```

**세부 리스크:**
- `.env.local` 파일이 네트워크 전송 중 노출
- GitHub에 실수로 push 됨
- Windows 백업에 암호화 없이 저장
- 클라우드 동기화 폴더에 포함됨

**필수 API 키 목록:**
| 키 | 용도 | 노출 시 피해 | 갱신 난이도 |
|---|------|-------------|-----------|
| ANTHROPIC_API_KEY | Claude API | 비용 증가, 서비스 중단 | 쉬움 (1분) |
| GITHUB_TOKEN | Git 인증 | 리포지토리 손상 | 중간 (5분) |
| SUPABASE_KEY | DB 접근 | 데이터 유출 | 어려움 (상담 필요) |
| VERCEL_TOKEN | 배포 | 배포 중단 | 중간 (5분) |
| DISCORD_TOKEN | 봇 동작 | 봇 탈취 | 어려움 (재초기화) |
| TELEGRAM_TOKEN | 봇 동작 | 봇 탈취 | 어려움 (재초기화) |

**완화 방안:**
1. **사전 준비:**
   - `.env.local` 파일 분리 저장
   ```bash
   # 회사 PC: 암호화 저장소에 백업
   openssl enc -aes-256-cbc -in ~/.openclaw/workspace-dev/.env.local -out env_backup.enc
   # 비밀번호 설정 (최소 15자)
   ```
   - 마스터 키 관리
   ```
   1. KeePass 또는 1Password에 마스터 암호 저장
   2. GitHub Secret 또는 Bitwarden에도 백업
   3. 물리적 오프라인 저장소 (종이 + 금고)
   ```

2. **전송 중:**
   - 암호화 전송 방법
   ```powershell
   # 방법 A: GitHub Secret (권장)
   # 1. GitHub 리포지토리 Settings > Secrets and variables > Actions
   # 2. 각 키를 환경 변수로 등록
   # 3. 노트북에서 GitHub Actions로 복원
   
   # 방법 B: 암호화 USB
   # BitLocker (Windows Pro) 또는 VeraCrypt로 USB 암호화
   
   # 방법 C: 안전한 클라우드
   # OneDrive/Google Drive의 암호화 폴더 사용
   ```

3. **노트북 설정:**
   - `.env.local` 파일 권한 제한
   ```powershell
   # Windows NTFS 권한 설정
   icacls "$env:USERPROFILE\.openclaw\workspace-dev\.env.local" /grant:r "%username%:F" /inheritance:r
   ```
   - `.gitignore`에 확인
   ```bash
   cd ~/.openclaw/workspace-dev
   grep -E "\.env|secret|key" .gitignore
   # 출력이 있어야 함
   ```

4. **사후 복구:**
   - API 키 갱신 절차 (최악의 시나리오)
   ```
   1. ANTHROPIC_API_KEY: console.anthropic.com에서 즉시 갱신 (1분)
   2. GITHUB_TOKEN: github.com/settings/tokens에서 revoke 후 신규 발급 (5분)
   3. SUPABASE_KEY: Supabase 콘솔에서 재발급 (상담 필요)
   4. VERCEL_TOKEN: vercel.com/account/tokens에서 갱신 (5분)
   5. DISCORD/TELEGRAM: 봇 토큰 재발급 (BotFather, Discord Developer Portal)
   ```

**테스트 시나리오:**
```bash
# 회사 PC: 민감한 파일이 Git에 포함되지 않았는지 확인
git ls-files | grep -E "\.env|secret|credential|key|token"
# 결과가 없어야 함
```

---

## 🟠 Medium-Risk 항목 (위험도 2-4)

### R3: Git 충돌 및 병합 오류
```
영향도:   중간(2) - 커밋 히스토리 손상, 수정 가능
가능성:   낮음(1) - 마이그레이션 중 변경 없으면 회피
위험도:   2 × 1 = 2
```

**발생 시나리오:**
- 회사 PC와 노트북에서 동시에 push
- CRLF/LF 변환으로 인한 모든 파일 수정 표시
- Merge conflict (메모리 파일 등)

**완화 방안:**
```bash
# 1. 마이그레이션 중 금지 조치
# - 회사 PC: git push/pull 금지
# - 노트북: 설정 완료 전 커밋 금지

# 2. 브랜치 분리
cd ~/.openclaw/workspace-dev
git checkout -b migration/windows-notebook-2026-06-03
# 노트북에서 모든 설정 수행
# 회사 PC에서는 변경 없음

# 3. 최종 병합 (모든 설정 완료 후)
git checkout main
git merge migration/windows-notebook-2026-06-03 --no-ff

# 4. CRLF 설정 (Windows)
git config --global core.autocrlf true
```

---

### R4: Node.js/npm 호환성 문제
```
영향도:   중간(2) - 빌드 실패, 재설치로 복구 가능
가능성:   낮음(1) - 정확한 버전 사용하면 회피
위험도:   2 × 1 = 2
```

**발생 시나리오:**
- Node.js v22.22.2 대신 다른 버전 설치
- npm v10.9.7 미만 버전으로 의존성 해석 오류
- 선택적 의존성 누락 (native modules)

**완화 방안:**
```powershell
# 1. 정확한 버전 설치 (관리자 모드)
# https://nodejs.org/en/download 에서 v22.22.2 직접 다운로드
# 또는 nvm-windows 사용

# 2. 버전 검증
node --version  # v22.22.2
npm --version   # 10.9.7 이상

# 3. 청정 설치
npm cache clean --force
Remove-Item node_modules -Recurse -Force
npm ci  # npm install 대신 ci 사용 (package-lock.json 기반)

# 4. 빌드 테스트
npm run build
npm test
```

---

### R5: Windows 경로 및 권한 문제
```
영향도:   중간(2) - 특정 기능 불작동, 수정 가능
가능성:   중간(2) - Windows 특화 문제 빈번
위험도:   2 × 2 = 4
```

**발생 시나리오:**
- 경로 길이 260자 초과 (Windows MAX_PATH)
- 특수문자 포함 폴더명 (한글, 특수기호)
- NTFS 권한 문제로 파일 접근 불가

**완화 방안:**
```powershell
# 1. 장 경로명 지원 활성화
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# 2. 경로 확인
$path = "$env:USERPROFILE\.openclaw\workspace-dev"
if ($path.Length -gt 260) { Write-Host "경로 길이 초과!" }

# 3. 권한 설정
icacls "$env:USERPROFILE\.openclaw" /grant:r "$env:USERNAME`:F" /t /c

# 4. Git 권한 설정
git config --global core.fileMode false  # Windows에서 권한 무시
```

---

### R6: 네트워크 및 원격 저장소 연결 실패
```
영향도:   중간(2) - Git 동기화 불가, 로컬 작업은 가능
가능성:   낮음(1) - 안정적인 인터넷으로 회피
위험도:   2 × 1 = 2
```

**발생 시나리오:**
- GitHub 접근 불가 (방화벽, DNS 문제)
- API 키 만료 (GitHub Token)
- 느린 인터넷 (대용량 파일 전송 시간 초과)

**완화 방안:**
```powershell
# 1. 네트워크 진단
Test-Connection github.com -Verbose

# 2. DNS 확인
Resolve-DnsName github.com

# 3. Git 연결 테스트
git ls-remote origin  # 원격 저장소 확인

# 4. 오프라인 모드 설정 (필요시)
# 인터넷 복구 전까지는 로컬에서만 작업
git config --global core.sshCommand "ssh -i ~/.ssh/id_rsa"
```

---

## 🟡 Low-Risk 항목 (위험도 1)

### R7: Telegram/Discord 토큰 만료
```
영향도:   중간(2) - 봇 기능 중단
가능성:   낮음(1) - 수동 갱신으로 회피
위험도:   2 × 1 = 2
```

**완화 방안:**
```bash
# 1. 토큰 만료 여부 확인
# Telegram: @BotFather /mybots -> 선택 -> Edit -> Edit TOKEN
# Discord: Developer Portal -> Applications -> Bot -> TOKEN

# 2. 토큰 갱신
# Telegram: /revoke (새 토큰 발급)
# Discord: Regenerate -> 복사

# 3. openclaw.json 업데이트
notepad $env:USERPROFILE\.openclaw\openclaw.json
# botToken / token 값 변경
```

---

### R8: 메모리 자동 정리 스크립트 실행 실패
```
영향도:   낮음(1) - MEMORY.md 성장만 계속
가능성:   낮음(1) - 스크립트 수동 실행으로 회피
위험도:   1 × 1 = 1
```

**완화 방안:**
```powershell
# 1. Task Scheduler 등록 확인
Get-ScheduledTask | Where-Object TaskName -like "*cleanup*"

# 2. 수동 실행
powershell -File "$env:USERPROFILE\.openclaw\workspace-dev\memory\.automation\memory_weekly_cleanup.sh"

# 3. 로그 확인
Get-Content "$env:USERPROFILE\.openclaw\workspace-dev\logs\memory_cleanup.log" -Tail 20
```

---

## 🛡️ 종합 완화 전략

### 최우선 (마이그레이션 전):
```
1. 메모리 파일 체크섬 계산 및 기록
2. 모든 API 키 목록 작성 및 암호화
3. Git 상태 확인 (Clean 상태)
4. 최종 커밋 및 push
```

### 우선 (마이그레이션 중):
```
1. 신뢰할 수 있는 전송 매체 선택 (USB 또는 클라우드)
2. 압축 파일 무결성 검증 (체크섬)
3. Windows에서 정확한 Node.js 설치
4. .env 파일 암호화 보관
```

### 사후 (마이그레이션 후):
```
1. 모든 기능 테스트 (24시간)
2. Git 동기화 확인
3. API 키 정상 작동 확인
4. 백업 자동화 설정
5. 로그 모니터링
```

---

## 📋 리스크 체크리스트

마이그레이션 전에 다음을 모두 확인하세요:

```
[x] 메모리 파일 체크섬 계산
[x] API 키 목록 작성 및 암호화
[x] Git 상태 확인 (Clean)
[x] 백업 파일 무결성 검증
[x] Windows 노트북 환경 준비
[x] 네트워크 연결 안정성 확인
[x] Discord/Telegram 토큰 유효성 확인
[x] 복구 절차 문서화
[x] 긴급 연락처 확보 (GitHub, Supabase, Vercel)
[x] 사후 모니터링 계획 수립

=> 모두 완료되면 마이그레이션 시작
```

---

**이 리스크 분석은 정기적으로 검토되어야 합니다.**  
**마이그레이션 후 1개월: 추가 리스크 검토**  
**마이그레이션 후 3개월: 전체 리스크 재평가**
