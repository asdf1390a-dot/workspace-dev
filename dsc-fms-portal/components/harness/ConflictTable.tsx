'use client';

import { ValidationResponse } from '@/lib/harness.types';

interface ConflictTableProps {
  conflicts: ValidationResponse[];
  isLoading?: boolean;
  onSelectConflict?: (conflict: ValidationResponse) => void;
}

export function ConflictTable({ conflicts, isLoading = false, onSelectConflict }: ConflictTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (conflicts.length === 0) {
    return <p className="py-8 text-center text-gray-600">충돌이 감지되지 않았습니다.</p>;
  }

  // 데스크톱: 테이블
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">상태</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">충돌 수</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">영향받는 자산</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">검증 시간</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">작업</th>
            </tr>
          </thead>
          <tbody>
            {conflicts.map((conflict) => (
              <tr
                key={conflict.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectConflict?.(conflict)}
                data-testid="conflict-item"
                data-conflict-id={conflict.id}
                data-severity={conflict.status}
              >
                <td className="px-4 py-4" data-testid="conflict-status">
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                      conflict.status === 'conflict'
                        ? 'bg-red-100 text-red-800'
                        : conflict.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                    data-testid="status-badge"
                    data-status={conflict.status}
                  >
                    {conflict.status === 'conflict'
                      ? '충돌'
                      : conflict.status === 'warning'
                      ? '경고'
                      : '정상'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900" data-testid="conflict-count">{conflict.conflicts.length}</td>
                <td className="px-4 py-4 text-sm text-gray-600" data-testid="conflict-assets">
                  {conflict.conflicts.flatMap((c) => c.affected_assets).join(', ') || '-'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600" data-testid="conflict-time">
                  {new Date(conflict.validated_at).toLocaleString('ko-KR')}
                </td>
                <td className="px-4 py-4 text-sm" data-testid="conflict-action">
                  <button className="text-blue-600 hover:text-blue-700 font-medium" data-testid="view-button">보기</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일: 카드 */}
      <div className="md:hidden space-y-4">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:shadow-md"
            onClick={() => onSelectConflict?.(conflict)}
            data-testid="conflict-card"
            data-conflict-id={conflict.id}
            data-severity={conflict.status}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <span
                className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                  conflict.status === 'conflict'
                    ? 'bg-red-100 text-red-800'
                    : conflict.status === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
                data-testid="status-badge-mobile"
                data-status={conflict.status}
              >
                {conflict.status === 'conflict'
                  ? '충돌'
                  : conflict.status === 'warning'
                  ? '경고'
                  : '정상'}
              </span>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-600">충돌 수</dt>
                <dd className="font-medium text-gray-900">{conflict.conflicts.length}</dd>
              </div>
              <div>
                <dt className="text-gray-600">영향받는 자산</dt>
                <dd className="font-medium text-gray-900">
                  {conflict.conflicts.flatMap((c) => c.affected_assets).join(', ') || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">검증 시간</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(conflict.validated_at).toLocaleString('ko-KR')}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
