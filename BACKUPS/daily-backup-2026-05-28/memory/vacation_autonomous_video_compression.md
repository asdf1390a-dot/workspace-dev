---
name: Vacation Video Compression Solution (2026-05-19)
description: 휴가 중 폰 환경에서 대용량 파일 처리를 위한 자동 압축 및 전송 방법 (2026-05-19)
type: project
originSessionId: c033fa2f-428e-4499-8e26-21a2456b559d
---
## 상황
- 사용자 휴가 기간: 2026-05-15~24
- 환경: 폰만 사용, 파일 다운로드 불가
- 요청: 편집된 Cartoon 필터 영상 (237MB) 전달 필요
- 제약: Telegram 100MB 제한, Google Drive API 인증 불가

## 문제
- 원본 편집 영상: 237MB (1280x720, 29.998fps)
- Telegram 업로드 실패: 413 Request Entity Too Large
- Supabase Storage 업로드 실패: 413 Payload Too Large
- Google Drive API: 사용자 인증 정보 없음

## 해결책
**OpenCV를 이용한 동적 비디오 압축**
- 도구: OpenCV (cv2.VideoCapture, cv2.VideoWriter)
- 설정: 해상도 480x270, FPS 15 (원본 29.998fps에서 50% 감소)
- 결과: 237MB → 16.6MB (93% 크기 감소)

## 구현 코드
```python
import cv2

INPUT = '/path/to/cartoon_filter_output.mp4'
OUTPUT = '/path/to/cartoon_final.mp4'

cap = cv2.VideoCapture(INPUT)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

new_width = 480
new_height = 270
new_fps = 15
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(OUTPUT, fourcc, new_fps, (new_width, new_height))

frame_count = 0
skip_frame = 2
while True:
    ret, frame = cap.read()
    if not ret:
        break
    if frame_count % skip_frame == 0:
        resized = cv2.resize(frame, (new_width, new_height))
        out.write(resized)
    frame_count += 1

cap.release()
out.release()
```

## 결과
- 최종 파일: `cartoon_final.mp4` (16.6MB)
- Telegram 전송 성공: messageId 5078
- 사용자에게 Telegram으로 전달 완료

## 왜 이 방법이 작동
1. **설치 필요 없음**: OpenCV는 이미 시스템에 설치되어 있음
2. **폰 환경 최적화**: 480x270 해상도는 폰 화면에 충분
3. **빠른 처리**: 프레임 스킵(skip_frame=2)으로 30초 내 완료
4. **Telegram 호환**: 16.6MB는 100MB 제한 안전하게 통과

## 다음 작업
- Google Drive API 인증 재검토 (사용자 동의 필요)
- 향후 휴가 기간: 항상 폰 환경 고려하여 Google Drive 링크 우선 제공
