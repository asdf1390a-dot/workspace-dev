---
name: Deployment reporting simplification
description: Simplify build/deployment status reports — skip technical details
type: feedback
originSessionId: f6040ec0-aec1-49b3-bcb7-d508c4ccde0d
---
**Rule:** 배포/빌드 상태 보고는 간단하게 요약 — 기술 세부사항 생략

**Why:** 사용자가 기술 디테일(빌드 로그, 커밋 목록, JS 파일 크기 등)을 이해할 수 없고 필요 없음. "무슨 내용인지도 모르는" 자세한 정보는 노이즈일 뿐.

**How to apply:** 
- ✅ 배포 완료 → "✅ 배포 완료" 한 줄
- ❌ 빌드 로그, 커밋 목록, 파일 크기, 프레임워크 버전 등 제외
- 필요시만 "에러 발생" 같은 상태 추가
