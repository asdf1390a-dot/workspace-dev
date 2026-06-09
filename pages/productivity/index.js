import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/pages/productivity.module.css';

const sheets = [
  { id: 'productivity-summary', label: '생산성 집계', icon: '📊' },
  { id: 'investment-hours', label: '투입시간', icon: '⏱️' },
  { id: 'idle-time', label: '02-IDLE', icon: '⏸️' },
  { id: 'manpower', label: 'MANPOWER', icon: '👥' },
  { id: 'man', label: 'MAN', icon: '👤' },
  { id: 'productivity', label: 'PRODUCTIVITY', icon: '📈' },
  { id: 'ct-standard-info', label: 'CT기준정보', icon: '⚙️' },
  { id: 'inspection-payment', label: '검수수불', icon: '✅' }
];

export default function ProductivityPortal() {
  const router = useRouter();
  const { sheet: activeSheet = 'productivity-summary' } = router.query;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    if (!activeSheet) return;
    setPage(1);
    fetchData();
  }, [activeSheet, search, sort, order]);

  useEffect(() => {
    if (!activeSheet) return;
    fetchData();
  }, [page, pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pageSize,
        ...(search && { search }),
        ...(sort && { sort }),
        order
      });

      const res = await fetch(`/api/productivity/${activeSheet}?${params}`);
      const json = await res.json();

      if (json.error) throw new Error(json.error);

      setData(json.data);
      setTotal(json.pagination.total);
    } catch (error) {
      console.error('Fetch error:', error);
      alert('데이터 조회 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && !k.includes('created') && !k.includes('updated')) : [];

  const pages = Math.ceil(total / pageSize);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📊 생산성 관리 포털</h1>
        <p>DSC 만누르공장 생산성 대시보드 데이터 조회</p>
      </div>

      {/* Sheet Tabs */}
      <div className={styles.sheetTabs}>
        {sheets.map(s => (
          <button
            key={s.id}
            className={`${styles.sheetTab} ${activeSheet === s.id ? styles.active : ''}`}
            onClick={() => {
              router.push(`/productivity?sheet=${s.id}`);
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.search}>
          <input
            type="text"
            placeholder="🔍 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))}>
          <option value={10}>10행</option>
          <option value={20}>20행</option>
          <option value={50}>50행</option>
          <option value={100}>100행</option>
        </select>

        <div className={styles.sortControls}>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="">정렬 없음</option>
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <button onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}>
            {order === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map(col => (
                        <td key={`${idx}-${col}`}>
                          {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} style={{ textAlign: 'center' }}>데이터가 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ← 이전
            </button>

            <span>페이지 {page} / {pages} (전체 {total}행)</span>

            <button
              disabled={page >= pages || loading}
              onClick={() => setPage(p => (p < pages ? p + 1 : p))}
            >
              다음 →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
