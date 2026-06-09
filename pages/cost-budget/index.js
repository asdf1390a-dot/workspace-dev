import { useState, useEffect } from 'react';
import styles from '@/styles/pages/cost-budget.module.css';

export default function CostBudgetPortal() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('category');
  const [order, setOrder] = useState('asc');
  const [sums, setSums] = useState({});
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setPage(1);
    fetchData();
  }, [search, category, sort, order]);

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pageSize,
        ...(search && { search }),
        ...(category && { category }),
        sort,
        order
      });

      const res = await fetch(`/api/cost-budget?${params}`);
      const json = await res.json();

      if (json.error) throw new Error(json.error);

      setData(json.data);
      setSums(json.sums);
      setTotal(json.pagination.total);

      if (categories.length === 0 && json.data.length > 0) {
        const uniqueCategories = [...new Set(json.data.map(row => row.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('데이터 조회 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const headers = ['category', 'column_2', 'amount_2023', 'percent_2023', 'amount_2024', 'percent_2024', 'increase_amount', 'increase_rate', 'reason_for_change', 'jan', 'feb', 'mar', 'apr', 'may', 'jun'];
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h] || '';
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cost-budget-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && !k.includes('created') && !k.includes('updated')) : [];
  const pages = Math.ceil(total / pageSize);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>💰 경비/예산 포털</h1>
        <p>월별 경비 계획 및 실적 현황</p>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="🔍 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select value={category} onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}>
            <option value="">전체 항목</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className={styles.actionGroup}>
          <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))}>
            <option value={10}>10행</option>
            <option value={20}>20행</option>
            <option value={50}>50행</option>
            <option value={100}>100행</option>
          </select>

          <div className={styles.sortControls}>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="category">항목명</option>
              {columns.filter(col => col.includes('amount') || col.includes('rate')).map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <button onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}>
              {order === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <button className={styles.downloadBtn} onClick={downloadCSV}>
            📥 CSV 다운로드
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
                  <>
                    {data.map((row, idx) => (
                      <tr key={idx}>
                        {columns.map(col => (
                          <td key={`${idx}-${col}`}>
                            {typeof row[col] === 'number' ? row[col].toLocaleString() : (row[col] || '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className={styles.sumRow}>
                      <td colSpan={2} style={{ fontWeight: 'bold' }}>합계</td>
                      {columns.slice(2).map(col => (
                        <td key={`sum-${col}`} className={styles.sumCell}>
                          {sums[col] ? sums[col].toLocaleString() : '-'}
                        </td>
                      ))}
                    </tr>
                  </>
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
