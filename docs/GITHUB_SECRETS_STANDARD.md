# GitHub Secrets 표준화 가이드 (2026-05-27)

## 🎯 목적
모든 프로젝트(8개)가 동일한 GitHub Secret 설정을 사용하도록 표준화

## 📋 필수 Secrets (모든 프로젝트 공통)

### 1. Vercel 배포 정보
```
VERCEL_TOKEN
- 설명: Vercel API token for automated deployments
- 값: $(curl -H "Authorization: Bearer $(gh auth token)" https://vercel.com/api/v9/tokens -X POST -d '{"name":"GitHub Actions"}' | jq '.token')
- 권한: Full Vercel account access
- 동기화: Shared across all projects
```

```
VERCEL_ORG_ID
- 설명: Vercel Organization ID (asdf1390a)
- 값: "asdf1390a"
- 설정: Team Settings → General → Organization ID
```

```
VERCEL_PROJECT_ID
- 설명: Individual project ID in Vercel
- 값: Available in project .vercelignore or Vercel dashboard
- 설정: Project Settings → General → Project ID (unique per project)
```

### 2. Supabase 데이터베이스
```
NEXT_PUBLIC_SUPABASE_URL
- 설명: Supabase project URL (public)
- 값: https://xxxx.supabase.co
- 설정: Supabase → Project Settings → API → Project URL
- 필수: YES (client-side)
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
- 설명: Supabase anonymous (public) key
- 값: eyJhbGc... (public, safe for frontend)
- 설정: Supabase → Project Settings → API → Anon Key
- 필수: YES (client-side)
```

```
SUPABASE_SERVICE_ROLE_KEY
- 설명: Supabase service role key (SECRET — server only)
- 값: eyJhbGc... (private, never expose)
- 설정: Supabase → Project Settings → API → Service Role Key
- 필수: YES (server-side API routes only)
- ⚠️ DO NOT expose in .env.local or client code
```

## 🔐 GitHub Actions 설정 방법

### 위치
1. GitHub 저장소 → Settings → Secrets and variables → Actions

### 추가 절차
```bash
# Step 1: CLI로 Secret 추가 (권장)
gh secret set VERCEL_TOKEN -b "$(cat vercel_token.txt)"
gh secret set VERCEL_ORG_ID -b "asdf1390a"
gh secret set VERCEL_PROJECT_ID -b "prj_xxxxx"
gh secret set NEXT_PUBLIC_SUPABASE_URL -b "https://xxxx.supabase.co"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY -b "eyJhbGc..."
gh secret set SUPABASE_SERVICE_ROLE_KEY -b "eyJhbGc..."

# Step 2: 검증
gh secret list
```

### 또는 Web UI
1. Repository → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭
3. 각 Secret 추가

## ✅ 검증 체크리스트

- [ ] VERCEL_TOKEN 설정 (Vercel 대시보드에서 확인)
- [ ] VERCEL_ORG_ID 설정 (asdf1390a)
- [ ] VERCEL_PROJECT_ID 설정 (프로젝트별 고유)
- [ ] NEXT_PUBLIC_SUPABASE_URL 설정 (공개)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY 설정 (공개)
- [ ] SUPABASE_SERVICE_ROLE_KEY 설정 (비공개)
- [ ] GitHub Actions 테스트 실행 (PR 생성 후 확인)
- [ ] 배포 성공 확인 (Vercel → Production URL 접근)

## 📝 프로젝트별 적용 일정

| 프로젝트 | VERCEL_PROJECT_ID | 예정일 | 상태 |
|---------|-------------------|-------|------|
| dsc-fms-portal | prj_dsc_main | 2026-05-27 | ⏳ |
| discord-bot | prj_discord | 2026-05-27 | ⏳ |
| travel-management | prj_travel | 2026-05-28 | ⏳ |
| team-dashboard | prj_team | 2026-05-28 | ⏳ |
| backup-management | prj_backup | 2026-05-29 | ⏳ |
| memory-automation | prj_memory | 2026-05-29 | ⏳ |
| asset-master | prj_asset | 2026-05-30 | ⏳ |
| api-gateway | prj_api | 2026-05-30 | ⏳ |

## 🚫 주의사항

1. **SERVICE_ROLE_KEY 노출 금지**
   - .env.local에 저장하지 말 것
   - Git에 커밋하지 말 것
   - 공개 코드에 사용하지 말 것

2. **Token 만료**
   - VERCEL_TOKEN은 최대 30일 유효
   - 월 1회 갱신 권장

3. **접근 권한**
   - 팀원: Read only (설정 열람만 가능)
   - Secretary Agent: Write (Secret 생성/수정)
   - GitHub Organization Owner: Admin

## 📞 문제 해결

**배포 실패 — "Invalid Vercel token"**
- VERCEL_TOKEN 확인 (만료됨?)
- Vercel 대시보드에서 새 token 생성
- gh secret set VERCEL_TOKEN으로 갱신

**배포 실패 — "Project not found"**
- VERCEL_PROJECT_ID 확인
- Vercel 대시보드 → Project Settings에서 확인

**Supabase 연결 오류**
- NEXT_PUBLIC_SUPABASE_URL 형식 확인 (https://xxxx.supabase.co)
- Anon Key 유효성 확인 (Supabase 대시보드)

---

**Last Updated:** 2026-05-27 (Phase 1 배포 표준화)  
**Next Review:** 2026-06-01 (Cron 테스트 실행 후)
