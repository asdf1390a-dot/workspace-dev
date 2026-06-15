'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EditHistoryEntry {
  id: number;
  asset_id: string;
  changed_by: string;
  changed_field: string;
  previous_value: string;
  new_value: string;
  changed_at: string;
}

interface AssetHistoryContentProps {
  assetId: string;
}

export default function AssetHistoryContent({ assetId }: AssetHistoryContentProps) {
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ offset: 0, limit: 20, total: 0 });

  useEffect(() => {
    fetchHistory();
  }, [pagination.offset]);

  async function fetchHistory() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        assetId,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });
      const response = await fetch(`/api/asset-audit/edit-history?${params}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data.data);
      setPagination(prev => ({ ...prev, total: data.pagination.total }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-8">로딩 중...</div>;
  if (error) return <div className="text-red-600 py-8">오류: {error}</div>;

  const hasMore = pagination.offset + pagination.limit < pagination.total;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">총 {pagination.total}개 변경 기록</h2>
        </div>

        {history.length === 0 ? (
          <p className="text-slate-500">편집 이력이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">필드: {entry.changed_field}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      변경자: {entry.changed_by.substring(0, 8)}...
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(entry.changed_at), {
                      locale: ko,
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="mt-2 text-sm space-y-1">
                  <p className="text-slate-600">
                    이전: <span className="font-mono bg-red-50 px-2 py-1 rounded">{entry.previous_value}</span>
                  </p>
                  <p className="text-slate-600">
                    변경: <span className="font-mono bg-green-50 px-2 py-1 rounded">{entry.new_value}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <span className="text-sm text-slate-600">
              {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} / {pagination.total}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.offset === 0}
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
