import { useState, useEffect } from 'react';
import styles from '@/styles/pages/cost-budget.module.css';

export default function CostBudgetPortal() {
  const categories = ['재료비', '인건비', '운영비'];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState(null);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, selectedCategory, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        pageSize,
        category: selectedCategory,
        search,
      });
      const res = await fetch(`/api/cost-budget?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setSummary(json.summary);
      setTotalPages(json.pagination?.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const csv = [
      ['카테고리', '항목명', '집행액', '예산액', '차액', '상태'].join(','),
      ...data.map((item) =>
        [
          item.category,
          item.item_name,
          item.amount,
          item.budget,
          item.variance,
          item.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-budget-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>💰 경비 포털</h1>

      {/* 요약 정보 */}
      {summary && (
        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <label>총 집행액</label>
            <span className={styles.value}>
              {(summary.totalAmount || 0).toLocaleString()} 원
            </span>
          </div>
          <div className={styles.summaryItem}>
            <label>총 예산액</label>
            <span className={styles.value}>
              {(summary.totalBudget || 0).toLocaleString()} 원
            </span>
          </div>
          <div className={styles.summaryItem}>
            <label>차액</label>
            <span className={`${styles.value} ${summary.variance > 0 ? styles.over : styles.under}`}>
              {(summary.variance || 0).toLocaleString()} 원
            </span>
          </div>
        </div>
      )}

      {/* 필터 및 검색 */}
      <div className={styles.filterBar}>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">전체 카테고리</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="항목명 검색..."
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

        <button onClick={handleDownloadCSV} className={styles.downloadBtn}>
          📥 CSV 다운로드
        </button>
      </div>

      {/* 데이터 테이블 */}
      {loading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>카테고리</th>
                <th>항목명</th>
                <th className={styles.numeric}>집행액</th>
                <th className={styles.numeric}>예산액</th>
                <th className={styles.numeric}>차액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.category}</td>
                  <td>{item.item_name}</td>
                  <td className={styles.numeric}>{(item.amount || 0).toLocaleString()}</td>
                  <td className={styles.numeric}>{(item.budget || 0).toLocaleString()}</td>
                  <td className={`${styles.numeric} ${item.variance > 0 ? styles.over : styles.under}`}>
                    {(item.variance || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[item.status]}`}>
                      {item.status === 'over_budget' ? '초과' : '정상'}
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
