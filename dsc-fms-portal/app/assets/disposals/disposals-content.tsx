'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Disposal {
  id: number;
  asset_id: string;
  disposed_by: string;
  disposal_reason: string;
  disposal_date: string;
  disposal_certificate_url: string | null;
  created_at: string;
}

export default function DisposalsContent() {
  const [disposals, setDisposals] = useState<Disposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ offset: 0, limit: 20, total: 0 });

  useEffect(() => {
    fetchDisposals();
  }, [pagination.offset]);

  async function fetchDisposals() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });
      const response = await fetch(`/api/asset-audit/disposals?${params}`);
      if (!response.ok) throw new Error('Failed to fetch disposals');
      const data = await response.json();
      setDisposals(data.data);
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
          <h2 className="text-xl font-semibold">총 {pagination.total}개 폐기 자산</h2>
        </div>

        {disposals.length === 0 ? (
          <p className="text-slate-500">폐기된 자산이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="text-left py-2 px-4 font-semibold">자산 ID</th>
                  <th className="text-left py-2 px-4 font-semibold">폐기 사유</th>
                  <th className="text-left py-2 px-4 font-semibold">폐기 일자</th>
                  <th className="text-left py-2 px-4 font-semibold">폐기자</th>
                  <th className="text-left py-2 px-4 font-semibold">증명서</th>
                </tr>
              </thead>
              <tbody>
                {disposals.map((disposal) => (
                  <tr key={disposal.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs text-blue-600">
                      {disposal.asset_id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4">{disposal.disposal_reason}</td>
                    <td className="py-3 px-4">
                      {format(new Date(disposal.disposal_date), 'yyyy-MM-dd', { locale: ko })}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {disposal.disposed_by.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      {disposal.disposal_certificate_url ? (
                        <a
                          href={disposal.disposal_certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          다운로드
                        </a>
                      ) : (
                        <span className="text-slate-400">없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
