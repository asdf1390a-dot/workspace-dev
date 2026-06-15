---
name: CTB 폴링 상태 (2026-06-15 14:35 KST)
description: Vercel 배포 상태 확인 — 주 배포 정상, 커스텀 도메인 DNS 타임아웃
type: project
---

# CTB 폴링 상태 (2026-06-15 14:35 KST)

## 📊 현황 요약

| 항목 | 상태 | 상세 |
|------|------|------|
| **Vercel 주 배포** | ✅ HTTP 200 | dsc-fms-portal.vercel.app 정상 응답 |
| **Health 엔드포인트** | ✅ OK | `{"status":"ok",...}` 반환 확인 |
| **커스텀 도메인 (4개)** | 🔴 TIMEOUT | fms-audit, fms-discord, fms-travel, fms-bm 모두 HTTP 000 |
| **신뢰도** | 🟡 50% | 주 배포 OK, 커스텀 도메인 차단 |
| **블로커** | 1건 | DNS/네트워크 설정 재검증 필요 |

## 🔍 상세 검증 결과

### ✅ Vercel 배포 정상 (HTTP 200)
```
curl -I https://dsc-fms-portal.vercel.app/
→ HTTP/2 200 OK
```

### ✅ Health 엔드포인트 응답 정상
```
curl https://dsc-fms-portal.vercel.app/api/health
→ {"status":"ok","timestamp":"2026-06-15T05:36:42.539Z","version":"1.0.0"}
```

### 🔴 커스텀 도메인 타임아웃 (모두 HTTP 000)
```
AUDIT-P1:      https://fms-audit.dsc-in.com/      → HTTP 000 TIMEOUT
DISCORD-BOT:   https://fms-discord.dsc-in.com/    → HTTP 000 TIMEOUT
TRAVEL-P2-UI:  https://fms-travel.dsc-in.com/     → HTTP 000 TIMEOUT
BM-P1:         https://fms-bm.dsc-in.com/         → HTTP 000 TIMEOUT
```

## 🎯 근본 원인 분석

**상황:**
- 주 Vercel 배포(dsc-fms-portal.vercel.app)는 건강함
- 커스텀 도메인을 통한 접근은 모두 타임아웃

**가능성:**
1. **DNS 설정 문제** — 커스텀 도메인 DNS 레코드가 더 이상 유효하지 않거나 잘못된 IP를 가리킴
2. **CDN/로드밸런서 설정** — Cloudflare 등 CDN 서비스의 설정 오류
3. **네트워크 접근** — 방화벽/지역 제한으로 이 네트워크에서 dsc-in.com 도메인 접근 불가
4. **Vercel 도메인 설정** — 프로젝트의 커스텀 도메인 바인딩이 해제됨

## ✅ 권장 조치 (사용자 액션)

### 1️⃣ DNS 설정 검증
```
$ nslookup fms-audit.dsc-in.com
$ dig fms-audit.dsc-in.com
```
→ 올바른 IP/CNAME이 반환되는지 확인

### 2️⃣ Vercel 프로젝트 설정 확인
- Vercel 대시보드 → dsc-fms-portal 프로젝트 → Settings → Domains
- 4개 커스텀 도메인이 여전히 바인딩되어 있는지 확인
- 필요시 CNAME 레코드 재설정 (보통 `cname.vercel-dns.com`)

### 3️⃣ CDN 서비스 확인 (Cloudflare 등 사용 중인 경우)
- 현재 프록시 상태 확인
- DNS 레코드 재확인

## 📋 결론

**주 배포는 정상이지만 커스텀 도메인이 DNS 문제로 인해 차단된 상태.**

**긴급도:** 🟡 중간 (주 Vercel URL로는 접근 가능하지만, 설정된 도메인을 통한 접근 불가)

**다음 단계:**
1. DNS 설정 재확인
2. Vercel 프로젝트 도메인 설정 검증
3. CDN 설정 확인 (필요시)

---

**검증 시간:** 2026-06-15 14:35:42 KST
**검증자:** CTB Auto-Polling System
