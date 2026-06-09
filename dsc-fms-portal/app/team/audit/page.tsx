'use client';

import { useState, useEffect } from 'react';
import { Shield, Filter, Download } from 'lucide-react';

interface AuditEntry {
  id: string;
  activityType: string;
  actorName: string;
  targetType: string;
  targetName: string;
  createdAt: string;
  changes?: any[];
  reason?: string;
}

function getActionColor(action: string, status: string) {
  if (status === 'failed') return 'bg-red-100 text-red-800';
  if (status === 'warning') return 'bg-yellow-100 text-yellow-800';

  switch (action) {
    case 'CREATED':
      return 'bg-green-100 text-green-800';
    case 'UPDATED':
      return 'bg-blue-100 text-blue-800';
    case 'DELETED':
      return 'bg-red-100 text-red-800';
    case 'ALLOCATED':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return '✓';
    case 'failed':
      return '✗';
    case 'warning':
      return '⚠';
    default:
      return '•';
  }
}

function getTargetTypeColor(type: string) {
  switch (type) {
    case 'member':
      return 'bg-blue-50 text-blue-900';
    case 'project':
      return 'bg-green-50 text-green-900';
    case 'allocation':
      return 'bg-purple-50 text-purple-900';
    case 'system':
      return 'bg-gray-50 text-gray-900';
    default:
      return 'bg-gray-50 text-gray-900';
  }
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/team/audit/logs?days=7&limit=50');
        const data = await res.json();
        setLogs(data.data || []);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLog = logs.filter((entry) => {
    if (filterType !== 'all' && entry.targetType !== filterType) return false;
    if (filterAction !== 'all' && entry.activityType !== filterAction) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-orange-600" />
            감시 로그
          </h1>
          <p className="text-slate-600 mt-1">시스템 활동 및 변경 이력 추적</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Download className="w-4 h-4" />
          내보내기
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Filter className="w-4 h-4 inline mr-2" />
            대상 유형
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">모든 유형</option>
            <option value="member">팀원</option>
            <option value="project">프로젝트</option>
            <option value="allocation">배분</option>
            <option value="system">시스템</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            활동 유형
          </label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">모든 활동</option>
            <option value="CREATED">생성</option>
            <option value="UPDATED">수정</option>
            <option value="DELETED">삭제</option>
            <option value="ALLOCATED">배분</option>
            <option value="FAILED">실패</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-slate-200 rounded-lg h-20 animate-pulse" />
            ))}
          </div>
        ) : filteredLog.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-500">감시 로그 데이터 없음</p>
          </div>
        ) : (
          filteredLog.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full text-left p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-300">•</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getActionColor(entry.activityType, 'success')}`}>
                            {entry.activityType}
                          </span>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTargetTypeColor(entry.targetType)}`}>
                            {entry.targetType}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900">{entry.targetName}</h3>
                        <p className="text-sm text-slate-600 mt-1">{entry.actorName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>

                {expandedId === entry.id && entry.changes && entry.changes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 text-sm mb-3">변경 사항:</h4>
                    <div className="space-y-2">
                      {entry.changes.map((change, idx) => (
                        <div key={idx} className="bg-slate-50 rounded p-3 text-sm border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">{change.field || '필드'}</span>
                            <span className="text-slate-600">
                              <span className="text-red-600">{change.before || '-'}</span>
                              <span className="mx-2 text-slate-400">→</span>
                              <span className="text-green-600">{change.after || '-'}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
