'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useProductionSchedules } from '@/lib/harness.hooks';
import { ScheduleTable } from '@/components/harness/ScheduleTable';
import { ProductionSchedule } from '@/lib/harness.types';

export default function ProductionScheduleList() {
  const { schedules, isLoading } = useProductionSchedules();
  const [selectedSchedule, setSelectedSchedule] = useState<ProductionSchedule | null>(null);
  const [dateFilter, setDateFilter] = useState('');

  const filteredSchedules = schedules?.filter(s => {
    if (!dateFilter) return true;
    return s.scheduled_date >= dateFilter;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">생산일정 관리</h1>
          <p className="mt-1 text-gray-600">일일 생산계획 목록 및 세부사항 확인</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/harness/schedule/create"
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            data-testid="new-schedule-btn"
          >
            + 새 생산일정
          </Link>
          <button
            onClick={() => {}}
            className="inline-block rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            data-testid="sort-date-btn"
          >
            📅 날짜순
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="date-filter" className="block text-sm font-medium text-gray-900">
          기준 날짜 필터
        </label>
        <input
          id="date-filter"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="mt-2 block rounded-lg border border-gray-300 px-3 py-2 text-sm"
          data-testid="date-filter"
        />
        <select
          id="facility-filter"
          className="mt-2 block rounded-lg border border-gray-300 px-3 py-2 text-sm"
          data-testid="facility-filter"
          defaultValue=""
        >
          <option value="">모든 시설</option>
          <option value="FAC-001">FAC-001</option>
        </select>
      </div>

      {/* 생산일정 테이블 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="schedule-list">
        <ScheduleTable
          schedules={filteredSchedules || []}
          isLoading={isLoading}
          onSelectSchedule={setSelectedSchedule}
        />
      </div>

      {/* 선택된 일정 상세정보 */}
      {selectedSchedule && (
        <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="schedule-detail">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">일정 상세정보</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {}}
                className="text-blue-600 hover:text-blue-700"
                data-testid="edit-btn"
              >
                편집
              </button>
              <button
                onClick={() => setSelectedSchedule(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-600">일정 ID</dt>
              <dd className="mt-1 font-mono text-sm text-gray-900">{selectedSchedule.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">시설 ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedSchedule.facility_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">생산 날짜</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedSchedule.scheduled_date}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">근무반</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedSchedule.shift === 'A' && '06:00-14:00 (A반)'}
                {selectedSchedule.shift === 'B' && '14:00-22:00 (B반)'}
                {selectedSchedule.shift === 'C' && '22:00-06:00 (C반)'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">목표 생산량</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedSchedule.target_quantity}개</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">계획 가동중단</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {Math.floor(selectedSchedule.planned_downtime_minutes / 60)}시간{' '}
                {selectedSchedule.planned_downtime_minutes % 60}분
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-600">사용 자산</dt>
              <dd className="mt-1">
                <div className="flex flex-wrap gap-2">
                  {selectedSchedule.asset_ids.map((id) => (
                    <span
                      key={id}
                      className="inline-block rounded bg-blue-100 px-2 py-1 text-sm text-blue-800"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-600">비고</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedSchedule.notes || '-'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-600">작성자</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedSchedule.created_by}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-600">작성 시각</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(selectedSchedule.created_at).toLocaleString('ko-KR')}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
