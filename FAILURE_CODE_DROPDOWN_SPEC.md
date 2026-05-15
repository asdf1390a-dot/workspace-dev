# 📋 failure_code 드롭다운 구현 명세

**Task ID:** FAILURE-CODE-001  
**담당:** 신규팀원  
**예상 시간:** 2~3시간  
**난이도:** ⭐⭐ (초중급)  
**데드라인:** 2026-05-19 17:00

---

## 🎯 목표

Asset Master Phase 2에서 사용할 **failure_code 드롭다운** UI 컴포넌트와 API 엔드포인트를 구현한다.

---

## 📝 요구사항

### Part 1: API 엔드포인트 (1시간)

**엔드포인트:** `GET /api/failure-codes`

**응답 포맷:**
```json
[
  {
    "id": 1,
    "code": "FC001",
    "name": "기계 고장",
    "category": "equipment"
  },
  {
    "id": 2,
    "code": "FC002",
    "name": "전기 고장",
    "category": "electrical"
  }
]
```

**구현 규칙:**
1. Supabase `failure_codes` 테이블에서 조회
2. 필드: `id`, `code`, `name`, `category`
3. 정렬: `code` 오름차순
4. 에러 핸들링: 500 응답 (에러 메시지 포함)

**테스트 방법:**
```bash
curl http://localhost:3000/api/failure-codes
```

---

### Part 2: React 컴포넌트 (1.5시간)

**파일:** `components/FailureCodeDropdown.js`

**Props:**
```javascript
{
  value: string,          // 현재 선택된 코드 ('FC001' 등)
  onChange: function,     // 선택 변경 시 콜백 (value 전달)
  disabled?: boolean,     // 비활성화 여부 (기본: false)
  error?: string         // 에러 메시지 (기본: 없음)
}
```

**동작:**
1. 마운트 시 API 호출 → 코드 목록 로드
2. 드롭다운에 항목 표시
3. 사용자가 선택하면 `onChange` 콜백 호출
4. 로딩 중이면 "Loading..." 표시

**스타일:**
- TailwindCSS 사용 (프로젝트 패턴 참고)
- 라벨: "Failure Code"
- 기본 선택지: "-- Select a failure code --"
- 포커스 상태: 파란색 테두리 (ring-2 ring-blue-500)

**예제 코드 구조:**
```jsx
export default function FailureCodeDropdown({
  value,
  onChange,
  disabled = false,
  error = null
}) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API 호출 로직
  }, []);

  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold mb-2">
        Failure Code
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className="..."
      >
        {/* 옵션 렌더링 */}
      </select>
      {loading && <span className="text-gray-500 text-xs mt-1">Loading...</span>}
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  );
}
```

---

### Part 3: 테스트 (30분)

#### 3.1 수동 테스트

**체크리스트:**
- [ ] 개발 서버에서 컴포넌트 렌더링됨 (http://localhost:3000)
- [ ] API 응답이 올바른 포맷 (curl 테스트)
- [ ] 드롭다운에 항목이 모두 표시됨
- [ ] 선택했을 때 `onChange` 호출됨 (브라우저 console에 로그)
- [ ] 로딩 상태가 표시되었다가 사라짐

#### 3.2 브라우저 호환성

**최소 요구사항:**
- Chrome/Firefox (최신)
- Safari (최신)
- 모바일: iPhone Safari (최신 2개 버전)

**키보드 네비게이션:**
- ↑↓ 화살표로 항목 선택 가능
- Enter로 확인 가능

#### 3.3 간단한 유닛 테스트 (선택)

```javascript
// __tests__/FailureCodeDropdown.test.js
import { render, screen } from '@testing-library/react';
import FailureCodeDropdown from '../components/FailureCodeDropdown';

describe('FailureCodeDropdown', () => {
  it('renders the component', () => {
    render(<FailureCodeDropdown value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Failure Code')).toBeInTheDocument();
  });

  // 추가 테스트...
});
```

---

## 🔗 참고 자료

| 자료 | 용도 |
|-----|------|
| `NEW_TEAM_MEMBER_STARTUP_GUIDE.md` | 코드 샘플 & 패턴 |
| `ASSET_MASTER_PHASE2_DESIGN.md` | 전체 설계 (failure_code 섹션) |
| `CLAUDE.md` | 코딩 규칙 & 컨벤션 |

---

## ✅ 완료 기준

**"완료"는 다음 모두를 만족할 때:**

1. ✅ API 엔드포인트가 정상 응답 (테스트됨)
2. ✅ 컴포넌트가 렌더링되고 드롭다운 선택 가능
3. ✅ 모바일 Safari에서 기본 동작 확인
4. ✅ 키보드 네비게이션 가능
5. ✅ Git에 커밋됨 (커밋 메시지: `feat: implement failure code dropdown`)

---

## 📞 막힐 때

| 문제 | 해결책 |
|------|--------|
| API 응답이 안 옴 | Supabase 자격증명 확인 + DB 테이블 존재 확인 |
| TailwindCSS 스타일이 안 먹음 | `npm run dev` 재시작 |
| 컴포넌트가 렌더링 안 됨 | 브라우저 콘솔 에러 메시지 확인 |
| 드롭다운이 텅 비어있음 | API 응답 데이터 확인 (Network 탭) |

---

## 🚀 제출 방법

1. **커밋:**
   ```bash
   git add .
   git commit -m "feat: implement failure code dropdown"
   git push origin <branch-name>
   ```

2. **웹개발자에게 보고:**
   - PR 링크 또는 브랜치명
   - 테스트 결과 (완료 체크리스트 표기)
   - 문제 사항 (있으면)

---

**예상 완료:** 2026-05-18 또는 2026-05-19  
**검수자:** 웹개발자  
**배포:** Feature branch → Main branch (웹개발자 검수 후)
