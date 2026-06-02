'use client';

import { AuditLog } from '@/lib/harness.types';
import { formatDateTime, getEventTypeLabel } from '@/lib/harness.utils';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">감시 로그가 없습니다</p>
      </div>
    );
  }

  return (
    <>
      {/* 데스크탑 테이블 */}
      <div className="hidden overflow-x-auto md:block rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">시간</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">이벤트 유형</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">상태</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">재시도</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">메시지</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr
                key={log.id}
                className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(log.created_at)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{getEventTypeLabel(log.event_type)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                      log.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {log.status === 'success' ? '성공' : '실패'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs">
                    {log.retry_count}회
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {log.error_message ? (
                    <span className="text-red-600">{log.error_message}</span>
                  ) : (
                    <span className="text-gray-600">정상</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="space-y-3 md:hidden">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {getEventTypeLabel(log.event_type)}
                </p>
                <p className="text-xs text-gray-600">{formatDateTime(log.created_at)}</p>
              </div>
              <span
                className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                  log.status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {log.status === 'success' ? '성공' : '실패'}
              </span>
            </div>
            <p className="text-xs text-gray-600">재시도: {log.retry_count}회</p>
            {log.error_message && (
              <p className="mt-2 text-xs text-red-600">{log.error_message}</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
