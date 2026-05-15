# 🚀 신규팀원 시작 가이드 (2페이지)

**목표:** Day 1 (09:00~10:30) 환경 세팅 후 바로 작업 시작 가능하도록  
**시간:** 2시간 이내에 읽고 실행 가능하도록 압축

---

## 📋 Page 1: 환경 세팅 + 필수 개념

### 1️⃣ 환경 세팅 (30분)

```bash
# 1. 리포지토리 클론
git clone <repo-url>
cd dsc-fms-portal

# 2. 디펜던시 설치
npm install

# 3. .env.local 설정 (웹개발자에게 받기)
# 필요한 변수:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# 4. 개발 서버 시작
npm run dev

# 5. 브라우저에서 확인
# http://localhost:3000
```

### 2️⃣ 프로젝트 폴더 구조 (5분)

```
dsc-fms-portal/
├── pages/             ← Next.js 라우팅 (페이지)
├── components/        ← React 컴포넌트 (UI)
├── api/               ← 백엔드 API 레이어
├── db/                ← 데이터베이스 마이그레이션 스크립트
├── lib/               ← 유틸리티 함수
├── hooks/             ← Custom React Hooks
├── types/             ← TypeScript 타입 정의
└── public/            ← 정적 파일
```

### 3️⃣ 기술 스택 (5분)

| 항목 | 기술 |
|-----|------|
| **프론트엔드** | Next.js 14 + React 18 + TailwindCSS |
| **백엔드** | Supabase (PostgreSQL) |
| **배포** | Vercel |
| **언어** | TypeScript |
| **상태관리** | React Hooks + Context API |

### 4️⃣ 데이터 구조: failure_code (5분)

**DB 테이블: `failure_codes`** (코드 샘플)

```sql
-- 테이블 구조
CREATE TABLE failure_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,     -- 'FC001', 'FC002', ...
  name VARCHAR(100) NOT NULL,            -- '기계고장', '전기고장', ...
  category VARCHAR(50),                  -- 'equipment', 'electrical', ...
  created_at TIMESTAMP DEFAULT NOW()
);

-- 예제 데이터
INSERT INTO failure_codes (code, name, category) VALUES
  ('FC001', '기계 고장', 'equipment'),
  ('FC002', '전기 고장', 'electrical'),
  ('FC003', '툴 손상', 'tooling'),
  ... (14개 총)
```

**API 엔드포인트:**
```
GET /api/failure-codes
응답: [
  { id: 1, code: 'FC001', name: '기계 고장', category: 'equipment' },
  { id: 2, code: 'FC002', name: '전기 고장', category: 'electrical' },
  ...
]
```

---

## 📋 Page 2: 코드 샘플 + Task 명세

### 5️⃣ UI 컴포넌트 패턴 (React)

**예제: failure_code 드롭다운 컴포넌트**

```jsx
// components/FailureCodeDropdown.js
import { useState, useEffect } from 'react';

export default function FailureCodeDropdown({ value, onChange }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API 호출
    fetch('/api/failure-codes')
      .then(res => res.json())
      .then(data => {
        setCodes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load failure codes:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold mb-2">
        Failure Code
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Select a failure code --</option>
        {codes.map(code => (
          <option key={code.id} value={code.code}>
            [{code.code}] {code.name}
          </option>
        ))}
      </select>
      {loading && <span className="text-gray-500 text-xs mt-1">Loading...</span>}
    </div>
  );
}
```

**사용 예제:**
```jsx
// pages/some-form.js
import FailureCodeDropdown from '../components/FailureCodeDropdown';

export default function SomeForm() {
  const [failureCode, setFailureCode] = useState('');

  return (
    <form>
      <FailureCodeDropdown
        value={failureCode}
        onChange={setFailureCode}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 6️⃣ API 엔드포인트 패턴 (Supabase)

**예제: failure_codes 조회**

```javascript
// pages/api/failure-codes.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('failure_codes')
      .select('id, code, name, category')
      .order('code', { ascending: true });

    if (error) throw error;

    return res.status(200).json(data);
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
```

### 7️⃣ TailwindCSS 스타일 (자주 쓰는 패턴)

```jsx
// 입력 필드
<input className="px-3 py-2 border border-gray-300 rounded-md text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500" />

// 버튼 (기본)
<button className="px-4 py-2 bg-blue-500 text-white rounded-md
                   hover:bg-blue-600 transition-colors" />

// 버튼 (위험)
<button className="px-4 py-2 bg-red-500 text-white rounded-md
                   hover:bg-red-600" />

// 테이블 헤더
<th className="px-4 py-3 bg-gray-100 border border-gray-300
               text-left text-sm font-semibold" />
```

---

## ✅ Task: failure_code 드롭다운 구현

**자세한 명세:** [`FAILURE_CODE_DROPDOWN_SPEC.md`](./FAILURE_CODE_DROPDOWN_SPEC.md)

### 요구사항 (짧은 버전)
1. **API 완성:** `/api/failure-codes` GET 엔드포인트
   - DB 테이블에서 모든 코드 조회
   - 응답 포맷: `[{ id, code, name, category }, ...]`

2. **UI 완성:** `components/FailureCodeDropdown.js`
   - API 호출하여 드롭다운에 데이터 로드
   - 선택 변경 시 `onChange` 콜백 호출
   - 로딩 상태 표시

3. **테스트:** 간단한 유닛 테스트
   - API 응답이 올바른 포맷인지
   - 드롭다운이 데이터를 올바르게 표시하는지

4. **체크리스트:**
   - [ ] API 엔드포인트 테스트 (curl 또는 Postman)
   - [ ] 컴포넌트가 브라우저에서 렌더링되는지 확인
   - [ ] 키보드 네비게이션 (↑↓ 화살표, Enter)
   - [ ] 모바일 Safari 호환성 (최소 기본 동작)

---

## 🔗 중요 참고 문서

| 문서 | 용도 |
|-----|------|
| `ASSET_MASTER_PHASE2_DESIGN.md` | 전체 설계 이해 (자습) |
| `ASSET_MASTER_PHASE2_API_GUIDE.md` | API 설계 상세 스펙 |
| `FAILURE_CODE_DROPDOWN_SPEC.md` | failure_code Task 상세 명세 |
| `CLAUDE.md` | 개발 규칙 & 컨벤션 |

---

## 💬 막힐 때

1. **환경 세팅 안 됨:** 웹개발자에게 `.env.local` 파일 요청
2. **API 응답이 안 옴:** Supabase 자격증명 확인 + `/api/failure-codes` 직접 테스트
3. **컴포넌트 렌더링 안 됨:** 브라우저 콘솔 확인 + 웹개발자 질문
4. **TailwindCSS 스타일 안 먹음:** `npm run dev` 재시작

---

**준비 완료되면 웹개발자와 함께 Day 1 진행!**  
*문제 생기면 언제든 질문하세요.*
