'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface DisposedAsset {
  id: number;
  asset_id: string;
  asset_name: string;
  disposal_reason: string;
  disposal_date: string;
  disposal_certificate_url?: string;
  disposed_by: string;
  created_at: string;
}

interface DateRange {
  from: string;
  to: string;
}

interface DisposedAssetsTableProps {
  dateRange?: DateRange;
  reasonFilter?: string;
  pageSize?: number;
}

export default function DisposedAssetsTable({
  dateRange,
  reasonFilter,
  pageSize = 20,
}: DisposedAssetsTableProps) {
  const [assets, setAssets] = useState<DisposedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const reasons = ['수명만료', '손상', '판매', '기증', '기타'];

  useEffect(() => {
    const fetchDisposed = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          limit: pageSize.toString(),
          offset: (page * pageSize).toString(),
          ...(dateRange?.from && { date_from: dateRange.from }),
          ...(dateRange?.to && { date_to: dateRange.to }),
          ...(reasonFilter && { reason: reasonFilter }),
        });

        const response = await fetch(`/api/assets/disposed?${params}`);
        if (!response.ok) throw new Error('데이터 로드 실패');

        const data = await response.json();
        setAssets(data.disposals || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    fetchDisposed();
  }, [page, pageSize, dateRange, reasonFilter]);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/audit-reports/export-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom: dateRange?.from,
          dateTo: dateRange?.to,
          format: 'csv',
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `disposed-assets-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (err) {
      alert('Export failed');
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">로딩 중...</div>;

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">폐기된 자산 ({total})</h2>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          CSV 내보내기
        </button>
      </div>

      {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-3 py-2 text-left">자산명</th>
              <th className="px-3 py-2 text-left">폐기 사유</th>
              <th className="px-3 py-2 text-left">폐기 날짜</th>
              <th className="px-3 py-2 text-left">증명서</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                  폐기된 자산이 없습니다.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{asset.asset_name}</td>
                  <td className="px-3 py-2">{asset.disposal_reason}</td>
                  <td className="px-3 py-2">{format(new Date(asset.disposal_date), 'yyyy-MM-dd')}</td>
                  <td className="px-3 py-2">
                    {asset.disposal_certificate_url ? (
                      <a
                        href={asset.disposal_certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        보기
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          이전
        </button>
        <span className="text-sm text-gray-600">
          페이지 {page + 1} / {Math.ceil(total / pageSize)}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= Math.ceil(total / pageSize) - 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}
