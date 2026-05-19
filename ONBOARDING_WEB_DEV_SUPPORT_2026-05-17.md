# 🎯 웹 개발 지원가 (Web Development Support Engineer) 온보딩 가이드

**신입자 시작:** 2026-05-17 09:00 KST  
**메멘토:** 웹개발자 (수평 관계)  
**주요 미션:** Asset Master Phase 2 (16개 API + 4개 UI + 자산 506개 관리 시스템)  
**완료 목표:** 2026-05-23 18:00 (7일)  
**기대효과:** 웹개발자 부하 30% 감소, 처리 속도 3배 향상

---

## 📅 Day 1 온보딩 스케줄 (2026-05-17, 09:00~18:00)

### 09:00~10:00 | 프로젝트 구조 & 조직 소개
- **목표:** 회사, 팀, 프로젝트 전체 이해
- **준비물:**
  - ✅ GitHub 계정 + dsc-fms-portal 리포지토리 접근 확인
  - ✅ Supabase 계정 (읽기/쓰기 권한)
  - ✅ Vercel 계정 (배포 권한)
  - ✅ Telegram 초대 (@asdf1390a 개인 채팅)
  - ✅ Discord #웹개발-web-dev 채널 초대
  
- **실행 항목:**
  1. DSC 공장 소개 (Mannur, India 자동차 부품 제조)
  2. 팀 구성 소개 (비서 + 번역가 + 분석가 + 웹개발자 + 평가자 + 자동화 엔지니어)
  3. 메멘토(웹개발자) 지정 및 직속 보고 라인 확인
  4. DSC FMS Portal 프로젝트 개요
  5. Asset Master 모듈 미션 설명

### 10:00~11:00 | 기술 스택 & 개발 환경 설정
- **목표:** 로컬 개발 환경 완전히 구성
- **기술 스택 (필수 확인사항):**
  - **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
  - **Backend:** Next.js API Routes, Supabase PostgREST
  - **Database:** PostgreSQL (Supabase)
  - **Deployment:** Vercel (CI/CD 자동)
  - **Version Control:** Git + GitHub
  - **Node.js 버전:** 18.17+ (필수)

- **환경 설정 체크리스트:**
  ```bash
  # 1. 저장소 클론
  git clone https://github.com/jeepney-auto/dsc-fms-portal.git
  cd dsc-fms-portal
  
  # 2. 의존성 설치 (node_modules)
  npm install
  # 또는 yarn install
  
  # 3. 환경 변수 설정 (.env.local 또는 .env.development.local)
  # 필수 변수:
  # - NEXT_PUBLIC_SUPABASE_URL
  # - NEXT_PUBLIC_SUPABASE_ANON_KEY
  # - SUPABASE_SERVICE_ROLE_KEY (비공개)
  # - DATABASE_URL (선택사항, 직접 쿼리용)
  
  # 4. 로컬 개발 서버 시작
  npm run dev
  # http://localhost:3000 접근 가능 확인
  ```

- **GitHub 저장소 구조:**
  ```
  dsc-fms-portal/
  ├── pages/                    # Next.js 페이지 라우팅
  │   ├── api/                  # API 엔드포인트 (REST routes)
  │   ├── assets/               # Asset Master 페이지
  │   ├── bm/                   # Breakdown Maintenance (고장 추적)
  │   ├── backup/               # Backup 관리
  │   └── ...
  ├── components/               # React 재사용 컴포넌트
  ├── lib/                       # 유틸리티, hooks, 서비스
  ├── db/                        # SQL 마이그레이션 파일
  ├── public/                    # 정적 자산 (이미지, 폰트)
  ├── styles/                    # 글로벌 CSS (Tailwind)
  ├── next.config.js            # Next.js 설정
  ├── tsconfig.json             # TypeScript 설정
  └── package.json              # 의존성
  ```

### 11:00~13:00 | Asset Master Phase 2 프로젝트 상세 리뷰
- **목표:** 16개 API, 4개 UI, 실행 전략 완벽 이해

- **Asset Master 핵심 개념:**
  - **자산:** 506개 물리적 기계/설비/JIG/MOULD (마스터 기준일: 2026-03-15)
  - **코드 스킴:** 3단계
    - 1단계: 카테고리 (01-15, 예: 01=UTILITY)
    - 2단계: 자산 클래스 (01.001 ~ 15.NNN)
    - 3단계: 개별 자산 (01.001.001)
  - **물리 태그:** DCMI-UTL-PSF-01 (QR에 인코딩)
  - **다국어:** 영어(시스템), 한국어(입력), 타밀어(현장)

- **DB 테이블 구조 (4개):**
  1. **categories** — 15개 대분류 (카테고리 코드 01-15)
  2. **asset_classes** — ~120개 세부분류 (분류 코드)
  3. **assets** — 506개 자산 메인 테이블
  4. **asset_audit** — 변경 이력 (trigger 기반 자동 기록)

- **API 16개 우선순위 (구현 순서):**
  
  **그룹 1: 조회 (5개, 2026-05-17~18)**
  - `GET /api/assets` — 목록 조회 + 필터 + 검색
  - `GET /api/assets/:id` — 상세 조회
  - `GET /api/asset-categories` — 카테고리 목록
  - `GET /api/assets/:id/audit-log` — 변경 이력
  - `GET /api/assets/locations` — 위치 자동완성

  **그룹 2: CRUD (4개, 병렬)**
  - `POST /api/assets` — 새 자산 추가
  - `PUT /api/assets/:id` — 자산 수정
  - `DELETE /api/assets/:id` — 자산 삭제
  - `POST /api/assets/bulk-update` — 일괄 수정

  **그룹 3: Import (5개, 고급)**
  - `POST /api/assets/import/preview` — Excel 미리보기 (검증)
  - `POST /api/assets/import/execute` — 실행 (bulk insert)
  - `GET /api/assets/import/batches` — Import 배치 이력
  - `GET /api/assets/import/batches/:id` — 특정 배치 상세
  - `GET /api/assets/import/batches/:id/items` — 배치 항목 조회

  **그룹 4: Export & Stats (2개, 마무리)**
  - `GET /api/assets/export/excel` — Excel 다운로드
  - `GET /api/assets/statistics` — 통계 대시보드

- **UI 4개 화면 (React 컴포넌트):**
  1. **자산 목록 페이지** — 검색, 필터, 페이지네이션, 테이블
  2. **자산 상세 페이지** — 정보 표시, QR 코드, 이력 탭
  3. **Import 마법사** — 3단계 (파일 선택 → 미리보기 → 실행)
  4. **통계 대시보드** — 자산 현황 요약 (카테고리별 분포 등)

- **failure_code 드롭다운 (추가 작업):**
  - BM (Breakdown Maintenance) 모듈에서 고장 코드 선택용
  - 별도 테이블 또는 카테고리 연계

- **개발 의존도 분석:**
  - 선행: DB 마이그레이션 (`db/24_asset_master_v2.sql`, 이미 완료 또는 2026-05-17 예정)
  - 병렬: 조회 + CRUD API 동시 개발 가능
  - 순차: Import API → Export & Stats

### 13:00~14:00 | 점심 시간

### 14:00~16:00 | 기존 코드 리뷰 & TypeScript 패턴
- **목표:** dsc-fms-portal의 기존 API/컴포넌트 패턴 이해

- **API 라우팅 패턴 (Next.js 13+ App Router):**
  ```typescript
  // pages/api/assets/route.ts (또는 pages/api/assets.ts)
  import { NextRequest, NextResponse } from 'next/server';
  import { createClient } from '@supabase/supabase-js';
  
  export async function GET(request: NextRequest) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 쿼리 파라미터 처리 (search, filter, page)
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // 검색어
    const category = searchParams.get('category'); // 필터
    
    // Supabase 조회
    let q = supabase
      .from('assets')
      .select('*');
    
    if (query) {
      q = q.or(`name_en.ilike.%${query}%,model.ilike.%${query}%`); // FTS
    }
    if (category) {
      q = q.eq('asset_class_code', category);
    }
    
    const { data, error } = await q.limit(50);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  }
  
  export async function POST(request: NextRequest) {
    const body = await request.json();
    // 새 자산 추가 로직
    // RLS 정책 확인 필수
  }
  ```

- **React 컴포넌트 패턴 (Tailwind CSS):**
  ```typescript
  // components/AssetTable.tsx
  import React, { useState, useEffect } from 'react';
  
  export default function AssetTable() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ search: '', category: '' });
    
    useEffect(() => {
      const fetchAssets = async () => {
        setLoading(true);
        const params = new URLSearchParams(filters);
        const res = await fetch(`/api/assets?${params}`);
        const data = await res.json();
        setAssets(data);
        setLoading(false);
      };
      
      fetchAssets();
    }, [filters]);
    
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">자산 목록</h1>
        
        {/* 필터 섹션 */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="자산명, 모델 검색..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border rounded"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border rounded"
          >
            <option value="">전체 카테고리</option>
            <option value="01">Utility</option>
            <option value="02">Process</option>
            {/* ... */}
          </select>
        </div>
        
        {/* 테이블 */}
        {loading ? (
          <p>로딩 중...</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-4 py-2 text-left">코드</th>
                <th className="border px-4 py-2 text-left">자산명 (EN)</th>
                <th className="border px-4 py-2 text-left">모델</th>
                <th className="border px-4 py-2 text-left">위치</th>
                <th className="border px-4 py-2 text-left">상태</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{asset.machine_asset_code}</td>
                  <td className="border px-4 py-2">{asset.name_en}</td>
                  <td className="border px-4 py-2">{asset.model}</td>
                  <td className="border px-4 py-2">{asset.location}</td>
                  <td className="border px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      asset.status === 'active' ? 'bg-green-200' : 'bg-yellow-200'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }
  ```

- **Supabase RLS (Row Level Security) 정책:**
  - 모든 INSERT/UPDATE/DELETE 시 RLS 검증
  - `auth.uid()` 체크 필수 (사용자 인증)
  - Asset Master 범위: 관리자/기술자만 수정 가능

- **TypeScript 타입 정의 (권장):**
  ```typescript
  // lib/types/asset.ts
  export interface Asset {
    id: string;
    asset_class_code: string;
    machine_asset_code: string; // 01.001.001
    machine_asset_number: string; // DCMI-UTL-PSF-01
    name_en: string;
    name_ko?: string;
    name_ta?: string;
    model?: string;
    make?: string;
    year_of_manufacture?: number;
    location?: string;
    status: 'active' | 'idle' | 'maintenance' | 'sold' | 'scrapped';
    qr_payload: string;
    remark?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
  }
  
  export interface AssetCategory {
    code: string;
    name_en: string;
    name_ko: string;
    name_ta: string;
    display_order: number;
  }
  ```

### 16:00~17:00 | 첫 작업 분배 & 셋업 검증
- **목표:** Day 2 시작할 첫 번째 구현 task 명확화

- **Day 2-3 (2026-05-18~19)에 시작할 첫 작업:**
  - 우선순위 #1-5: 조회 API (5개) — 의존도 높음
  - 권장 할당: 신입자는 조회 API부터 시작 (POST/PUT/DELETE는 나중)
  - 예상 시간: 각 1-2시간, 총 6-8시간 (2일)

- **첫 번째 과제 (2026-05-18 09:00 시작):**
  ```
  Task #1: GET /api/assets (목록 조회)
  - 필터: 카테고리, 위치, 상태
  - 검색: name_en, model, serial_no (FTS)
  - 페이지네이션: limit=50, offset=0
  - 응답: { data: Asset[], total: number, error?: string }
  - 예상 시간: 2~3시간
  - 메멘토 코드리뷰: 2시간 후
  ```

- **개발 환경 최종 검증:**
  - ✅ npm install 완료 (node_modules 500MB+)
  - ✅ npm run dev 실행 (localhost:3000 접근)
  - ✅ .env.local 환경 변수 확인
  - ✅ GitHub 커밋 테스트 (간단한 README 수정)
  - ✅ Vercel 배포 테스트 (자동, PR 반영)

### 17:00~18:00 | Q&A & 팀 소개
- **목표:** 질문 해결, 팀원 소개, 마무리
- **실행:**
  1. 질문 시간 (기술, 프로세스, 도구)
  2. 웹개발자(메멘토)와 1:1 대화
  3. 팀 Slack/Telegram 채널 소개
  4. 내일 일정 확인 (2026-05-18 09:00 API 개발 시작)
  5. 점심/저녁 약속 조율

---

## 🔄 Day 2-3 스케줄 (2026-05-18~19, 09:00~18:00)

### 목표
- ✅ 조회 API 5개 구현 완료 (GET 5개)
- ✅ 코드 리뷰 1회 (메멘토)
- ✅ GitHub 커밋 5개 (1 API = 1 커밋)
- ✅ 테스트 (Postman 또는 curl)

### 일정
| 시간 | 활동 | 결과물 |
|------|------|--------|
| 09:00~11:00 | Task #1-2: GET /assets, GET /assets/:id | 2개 API |
| 11:00~12:00 | 코드 리뷰 (메멘토) | 피드백 |
| 12:00~13:00 | 점심 |  |
| 13:00~15:00 | Task #3-4: GET /categories, /audit-log | 2개 API |
| 15:00 | **진도 리포트** (메멘토에게 제출) | 4개 완료 |
| 15:00~16:00 | 코드 리뷰 (메멘토) | 피드백 |
| 16:00~17:30 | Task #5: GET /locations | 1개 API |
| 17:30~18:00 | 테스트 + 커밋 | 코드 푸시 |

### 예상 산출물
- 5개 API 파일 (route.ts)
- 5개 테스트 케이스 (curl 또는 Postman)
- 5개 GitHub 커밋

---

## 🚀 Day 4-7 스케줄 (2026-05-20~23, 09:00~18:00)

### 목표
- ✅ CRUD API 4개 + Import API 5개 + Export API 1개 (총 10개)
- ✅ **매일 15:00 진도 리포트** (메멘토에게 제출)
- ✅ 모든 API 테스트 완료
- ✅ GitHub 배포 준비 (PR)

### 일정

**Day 4 (2026-05-20, 월요일)**
- 09:00~11:00: Task #6-7 (POST /assets, PUT /assets/:id)
- 11:00~12:00: 코드 리뷰 + 병합
- 12:00~13:00: 점심
- 13:00~15:00: Task #8 (DELETE /assets/:id)
- **15:00: 진도 리포트** (완료: 3개 API)
- 15:00~16:00: 코드 리뷰
- 16:00~17:30: Task #9 (POST /bulk-update)
- 17:30~18:00: 커밋 + 문서화

**Day 5 (2026-05-21, 화요일)**
- 09:00~12:00: Task #10-12 (Import preview, execute, batches)
- 12:00~13:00: 점심
- 13:00~15:00: 계속 구현
- **15:00: 진도 리포트** (완료: 4-5개)
- 15:00~16:00: 코드 리뷰
- 16:00~18:00: 테스트 + 통합

**Day 6 (2026-05-22, 수요일)**
- 09:00~12:00: Task #13-15 (Import items, export, stats)
- 12:00~13:00: 점심
- 13:00~15:00: 계속 구현
- **15:00: 진도 리포트** (완료: 5-6개)
- 15:00~16:00: 코드 리뷰
- 16:00~18:00: 통합 테스트

**Day 7 (2026-05-23, 목요일)**
- 09:00~12:00: UI 컴포넌트 작업 또는 최종 테스트
- 12:00~13:00: 점심
- 13:00~15:00: 최종 점검 + 문서화
- **15:00: 최종 진도 리포트** (완료 현황)
- 15:00~16:00: 메멘토 최종 코드 리뷰
- 16:00~17:00: Vercel 배포 (자동 또는 수동)
- 17:00~18:00: 완료 체크인 + 회고

---

## 📋 체크리스트 (Day 1 필수)

### 액세스 및 도구
- [ ] GitHub 계정 활성화 (`jeepney-auto/dsc-fms-portal` 쓰기 권한)
- [ ] Supabase 계정 (asdf1390a@gmail.com 초대)
- [ ] Vercel 계정 (dsc-fms-portal 프로젝트 배포 권한)
- [ ] Telegram 채팅 (`@asdf1390a` 개인 메시지)
- [ ] Discord (#웹개발-web-dev 채널)

### 개발 환경
- [ ] Node.js 18.17+ 설치 확인 (`node -v`)
- [ ] 저장소 클론 완료
- [ ] `npm install` 완료 (node_modules 생성)
- [ ] `.env.local` 환경 변수 설정 완료
- [ ] `npm run dev` 정상 작동 (localhost:3000 접근)
- [ ] Git 사용자 설정 완료 (`git config user.name/email`)

### 지식 습득
- [ ] DSC FMS Portal 프로젝트 개요 이해
- [ ] Asset Master 모듈 목적 및 범위 이해
- [ ] 16개 API 우선순위 이해
- [ ] 4개 UI 화면 이해
- [ ] Next.js + React + Tailwind 기본 패턴 숙지
- [ ] Supabase PostgREST + RLS 개념 이해

### 첫 작업 준비
- [ ] Task #1 (GET /api/assets) 스펙 이해
- [ ] 메멘토(웹개발자)와 Daily Standup 시간 약속 (09:00 권장)
- [ ] 진도 리포트 제출 방법 확인 (매일 15:00)

---

## 🎓 학습 자료 & 참고

### Next.js + Supabase 문서
- **Next.js 14 공식 문서:** https://nextjs.org/docs
- **Supabase 완전 가이드:** https://supabase.com/docs
- **Supabase RLS 정책:** https://supabase.com/docs/guides/auth/row-level-security

### 코딩 패턴
- **기존 코드 리뷰:** dsc-fms-portal/pages/api/ 디렉토리의 기존 API
- **컴포넌트 예시:** dsc-fms-portal/components/ 디렉토리
- **스타일링:** Tailwind CSS 클래스 + 기존 컴포넌트 참고

### 의사소통
- **Telegram:** 비상 연락용 (응답 빠름)
- **Discord:** 팀 논의 + 기술 공유 (#웹개발-web-dev)
- **GitHub Issues:** 버그 추적 + Task 관리

---

## 🎯 Day 1 후 체크인

**Day 1 마지막 (17:00~18:00)에 확인:**
1. 개발 환경 100% 작동하는가?
2. GitHub 첫 커밋 (간단한 파일 수정)이 성공했는가?
3. npm run dev로 localhost:3000 열리는가?
4. 메멘토와 Daily Standup 시간이 정해졌는가?
5. Task #1 스펙을 명확히 이해했는가?

**"모두 준비 완료!" → Day 2 09:00 Task #1 시작**

---

## 📞 긴급 연락처

| 역할 | 이름 | Telegram | Discord | GitHub |
|------|------|----------|---------|--------|
| 메멘토 (웹개발자) | TBD | @TBD | web-dev | web-builder |
| 비서 | 비서 | @asdf1390a | #비서-secretary | - |
| 평가자 | TBD | @TBD | #평가자-evaluator | evaluator |
| 팀 채널 | 전체 | - | #웹개발-web-dev | - |

---

## 📝 notes

- **메멘토 (수평 관계):** 웹개발자가 기술 리더. 코드 리뷰, 아키텍처 결정, 문제 해결 주도.
- **자율성:** Day 2부터는 개인이 Task를 주도적으로 진행. 막히면 Slack/Telegram으로 즉시 보고.
- **진도 리포트:** 매일 15:00 메멘토에게 현황 정리하여 보고. (Day 4-7)
- **일정 변경 가능:** 실제 진도에 따라 Task 순서나 일정 조정 가능. 유연하게 진행.

**성공의 열쇠:** 명확한 스펙 이해 + 빠른 첫 구현 + 정기적 코드 리뷰 + 자율적 진도 관리
