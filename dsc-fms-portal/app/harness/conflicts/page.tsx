'use client';

import { useState } from 'react';
import { useConflicts } from '@/lib/harness.hooks';
import { ConflictTable } from '@/components/harness/ConflictTable';
import { ValidationResponse } from '@/lib/harness.types';

export default function ConflictDetectionDashboard() {
  const { conflicts, isLoading } = useConflicts();
  const [selectedConflict, setSelectedConflict] = useState<ValidationResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const filteredConflicts = conflicts.filter((c) => {
    if (!statusFilter) return true;
    return c.status === statusFilter;
  });

  const conflictStats = {
    total: conflicts.length,
    critical: conflicts.filter((c) => c.status === 'conflict').length,
    warning: conflicts.filter((c) => c.status === 'warning').length,
    valid: conflicts.filter((c) => c.status === 'valid').length,
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">충돌 감지 대시보드</h1>
        <p className="mt-1 text-gray-600">생산일정과 유지보수 계획의 충돌을 확인하고 관리하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4" data-testid="total-conflicts-card">
          <p className="text-sm text-gray-600">전체 검증</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{conflictStats.total}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4" data-testid="critical-conflicts-card">
          <p className="text-sm text-red-600">충돌</p>
          <p className="mt-2 text-2xl font-bold text-red-900">{conflictStats.critical}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4" data-testid="high-conflicts-card">
          <p className="text-sm text-yellow-600">경고</p>
          <p className="mt-2 text-2xl font-bold text-yellow-900">{conflictStats.warning}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4" data-testid="medium-conflicts-card">
          <p className="text-sm text-green-600">정상</p>
          <p className="mt-2 text-2xl font-bold text-green-900">{conflictStats.valid}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-900">
          상태 필터
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mt-2 block rounded-lg border border-gray-300 px-3 py-2 text-sm"
          data-testid="severity-critical-filter"
        >
          <option value="">모든 상태</option>
          <option value="conflict">충돌만</option>
          <option value="warning">경고만</option>
          <option value="valid">정상만</option>
        </select>
      </div>

      {/* 충돌 테이블 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="conflict-table-container">
        <ConflictTable
          conflicts={filteredConflicts}
          isLoading={isLoading}
          onSelectConflict={setSelectedConflict}
        />
      </div>

      {/* 선택된 충돌 상세정보 */}
      {selectedConflict && (
        <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="conflict-detail-panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">충돌 상세정보</h2>
            <button
              onClick={() => setSelectedConflict(null)}
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
                  <dt className="text-sm font-medium text-gray-600">검증 ID</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">{selectedConflict.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">상태</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                        selectedConflict.status === 'conflict'
                          ? 'bg-red-100 text-red-800'
                          : selectedConflict.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {selectedConflict.status === 'conflict'
                        ? '충돌'
                        : selectedConflict.status === 'warning'
                        ? '경고'
                        : '정상'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">검증 시간</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(selectedConflict.validated_at).toLocaleString('ko-KR')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">소요 시간</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedConflict.validation_duration_ms}ms</dd>
                </div>
              </dl>
            </div>

            {/* 충돌 목록 */}
            {selectedConflict.conflicts.length > 0 && (
              <div data-testid="affected-assets">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">감지된 충돌</h3>
                <div className="space-y-3">
                  {selectedConflict.conflicts.map((conflict, idx) => (
                    <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                              conflict.severity === 'critical'
                                ? 'bg-red-600 text-white'
                                : 'bg-orange-600 text-white'
                            }`}
                          >
                            {conflict.severity === 'critical' ? '중대' : '경고'}
                          </span>
                          <p className="font-medium text-gray-900">{conflict.type}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{conflict.details}</p>
                      <p className="text-xs text-gray-600">
                        영향받는 자산: {conflict.affected_assets.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 권장사항 */}
            {selectedConflict.recommendations.length > 0 && (
              <div data-testid="recommendations">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">권장사항</h3>
                <div className="space-y-2">
                  {selectedConflict.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3" data-testid="recommendation-item">
                      <span className="text-blue-600 font-bold">{idx + 1}.</span>
                      <p className="text-sm text-blue-900">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
