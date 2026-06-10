import { useState, useEffect } from 'react';
import styles from '@/styles/pages/productivity.module.css';

export default function ProductivityPortal() {
  const sheets = [
    '생산성 집계',
    '투입시간',
    'IDLE',
    'MANPOWER',
    'MAN',
    '생산성',
    'CT기준정보',
    '검수수불',
  ];

  const [activeSheet, setActiveSheet] = useState(sheets[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchData();
  }, [activeSheet, page, pageSize, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        search,
      });
      const res = await fetch(`/api/productivity/${activeSheet}?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setTotalPages(json.pagination?.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📊 생산성 포털</h1>

      {/* 시트 탭 */}
      <div className={styles.tabs}>
        {sheets.map((sheet) => (
          <button
            key={sheet}
            className={`${styles.tab} ${activeSheet === sheet ? styles.active : ''}`}
            onClick={() => {
              setActiveSheet(sheet);
              setPage(1);
            }}
          >
            {sheet}
          </button>
        ))}
      </div>

      {/* 검색 바 */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="검색..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value={10}>10행</option>
          <option value={20}>20행</option>
          <option value={50}>50행</option>
          <option value={100}>100행</option>
        </select>
      </div>

      {/* 데이터 테이블 */}
      {loading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>값</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>{row.data?.id}</td>
                  <td>{row.data?.name}</td>
                  <td className={styles.number}>{row.data?.value?.toLocaleString()}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[row.data?.status]}`}>
                      {row.data?.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          <div className={styles.pagination}>
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              이전
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
