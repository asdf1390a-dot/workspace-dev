'use client';

import Link from 'next/link';
import { useProductionSchedules } from '@/lib/harness.hooks';
import { useMaintenancePlans } from '@/lib/harness.hooks';
import { useConflicts } from '@/lib/harness.hooks';
import { useAuditLogs } from '@/lib/harness.hooks';

export default function HarnessDashboard() {
  const { schedules, isLoading: schedLoading } = useProductionSchedules();
  const { plans, isLoading: plansLoading } = useMaintenancePlans();
  const { conflicts, isLoading: conflictsLoading } = useConflicts();
  const { logs: auditLogs, isLoading: logsLoading } = useAuditLogs();

  const stats = [
    {
      label: '생산일정',
      value: schedules?.length || 0,
      icon: '📅',
      href: '/harness/schedule',
      color: 'bg-blue-50 text-blue-700',
      loading: schedLoading,
    },
    {
      label: '유지보수 계획',
      value: plans?.length || 0,
      icon: '🔧',
      href: '/harness/maintenance',
      color: 'bg-green-50 text-green-700',
      loading: plansLoading,
    },
    {
      label: '감지된 충돌',
      value: conflicts?.length || 0,
      icon: '⚠️',
      href: '/harness/conflicts',
      color: 'bg-red-50 text-red-700',
      loading: conflictsLoading,
    },
    {
      label: '감시 로그',
      value: auditLogs?.length || 0,
      icon: '📝',
      href: '/harness/audit-logs',
      color: 'bg-purple-50 text-purple-700',
      loading: logsLoading,
    },
  ];

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Harness 검증 대시보드</h1>
        <p className="mt-2 text-gray-600">생산일정과 유지보수 계획의 충돌을 자동으로 감지하고 관리합니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className={`mt-2 text-3xl font-bold ${stat.loading ? 'text-gray-300' : ''}`}>
                  {stat.loading ? '...' : stat.value}
                </p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className={`mt-4 inline-block rounded px-2 py-1 text-xs font-medium ${stat.color}`}>
              자세히 보기 →
            </div>
          </Link>
        ))}
      </div>

      {/* 주요 기능 섹션 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 생산일정 관리 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h2 className="text-lg font-semibold text-gray-900">생산일정 관리</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            일일 생산계획을 입력하고 자산 가용성을 확인하세요.
          </p>
          <div className="flex gap-3">
            <Link
              href="/harness/schedule/create"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              새 생산일정 생성
            </Link>
            <Link
              href="/harness/schedule"
              className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              목록 보기
            </Link>
          </div>
        </div>

        {/* 유지보수 계획 관리 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <h2 className="text-lg font-semibold text-gray-900">유지보수 계획 관리</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            정기/비상 유지보수 계획을 등록하고 추적하세요.
          </p>
          <div className="flex gap-3">
            <Link
              href="/harness/maintenance/create"
              className="inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              새 유지보수 계획 생성
            </Link>
            <Link
              href="/harness/maintenance"
              className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              목록 보기
            </Link>
          </div>
        </div>

        {/* 충돌 감지 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg font-semibold text-gray-900">충돌 감지</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            생산일정과 유지보수 계획의 충돌을 확인하고 해결하세요.
          </p>
          <Link
            href="/harness/conflicts"
            className="inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            충돌 보기
          </Link>
        </div>

        {/* 팀 배정 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <h2 className="text-lg font-semibold text-gray-900">팀 배정</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            유지보수팀 인원을 관리하고 작업을 배정하세요.
          </p>
          <Link
            href="/harness/teams"
            className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            팀 관리
          </Link>
        </div>
      </div>

      {/* 최근 로그 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">최근 검증 활동</h2>
        {logsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        ) : auditLogs && auditLogs.length > 0 ? (
          <div className="space-y-2">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{log.event_type}</p>
                  <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('ko-KR')}</p>
                </div>
                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                  log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {log.status === 'success' ? '성공' : '실패'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">최근 검증 활동이 없습니다.</p>
        )}
        <div className="mt-4">
          <Link
            href="/harness/audit-logs"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            전체 로그 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
