'use client';

import { ProductionSchedule } from '@/lib/harness.types';
import { formatDate, getShiftLabel, formatDuration } from '@/lib/harness.utils';

interface ScheduleTableProps {
  schedules: ProductionSchedule[];
  isLoading?: boolean;
  onSelectSchedule?: (schedule: ProductionSchedule) => void;
}

export function ScheduleTable({ schedules, isLoading, onSelectSchedule }: ScheduleTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">생산일정이 없습니다</p>
      </div>
    );
  }

  // 모바일에서는 카드 형식, 데스크탑에서는 테이블
  return (
    <>
      {/* 데스크탑 테이블 */}
      <div className="hidden overflow-x-auto md:block rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">날짜</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">근무반</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">자산</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">생산량</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">가동중단</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule, i) => (
              <tr
                key={schedule.id}
                className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                onClick={() => onSelectSchedule?.(schedule)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSelectSchedule?.(schedule);
                }}
                data-testid="schedule-item"
                data-schedule-id={schedule.id}
              >
                <td className="px-6 py-4 text-sm text-gray-900" data-testid="schedule-date">{formatDate(schedule.scheduled_date)}</td>
                <td className="px-6 py-4 text-sm text-gray-900" data-testid="schedule-shift">{getShiftLabel(schedule.shift)}</td>
                <td className="px-6 py-4 text-sm text-gray-600" data-testid="schedule-assets" data-asset-ids={schedule.asset_ids.join(',')}>{schedule.asset_ids.join(', ')}</td>
                <td className="px-6 py-4 text-sm text-gray-900" data-testid="schedule-quantity">{schedule.target_quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-600" data-testid="schedule-downtime">
                  {formatDuration(schedule.planned_downtime_minutes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="space-y-3 md:hidden">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:shadow-md"
            onClick={() => onSelectSchedule?.(schedule)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSelectSchedule?.(schedule);
            }}
            data-testid="schedule-card"
            data-schedule-id={schedule.id}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{formatDate(schedule.scheduled_date)}</p>
                <p className="text-xs text-gray-600">{getShiftLabel(schedule.shift)}</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded" data-testid="quantity-badge">
                {schedule.target_quantity}개
              </span>
            </div>
            <p className="text-xs text-gray-600">자산: {schedule.asset_ids.join(', ')}</p>
            <p className="text-xs text-gray-600 mt-1">
              가동중단: {formatDuration(schedule.planned_downtime_minutes)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
