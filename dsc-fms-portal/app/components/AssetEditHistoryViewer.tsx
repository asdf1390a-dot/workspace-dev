'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface EditEntry {
  id: number;
  changed_by: { id: string; name: string };
  changed_field: string;
  previous_value: string;
  new_value: string;
  changed_at: string;
}

interface AssetEditHistoryViewerProps {
  assetId: string;
  limit?: number;
  showDiff?: boolean;
  exportFormat?: 'json' | 'csv' | 'pdf';
}

export default function AssetEditHistoryViewer({
  assetId,
  limit = 50,
  showDiff = true,
  exportFormat = 'json',
}: AssetEditHistoryViewerProps) {
  const [entries, setEntries] = useState<EditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: (page * limit).toString(),
          ...(filter && { field: filter }),
        });

        const response = await fetch(`/api/assets/${assetId}/edit-history?${params}`);
        if (!response.ok) throw new Error('Failed to fetch edit history');

        const data = await response.json();
        setEntries(data.entries || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [assetId, limit, page, filter]);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/audit-reports/export-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId,
          format: exportFormat,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edit-history-${assetId}.${exportFormat === 'csv' ? 'csv' : 'json'}`;
      a.click();
    } catch (err) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">로딩 중...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">오류: {error}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">편집 이력</h2>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다운로드
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="필드 검색..."
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
          className="flex-1 px-3 py-2 border rounded"
        />
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-gray-500">편집 이력이 없습니다.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="border rounded p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{entry.changed_field}</p>
                  <p className="text-sm text-gray-600">
                    편집자: {entry.changed_by.name} · {format(new Date(entry.changed_at), 'yyyy-MM-dd HH:mm:ss')}
                  </p>
                </div>
              </div>
              {showDiff && (
                <div className="mt-2 text-sm space-y-1">
                  <p className="text-red-600">이전: {entry.previous_value || '(없음)'}</p>
                  <p className="text-green-600">새값: {entry.new_value || '(없음)'}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          이전
        </button>
        <span className="text-sm text-gray-600">페이지 {page + 1}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={entries.length < limit}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}
