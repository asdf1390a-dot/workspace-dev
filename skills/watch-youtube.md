---
name: Watch YouTube — 영상 학습 자료 추출
description: YouTube 영상 자막을 추출해서 Claude에 전달, 내용 분석 및 인사이트 도출
type: skill
---

# Watch YouTube — 자막 기반 학습 자료 추출

**목적:** YouTube 영상 → 자막 추출 → 분석 및 최적화 방안 제시

## 활용 패턴

1. **영상 링크 제공**
   - `https://youtu.be/{VIDEO_ID}`

2. **자막 추출 (선호 순서)**
   - ✅ yt-dlp + youtube-transcript-api (자동)
   - ✅ YouTube 공식 자막 다운로드 (수동)
   - ✅ Gems 사용 (텍스트 복사, 수동)

3. **내용 분석**
   - 기술 인사이트 추출
   - 코드 최적화 포인트 식별
   - 팀 학습 자료로 변환

## 저작권 및 제약사항

⚠️ **YouTube 저작권 정책:**
- 교육/강의 영상: 자막 추출 허용 (교육 목적)
- 음악/영화 클립: 저작권 제약 가능성
- 개인 채널 강좌: 대부분 자막 추출 가능

## 기술 스택

| 도구 | 목적 | 상태 |
|------|------|------|
| yt-dlp | 자막 다운로드 | ✅ 설치됨 |
| youtube-transcript-api | API 기반 추출 | ✅ 설치됨 (대체) |
| Gems (수동) | 브라우저 기반 | ✅ 사용 가능 |

## 사용 예시

**입력:**
```
https://youtu.be/fInMcawbKng
→ "Claude Code Dynamic Workflow | 낡아빠진 하네스는 다이어트가 필수!"
```

**출력:**
- ✅ 자막 텍스트
- ✅ 핵심 인사이트 (하네스 최적화)
- ✅ 코드 적용 방안

---

**마지막 업데이트:** 2026-06-05 02:18 KST
