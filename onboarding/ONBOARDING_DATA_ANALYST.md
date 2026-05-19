# 데이터분석가(Data Analyst) 온보딩 — 복사-붙여넣기 키트

## 역할 요약
**DSC Mannur 공장 데이터 분석 & 자동화 스크립트 개발.** Excel/CSV 데이터 수집 → KPI 분석 → 차트/리포트 생성. Supabase DB 직접 쿼리 가능.

## 핵심 책임
1. Excel/CSV 데이터 분석 (pandas, openpyxl)
2. Supabase 데이터 직접 쿼리 (PostgreSQL)
3. 주간/월간 KPI 리포트 생성 (자동화)
4. 이상 패턴 탐지 (이상치, 추세, 편차)
5. 분석 결과 시각화 (차트, 그래프)

---

## Day 1 체크리스트 (09:00~11:00, 2시간)

### 09:00~09:30 — 공장 데이터 이해
- [ ] DSC Mannur 개요 읽기: `USER.md` (생산/기술/보전/생산관리 4부서)
- [ ] 현황 리포트 읽기:
  - `project_weekly_report_form.md` — 주간업무양식 구조 (4개 부서, 각 지표)
  - `project_2번파일_구조.md` — 경영실적 Excel 시트 구조
- [ ] 데이터 추세 확인:
  - 최근 3주간 경영실적 Excel (사용자 제공)
  - Supabase 샘플 데이터 (BM events, Asset, Travel 등)

### 09:30~10:15 — 기술스택 & 도구 학습
- [ ] Python 분석 스택:
  ```
  pandas — DataFrame 조작
  openpyxl — Excel 읽고 쓰기
  plotly / matplotlib — 시각화
  psycopg2 — PostgreSQL 직접 쿼리
  ```
- [ ] Supabase 연결:
  - URL: https://[project-id].supabase.co
  - 인증: service_role_key (보관 필수)
  - 테이블: assets, bm_events, travel_requests, backup_metrics 등
- [ ] 데이터 링크 (공유 폴더 또는 API):
  - Google Drive: [경영실적 폴더]
  - Excel 자동 다운로드 API (있으면)

### 10:15~11:00 — 첫 분석 환경 세팅
- [ ] Python 3.11+ 설치 확인
- [ ] 라이브러리 설치:
  ```bash
  pip install pandas openpyxl plotly psycopg2-binary python-dotenv
  ```
- [ ] `.env` 설정:
  ```
  SUPABASE_URL=https://[project-id].supabase.co
  SUPABASE_KEY=eyJ...
  ```
- [ ] 첫 쿼리 실행:
  ```python
  import pandas as pd
  import psycopg2
  
  conn = psycopg2.connect(
    host="[project-id].supabase.co",
    user="postgres",
    password="[password]",
    database="postgres"
  )
  df = pd.read_sql("SELECT * FROM assets LIMIT 10;", conn)
  print(df.head())
  ```

---

## Day 1 오후 (14:00) — 첫 분석 과제

**과제 A (4시간):** 주간업무양식 자동화 스크립트 (Excel → DataFrame)
- 목표: Excel 파일 읽기 → 4개 부서 데이터 분리 → 기본 KPI 계산
- 파일: `scripts/analyze_weekly_report.py`
- 입력: 주간업무양식.xlsx (사용자 제공)
- 출력: CSV 또는 DataFrame 형태 데이터
- 완료 기준: 스크립트 실행 → 정상적으로 데이터 추출

**과제 B (8시간):** Supabase 데이터 분석 (BM 이벤트 추세)
- 목표: BM(Breakdown) 이벤트 데이터 → 부서별/설비별 고장 빈도 분석
- 파일: `scripts/analyze_bm_trends.py`
- 쿼리: Supabase `bm_events` 테이블
- 출력: CSV + 시각화 (Plotly 차트)
- 완료 기준: 스크립트 실행 → 차트 생성

---

## 핵심 참고 문서 (복사-붙여넣기용)

1. **공장 데이터 이해**
   - `project_weekly_report_form.md` — 주간양식 구조
   - `project_2번파일_구조.md` — Excel 시트별 컬럼 + 단위
   - `project_exchange_rate.md` — 환율 (INR↔KRW)

2. **기술 가이드**
   - pandas 문서: https://pandas.pydata.org/docs
   - Supabase Python: https://supabase.com/docs/reference/python
   - Plotly: https://plotly.com/python

3. **완료된 분석 사례**
   - `memory/active_work_tracking.md` — 진도 데이터 (참고)
   - 기존 리포트: [사용자 제공]

4. **데이터 규칙**
   - `memory/feedback_sort_order.md` — 정렬 규칙 (오름/내림차순)
   - `memory/feedback_report_update.md` — 리포트 업데이트 규칙

5. **자동화 스크립트 위치**
   - `/scripts/` — Python 분석 스크립트
   - `/data/` — 입출력 데이터

---

## 일주일 로드맵

| 날짜 | 시간 | 이벤트 | 상태 |
|------|------|--------|------|
| Day 1 | 09:00 | 공장 데이터 & 기술스택 학습 | ✅ 완료 |
| Day 1 | 14:00 | 첫 분석 과제 시작 | ✅ 진행 |
| Day 2~3 | 일일 | 첫 과제 완료 + 자동화 스크립트 작성 | 🟡 진행 |
| Day 4 | 09:00 | 다음 분석 과제 시작 (예: BM 추세) | 예정 |
| Day 5 | 15:00 | 주간 분석 결과 1차 리포트 | 예정 |
| Day 6~7 | 일일 | 리포트 검증 + 시각화 고도화 | 예정 |

---

## 신입이 할 일 (순서대로)

1. Day 1 체크리스트 완료 (2시간)
2. 선임 데이터분석가에게 환경세팅 완료 리포트
3. 첫 분석 과제(A 또는 B) 시작
4. 스크립트 작성 → GitHub 커밋 → 선임에게 리뷰 요청
5. 리뷰 피드백 반영
6. 분석 결과 리포트 작성 (1페이지)
7. 자동화 스크립트 등록 (매주 자동 실행)

---

## 첫 분석 스크립트 템플릿

```python
# scripts/analyze_weekly_report.py
import pandas as pd
import os
from dotenv import load_dotenv

load_dotenv()

# 1. Excel 읽기
file_path = "data/주간업무양식_2026-05-19.xlsx"
df = pd.read_excel(file_path, sheet_name="Sheet1")

# 2. 4개 부서 분리 (예시)
production = df[df['부서'] == '생산']
technology = df[df['부서'] == '기술']
maintenance = df[df['부서'] == '보전']
production_mgmt = df[df['부서'] == '생산관리']

# 3. KPI 계산 (예시: 평균 가동률)
avg_uptime = production['가동률(%)'].mean()
print(f"생산부 평균 가동률: {avg_uptime:.1f}%")

# 4. 결과 저장
df.to_csv("data/analysis_output_2026-05-19.csv", index=False, encoding="utf-8-sig")
print("분석 완료 → data/analysis_output_2026-05-19.csv")
```

---

## Supabase 쿼리 템플릿

```python
# scripts/query_supabase.py
import psycopg2
import pandas as pd
from dotenv import load_dotenv
import os

load_dotenv()

# Supabase 연결
conn = psycopg2.connect(
    host=os.getenv("SUPABASE_URL").replace("https://", "").replace(".supabase.co", ""),
    user="postgres",
    password=os.getenv("SUPABASE_KEY"),
    database="postgres",
    sslmode="require"
)

# BM 이벤트 쿼리
query = """
SELECT 
  DATE(created_at) as date,
  equipment_type,
  COUNT(*) as breakdown_count
FROM bm_events
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), equipment_type
ORDER BY date DESC;
"""

df = pd.read_sql(query, conn)
print(df)

conn.close()
```

---

## 시각화 템플릿 (Plotly)

```python
import plotly.express as px

# 데이터 준비 (위 쿼리 결과)
fig = px.bar(df, x="date", y="breakdown_count", color="equipment_type",
             title="설비별 고장 빈도 (지난 30일)",
             labels={"breakdown_count": "고장 건수", "date": "날짜"})

fig.write_html("output/bm_trends.html")
print("차트 저장 → output/bm_trends.html")
```

---

## 도움말
- **데이터 접근 권한 없을 때:** 선임에게 Supabase 서비스 계정 요청
- **Excel 형식 불일치할 때:** 선임에게 템플릿 문서 요청 (`project_2번파일_구조.md`)
- **Supabase 쿼리 느릴 때:** 인덱스 확인 또는 선임에게 쿼리 최적화 요청
