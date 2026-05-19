---
name: Travel Management 바우처 자동 파싱 설계
description: PDF 여행바우처 자동 분석, 이벤트 변환, 파싱 로직, 다국어 지원
type: project
relatedFiles: dsc-fms-portal/TRAVEL_MANAGEMENT_PHASE2_VOUCHER_PARSING_DESIGN.md
originSessionId: 54ff14a1-52a1-46c3-a629-411bcd6f7a7c
---
# Travel Management Phase 2 — 바우처 자동 파싱 설계

**상태:** 플레너 설계 완료 (웹개발자 구현 대기)  
**작성일:** 2026-05-14  
**목표:** 여행 바우처 PDF → Travel Management 이벤트 자동 변환

## 기능 개요

사용자가 여행사/플랫폼에서 받은 **바우처 PDF**를 일괄 업로드하면:

1. **PDF 텍스트 추출** → 구조화된 데이터
2. **활동 정보 식별** → 날짜·시간·활동명·위치·인원·금액
3. **자동 이벤트 생성** → travel_events 테이블에 INSERT
4. **사용자 확인** → 파싱 결과 미리보기 → 수동 보정 가능
5. **확정 등록** → 여러 이벤트 한 번에 캘린더 반영

**해결하는 문제:**
- 수동: 바우처 9장을 일일이 열어 날짜·시간·장소를 옮겨 적음 → 누락·오타 위험
- 자동: 9개 PDF 업로드 → 시스템 자동 추출 → 확인만 (입력 시간: 30분 → 2분)

## 핵심 기능

| 기능 | 설명 | 우선순위 |
|-----|------|--------|
| **PDF 업로드** | 멀티 파일 드래그앤드롭, 최대 20MB/파일, 50개/배치 | P0 |
| **자동 파싱** | 텍스트 추출 → 활동 정보 구조화 | P0 |
| **결과 미리보기** | 추출 데이터를 테이블로 확인 | P0 |
| **수동 보정** | 잘못 추출된 필드 수정 후 확정 | P0 |
| **이벤트 자동 생성** | Phase 1 travel_events API 호출 | P0 |
| **바우처 원본 보존** | travel_documents에 PDF 저장, voucher_id 연결 | P1 |
| **중복 감지** | 같은 날짜·시간·활동의 중복 경고 | P1 |
| **다국어 지원** | 영어/베트남어/한국어/일본어 텍스트 처리 | P2 |
| **재파싱** | 파싱 실패 PDF 재시도, 일괄 재처리 | P2 |

## 기술 스택

| 구성 요소 | 선택 | 비고 |
|----------|------|-----|
| **PDF 라이브러리** | `pdf-parse` (Node.js 서버 사이드) | 텍스트만 추출 — 빠르고 가벼움 |
| **백업 라이브러리** | `pdfjs-dist` | 텍스트 추출 실패 시 fallback |
| **OCR** | `tesseract.js` (선택) | 이미지 기반 PDF 마지막 수단 |
| **파싱 방식** | 정규표현식 + 휴리스틱 + 키워드 매칭 | LLM 미사용 (비용·지연·정확도) |
| **저장소** | Supabase Storage (travel-documents 버킷) | Phase 1과 동일 |
| **DB** | PostgreSQL (travel_vouchers 신규 테이블) | Phase 1 스키마 확장 |
| **언어 감지** | `franc-min` 또는 키워드 기반 휴리스틱 | 가벼운 옵션 |

## 비기능 요구사항

| 항목 | 목표치 |
|-----|-------|
| **파싱 정확도** | 텍스트 PDF: ≥90% (날짜·시간·활동명) |
| **처리 속도** | 단일 PDF (1-2 페이지): ≤3초 |
| **배치 처리** | 9개 PDF 동시 업로드: ≤30초 |
| **파일 크기 제한** | 단일 20MB, 배치 100MB |
| **언어 지원** | 영어·베트남어 (1차), 한국어·일본어 (2차) |
| **백업** | 원본 PDF는 무조건 Storage 저장 (감사용) |

## UI/UX 워크플로우 (4단계)

**진입점:** Travel Detail → Tab 2: Schedule 또는 Tab 5: Documents

### Step 1: 업로드
- 사용자: 9개 PDF 드래그
- 시스템: 파일 검증 (크기, 타입)
- 유효성 검사: MIME type application/pdf, ≤20MB/파일

### Step 2: 파싱
- PDF → 텍스트 추출 (pdf-parse)
- 정규표현식 + 휴리스틱으로 활동 정보 추출
- 추출 필드: title, event_type, event_date, event_time, location, amount
- 반환: 파싱 완료 또는 실패 상태

### Step 3: 미리보기
- 추출된 이벤트 테이블 표시
- 각 행: 활동명, 날짜, 시간, 위치, 금액, 파싱 신뢰도
- 편집 기능: 필드 수정, 행 선택/해제, 중복 감지 경고

### Step 4: 확정
- 사용자 "확정" 클릭
- travel_events API 호출 (배치 또는 개별)
- 원본 PDF를 travel_documents에 저장
- travel_vouchers 테이블 기록 (메타데이터)
- 캘린더에 즉시 반영

## 파싱 로직 (정규표현식 + 휴리스틱)

**추출할 필드:**
```
title: string          # 활동명 (예: "항공권 ORD→ICN")
event_type: enum       # flight|hotel|meal|transport|other
event_date: YYYY-MM-DD
event_time: HH:MM      # 없을 수 있음
location: string       # 도시/공항 코드
amount: number         # KRW 기준
currency: string       # KRW|USD|VND 등
```

**언어별 키워드 패턴 (예시):**
```
English:
- "Flight" → event_type: flight
- "Hotel/Accommodation" → event_type: hotel
- "Meal/Dinner" → event_type: meal

Korean (한국어):
- "항공권/비행기" → event_type: flight
- "숙박/호텔" → event_type: hotel
- "식사" → event_type: meal

Vietnamese (베트남어):
- "Chuyến bay" → event_type: flight
- "Khách sạn" → event_type: hotel
```

**날짜 정규표현식 (예시):**
```
\d{4}-\d{2}-\d{2}                    # 2026-05-15
\d{2}/\d{2}/\d{4}                    # 15/05/2026
(Jan|Feb|...)\s+\d{1,2},?\s+\d{4}   # May 15, 2026
```

## DB 스키마 확장

### travel_vouchers (신규)
```
id: uuid (PK)
travel_id: uuid (FK → travels)
file_name: text
file_path: text (Supabase Storage URL)
file_size: bigint
created_at: timestamp
parsing_status: enum (pending|success|failed|partial)
parsing_metadata: jsonb
parsed_events_count: int
failed_fields: jsonb (파싱 실패한 필드 목록)
```

### travel_voucher_parsing_logs (신규, 감시)
```
id: uuid (PK)
voucher_id: uuid (FK)
parsing_attempt: int
status: enum (success|failed|timeout)
error_message: text
extracted_data: jsonb (추출된 원본 데이터)
created_at: timestamp
```

## API 설계

### POST /api/travels/[id]/vouchers/parse
**요청:** multipart/form-data (PDF 파일들)
**응답:**
```json
{
  "batch_id": "uuid",
  "total_files": 9,
  "parsed_count": 8,
  "failed_count": 1,
  "previews": [
    {
      "voucher_id": "uuid",
      "file_name": "booking_1.pdf",
      "events": [
        {
          "title": "ICN→ORD Flight",
          "event_type": "flight",
          "event_date": "2026-05-15",
          "event_time": "14:30",
          "location": "Incheon (ICN)",
          "amount": 850000,
          "confidence": 0.95
        }
      ],
      "errors": []
    }
  ]
}
```

### POST /api/travels/[id]/vouchers/confirm
**요청:**
```json
{
  "batch_id": "uuid",
  "confirmed_events": [
    {
      "voucher_id": "uuid",
      "events": [{ title, event_type, event_date, event_time, location, amount }]
    }
  ]
}
```
**응답:**
```json
{
  "created_count": 8,
  "events": [{ id, travel_id, title, event_type, ... }]
}
```

## 에러 처리

| 에러 | 처리 방식 |
|-----|---------|
| PDF 파일 손상 | pdfjs-dist로 재시도, 실패 시 OCR fallback |
| 텍스트 추출 실패 | tesseract.js (OCR) 또는 수동 입력 안내 |
| 파싱 정확도 <80% | "신뢰도 낮음" 경고 표시, 수동 검토 권장 |
| 중복 감지 | "동일한 이벤트가 존재합니다" 경고, 스킵 옵션 |
| 언어 감지 실패 | 사용자에게 언어 선택 프롬프트 |
| 타임아웃 (>30초) | 부분 결과 반환, 재파싱 옵션 제공 |
