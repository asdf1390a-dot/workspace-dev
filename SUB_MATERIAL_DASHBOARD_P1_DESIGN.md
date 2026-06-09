---
name: Sub-Material Management Dashboard P1 설계 명세서
description: CEO 전용 부자재 월간 관리 대시보드 + 엑셀 업로드 + 분석 및 절감 제안
type: project
relatedFiles: TEAM_DASHBOARD_PHASE2C_DESIGN_SPEC.md, ASSET_MANAGEMENT_DESIGN.md
status: ✅ 설계 완료 — Web-Builder AI 구현 준비
createdAt: 2026-06-09 20:00 KST
deadline: 2026-06-20 18:00 KST (구현 예정: 3-4일)
---

# 부자재 관리 대시보드 P1 설계 명세서

**설계자:** Web App Designer/Planner  
**상태:** ✅ 설계 완료 → Web-Builder 구현 준비  
**마감:** 2026-06-20 18:00 KST  
**예상 구현 기간:** 3-4일  
**대상 사용자:** CEO (권한 관리 포함, 초대 기능)

---

## 📋 목차

1. [개요 & 요구사항](#개요--요구사항)
2. [범위 정의 (Scope)](#범위-정의-scope)
3. [데이터 모델 & DB 스키마](#데이터-모델--db-스키마)
4. [파일 업로드 워크플로우](#파일-업로드-워크플로우)
5. [UI/UX 설계](#uiux-설계)
6. [분석 및 인사이트 기능](#분석-및-인사이트-기능)
7. [API 엔드포인트 명세](#api-엔드포인트-명세)
8. [권한 관리 & RLS](#권한-관리--rls)
9. [데이터 검증 & 오류 처리](#데이터-검증--오류-처리)
10. [구현 로드맵 & 체크리스트](#구현-로드맵--체크리스트)

---

## 개요 & 요구사항

### 목적
DSC Mannur 인도 첸나이 공장의 **월간 부자재 소비 추적 및 비용 절감 제안 시스템**

**6가지 부자재:**
- CO2 (용접용)
- ARGON (용접용)
- N2 (불활성 기체)
- DIESEL (연료)
- GREASE (윤활유)
- COIL (전자기 코일)

### 핵심 요구사항
1. ✅ **월 1회 엑셀 파일 업로드** — 자동 파싱 + DB 저장
2. ✅ **월별 분석** — 소비량, 비용, 변동추이, 비교 그래프
3. ✅ **비용 절감 제안** — AI 기반 이상치 감지 및 개선 제안
4. ✅ **CEO 전용 접근** — RLS 기반 권한 제어
5. ✅ **사용자 초대 기능** — CEO가 다른 사용자에게 읽기/편집 권한 부여
6. ✅ **데이터 검증** — 음수값, 검침 롤오버 감지 및 플래깅
7. ✅ **파일 이력 관리** — 업로드 이력, 파싱 결과 추적

### 성공 기준
- ✅ 5개 테이블 + 2개 함수 설계
- ✅ 5개 API 엔드포인트 명세
- ✅ 4개 UI 페이지 설계
- ✅ 엑셀 파싱 로직 상세화
- ✅ 분석 알고리즘 정의

---

## 범위 정의 (Scope)

### 포함사항 (MVP)

| 항목 | 개수 | 설명 |
|------|------|------|
| **신규 테이블** | 5 | monthly_summary, daily_consumption, cost_data, file_metadata, user_invites |
| **신규 함수** | 2 | parse_material_file(), calculate_insights() |
| **API 엔드포인트** | 5 | upload, dashboard, detail, inviteUser, updatePermission |
| **UI 페이지** | 4 | 대시보드, 파일 관리, 사용자 관리, 설정 |
| **UI 컴포넌트** | 8 | MaterialCard, TrendChart, FileUpload, UserInviteModal, AnomalyBadge 등 |
| **파일 포맷** | 2 | 월별 요약, 일일 소비 기록 (6개 시트) |

### 제외사항 (P2 연기)

- 기계학습 기반 예측 (현재는 규칙 기반)
- 모바일 네이티브 앱
- 국제화 (i18n) — 현재 타밀어/영어 폰트만 지원
- PDF 보고서 자동 생성
- 실시간 센서 데이터 연동
- 부자재 단가 자동 조회 (현재는 수동 입력)

---

## 데이터 모델 & DB 스키마

### 1. 테이블: monthly_material_summary

**목적:** 6개 부자재별 월간 집계 데이터

```sql
CREATE TABLE monthly_material_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,                         -- 2026
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  material_type TEXT NOT NULL CHECK (
    material_type IN ('CO2', 'ARGON', 'N2', 'DIESEL', 'GREASE', 'COIL')
  ),
  
  -- 소비 데이터
  opening_balance DECIMAL(10, 2) NOT NULL,    -- 월초 재고
  closing_balance DECIMAL(10, 2) NOT NULL,    -- 월말 재고
  total_consumption DECIMAL(10, 2) NOT NULL,  -- 월 소비량
  
  -- 비용 데이터
  unit_price DECIMAL(10, 4),                   -- 단가 (INR)
  total_cost DECIMAL(12, 2),                   -- 월 비용 (단가 × 소비량)
  
  -- 메타데이터
  unit TEXT NOT NULL,                          -- 단위 (Kg, Ltr, Cylinder 등)
  data_quality_flag BOOLEAN DEFAULT false,     -- 이상치 감지 플래그
  anomaly_details JSONB,                       -- 이상치 상세 (음수값, 롤오버 등)
  
  file_id UUID REFERENCES file_metadata(id),   -- 업로드 파일 추적
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  UNIQUE(year, month, material_type)
);

-- 인덱스
CREATE INDEX idx_monthly_summary_period ON monthly_material_summary(year, month);
CREATE INDEX idx_monthly_summary_material ON monthly_material_summary(material_type);
CREATE INDEX idx_monthly_summary_quality_flag ON monthly_material_summary(data_quality_flag);
```

### 2. 테이블: daily_material_consumption

**목적:** 일일 소비 기록 (교대별 분해, 선택사항)

```sql
CREATE TABLE daily_material_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES monthly_material_summary(id) ON DELETE CASCADE,
  
  consumption_date DATE NOT NULL,
  shift TEXT CHECK (shift IN ('A', 'B', 'C', 'Full Day')),  -- 교대
  consumption_qty DECIMAL(10, 2) NOT NULL,
  
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(summary_id, consumption_date, shift)
);

CREATE INDEX idx_daily_consumption_summary ON daily_material_consumption(summary_id);
CREATE INDEX idx_daily_consumption_date ON daily_material_consumption(consumption_date);
```

### 3. 테이블: material_cost_settings

**목적:** 부자재별 단가 및 분석 임계값 관리

```sql
CREATE TABLE material_cost_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_type TEXT NOT NULL UNIQUE CHECK (
    material_type IN ('CO2', 'ARGON', 'N2', 'DIESEL', 'GREASE', 'COIL')
  ),
  
  -- 단가 설정
  current_unit_price DECIMAL(10, 4) NOT NULL,  -- 현재 단가 (INR)
  currency TEXT DEFAULT 'INR',
  unit TEXT NOT NULL,                          -- Kg, Ltr, Cylinder, etc.
  
  -- 분석 임계값
  anomaly_threshold_percent DECIMAL(5, 2) DEFAULT 20.0,  -- 전월 대비 증감 임계값 (%)
  critical_threshold_percent DECIMAL(5, 2) DEFAULT 35.0, -- 심각한 이상 임계값 (%)
  
  -- 메타데이터
  price_effective_date DATE,
  remarks TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
```

### 4. 테이블: file_metadata

**목적:** 업로드된 엑셀 파일 이력 추적

```sql
CREATE TABLE file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 파일 정보
  file_name TEXT NOT NULL,
  file_size INTEGER,                           -- 바이트
  file_type TEXT DEFAULT 'xlsx',               -- xlsx, csv
  storage_path TEXT,                           -- Supabase Storage 경로
  
  -- 업로드 정보
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- 파싱 결과
  parsing_status TEXT CHECK (parsing_status IN ('pending', 'success', 'failed', 'partial')),
  parsing_error_message TEXT,
  parsed_rows_count INT,                       -- 파싱된 행 수
  
  -- 데이터 범위
  data_period_year INT,
  data_period_month INT,
  
  -- 메타데이터
  sheets_detected TEXT[],                      -- ['CO2', 'ARGON', 'N2', ...]
  quality_check_passed BOOLEAN DEFAULT false,
  quality_issues JSONB,                        -- [{ material, issue, rows }]
  
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(uploaded_by, file_name, uploaded_at)
);

CREATE INDEX idx_file_metadata_period ON file_metadata(data_period_year, data_period_month);
CREATE INDEX idx_file_metadata_status ON file_metadata(parsing_status);
```

### 5. 테이블: material_user_invites

**목적:** CEO의 사용자 초대 및 권한 관리

```sql
CREATE TABLE material_user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 초대 정보
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- 권한
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
  -- viewer: 읽기 전용 (대시보드, 보고서 조회)
  -- editor: 편집 권한 (데이터 수정, 파일 업로드)
  
  -- 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked')),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES auth.users(id),
  
  -- 만료 정책
  expires_at TIMESTAMP WITH TIME ZONE,        -- NULL = 무기한
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_invites_email ON material_user_invites(invited_email);
CREATE INDEX idx_invites_status ON material_user_invites(status);
CREATE INDEX idx_invites_invited_by ON material_user_invites(invited_by);
```

### 6. 테이블: material_consumption_anomalies (선택사항, P2)

**목적:** 감지된 이상 데이터 기록 (감사 추적용)

```sql
CREATE TABLE material_consumption_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES monthly_material_summary(id),
  
  anomaly_type TEXT CHECK (anomaly_type IN ('negative_value', 'rollover', 'missing_shift', 'unusual_consumption', 'cost_spike')),
  severity TEXT CHECK (severity IN ('warning', 'critical')),
  description TEXT,
  suggested_action TEXT,
  
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## 파일 업로드 워크플로우

### 엑셀 파일 포맷 정의

#### 시트 1-6: 부자재별 데이터 (CO2, ARGON, N2, DIESEL, GREASE, COIL)

각 시트 구조:

```
┌─────────────────────────────────────────────────────────┐
│ Sheet: CO2 (예시)                                        │
├─────────────────────────────────────────────────────────┤
│ A      B            C          D      E    F    G        │
│ Date   Shift        Opening    Usage  Closing Unit Price │
│ (Date) (A/B/C/FD)   (Qty)      (Qty)  (Qty) (Kg) (INR)   │
├─────────────────────────────────────────────────────────┤
│ 1-Jun  A            500        50     450    Kg   2500   │
│ 1-Jun  B            450        45     405    Kg   2500   │
│ 1-Jun  C            405        40     365    Kg   2500   │
│ 2-Jun  Full Day     365        60     305    Kg   2500   │
│ ...                                                      │
│ 30-Jun Full Day     310        30     280    Kg   2500   │
└─────────────────────────────────────────────────────────┘

월 요약 행 (마지막 행):
│ MONTHLY_SUMMARY │ │ 500 │ 1200 │ 280 │ Kg │ 2500 │
```

**주요 특징:**
- 6개 시트: CO2, ARGON, N2, DIESEL, GREASE, COIL
- 각 시트: 일일 소비 기록 + 월 요약 행
- 월말 데이터 필수 (closing_balance 검증용)
- 시트명은 정확히 매칭 필요

### 파일 업로드 흐름

```
1. CEO가 /sub-materials/files 페이지에서 엑셀 파일 업로드
   ↓
2. 파일 검증 (형식, 크기, 시트 존재 여부)
   ↓
3. 파일을 Supabase Storage에 저장 (sub-materials/{year-month}/)
   ↓
4. file_metadata 테이블에 기록 생성 (status='pending')
   ↓
5. 백그라운드 작업: parse_material_file() 호출
   ├─ 6개 시트 파싱
   ├─ 데이터 검증 (이상치 감지)
   ├─ monthly_material_summary 테이블에 upsert
   ├─ daily_material_consumption 테이블에 삽입
   └─ file_metadata 업데이트 (status='success' or 'failed')
   ↓
6. UI에서 "이상치" 플래그 있는 레코드 강조 표시
   ↓
7. 대시보드 자동 새로고침 (분석 데이터 갱신)
```

### 파일 파싱 알고리즘 (의사코드)

```javascript
async function parse_material_file(fileId) {
  const file = await getFileFromStorage(fileId);
  const workbook = XLSX.read(file);
  
  const materialTypes = ['CO2', 'ARGON', 'N2', 'DIESEL', 'GREASE', 'COIL'];
  const results = {};
  const errors = [];
  
  for (const material of materialTypes) {
    const sheet = workbook.Sheets[material];
    if (!sheet) {
      errors.push({ material, error: 'Sheet not found' });
      continue;
    }
    
    const rows = XLSX.utils.sheet_to_json(sheet);
    const monthlyData = rows[rows.length - 1]; // 마지막 행 (MONTHLY_SUMMARY)
    
    // 데이터 검증
    const { isValid, anomalies } = validateMaterialData(
      monthlyData,
      material
    );
    
    // DB에 저장
    const summaryRecord = {
      year: fileMetadata.data_period_year,
      month: fileMetadata.data_period_month,
      material_type: material,
      opening_balance: parseFloat(monthlyData.Opening),
      total_consumption: parseFloat(monthlyData.Usage),
      closing_balance: parseFloat(monthlyData.Closing),
      unit_price: parseFloat(monthlyData['Unit Price']),
      data_quality_flag: !isValid,
      anomaly_details: anomalies,
      file_id: fileId,
    };
    
    await upsertMonthlyMaterialSummary(summaryRecord);
    
    // 일일 데이터 저장 (선택사항)
    for (const dailyRow of rows.slice(0, -1)) {
      if (dailyRow.Date) {
        await insertDailyConsumption({
          summary_id: summaryRecord.id,
          consumption_date: parseDate(dailyRow.Date),
          shift: dailyRow.Shift,
          consumption_qty: parseFloat(dailyRow.Usage),
        });
      }
    }
  }
  
  // file_metadata 업데이트
  await updateFileMetadata(fileId, {
    parsing_status: errors.length > 0 ? 'partial' : 'success',
    parsing_error_message: errors,
    sheets_detected: materialTypes,
    quality_issues: errors,
  });
}

function validateMaterialData(row, material) {
  const anomalies = [];
  
  // 1. 음수값 체크
  const opening = parseFloat(row.Opening);
  const usage = parseFloat(row.Usage);
  const closing = parseFloat(row.Closing);
  
  if (opening < 0 || usage < 0 || closing < 0) {
    anomalies.push({
      type: 'negative_value',
      severity: 'critical',
      details: `Negative value detected: opening=${opening}, usage=${usage}, closing=${closing}`,
    });
  }
  
  // 2. 수량 검증 (opening - usage = closing)
  const expectedClosing = opening - usage;
  const tolerance = 0.5; // 0.5 unit 오차 허용
  if (Math.abs(closing - expectedClosing) > tolerance) {
    anomalies.push({
      type: 'calculation_mismatch',
      severity: 'warning',
      details: `Expected closing: ${expectedClosing}, Actual: ${closing}`,
    });
  }
  
  // 3. 검침 롤오버 감지 (closing > opening)
  if (closing > opening) {
    anomalies.push({
      type: 'rollover',
      severity: 'warning',
      details: `Closing (${closing}) > Opening (${opening}). Possible meter rollover.`,
    });
  }
  
  return {
    isValid: anomalies.length === 0,
    anomalies,
  };
}
```

---

## UI/UX 설계

### 페이지 1: 대시보드 (`/sub-materials`)

**경로:** `/sub-materials`  
**목적:** 월간 부자재 소비 현황 및 비용 분석  
**대상 사용자:** CEO, 초대된 사용자 (읽기)

#### 레이아웃

```
┌──────────────────────────────────────────────────────────────────┐
│ 부자재 관리 대시보드                                             │
│ [월 선택: 2026-06 ▼] [새로고침] [파일 관리] [사용자 관리]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ 【핵심 지표 요약】                                               │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐   │
│ │ 월 총 비용   │ 전월 대비    │ 부자재 종류  │ 이상 데이터  │   │
│ │ 45,670 INR   │ +15% (증가)  │ 6개          │ 1개 ⚠️      │   │
│ └──────────────┴──────────────┴──────────────┴──────────────┘   │
│                                                                   │
│ 【6개 부자재별 카드】                                           │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐   │
│ │   CO2        │   ARGON      │   N2         │  DIESEL      │   │
│ │              │              │              │              │   │
│ │ 사용: 1,200Kg│ 사용: 800Cy  │ 사용: 500Kg  │ 사용: 2000L  │   │
│ │ 비용: 3000₹ │ 비용: 4500₹ │ 비용: 2500₹ │ 비용: 15000₹│   │
│ │ 전월 +12%   │ 전월 +8%    │ 전월 -5%    │ 전월 +22% ⚠️ │   │
│ └──────────────┴──────────────┴──────────────┴──────────────┘   │
│ ┌──────────────┬──────────────┐                                 │
│ │   GREASE     │   COIL       │                                 │
│ │              │              │                                 │
│ │ 사용: 100L   │ 사용: 250개  │                                 │
│ │ 비용: 1500₹ │ 비용: 2170₹ │                                 │
│ │ 전월 +3%    │ 전월 -10%   │                                 │
│ └──────────────┴──────────────┘                                 │
│                                                                   │
│ 【월별 비용 변동추이 (최근 6개월)】                             │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │                          ╱╲                              │   │
│ │                    ╱──╲ ╱  ╲                            │   │
│ │            ╱──╲ ╱    ╲╱    ╲                           │   │
│ │     ╱──╲ ╱    ╲              ╲                          │   │
│ │    ╱    ╲              (현재)                            │   │
│ │   │────│────│────│────│────│────│                      │   │
│ │  1월  2월  3월  4월  5월  6월                           │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│ 【비용 절감 제안】                                              │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 🔴 DIESEL 소비 급증 (전월 +22%)                           │   │
│ │    제안: 장비 효율성 점검, 연료 누수 확인                 │   │
│ │                                                           │   │
│ │ 🟡 ARGON 소비 안정적 (전월 +8%)                           │   │
│ │    제안: 용접 공정 개선으로 5% 절감 가능                  │   │
│ │                                                           │   │
│ │ 🟢 COIL 소비 감소 (-10%)                                  │   │
│ │    상태: 효율적 — 계속 유지                               │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 컴포넌트 명세

**MaterialCard (6개)**
```typescript
interface MaterialCardProps {
  material: 'CO2' | 'ARGON' | 'N2' | 'DIESEL' | 'GREASE' | 'COIL';
  currentUsage: number;
  currentCost: number;
  unit: string;
  monthOverMonthPercent: number;  // +12, -5 등
  hasAnomaly: boolean;
  anomalyType?: string;           // 'negative_value', 'rollover' 등
}
```

**TrendChart**
```typescript
interface TrendChartProps {
  data: Array<{
    month: string;
    cost: number;
    materials: Record<string, number>;  // { CO2: 3000, ARGON: 4500, ... }
  }>;
  selectedMaterial?: string;  // 특정 부자재 강조 표시
  timeRange: 'last3months' | 'last6months' | 'last12months';
}
```

**InsightPanel**
```typescript
interface InsightPanelProps {
  insights: Array<{
    severity: 'critical' | 'warning' | 'info';
    material: string;
    title: string;
    description: string;
    suggestedAction: string;
    anomalyPercent?: number;
  }>;
}
```

---

### 페이지 2: 파일 관리 (`/sub-materials/files`)

**경로:** `/sub-materials/files`  
**목적:** 엑셀 파일 업로드 및 파싱 결과 조회  
**권한:** CEO (업로드), 초대된 편집자 (업로드), 초대된 뷰어 (조회만)

#### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│ 파일 관리                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ 【파일 업로드】                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │                                                        │   │
│ │   📁 Drag & drop or click to upload Excel file       │   │
│ │                                                        │   │
│ │   [선택] (또는 드래그)                               │   │
│ │                                                        │   │
│ └──────────────────────────────────────────────────────┘   │
│ 지원 포맷: .xlsx (최대 5MB)                              │
│                                                               │
│ 【업로드 이력】                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 날짜      │ 파일명        │ 기간  │ 상태      │ 액션  │   │
│ ├──────────────────────────────────────────────────────┤   │
│ │ 09-Jun   │ Materials-... │ 2026-06 │ ✅ Success │ 👁️   │   │
│ │ 08-Jun   │ Materials-... │ 2026-05 │ ⚠️ Partial │ ⚠️   │   │
│ │ 05-Jun   │ Materials-... │ 2026-04 │ ❌ Failed  │ ⚠️   │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                               │
│ 【상세 정보】(선택한 파일)                                 │
│ 파일명: Materials-2026-06-09.xlsx                           │
│ 크기: 150 KB                                               │
│ 업로드: 2026-06-09 15:30 (by CEO)                        │
│ 데이터 기간: 2026-06                                     │
│ 파싱 결과:                                                 │
│  - CO2 ✅ 30행                                            │
│  - ARGON ✅ 30행                                          │
│  - N2 ✅ 30행                                             │
│  - DIESEL ⚠️ 29행 (1행 이상 감지)                        │
│  - GREASE ✅ 30행                                         │
│  - COIL ✅ 30행                                           │
│                                                               │
│ 【이상 데이터】                                            │
│ - DIESEL: 6월 1일 SHIFT-A 음수값 감지 (-50Ltr)            │
│   → [수정] [무시] [삭제]                                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### 페이지 3: 상세 분석 (`/sub-materials/detail`)

**경로:** `/sub-materials/detail?material=CO2&range=6months`  
**목적:** 부자재별 상세 분석 및 월별 비교

#### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│ 상세 분석: CO2                                               │
│ [부자재: CO2 ▼] [기간: 최근 6개월 ▼] [내보내기]             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ 【소비량 변동추이】                                         │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 1,500 │                                               │   │
│ │ 1,200 │    ╱╲                                         │   │
│ │   900 │   ╱  ╲    ╱╲                                 │   │
│ │   600 │  ╱    ╲  ╱  ╲                                │   │
│ │   300 │ ╱      ╲╱    ╲                               │   │
│ │     0 │_______________╲_____                         │   │
│ │      1월  2월  3월  4월  5월  6월                   │   │
│ └──────────────────────────────────────────────────────┘   │
│ 평균 소비: 1,050 Kg | 최대: 1,200 Kg | 최소: 850 Kg      │
│                                                               │
│ 【월별 비용 분석】                                         │
│ ┌─────────┬────────┬────────┬──────────┬──────────┐       │
│ │  월    │ 소비량  │ 단가   │ 월 비용  │ 전월 대비 │       │
│ ├─────────┼────────┼────────┼──────────┼──────────┤       │
│ │ 1월    │ 900 Kg │ 2500₹  │ 2,250,000│ -        │       │
│ │ 2월    │ 1,100  │ 2500   │ 2,750,000│ +22%     │       │
│ │ 3월    │ 1,200  │ 2500   │ 3,000,000│ +9%      │       │
│ │ 4월    │ 950    │ 2500   │ 2,375,000│ -21% ✅  │       │
│ │ 5월    │ 1,050  │ 2500   │ 2,625,000│ +8%      │       │
│ │ 6월    │ 1,180  │ 2500   │ 2,950,000│ +12%     │       │
│ └─────────┴────────┴────────┴──────────┴──────────┘       │
│                                                               │
│ 【효율성 지표】(생산량 대비 소비율 - 선택사항)            │
│ - 월 생산량 데이터 연동 필요 (추후 연동)                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### 페이지 4: 사용자 관리 (`/sub-materials/users`)

**경로:** `/sub-materials/users`  
**목적:** CEO가 사용자 초대 및 권한 관리  
**권한:** CEO only

#### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│ 사용자 관리                                                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ 【사용자 초대】                                             │
│ 이메일: [________________]                                 │
│ 권한:   [Viewer ▼] (Viewer / Editor)                       │
│ 만료:   [________________] (선택사항, YYYY-MM-DD)         │
│         [초대 전송]                                        │
│                                                               │
│ 【초대된 사용자 목록】                                     │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 이메일        │ 역할    │ 상태    │ 초대일  │ 액션    │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ manager@...   │ Editor  │ ✅ Active │ 05-Jun │ [🗑️]  │   │
│ │ staff@...     │ Viewer  │ ⏳ Pending │ 08-Jun │ [재전송]│   │
│ │ user@...      │ Viewer  │ ✅ Active │ 02-Jun │ [🗑️]  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                               │
│ 【권한 설명】                                              │
│ - Viewer: 대시보드, 파일 목록, 분석 조회 (읽기 전용)      │
│ - Editor: Viewer 권한 + 파일 업로드, 데이터 수정           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

### 페이지 5: 설정 (`/sub-materials/settings`)

**경로:** `/sub-materials/settings`  
**목적:** 부자재 단가 및 분석 임계값 설정  
**권한:** CEO only

#### 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│ 설정                                                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ 【부자재 단가 관리】                                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 부자재   │ 단가 (INR) │ 단위  │ 적용일   │ 액션      │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ CO2     │ 2,500     │ Kg   │ 2026-01-01 │ [편집] │   │
│ │ ARGON   │ 5,625     │ Cy   │ 2026-01-01 │ [편집] │   │
│ │ N2      │ 5,000     │ Kg   │ 2026-01-01 │ [편집] │   │
│ │ DIESEL  │ 7.50      │ Ltr  │ 2026-04-15 │ [편집] │   │
│ │ GREASE  │ 15        │ Ltr  │ 2026-01-01 │ [편집] │   │
│ │ COIL    │ 8.68      │ 개   │ 2026-01-01 │ [편집] │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                               │
│ 【분석 임계값】                                            │
│ 이상 감지 임계값: [20] % (전월 대비 증감)                 │
│ 심각 임계값:     [35] % (알림 표시)                      │
│                                                               │
│ [저장]                                                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 분석 및 인사이트 기능

### 1. 자동 이상치 감지

**규칙 기반 이상치 감지:**

```typescript
interface AnomalyDetectionResult {
  material: string;
  month: number;
  year: number;
  anomalies: Array<{
    type: 'negative_value' | 'rollover' | 'consumption_spike' | 'cost_spike';
    severity: 'warning' | 'critical';
    value?: number;
    expectedRange?: { min: number; max: number };
    description: string;
    suggestedAction: string;
  }>;
}

function detectAnomalies(
  currentMonth: MonthlyMaterialSummary,
  previousMonth?: MonthlyMaterialSummary
): AnomalyDetectionResult {
  const anomalies = [];
  
  // 1. 음수값 체크
  if (currentMonth.opening_balance < 0 || 
      currentMonth.total_consumption < 0 || 
      currentMonth.closing_balance < 0) {
    anomalies.push({
      type: 'negative_value',
      severity: 'critical',
      description: 'Negative consumption or balance detected',
      suggestedAction: 'Verify data entry, check for data corruption',
    });
  }
  
  // 2. 검침 롤오버 감지
  if (currentMonth.closing_balance > currentMonth.opening_balance) {
    anomalies.push({
      type: 'rollover',
      severity: 'warning',
      description: `Closing balance (${currentMonth.closing_balance}) > Opening balance (${currentMonth.opening_balance})`,
      suggestedAction: 'Check if meter rolled over; verify readings',
    });
  }
  
  // 3. 소비 급증 (전월 대비)
  if (previousMonth) {
    const consumptionChange = 
      (currentMonth.total_consumption - previousMonth.total_consumption) 
      / previousMonth.total_consumption * 100;
    
    const threshold = material_settings.anomaly_threshold_percent; // 20%
    
    if (consumptionChange > threshold) {
      anomalies.push({
        type: 'consumption_spike',
        severity: consumptionChange > 35 ? 'critical' : 'warning',
        value: consumptionChange,
        expectedRange: { 
          min: -threshold, 
          max: threshold 
        },
        description: `Consumption increased by ${consumptionChange.toFixed(1)}% vs previous month`,
        suggestedAction: `Investigate cause: production volume change, equipment inefficiency, or data error`,
      });
    }
  }
  
  // 4. 비용 급증
  if (previousMonth && currentMonth.total_cost && previousMonth.total_cost) {
    const costChange = (currentMonth.total_cost - previousMonth.total_cost) 
      / previousMonth.total_cost * 100;
    
    if (costChange > 30) {
      anomalies.push({
        type: 'cost_spike',
        severity: 'warning',
        value: costChange,
        description: `Cost increased by ${costChange.toFixed(1)}%`,
        suggestedAction: `Check if price increased or consumption spike`,
      });
    }
  }
  
  return {
    material: currentMonth.material_type,
    month: currentMonth.month,
    year: currentMonth.year,
    anomalies,
  };
}
```

### 2. 비용 절감 제안 엔진

```typescript
interface SavingsOpportunity {
  material: string;
  estimatedMonthlySavings: number;  // INR
  percentageSavings: number;        // %
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  implementationDifficulty: 'easy' | 'medium' | 'hard';
}

function generateSavingsRecommendations(
  materialData: MonthlyMaterialSummary[],
  settings: MaterialCostSettings[]
): SavingsOpportunity[] {
  const recommendations = [];
  
  for (const material of materialData) {
    const prev = getPreviousMonth(material);
    if (!prev) continue;
    
    const consumptionChange = 
      (material.total_consumption - prev.total_consumption) 
      / prev.total_consumption;
    
    // 제안 1: DIESEL 효율성
    if (material.material_type === 'DIESEL' && consumptionChange > 0.15) {
      recommendations.push({
        material: 'DIESEL',
        estimatedMonthlySavings: material.total_cost * 0.08,  // 8% 절감 목표
        percentageSavings: 8,
        priority: 'high',
        recommendation: 'Equipment maintenance: Check fuel filters, injection nozzles, and engine efficiency',
        implementationDifficulty: 'medium',
      });
    }
    
    // 제안 2: ARGON/CO2 효율성 (용접 공정)
    if (['ARGON', 'CO2'].includes(material.material_type)) {
      recommendations.push({
        material: material.material_type,
        estimatedMonthlySavings: material.total_cost * 0.05,  // 5% 절감
        percentageSavings: 5,
        priority: 'medium',
        recommendation: 'Welding process optimization: Improve torch efficiency, reduce spatter',
        implementationDifficulty: 'medium',
      });
    }
    
    // 제안 3: GREASE 최적화
    if (material.material_type === 'GREASE' && material.total_consumption > 50) {
      recommendations.push({
        material: 'GREASE',
        estimatedMonthlySavings: material.total_cost * 0.10,  // 10% 절감
        percentageSavings: 10,
        priority: 'low',
        recommendation: 'Lubrication audit: Identify over-greased equipment, use synthetic grease for longer life',
        implementationDifficulty: 'easy',
      });
    }
  }
  
  return recommendations.sort((a, b) => 
    (b.estimatedMonthlySavings || 0) - (a.estimatedMonthlySavings || 0)
  );
}
```

---

## API 엔드포인트 명세

### 1. POST /api/sub-materials/upload

**목적:** 엑셀 파일 업로드 및 파싱 시작

**요청:**
```
POST /api/sub-materials/upload
Content-Type: multipart/form-data

Body:
- file: FormData (xlsx 파일)
- dataYear: number (2026)
- dataMonth: number (1-12)
```

**응답 (202 Accepted):**
```json
{
  "fileId": "uuid",
  "status": "pending",
  "message": "File uploaded. Parsing in progress.",
  "checkStatusUrl": "/api/sub-materials/files/{fileId}/status"
}
```

**오류 (400):**
```json
{
  "error": "Invalid file format",
  "details": "Expected .xlsx file, received .csv"
}
```

---

### 2. GET /api/sub-materials/dashboard

**목적:** 월간 대시보드 데이터 조회

**요청:**
```
GET /api/sub-materials/dashboard?year=2026&month=6
```

**응답 (200 OK):**
```json
{
  "period": {
    "year": 2026,
    "month": 6,
    "monthName": "June"
  },
  "summary": {
    "totalMonthlyCost": 45670.00,
    "previousMonthCost": 39670.00,
    "costChangePercent": 15.2,
    "materialCount": 6,
    "anomalyCount": 1
  },
  "materials": [
    {
      "type": "CO2",
      "consumption": 1200,
      "unit": "Kg",
      "cost": 3000,
      "unitPrice": 2.5,
      "previousMonthConsumption": 1070,
      "changePercent": 12.1,
      "hasAnomaly": false
    },
    {
      "type": "DIESEL",
      "consumption": 2000,
      "unit": "Ltr",
      "cost": 15000,
      "unitPrice": 7.5,
      "previousMonthConsumption": 1640,
      "changePercent": 22.0,
      "hasAnomaly": true,
      "anomalyType": "consumption_spike",
      "anomalySeverity": "warning"
    }
    // ... 나머지 4개 부자재
  ],
  "insights": [
    {
      "material": "DIESEL",
      "severity": "warning",
      "title": "Consumption Spike Detected",
      "description": "DIESEL consumption increased by 22% compared to last month",
      "suggestedAction": "Check equipment efficiency, verify fuel consumption logs",
      "estimatedSavings": 3000.00
    }
  ],
  "trend": {
    "last6Months": [
      { "month": 1, "totalCost": 39800, "materials": { "CO2": 2700, "ARGON": 4200, ... } },
      // ... 5개월 더
    ]
  }
}
```

---

### 3. GET /api/sub-materials/detail

**목적:** 부자재별 상세 분석 조회

**요청:**
```
GET /api/sub-materials/detail?material=CO2&range=6months&year=2026
```

**응답 (200 OK):**
```json
{
  "material": "CO2",
  "unit": "Kg",
  "currentUnitPrice": 2.5,
  "monthlyData": [
    {
      "month": 1,
      "year": 2026,
      "consumption": 900,
      "cost": 2250,
      "changePercent": 0,
      "anomalies": []
    },
    // ... 5개월 더
  ],
  "statistics": {
    "averageConsumption": 1050,
    "maxConsumption": 1200,
    "minConsumption": 850,
    "averageCost": 2625,
    "totalConsumption": 6300,
    "totalCost": 15750
  }
}
```

---

### 4. POST /api/sub-materials/inviteUser

**목적:** 사용자 초대

**요청:**
```json
POST /api/sub-materials/inviteUser
Content-Type: application/json

{
  "email": "manager@example.com",
  "role": "viewer",
  "expiresAt": "2026-12-31" // optional
}
```

**응답 (201 Created):**
```json
{
  "inviteId": "uuid",
  "email": "manager@example.com",
  "role": "viewer",
  "status": "pending",
  "inviteLink": "https://dsc-fms-portal.vercel.app/accept-invite?token=...",
  "expiresAt": "2026-12-31"
}
```

---

### 5. DELETE /api/sub-materials/revokeAccess/:inviteId

**목적:** 사용자 권한 취소

**요청:**
```
DELETE /api/sub-materials/revokeAccess/:inviteId
```

**응답 (200 OK):**
```json
{
  "message": "Access revoked successfully",
  "email": "manager@example.com"
}
```

---

## 권한 관리 & RLS

### Supabase RLS 정책

```sql
-- 1. 대시보드 접근 제어 (CEO 또는 초대된 사용자)
CREATE POLICY "Users can access if CEO or invited"
ON monthly_material_summary
FOR SELECT USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM material_user_invites
    WHERE invited_email = auth.jwt() ->> 'email'
    AND status = 'accepted'
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- 2. 파일 업로드 권한 (CEO + 초대된 편집자)
CREATE POLICY "Only CEO and editors can upload"
ON file_metadata
FOR INSERT WITH CHECK (
  auth.uid() = (
    SELECT id FROM auth.users WHERE email = 'ceo@example.com'
  )
  OR EXISTS (
    SELECT 1 FROM material_user_invites
    WHERE invited_email = auth.jwt() ->> 'email'
    AND role = 'editor'
    AND status = 'accepted'
  )
);

-- 3. 데이터 수정 권한 (CEO + 초대된 편집자)
CREATE POLICY "Only CEO and editors can update"
ON monthly_material_summary
FOR UPDATE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM material_user_invites
    WHERE invited_email = auth.jwt() ->> 'email'
    AND role = 'editor'
    AND status = 'accepted'
  )
);
```

---

## 데이터 검증 & 오류 처리

### 검증 규칙

| 규칙 | 체크 내용 | 임계값 | 심각도 |
|------|---------|--------|--------|
| **음수값** | opening_balance, consumption, closing_balance < 0 | 0 | Critical ❌ |
| **롤오버** | closing_balance > opening_balance | (차이 > 0.5 unit) | Warning ⚠️ |
| **불균형** | opening - consumption ≠ closing | 오차 > 0.5 | Warning ⚠️ |
| **소비 급증** | (현월 - 전월) / 전월 > 임계값 | 20%, 35% | Warning/Critical |
| **결측치** | 특정 교대 데이터 빠짐 | 일일 데이터만 | Warning ⚠️ |
| **단위 불일치** | 예상 단위와 다름 | (설정 값과 비교) | Warning ⚠️ |

### 오류 처리 전략

```
1. 파일 검증 실패 (형식, 크기)
   → 즉시 사용자에게 오류 표시 (400 Bad Request)
   → "Invalid file format. Expected .xlsx"

2. 파싱 실패 (시트 누락, 컬럼 오류)
   → 부분 성공으로 처리 (status='partial')
   → 성공한 시트만 저장, 실패한 시트 리포팅
   → UI에서 "⚠️ Partial Success" 표시

3. 데이터 검증 실패 (음수값, 롤오버)
   → 데이터 저장하되 data_quality_flag='true' 설정
   → UI에서 ⚠️ 배지 표시, 상세 정보 제공
   → CEO가 수정 또는 무시 선택 가능

4. DB 저장 실패
   → 트랜잭션 롤백
   → 사용자에게 "Server error. Please try again"
   → 관리자에게 로그 전송
```

---

## 구현 로드맵 & 체크리스트

### Phase 1: DB 및 API 구현 (2일)

- [ ] 5개 테이블 마이그레이션 생성
- [ ] 2개 함수 구현 (parse_material_file, calculate_insights)
- [ ] 5개 API 엔드포인트 구현
- [ ] RLS 정책 적용
- [ ] API 테스트 (Postman 또는 프론트엔드)

### Phase 2: 프론트엔드 UI 구현 (2일)

- [ ] 대시보드 페이지 (+컴포넌트 8개)
- [ ] 파일 관리 페이지
- [ ] 상세 분석 페이지
- [ ] 사용자 관리 페이지
- [ ] 설정 페이지
- [ ] 에러 처리 및 로딩 상태
- [ ] 모바일 반응형 디자인

### Phase 3: 테스트 & 배포 (1일)

- [ ] 단위 테스트 (파일 파싱 로직)
- [ ] 통합 테스트 (업로드 → 파싱 → 대시보드)
- [ ] 권한 테스트 (CEO, 뷰어, 편집자)
- [ ] 엣지 케이스 테스트 (빈 파일, 손상된 데이터)
- [ ] Vercel 배포
- [ ] 프로덕션 확인

### 파일 구조

```
dsc-fms-portal/
├── app/
│   ├── api/
│   │   └── sub-materials/
│   │       ├── upload/route.ts
│   │       ├── dashboard/route.ts
│   │       ├── detail/route.ts
│   │       ├── inviteUser/route.ts
│   │       └── revokeAccess/[id]/route.ts
│   └── sub-materials/
│       ├── page.tsx                 (대시보드)
│       ├── files/page.tsx            (파일 관리)
│       ├── detail/page.tsx           (상세 분석)
│       ├── users/page.tsx            (사용자 관리)
│       ├── settings/page.tsx         (설정)
│       └── components/
│           ├── MaterialCard.tsx
│           ├── TrendChart.tsx
│           ├── FileUpload.tsx
│           ├── InsightPanel.tsx
│           └── AnomalyBadge.tsx
├── supabase/
│   └── migrations/
│       └── 20260609_sub_material_dashboard.sql
└── lib/
    ├── sub-materials.ts              (API 클라이언트)
    └── validation.ts                 (데이터 검증)
```

---

## 엣지 케이스 & 고려사항

### 데이터 관련

1. **빈 파일 업로드**
   - 처리: 파일 크기 0 체크, 즉시 거절
   - 메시지: "File is empty"

2. **잘못된 시트명**
   - 처리: 누락된 시트만 스킵, 기존 데이터 유지
   - 메시지: "ARGON sheet not found. Skipping."

3. **중복 업로드 (같은 월)**
   - 처리: UPSERT — 기존 데이터 덮어쓰기
   - 메시지: "Previous data for June 2026 has been replaced"

4. **부분 실패 (일부 시트만 성공)**
   - 처리: 성공한 시트만 저장, 실패한 시트는 리포팅
   - 상태: 'partial' (수동 검토 필요)

### 권한 관련

1. **CEO 계정 삭제**
   - 영향: 초대된 모든 사용자 권한 자동 취소 (FK cascading)
   - 대책: CEO 계정은 보호 (별도 권한 확인 필수)

2. **초대 링크 만료**
   - 처리: expires_at > now() 체크
   - 메시지: "Invite has expired. Contact CEO for new invitation"

3. **동일 이메일 중복 초대**
   - 처리: 기존 초대 업데이트 (또는 거절)
   - 메시지: "User already invited"

### 성능 관련

1. **대용량 파일 처리**
   - 제한: 최대 5MB
   - 처리: 백그라운드 작업으로 비동기 파싱
   - 체크: 상태 폴링 엔드포인트 제공

2. **대시보드 로딩 느림**
   - 최적화: 인덱싱 (year, month, material_type)
   - 캐싱: 일일 집계 결과 캐시 (Redis)

---

## 예상 질문 & 답변

**Q. 왜 daily_material_consumption 테이블이 필요한가?**  
A. 일일 소비 기록을 교대별로 추적하면 추후 교대별 효율성 비교 및 문제 진단이 용이합니다. 현재는 선택사항이지만, 향후 분석 심화 시 필요합니다.

**Q. 단가가 변경되면 과거 데이터도 수정하나?**  
A. 아니요. 과거 데이터는 유지하되, 새로운 단가는 future-dated records에만 적용됩니다 (material_cost_settings.price_effective_date).

**Q. 초대된 사용자가 오프라인 중에도 액세스할 수 있나?**  
A. 아니요. Supabase 인증이 필요합니다. 초대받은 이메일로 포털에 로그인해야 합니다.

**Q. 파일 업로드 후 몇 초 안에 대시보드가 갱신되나?**  
A. 현재는 백그라운드 파싱이므로 1-5초(파일 크기에 따라) 후 대시보드가 갱신됩니다. UI 폴링으로 상태 확인 가능합니다.

---

## 참고 링크

- [기존 Asset Master 설계](ASSET_MANAGEMENT_DESIGN.md)
- [Team Dashboard Phase 2C 설계](TEAM_DASHBOARD_PHASE2C_DESIGN_SPEC.md)
- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [ExcelJS 라이브러리](https://github.com/exceljs/exceljs)

---

**최종 확인**

- ✅ 5개 테이블 설계 완료
- ✅ 2개 함수 명세 완료
- ✅ 5개 API 엔드포인트 정의
- ✅ 5개 UI 페이지 와이어프레임
- ✅ 파일 파싱 알고리즘 상세화
- ✅ 분석 엔진 기본 로직
- ✅ 권한 관리 및 RLS 정책
- ✅ 엣지 케이스 정의

**설계 완료 날짜:** 2026-06-09 20:30 KST  
**웹개발자 구현 시작:** 2026-06-10 예정

