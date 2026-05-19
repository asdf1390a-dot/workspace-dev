# 자동화 시스템 구현 가이드 (Phase 1-2)

**Status:** ✅ 구현 완료 (2026-05-19 18:10 KST)  
**마감:** 2026-05-19 20:00 KST  
**소요시간:** ~2시간

---

## 📦 산출물 목록 (5개 완성)

### 1️⃣ Git Hook Script (GCS 차단)
**파일:** `scripts/git-hooks/commit-msg` (78줄, 실행권 O)

**역할:**
- 커밋 메시지 형식 검증 (GCS 표준)
- 표준: `<type>(<scope>): <subject>` + `Refs:` + `Stage:`
- 위반 시 커밋 거부 + 상세 가이드 출력

**활성화:**
```bash
# 프로젝트 초기화 또는 수동 설정
cp scripts/git-hooks/commit-msg .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
```

---

### 2️⃣ GitHub Actions Workflow (GCS 검증)
**파일:** `.github/workflows/gcs-validation.yml` (~110줄)

**역할:**
- PR 생성/업데이트 시 자동 커밋 검증
- 모든 커밋이 GCS 표준 준수 여부 확인
- CTB 업데이트 여부 체크 (권장사항)

**자동 실행:**
- Trigger: PR opened/synchronized/reopened
- 결과: PR Checks에 표시

---

### 3️⃣ Vercel Cron 설정 (6개 타임샷)
**파일:** `vercel.json` (수정됨)

**설정된 체크포인트:**
| 시간(KST) | UTC Cron | 엔드포인트 | 상태 |
|-----------|----------|-----------|------|
| 08:00 | `0 23 * * *` | `/api/cron/checkpoint/08-00` | ✅ |
| 09:00 | `0 0 * * *` | `/api/cron/checkpoint/09-00` | ✅ |
| 12:00 | `0 3 * * *` | `/api/cron/checkpoint/12-00` | ✅ |
| 14:00 | `0 5 * * *` | `/api/cron/checkpoint/14-00` | ✅ |
| 15:00 | `0 6 * * *` | `/api/cron/checkpoint/15-00` | ✅ |
| 18:00 | `0 9 * * *` | `/api/cron/checkpoint/18-00` | ✅ |

**주의:** UTC 기준 (한국시간 - 9시간)

---

### 4️⃣ Cron Checkpoint Manager (자동화 로직)

#### A. TypeScript 모듈
**파일:** `lib/automation/cron-checkpoint-manager.ts` (220줄)

**기능:**
- 체크포인트 타이밍 기록
- CTB(active_work_tracking.md) 자동 동기화
- 신뢰도(reliability) 자동 계산
- 지연/누락 체크포인트 복구

#### B. API 엔드포인트
**파일:** `pages/api/cron/checkpoint/[time].ts` (140줄)

**처리 로직:**
1. 실제 실행 시간 기록
2. 예정 시간과의 차이 계산 (delay_minutes)
3. 상태 판정:
   - ≤5분: `completed` ✅
   - 5-15분: `delayed` ⏳
   - >15분: `missed` ❌
4. DB 저장 (checkpoint_logs 테이블)
5. Telegram 알림 전송
6. 신뢰도 계산 및 반환

---

### 5️⃣ Telegram 알림 시스템
**파일:** `lib/automation/telegram-config.ts` (200줄)

**템플릿 3종:**

#### A. 체크포인트 알림
```markdown
📍 Daily Checkpoint #0800

⏰ Scheduled: 08:00 KST
⏱ Actual: 08:02 KST
📊 Status: completed ✅
🎯 Reliability: 100%
```

#### B. GCS 위반 알림
```markdown
⚠️ GCS Violation Detected

❌ abc1234: Invalid header format
❌ def5678: Missing 'Refs:' tag
```

#### C. CTB 동기화 알림
```markdown
🔄 CTB Synchronized

⏱ Timestamp: 2026-05-19 18:15
📊 Updates: 24 records synced
✅ Status: Success
```

---

## 🗄️ 데이터베이스 스키마

**파일:** `db/31_checkpoint_logs_table.sql` (120줄)

### 테이블: checkpoint_logs
```sql
CREATE TABLE checkpoint_logs (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  scheduled_time VARCHAR(5),    -- "08:00"
  actual_time VARCHAR(5),       -- "08:03"
  status VARCHAR(20),           -- 'completed' | 'delayed' | 'missed'
  delay_minutes INTEGER,
  timestamp TIMESTAMPTZ,
  notes TEXT
);
```

### 뷰 2개:
- **checkpoint_daily_reliability** — 일일 신뢰도 (%)
- **checkpoint_monthly_reliability** — 월간 신뢰도 (%)

---

## 🔧 환경변수 설정 필요

**.env.local 또는 Vercel 환경변수에 추가:**

```bash
# Telegram (필수 — 자동 알림용)
TELEGRAM_BOT_TOKEN=<your_bot_token>
TELEGRAM_CHAT_ID=<your_chat_id>

# Vercel Cron 보안 (필수)
CRON_SECRET=<random_32char_secret>

# Supabase (기존)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 📋 구현 체크리스트

### Phase 1: DB & 환경변수 설정
- [ ] DB 마이그레이션 실행 (`db/31_checkpoint_logs_table.sql`)
  ```bash
  psql -h <host> -U <user> -d <db> -f db/31_checkpoint_logs_table.sql
  ```
- [ ] 환경변수 설정 (`.env.local` 또는 Vercel)
  - [ ] `TELEGRAM_BOT_TOKEN`
  - [ ] `TELEGRAM_CHAT_ID`
  - [ ] `CRON_SECRET`

### Phase 2: Git Hook 활성화
- [ ] 로컬에서 `.git/hooks/commit-msg` 설정
  ```bash
  cp scripts/git-hooks/commit-msg .git/hooks/commit-msg
  chmod +x .git/hooks/commit-msg
  ```
- [ ] 테스트 커밋으로 검증
  ```bash
  git commit -m "test: check hook" # ❌ FAIL (format invalid)
  git commit -m "feat(test): check hook

  Refs: test-task
  Stage: API
  "  # ✅ PASS
  ```

### Phase 3: 배포 & 테스트
- [ ] GitHub Actions 활성화 확인 (`.github/workflows/` 존재)
- [ ] Vercel 배포 후 cron 실행 대기
  - [ ] cron 실행 로그 확인 (Vercel Dashboard > Functions > Cron)
  - [ ] `checkpoint_logs` 테이블에 레코드 확인
- [ ] Telegram 알림 수신 확인

### Phase 4: 모니터링
- [ ] 매일 신뢰도 95% 이상 유지
  ```sql
  SELECT * FROM checkpoint_daily_reliability;
  ```
- [ ] 지연/누락 체크포인트 즉시 대응
- [ ] 월간 리포트 생성

---

## 🚀 운영 가이드

### 일일 체크포인트 흐름

```
08:00 → Vercel cron trigger
     ↓
API endpoint 실행 (pages/api/cron/checkpoint/08-00)
     ↓
checkpoint_logs 테이블 저장
     ↓
신뢰도 계산 + Telegram 알림 전송
     ↓
📊 CTB 자동 갱신 (View 통해)
```

### 신뢰도 목표
- **일일:** 95% 이상 (6개 중 5.7개 이상 완료)
- **월간:** 92% 이상
- **연간:** 90% 이상

### 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Telegram 알림 안 옴 | 환경변수 미설정 | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` 확인 |
| 체크포인트 레코드 없음 | DB 마이그레이션 미실행 | `db/31_checkpoint_logs_table.sql` 실행 |
| cron 미실행 | `CRON_SECRET` 불일치 | Vercel env와 코드 일치 확인 |
| 신뢰도 낮음 | 네트워크/타이밍 이슈 | 자동 복구 로직 실행 (24시간 내 만회) |

---

## 📊 대시보드 쿼리

### 오늘 신뢰도
```sql
SELECT date, reliability_percent, completed_count, total_checkpoints
FROM checkpoint_daily_reliability
WHERE date = CURRENT_DATE;
```

### 최근 7일 추이
```sql
SELECT date, reliability_percent
FROM checkpoint_daily_reliability
WHERE date >= CURRENT_DATE - 6
ORDER BY date DESC;
```

### 지연 체크포인트 조회
```sql
SELECT date, scheduled_time, actual_time, delay_minutes
FROM checkpoint_logs
WHERE status = 'delayed'
ORDER BY delay_minutes DESC
LIMIT 10;
```

---

## 📝 다음 단계 (Phase 3)

1. **자동 복구 강화**
   - 누락된 체크포인트 자동 감지
   - 24시간 내 만회 로직 추가

2. **CTB 정합성 검증**
   - 체크포인트 로그 vs active_work_tracking.md 일치도 확인
   - 불일치 시 자동 경고

3. **팀 대시보드 추가**
   - 실시간 신뢰도 대시보드 (웹 UI)
   - 월간 리포트 자동 생성

4. **알림 고도화**
   - Discord 연동 (팀 논의 기록)
   - 슬랙 옵션 추가

---

## 📞 지원

- **Git Hook 관련:** `scripts/git-hooks/commit-msg` 참고
- **Vercel 로그:** Dashboard > Functions > Cron > Logs
- **DB 쿼리:** Supabase Console > SQL Editor
- **Telegram 설정:** BotFather로 토큰 발급

---

**Created:** 2026-05-19 18:10 KST  
**Status:** ✅ Phase 1-2 완성 (GCS + Daily Checkpoint)  
**Next Review:** 2026-05-26 (1주일 뒤)
