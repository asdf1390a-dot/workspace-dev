'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AuditData {
  assetId: string;
  statistics: {
    totalChanges: number;
    uniqueUsers: number;
    topChangedFields: Array<{ field: string; count: number }>;
    firstChangeAt: string | null;
    lastChangeAt: string | null;
  };
  editHistory: Array<{
    id: number;
    changed_field: string;
    previous_value: string;
    new_value: string;
    changed_at: string;
  }>;
}

interface AssetAuditContentProps {
  assetId: string;
}

export default function AssetAuditContent({ assetId }: AssetAuditContentProps) {
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAudit();
  }, [assetId]);

  async function fetchAudit() {
    try {
      setLoading(true);
      const response = await fetch(`/api/assets/${assetId}/edit-tracking`);
      if (!response.ok) throw new Error('Failed to fetch audit data');
      const data = await response.json();
      setAudit(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-8">로딩 중...</div>;
  if (error) return <div className="text-red-600 py-8">오류: {error}</div>;
  if (!audit) return <div className="text-slate-500 py-8">데이터 없음</div>;

  const stats = audit.statistics;

  return (
    <div className="space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-slate-600 text-sm">총 변경 횟수</p>
            <p className="text-3xl font-bold mt-2">{stats.totalChanges}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-slate-600 text-sm">변경 사용자 수</p>
            <p className="text-3xl font-bold mt-2">{stats.uniqueUsers}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-slate-600 text-sm">첫 변경</p>
            <p className="text-sm font-mono mt-2">
              {stats.firstChangeAt
                ? format(new Date(stats.firstChangeAt), 'MMM dd, yyyy', { locale: ko })
                : 'N/A'}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-slate-600 text-sm">마지막 변경</p>
            <p className="text-sm font-mono mt-2">
              {stats.lastChangeAt
                ? format(new Date(stats.lastChangeAt), 'MMM dd, yyyy', { locale: ko })
                : 'N/A'}
            </p>
          </div>
        </Card>
      </div>

      {/* Top Changed Fields */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">자주 변경된 필드 (상위 5개)</h3>
        {stats.topChangedFields.length === 0 ? (
          <p className="text-slate-500">변경 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {stats.topChangedFields.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-mono text-sm text-blue-600">{field.field}</span>
                <div className="flex-1 mx-4 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (field.count / (stats.topChangedFields[0]?.count || 1)) * 100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-slate-600 text-sm font-semibold w-8 text-right">
                  {field.count}회
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Changes */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">최근 변경 (상위 10개)</h3>
        {audit.editHistory.length === 0 ? (
          <p className="text-slate-500">변경 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {audit.editHistory.slice(0, 10).map((entry, idx) => (
              <div key={idx} className="text-sm border-l-2 border-blue-500 pl-4 py-2">
                <p className="font-semibold">{entry.changed_field}</p>
                <p className="text-slate-600 text-xs mt-1">
                  {format(new Date(entry.changed_at), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
