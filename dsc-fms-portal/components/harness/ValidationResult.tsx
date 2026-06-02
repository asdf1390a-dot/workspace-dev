'use client';

import { ValidationResponse } from '@/lib/harness.types';
import { getValidationStatusLabel, getValidationStatusColor, getConflictTypeLabe, formatDateTime } from '@/lib/harness.utils';
import { AlertBox } from './shared/AlertBox';

interface ValidationResultProps {
  result: ValidationResponse | null;
  isLoading?: boolean;
}

export function ValidationResult({ result, isLoading = false }: ValidationResultProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const statusLabel = getValidationStatusLabel(result.status);
  const statusColor = getValidationStatusColor(result.status);

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      {/* 상태 헤더 */}
      <div className={`rounded-lg ${statusColor} p-4`}>
        <h2 className="text-lg font-semibold">{statusLabel}</h2>
        <p className="text-sm">검증 시간: {formatDateTime(result.validated_at)}</p>
        <p className="text-sm">소요 시간: {result.validation_duration_ms}ms</p>
      </div>

      {/* 충돌 항목 */}
      {result.conflicts && result.conflicts.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">감지된 충돌</h3>
          <div className="space-y-3">
            {result.conflicts.map((conflict, i) => (
              <AlertBox
                key={i}
                type={conflict.severity === 'critical' ? 'error' : 'warning'}
                title={getConflictTypeLabe(conflict.type)}
                message={conflict.details}
                details={
                  conflict.affected_assets.length > 0
                    ? [`영향을 받는 자산: ${conflict.affected_assets.join(', ')}`]
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* 권장사항 */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">권장사항</h3>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                <span className="font-semibold">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 세부 정보 */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="mb-3 font-semibold text-gray-900">세부 정보</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">요청 ID</dt>
            <dd className="font-mono text-gray-900">{result.request_id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">응답 ID</dt>
            <dd className="font-mono text-gray-900">{result.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">검증자</dt>
            <dd className="text-gray-900">{result.validated_by}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
