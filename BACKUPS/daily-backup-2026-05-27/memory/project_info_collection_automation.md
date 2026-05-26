---
name: GitHub/ProductHunt 정보 수집 자동화 설계
description: Project 2 — 매일 09:00 KST 자동 수집 + AI 필터링 (완료 목표 2026-05-27)
type: project
status: pending
targetDate: 2026-05-27
---

# Project 2: GitHub/ProductHunt 정보 수집 자동화 (2026-05-19)

## 📋 개요

**목표:** GitHub Trending, ProductHunt Daily를 매일 09:00 KST 수집하여 DSC 관련도가 높은 항목만 Telegram #정보채널 배포

**완료 기준:**
- ✅ GitHub API 통합 (별 4k+ 항목만)
- ✅ ProductHunt API 통합 (상위 20개)
- ✅ AI 필터링 (Claude API, 관련도 스코어)
- ✅ 중복 제거 (24h 윈도우)
- ✅ Telegram 배포 (필터링 결과만)
- ✅ 정확도 검증 (수동 평가 80% 이상)

---

## 🏗️ 아키텍처

```
┌──────────────────────────┐
│ Vercel Cron (09:00 KST)  │
│ POST /api/cron/info-collection/github-trending
│ POST /api/cron/info-collection/product-hunt
└────────────┬─────────────┘
             │
    ┌────────▼────────┐
    │ Data Collection │
    ├─ GitHub REST API
    ├─ ProductHunt GraphQL
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Deduplication   │
    │ (24h window)    │
    └────────┬────────┘
             │
    ┌────────▼────────────────┐
    │ AI Relevance Filter      │
    │ (Claude API)             │
    │ - "DSC 관련도" 평가      │
    │ - 점수화 (0.0 ~ 1.0)    │
    └────────┬────────────────┘
             │
    ┌────────▼────────────────┐
    │ Telegram Formatter       │
    │ - 제목 + 설명            │
    │ - 스타/업보트 수         │
    │ - 관련도 배지            │
    └────────┬────────────────┘
             │
    ┌────────▼────────────────┐
    │ Telegram Bot API         │
    │ - 메시지 발송            │
    │ - 스레드 reply 지원      │
    └────────┬────────────────┘
             │
    ┌────────▼────────────────┐
    │ Supabase Storage         │
    │ - info_collected 테이블  │
    │ - 실행 로그              │
    └─────────────────────────┘
```

---

## 📊 데이터 구조

### GitHub API (REST)

**엔드포인트:** `GET https://api.github.com/search/repositories`

**쿼리:**
```
q=stars:>=4000 created:>=2024-05-01 language:typescript OR language:python OR language:go
sort=stars
order=desc
per_page=30
```

**응답 (예):**
```json
{
  "total_count": 12345,
  "items": [
    {
      "id": 123456,
      "name": "awesome-dsc-fms",
      "full_name": "org/awesome-dsc-fms",
      "html_url": "https://github.com/org/awesome-dsc-fms",
      "description": "DSC Factory Management System",
      "stars": 4521,
      "forks": 312,
      "language": "TypeScript",
      "updated_at": "2026-05-23T10:45:00Z"
    }
  ]
}
```

### ProductHunt API (GraphQL)

**엔드포인트:** `https://api.producthunt.com/v2/graphql`

**쿼리:**
```graphql
{
  posts(first: 20, after: null) {
    edges {
      node {
        id
        name
        tagline
        description
        url
        votesCount
        thumbnail {
          url
        }
      }
    }
  }
}
```

**응답 (예):**
```json
{
  "data": {
    "posts": {
      "edges": [
        {
          "node": {
            "id": "aHR0...",
            "name": "DSC FMS Pro",
            "tagline": "AI-Powered Factory Management",
            "votesCount": 485,
            "url": "https://producthunt.com/posts/dsc-fms-pro"
          }
        }
      ]
    }
  }
}
```

### Supabase Schema

```sql
CREATE TABLE info_collected (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50),  -- 'github' | 'producthunt'
  external_id VARCHAR(255) UNIQUE,
  title VARCHAR(255),
  description TEXT,
  url VARCHAR(500),
  github_stars INTEGER,
  github_forks INTEGER,
  producthunt_votes INTEGER,
  language VARCHAR(50),
  relevance_score FLOAT,  -- 0.0 ~ 1.0 (Claude AI)
  relevance_category VARCHAR(50),  -- 'exact' | 'related' | 'peripheral'
  collected_at TIMESTAMP DEFAULT NOW(),
  collected_by VARCHAR(50) DEFAULT 'cron:info-collection',
  telegram_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP
);

CREATE INDEX idx_source_collected_at ON info_collected(source, collected_at DESC);
CREATE INDEX idx_relevance_score ON info_collected(relevance_score DESC);
CREATE UNIQUE INDEX idx_dedup_24h ON info_collected(source, external_id)
  WHERE collected_at > NOW() - INTERVAL '24 hours';
```

---

## 💻 구현 상세

### 1. API 엔드포인트

#### GitHub Trending
```http
POST /api/cron/info-collection/github-trending HTTP/1.1
Authorization: Bearer <CRON_SECRET>
```

**응답 (예):**
```json
{
  "status": 200,
  "source": "github",
  "collected": 8,
  "filtered": 2,
  "filterPercentage": 25,
  "items": [
    {
      "title": "awesome-dsc-fms",
      "relevance": 0.92,
      "category": "exact",
      "stars": 4521,
      "url": "https://github.com/org/awesome-dsc-fms"
    }
  ],
  "telegramSent": true
}
```

#### ProductHunt Daily
```http
POST /api/cron/info-collection/product-hunt HTTP/1.1
Authorization: Bearer <CRON_SECRET>
```

### 2. 파일 구조

```
app/api/cron/info-collection/
├── github-trending/
│   └── route.ts                     # GitHub 크론
├── product-hunt/
│   └── route.ts                     # ProductHunt 크론
lib/info-collection/
├── github-scraper.ts                # GitHub API 통합
├── product-hunt-scraper.ts          # ProductHunt API 통합
├── ai-filter.ts                     # Claude AI 필터링
├── deduplication.ts                 # 중복 제거
├── telegram-formatter.ts            # Telegram 포맷팅
└── types.ts

db/migrations/
└── 004_info_collection_schema.sql
```

### 3. AI 필터링 로직

**Claude API 프롬프트:**
```
당신은 제조업 AI 전문가입니다. 아래 GitHub/ProductHunt 항목을 평가하세요.

컨텍스트:
- DSC Mannur: 자동차 부품 제조 공장 (인도 Chennai)
- 관심 분야: ERP, IoT, 제조관리, 품질관리, 재고관리, AI/ML
- 언어: English OK, 한글 우선

항목: {title}
설명: {description}
저장소/링크: {url}

평가:
1. 관련도 점수 (0.0 ~ 1.0): ?
2. 카테고리 (exact/related/peripheral): ?
3. 이유: ?

응답 JSON 형식:
{
  "relevance_score": 0.85,
  "category": "related",
  "reason": "제조업 ERP 자동화 관련"
}
```

**필터링 규칙:**
```typescript
// lib/info-collection/ai-filter.ts
export async function filterByRelevance(
  items: GitHubItem[],
  minScore: number = 0.6
): Promise<FilteredItem[]> {
  const filtered: FilteredItem[] = [];

  for (const item of items) {
    const score = await evaluateRelevanceWithClaude(item);
    if (score >= minScore) {
      filtered.push({ ...item, relevance_score: score });
    }
  }

  return filtered.sort((a, b) => b.relevance_score - a.relevance_score);
}
```

---

## 🧪 테스트 계획

### Manual Evaluation (Day 5)
- [ ] GitHub 항목 10개 샘플 평가 (관련도 정확도 확인)
- [ ] ProductHunt 항목 5개 샘플 평가
- [ ] 거짓양성(False Positive) 검토 (예: 무관한 항목 필터됨)
- [ ] 거짓음성(False Negative) 검토 (예: 관련된 항목 탈락)

### Success Criteria
- **필터링 정확도:** > 80% (Evaluator AI Agent 판정)
- **중복 제거:** 100% (Supabase 제약 확인)
- **응답시간:** < 60초/소스

---

## 📈 Telegram 메시지 포맷

```
🔍 Info Collection Daily
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 2026-05-23 | 09:00 수집

📚 GitHub Trending (2/8 필터됨)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ awesome-dsc-fms
   ⭐ 4,521 | 🔗 Fork 312
   🎯 관련도 0.92 (최적)
   제조업 ERP/IoT 자동화
   https://github.com/org/awesome-dsc-fms

2️⃣ manufacturing-ai-platform
   ⭐ 3,200 | 🔗 Fork 189
   🎯 관련도 0.78 (높음)
   AI 기반 생산 최적화
   https://github.com/...

🛍️ ProductHunt Daily (0/20 필터됨)
   (관련 항목 없음)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**구현 우선순위:**
1. GitHub API 통합 (Day 3)
2. AI 필터 (Claude API) (Day 4)
3. ProductHunt API (Day 4)
4. 통합 테스트 (Day 5)
5. Vercel Cron 배포 (Day 5)

**참고:** GitHub Token 필요 (ghp_...), ProductHunt API는 공개
