# Memory-P2: 메모리 자동화 시스템

## 개요

Memory-P2는 메모리 시스템의 자동 인덱싱, 캐싱, 동기화를 관리하는 포괄적인 자동화 프레임워크입니다.

**목표:**
- 📑 **자동 인덱싱**: MEMORY.md를 분석하고 JSON 인덱스로 변환
- 💾 **캐싱 계층**: LRU + TTL 캐시로 빠른 조회
- 🔄 **자동 동기화**: 메모리 변경 시 CTB(현황판) 자동 업데이트
- 🧹 **자동 정리**: 오래된 파일/중복 항목 자동 삭제
- 📊 **모니터링**: 시스템 건강 상태 실시간 추적

---

## 아키텍처

### 4개 핵심 컴포넌트

```
┌─────────────────────────────────────────────────────────────┐
│                   Memory Automation System                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣  memory-indexer.js                                      │
│      └─ MEMORY.md 파싱 → JSON 인덱스 생성                    │
│      └─ LRU 캐시 (15분 TTL)                                 │
│      └─ 중복 감지 & 오래된 항목 표시                         │
│                                                              │
│  2️⃣  memory-sync-manager.js                                 │
│      └─ 메모리 변경 감지 (MD5 해시)                         │
│      └─ CTB 상태 원자적 업데이트                            │
│      └─ 재시도 로직 (최대 3회)                              │
│                                                              │
│  3️⃣  memory-auto-cleanup.js (기존)                          │
│      └─ 30일 이상 오래된 항목 아카이브                      │
│      └─ 7일 이상 오래된 파일 삭제                           │
│      └─ 3일 이상 오래된 백업 삭제                           │
│                                                              │
│  4️⃣  memory-health-monitor.js                               │
│      └─ 캐시 성능 (Hit Rate)                               │
│      └─ 인덱스 신선도 (1시간 이내)                          │
│      └─ 저장소 크기 (100MB 이하)                            │
│      └─ 동기화 신뢰도 (95% 이상)                            │
│      └─ 전체 점수 (0-100)                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

         ↓ 5분마다 실행 ↓

┌─────────────────────────────────────────────────────────────┐
│              CTB (Current Task Board) 업데이트               │
│              .ctb-state.json (원자적 쓰기)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 파일 구조

```
memory/
├── MEMORY.md                          # 메인 메모리 문서
├── memory-indexer.js                  # 인덱싱 엔진
├── memory-sync-manager.js             # CTB 동기화 관리
├── memory-health-monitor.js           # 건강 상태 모니터링
├── MEMORY_AUTOMATION_SYSTEM.md        # 이 문서
│
├── collected/                         # 자동 생성 (수집 결과)
│   ├── memory_index.json             # JSON 형식 인덱스
│   ├── memory_cache.json             # LRU 캐시 상태
│   ├── memory_metadata.json          # 인덱싱 메타데이터
│   ├── sync_state.json               # 동기화 상태
│   ├── sync_history.jsonl            # 동기화 히스토리 (JSONL)
│   └── health_report_*.json          # 주기적 건강 리포트
│
├── archive/                           # 아카이브 (30일 이상 오래된 항목)
│   ├── stale_archive_*.json
│   └── memory_snapshot_YYYY-MM.json
│
├── backups/                           # 백업
│   └── MEMORY_*.md.bak
│
└── logs/                              # 로그
    ├── ctb-auto-update.log
    ├── ctb-polling-commit.log
    └── memory-auto-cleanup.log
```

---

## 실행 흐름 (5분 주기)

### 1단계: Indexing (0초)

```bash
node memory/memory-indexer.js
```

**작업:**
- MEMORY.md 파싱 (마크다운 → JSON)
- 카테고리별 분류 (user, feedback, project, reference, incident, archive)
- 중복 감지 (title+link 시그니처)
- 오래된 항목 표시 (30일 이상)
- LRU 캐시 업데이트 (크기: 1000 항목, TTL: 15분)

**출력:**
- `collected/memory_index.json` — 구조화된 인덱스
- `collected/memory_cache.json` — 캐시 상태
- `collected/memory_metadata.json` — 통계

**성능:**
- 평균 처리 시간: <100ms
- 캐시 Hit Rate: 목표 ≥70%

---

### 2단계: Synchronization (1분)

```bash
node memory/memory-sync-manager.js once
```

**작업:**
- 메모리 파일 MD5 해시 비교
- 변경 감지 → 인덱서 실행
- 메트릭 계산 (총 항목수, 카테고리수, 중복율, 오래된 비율)
- CTB 상태 파일 원자적 업데이트
- 동기화 히스토리 기록 (JSONL)

**재시도 로직:**
- 실패 시 지수 백오프: 1초, 2초, 4초 (최대 3회)
- 각 실패를 로그와 히스토리에 기록

**출력:**
- `.ctb-state.json` — 원자적 쓰기 (원본 파일 보존)
- `collected/sync_state.json` — 동기화 상태
- `collected/sync_history.jsonl` — 히스토리 추가

**신뢰도:**
- 목표 Success Rate: ≥95%

---

### 3단계: Cleanup (2분)

```bash
node crons/memory-auto-cleanup.js
```

**작업:**
- 인덱서 실행 (변경 재확인)
- 중복 항목 감지 & 리포트
- 30일 이상 오래된 항목 아카이브
- 7일 이상 오래된 수집 파일 삭제
- 3일 이상 오래된 백업 삭제
- 월간 스냅샷 생성
- 정리 리포트 작성

**출력:**
- `archive/stale_archive_*.json` — 아카이브된 항목
- `archive/memory_snapshot_YYYY-MM.json` — 월간 스냅샷
- `collected/cleanup_report_*.json` — 정리 통계

---

### 4단계: Health Check (3분)

```bash
node memory/memory-health-monitor.js
```

**모니터링 항목:**
1. **Index Freshness** — 1시간 이내 최신화
2. **Cache Performance** — Hit Rate ≥70%
3. **Index Quality** — 중복율 <5%, 오래된 비율 <30%
4. **Storage** — 총 크기 <100MB
5. **Sync Reliability** — Success Rate ≥95%
6. **Queue Depth** — Pending <100

**Health Score:** 
- 0-100 점 (6개 항목 점수 평균)
- ≥90: 건강 (🟢)
- 70-89: 약간 저하 (🟡)
- <70: 건강하지 못함 (🔴)

**출력:**
- 콘솔 리포트 (스크린에 표시)
- `collected/health_report_*.json` — JSON 저장

---

### 5단계: Git Commit (4분, 존재하는 경우)

```bash
bash memory-automation/ctb-polling-commit.sh
```

**작업:**
- CTB 상태 파일 변경 감지
- 한글 커밋 메시지 생성
  ```
  chore(ctb): 폴링 사이클 1018 @ 17:19 KST (2026년 06월 09일) — 완벽한 안정성 유지. 
  시스템 진행률: 100% | Phase2A=ready | Phase2B=ready | Phase2C=ready | 프로덕션=OK | 블로커=0
  ```
- Git에 커밋

**규칙:**
- 100% 한글 (상태 표현, 통계)
- 영어 프로젝트명 유지 가능 (AUDIT, DISCORD-BOT 등)
- 변경 없으면 스킵

---

## 사용법

### 전체 파이프라인 실행

```bash
cd /home/jeepney/.openclaw/workspace-dev

# 1. 인덱싱
node memory/memory-indexer.js

# 2. 동기화
node memory/memory-sync-manager.js once

# 3. 정리
node crons/memory-auto-cleanup.js

# 4. 건강 상태 체크
node memory/memory-health-monitor.js
```

### 단일 명령어 (권장)

```bash
# 한 번 실행
node memory/memory-sync-manager.js once

# 통계 확인
node memory/memory-sync-manager.js stats

# 건강 상태 (JSON)
node memory/memory-health-monitor.js json

# 건강 상태 (저장)
node memory/memory-health-monitor.js save
```

### 데몬 모드 (백그라운드)

```bash
# 5분 주기 지속 실행
node memory/memory-sync-manager.js daemon

# 또는 cron으로 스케줄:
*/5 * * * * cd /home/jeepney/.openclaw/workspace-dev && node memory/memory-sync-manager.js once >> memory/logs/memory-sync.log 2>&1
```

---

## 데이터 구조

### memory_index.json

```json
{
  "categories": {
    "user": [1, 2, 3],
    "feedback": [4, 5, 6],
    "project": [7, 8],
    "reference": [],
    "incident": [],
    "archive": []
  },
  "entries": [
    {
      "id": 1,
      "title": "Core Autonomous Operation",
      "link": "feedback_core_autonomous_operation.md",
      "category": "feedback",
      "timestamp": "2026-06-09",
      "lineNumber": 5,
      "preview": "- [⭐ Core Autonomous Operation]...",
      "hash": "abc123def456...",
      "isDuplicate": false,
      "isStale": false
    },
    ...
  ],
  "metadata": {
    "lastIndexed": "2026-06-09T08:26:02.507Z",
    "memoryHash": "090bd5ec624ec6ef1144e0487e3a8bfd",
    "indexVersion": 1,
    "cacheHits": 125,
    "cacheMisses": 35,
    "duplicatesDetected": 2,
    "staleEntriesCount": 5
  }
}
```

### memory_cache.json

```json
{
  "entries": [
    {
      "key": "category:feedback",
      "value": {
        "entries": [...],
        "count": 12
      },
      "timestamp": 1780992302117
    },
    ...
  ],
  "metadata": {
    "lastIndexed": "2026-06-09T08:26:02.507Z",
    "cacheHits": 125,
    "cacheMisses": 35
  }
}
```

### sync_history.jsonl (한 줄에 하나씩)

```json
{"timestamp":"2026-06-09T08:20:01.915Z","status":"success","syncCount":42,"metrics":{...},"attempt":1}
{"timestamp":"2026-06-09T08:25:01.543Z","status":"failed","error":"CTB update failed","attempt":1,"failureCount":1}
{"timestamp":"2026-06-09T08:30:01.200Z","status":"success","syncCount":43,"metrics":{...},"attempt":1}
```

---

## 에러 처리 & 복구

### 인덱싱 실패

**증상:** `collected/memory_index.json` 생성 안 됨

**원인:**
- MEMORY.md 문법 오류
- 파일 시스템 권한 문제
- 메모리 부족

**복구:**
1. `MEMORY.md` 검증 (마크다운 문법)
2. 권한 확인: `chmod 755 memory/`
3. 디스크 공간 확인: `df -h`

---

### 동기화 실패 (3회 재시도 후)

**증상:** 
- `.ctb-state.json` 미업데이트
- `collected/sync_state.json`에 `lastError` 기록

**원인:**
- CTB 파일 잠금 (다른 프로세스가 쓰는 중)
- 파일 시스템 읽기 전용
- 인덱서 연쇄 실패

**복구:**
```bash
# 1. 동기화 상태 확인
node memory/memory-sync-manager.js stats

# 2. 에러 로그 확인
cat memory/logs/memory-sync.log

# 3. 수동 동기화
node memory/memory-sync-manager.js once

# 4. 건강 상태 체크
node memory/memory-health-monitor.js
```

---

### 캐시 Hit Rate 저하

**증상:** Health Monitor에서 "cache: ❌"

**원인:**
- TTL (15분)이 자주 만료됨
- 조회 패턴이 예측 불가능
- 캐시 크기 제한 (1000)에 도달

**복구:**
```bash
# 1. 캐시 통계 확인
cat memory/collected/memory_cache.json | jq .metadata

# 2. 캐시 강제 재생성
rm memory/collected/memory_cache.json
node memory/memory-indexer.js

# 3. TTL 조정 (설정)
# memory/memory-indexer.js의 CACHE_TTL_MS 수정 (기본 15분)
```

---

## 성능 최적화

### 1. 인덱싱 속도

| 크기 | 시간 |
|------|------|
| 100 항목 | <50ms |
| 1000 항목 | 100-150ms |
| 5000 항목 | 300-500ms |

**최적화 팁:**
- MEMORY.md를 섹션별로 분리 (너무 많으면 Archive로 이동)
- Stale 항목 정기적으로 아카이브 (30일)

### 2. 동기화 속도

| 항목 | 시간 |
|------|------|
| 변경 감지 | <10ms |
| 인덱싱 | <100ms |
| 메트릭 계산 | <20ms |
| CTB 업데이트 | <50ms |
| **총계** | **<180ms** |

**최적화 팁:**
- 원자적 쓰기로 파일 일관성 보장
- 재시도 로직이 대기 시간 증가 (지수 백오프)

### 3. 캐시 효율성

**Hit Rate 개선:**
- 자주 조회하는 카테고리 먼저 캐시
- LRU 기반 자동 제거 (최근 미사용)
- TTL 15분 (업데이트 주기와 동기화)

---

## 모니터링 대시보드

### 실시간 상태 확인

```bash
# 건강 상태 (보기 좋게)
node memory/memory-health-monitor.js

# 동기화 통계
node memory/memory-sync-manager.js stats

# 인덱스 요약
node memory/memory-indexer.js 2>&1 | grep "Summary" -A 10

# 수집 디렉토리 상태
ls -lh memory/collected/
du -sh memory/
```

### 주기적 리포트

```bash
# 일일 리포트 (07:00 KST)
0 7 * * * cd /home/jeepney/.openclaw/workspace-dev && node memory/memory-health-monitor.js save >> memory/logs/health.log 2>&1

# 주간 정리 (월요일 00:00 KST)
0 0 * * 1 cd /home/jeepney/.openclaw/workspace-dev && node crons/memory-auto-cleanup.js >> memory/logs/cleanup.log 2>&1

# 월간 정리 (1일 00:00 KST)
0 0 1 * * cd /home/jeepney/.openclaw/workspace-dev && node crons/memory-auto-cleanup.js >> memory/logs/monthly-cleanup.log 2>&1
```

---

## 트러블슈팅

### Q1. 메모리 시스템이 작동하는지 확인하려면?

```bash
# 1. 파일 존재 확인
test -f memory/MEMORY.md && echo "✅ MEMORY.md exists" || echo "❌ Not found"
test -f memory/collected/memory_index.json && echo "✅ Index exists" || echo "❌ Index not found"

# 2. 최신 상태 확인
stat memory/collected/memory_index.json | grep Modify

# 3. 건강 상태
node memory/memory-health-monitor.js | head -20
```

### Q2. 캐시를 초기화하려면?

```bash
# 캐시만 초기화
rm memory/collected/memory_cache.json

# 전체 수집 디렉토리 초기화 (주의!)
rm -rf memory/collected/*
rm memory/collected/memory_index.json memory/collected/memory_cache.json memory/collected/memory_metadata.json

# 재실행
node memory/memory-indexer.js
```

### Q3. 동기화가 실패하면?

```bash
# 1. 에러 확인
cat memory/logs/memory-sync.log | tail -20

# 2. 수동 동기화 시도
node memory/memory-sync-manager.js once

# 3. 상태 확인
node memory/memory-sync-manager.js stats

# 4. CTB 파일 권한 확인
ls -l .ctb-state.json
chmod 644 .ctb-state.json
```

---

## 통합 & 배포

### Cron 설정

```bash
# 5분마다 전체 파이프라인 실행
*/5 * * * * cd /home/jeepney/.openclaw/workspace-dev && (node memory/memory-indexer.js && node memory/memory-sync-manager.js once && node crons/memory-auto-cleanup.js) >> memory/logs/pipeline.log 2>&1

# 또는 간단히 (동기화만)
*/5 * * * * cd /home/jeepney/.openclaw/workspace-dev && node memory/memory-sync-manager.js once >> memory/logs/memory-sync.log 2>&1
```

### CI/CD 통합

```yaml
# .github/workflows/memory-automation.yml
name: Memory Automation
on:
  push:
    paths: ['memory/MEMORY.md']
  schedule:
    - cron: '*/5 * * * *'

jobs:
  memory-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd memory && npm install
      - run: node memory-indexer.js
      - run: node memory-sync-manager.js once
      - run: node memory-health-monitor.js json
      - uses: actions/upload-artifact@v3
        with:
          name: health-reports
          path: memory/collected/health_report_*.json
```

---

## 참고 사항

1. **원자성**: CTB 업데이트는 임시 파일로 쓰고 `rename`으로 원자적 이동
2. **재시도**: 지수 백오프 (1s, 2s, 4s) 최대 3회
3. **로깅**: 모든 작업을 JSONL 형식 히스토리에 기록
4. **정리**: 30일 이상 stale 항목은 자동 아카이브
5. **캐싱**: LRU + TTL로 성능과 신선도 균형

---

**마지막 업데이트**: 2026-06-09 17:20 KST  
**버전**: Memory-P2 v1.0  
**상태**: ✅ Production Ready
