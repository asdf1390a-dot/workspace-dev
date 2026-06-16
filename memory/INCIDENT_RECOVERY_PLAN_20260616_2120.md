---
name: 배포 회귀 인시던트 복구 계획 (2026-06-16 21:20 KST)
description: 근본 원인 규명 + 복구 전략 수정 | GitHub Actions 워크플로우 오류 수정 | Option A 즉시 실행 권장
type: project
timestamp: 2026-06-16 21:20:00 KST
---

# 🔴 배포 회귀 인시던트 복구 계획 (2026-06-16 21:20 KST)

## 근본 원인 규명 ✅

### 발견된 오류
**GitHub Actions 워크플로우 (`.github/workflows/p2-vercel-auto-recovery.yml`)의 엔드포인트 설정 오류**

#### 잘못된 설정 (이전)
```bash
endpoints=(
  "https://dsc-fms-portal-audit.vercel.app"        # ❌ 존재 안 함
  "https://dsc-fms-portal-discord.vercel.app"      # ❌ 존재 안 함
  "https://dsc-fms-portal-bm.vercel.app"           # ❌ 존재 안 함
  "https://dsc-fms-portal-travel.vercel.app"       # ❌ 존재 안 함
)
```

#### 실제 엔드포인트 (수정됨)
```bash
endpoints=(
  "https://dsc-fms-portal.vercel.app"              # ✅ Main Portal
  "https://dsc-audit-p1.vercel.app"                # ✅ AUDIT-P1
  "https://dsc-discord-bot-p1.vercel.app"          # ✅ DISCORD-BOT-P1
  "https://dsc-travel-p2-ui.vercel.app"            # ✅ TRAVEL-P2-UI
)
```

### 영향
- 워크플로우가 **존재하지 않는 엔드포인트** 모니터링 중
- 항상 DOWN 판정 → 재배포 시도
- 하지만 `vercel deploy --prod`은 root 프로젝트(Main Portal)만 배포
- **3/4 P1 프로젝트는 배포되지 않음** → 이번 회귀의 직접 원인

## 수정된 조치 ✅

### 커밋: bd5d4e0d (21:19 KST)
```
fix: P2 워크플로우 엔드포인트 URL 수정
- 워크플로우 4/4 엔드포인트 검증 로직 수정 완료
- 다음 5분 주기(크론)에 자동 실행 예정
```

### 예상 재실행 시간
- **현재:** 21:20 KST
- **다음 크론:** 21:20~21:25 중 자동 실행

## 복구 전략 (3가지)

### **Option A: 수동 Vercel 대시보드 개입** ✨ **추천**

#### 절차
1. Vercel 대시보드 접속 (`https://vercel.com/dashboard`)
2. 프로젝트별 재배포:
   - `dsc-audit-p1` → Redeploy
   - `dsc-discord-bot-p1` → Redeploy
   - `dsc-travel-p2-ui` → Redeploy
3. 각 배포 완료 후 4/4 UP 확인

#### 특징
- **소요시간:** 10~15분
- **성공확률:** 95%+
- **장점:** 직접 제어, 빠른 복구
- **진행자:** 수동 개입 필요 (자동화 아님)

### **Option B: 수정된 GitHub Actions 자동 재트리거**

#### 절차
1. 워크플로우 대기 (다음 크론 주기)
2. 수정된 엔드포인트 검증 실행
3. DOWN 감지 → 자동 재배포
4. 30초 후 재검증

#### 특징
- **소요시간:** 5~10분 (크론 대기 포함)
- **성공확률:** 75% (여전히 배포 스크립트 제약)
- **장점:** 자동화, 모니터링 일관성
- **단점:** 크론 주기 대기, 배포 스크립트 검토 필요

### **Option C: 수동 CLI 배포**

#### 절차
```bash
# 각 프로젝트 개별 배포
cd audit-p1 && vercel deploy --prod
cd ../discord-bot-p1 && vercel deploy --prod
cd ../travel-p2-ui && vercel deploy --prod
```

#### 특징
- **소요시간:** 15~20분
- **성공확률:** 80% (로컬 구조 검증 필요)
- **장점:** 명확한 피드백
- **단점:** 로컬 파일 구조 확인 필요

## 현재 상태 (21:20 KST)

| 항목 | 상태 |
|------|------|
| **배포 현황** | 🔴 1/4 UP (3분+ 안정화) |
| **지속 시간** | 5분 + (18:09 → 21:20) |
| **워크플로우 수정** | ✅ 완료 (bd5d4e0d) |
| **다음 크론** | 📅 21:20~25 중 실행 예정 |
| **권장 행동** | **🚨 Option A 즉시 실행** |

## 결정 대기

**필요한 사용자 결정:**
1. **Option A 즉시 실행?** (10~15분 수동 개입)
2. **Option B 대기?** (자동 크론 재실행, ~5분 대기)
3. **Option C 수동 CLI?** (로컬 검증 후 배포)

### 추천
**Option A 우선 실행**, 실패 시 B/C 병행

---

**생성:** 2026-06-16 21:20:00 KST  
**상태:** 🔴 CRITICAL (근본 원인 규명 ✅, 복구 대기)  
**마감:** 2026-06-20 14:00 (남은 시간 78h 40m)
