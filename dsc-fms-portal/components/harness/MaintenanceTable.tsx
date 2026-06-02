'use client';

import { MaintenancePlan } from '@/lib/harness.types';
import {
  formatDateTime,
  getMaintenanceTypeLabel,
  getPriorityLabel,
  getPriorityStyling,
  formatDuration,
} from '@/lib/harness.utils';

interface MaintenanceTableProps {
  plans: MaintenancePlan[];
  isLoading?: boolean;
  onSelectPlan?: (plan: MaintenancePlan) => void;
}

export function MaintenanceTable({ plans, isLoading, onSelectPlan }: MaintenanceTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">유지보수 계획이 없습니다</p>
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">자산</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">유형</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">시간</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">우선순위</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">영향 범위</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan, i) => {
              const priorityStyling = getPriorityStyling(plan.priority);
              return (
                <tr
                  key={plan.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => onSelectPlan?.(plan)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectPlan?.(plan);
                  }}
                  data-testid="maintenance-item"
                  data-plan-id={plan.id}
                >
                  <td className="px-6 py-4 text-sm text-gray-900" data-testid="maintenance-asset">{plan.asset_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600" data-testid="maintenance-type">{getMaintenanceTypeLabel(plan.maintenance_type)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600" data-testid="maintenance-time">
                    <div>{formatDateTime(plan.scheduled_start)}</div>
                    <div className="text-xs text-gray-500">~ {formatDateTime(plan.scheduled_end)}</div>
                  </td>
                  <td className="px-6 py-4" data-testid="maintenance-priority">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${priorityStyling.bg} ${priorityStyling.text}`} data-priority={plan.priority}>
                      {getPriorityLabel(plan.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600" data-testid="maintenance-scope">
                    {plan.impact_scope === 'single' && '단일'}
                    {plan.impact_scope === 'area' && '지역'}
                    {plan.impact_scope === 'facility' && '전체'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="space-y-3 md:hidden">
        {plans.map((plan) => {
          const priorityStyling = getPriorityStyling(plan.priority);
          return (
            <div
              key={plan.id}
              className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:shadow-md"
              onClick={() => onSelectPlan?.(plan)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelectPlan?.(plan);
              }}
              data-testid="maintenance-card"
              data-plan-id={plan.id}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{plan.asset_id}</p>
                  <p className="text-xs text-gray-600">{getMaintenanceTypeLabel(plan.maintenance_type)}</p>
                </div>
                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${priorityStyling.bg} ${priorityStyling.text}`} data-testid="priority-badge" data-priority={plan.priority}>
                  {getPriorityLabel(plan.priority)}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{formatDateTime(plan.scheduled_start)}</p>
              <p className="text-xs text-gray-600">
                소요: {formatDuration(plan.duration_minutes)} · 영향: {plan.impact_scope === 'single' ? '단일' : plan.impact_scope === 'area' ? '지역' : '전체'}
              </p>
              {plan.required_downtime && (
                <p className="mt-2 text-xs text-red-600 font-semibold">⚠️ 자산 정지 필요</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
