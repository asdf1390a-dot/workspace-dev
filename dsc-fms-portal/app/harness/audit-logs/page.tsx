'use client';

import { useState } from 'react';
import { useAuditLogs } from '@/lib/harness.hooks';
import { AuditLog } from '@/lib/harness.types';
import { formatDateTime, getEventTypeLabel } from '@/lib/harness.utils';

export default function AuditLogsPage() {
  const [statusFilter, setStatusFilter] = useState<'success' | 'failure' | ''>('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { logs, isLoading } = useAuditLogs({
    status: statusFilter === '' ? undefined : (statusFilter as 'success' | 'failure'),
  });

  const filteredLogs = logs.filter((log) => {
    if (eventTypeFilter && log.event_type !== eventTypeFilter) return false;
    return true;
  });

  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === 'success').length,
    failure: logs.filter((l) => l.status === 'failure').length,
    retries: logs.filter((l) => l.retry_count > 0).length,
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">감시 로그</h1>
        <p className="mt-1 text-gray-600">검증 요청, 충돌 감지, 재시도 등의 모든 이벤트를 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">전체 이벤트</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-600">성공</p>
          <p className="mt-2 text-2xl font-bold text-green-900">{stats.success}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">실패</p>
          <p className="mt-2 text-2xl font-bold text-red-900">{stats.failure}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-600">재시도</p>
          <p className="mt-2 text-2xl font-bold text-blue-900">{stats.retries}</p>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-900">
            상태
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="mt-2 block rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
          >
            <option value="">모든 상태</option>
            <option value="success">성공만</option>
            <option value="failure">실패만</option>
          </select>
        </div>
        <div>
          <label htmlFor="event-type-filter" className="block text-sm font-medium text-gray-900">
            이벤트 유형
          </label>
          <select
            id="event-type-filter"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="mt-2 block rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
          >
            <option value="">모든 유형</option>
            <option value="request_received">요청 수신</option>
            <option value="validation_started">검증 시작</option>
            <option value="validation_completed">검증 완료</option>
            <option value="conflict_detected">충돌 감지</option>
            <option value="retry_scheduled">재시도 예정</option>
            <option value="retry_executed">재시도 실행</option>
          </select>
        </div>
      </div>

      {/* 로그 테이블 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <p className="py-8 text-center text-gray-600">감시 로그가 없습니다.</p>
        ) : (
          <>
            {/* 데스크톱: 테이블 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">이벤트</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">요청 ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">시간</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">재시도</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="px-4 py-4">
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
                      <td className="px-4 py-4 text-sm text-gray-900">{getEventTypeLabel(log.event_type)}</td>
                      <td className="px-4 py-4 text-sm font-mono text-gray-600">{log.request_id.slice(0, 8)}...</td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{log.retry_count}</td>
                      <td className="px-4 py-4 text-sm">
                        <button className="text-blue-600 hover:text-blue-700 font-medium">상세</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일: 카드 */}
            <div className="md:hidden space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:shadow-md"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
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
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-600">이벤트</dt>
                      <dd className="font-medium text-gray-900">{getEventTypeLabel(log.event_type)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">요청 ID</dt>
                      <dd className="font-mono text-gray-900">{log.request_id.slice(0, 12)}...</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">시간</dt>
                      <dd className="text-gray-900">{formatDateTime(log.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">재시도 횟수</dt>
                      <dd className="text-gray-900">{log.retry_count}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 상세정보 패널 */}
      {selectedLog && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">로그 상세정보</h2>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-900">기본 정보</h3>
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">로그 ID</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">{selectedLog.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">상태</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                        selectedLog.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedLog.status === 'success' ? '성공' : '실패'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">이벤트 유형</dt>
                  <dd className="mt-1 text-sm text-gray-900">{getEventTypeLabel(selectedLog.event_type)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">발생 시간</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(selectedLog.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">요청 ID</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">{selectedLog.request_id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">응답 ID</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">
                    {selectedLog.response_id || '-'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 재시도 정보 */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-900">재시도 정보</h3>
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">재시도 횟수</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedLog.retry_count}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">다음 재시도 예정</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedLog.next_retry_at ? formatDateTime(selectedLog.next_retry_at) : '-'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 오류 정보 */}
            {selectedLog.status === 'failure' && (
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">오류 정보</h3>
                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">오류 코드</dt>
                    <dd className="mt-1 font-mono text-sm text-gray-900">{selectedLog.error_code || '-'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-600">오류 메시지</dt>
                    <dd className="mt-1 rounded-lg bg-red-50 p-3 font-mono text-sm text-red-900">
                      {selectedLog.error_message || '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* 메타데이터 */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-900">메타데이터</h3>
              <dl className="grid grid-cols-1 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-600">요청 출처</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedLog.metadata?.request_source || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">사용자 에이전트</dt>
                  <dd className="mt-1 font-mono text-xs text-gray-600 break-words">
                    {selectedLog.metadata?.user_agent || '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">IP 주소</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">
                    {selectedLog.metadata?.ip_address || '-'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
