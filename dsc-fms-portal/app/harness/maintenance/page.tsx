'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMaintenancePlans } from '@/lib/harness.hooks';
import { MaintenanceTable } from '@/components/harness/MaintenanceTable';
import { MaintenancePlan } from '@/lib/harness.types';
import { formatDateTime, getMaintenanceTypeLabel } from '@/lib/harness.utils';

export default function MaintenancePlanList() {
  const { plans, isLoading } = useMaintenancePlans();
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [typeFilter, setTypeFilter] = useState('');

  const filteredPlans = plans?.filter(p => {
    if (!typeFilter) return true;
    return p.maintenance_type === typeFilter;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">유지보수 계획 관리</h1>
          <p className="mt-1 text-gray-600">정기/비상 유지보수 계획 목록 및 세부사항 확인</p>
        </div>
        <Link
          href="/harness/maintenance/create"
          className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          data-testid="new-plan-btn"
        >
          + 새 유지보수 계획
        </Link>
      </div>

      {/* 필터 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="type-filter" className="block text-sm font-medium text-gray-900">
          유지보수 유형
        </label>
        <select
          id="type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="mt-2 block rounded-lg border border-gray-300 px-3 py-2 text-sm"
          data-testid="status-filter"
        >
          <option value="">모든 유형</option>
          <option value="preventive">정기 유지보수</option>
          <option value="corrective">비상 유지보수</option>
          <option value="predictive">예측 유지보수</option>
        </select>
      </div>

      {/* 유지보수 계획 테이블 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="plan-list">
        <MaintenanceTable
          plans={filteredPlans || []}
          isLoading={isLoading}
          onSelectPlan={setSelectedPlan}
        />
      </div>

      {/* 선택된 계획 상세정보 */}
      {selectedPlan && (
        <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="plan-detail">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">계획 상세정보</h2>
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-600">계획 ID</dt>
              <dd className="mt-1 font-mono text-sm text-gray-900">{selectedPlan.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">자산 ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedPlan.asset_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">유지보수 유형</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {getMaintenanceTypeLabel(selectedPlan.maintenance_type)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">우선순위</dt>
              <dd className="mt-1">
                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                  selectedPlan.priority === 'high'
                    ? 'bg-red-100 text-red-800'
                    : selectedPlan.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {selectedPlan.priority === 'high' ? '높음' : selectedPlan.priority === 'medium' ? '중간' : '낮음'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">시작 시간</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(selectedPlan.scheduled_start)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">종료 시간</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDateTime(selectedPlan.scheduled_end)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">소요 시간</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {Math.floor(selectedPlan.duration_minutes / 60)}시간{' '}
                {selectedPlan.duration_minutes % 60}분
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">보전팀 ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedPlan.maintenance_team_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">영향 범위</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedPlan.impact_scope === 'single' && '단일 자산'}
                {selectedPlan.impact_scope === 'area' && '지역'}
                {selectedPlan.impact_scope === 'facility' && '전체 시설'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">자산 정지 필요</dt>
              <dd className="mt-1">
                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                  selectedPlan.required_downtime ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {selectedPlan.required_downtime ? '필요' : '불필요'}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-600">작업 내용</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedPlan.notes || '-'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-600">작성자</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedPlan.created_by}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-600">작성 시각</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(selectedPlan.created_at).toLocaleString('ko-KR')}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
