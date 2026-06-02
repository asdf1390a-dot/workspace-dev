'use client';

import { useState } from 'react';
import { useTeams } from '@/lib/harness.hooks';
import { TeamAssignment } from '@/lib/harness.types';
import {
  formatDateTime,
  getTeamTypeLabel,
  getTeamStatusLabel,
  getTeamStatusColor,
  calculateTeamUtilization,
  getTeamUtilizationColor,
} from '@/lib/harness.utils';
import Link from 'next/link';

export default function TeamAssignmentManagerPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamAssignment | null>(null);

  const { teams, isLoading } = useTeams({
    teamType:
      (typeFilter as 'maintenance' | 'production' | 'inspection' | 'quality') || undefined,
    status: (statusFilter as 'active' | 'inactive' | 'on_break') || undefined,
  });

  const stats = {
    total: teams.length,
    totalCapacity: teams.reduce((sum, t) => sum + t.max_capacity, 0),
    currentWorkload: teams.reduce((sum, t) => sum + (t.current_workload || 0), 0),
    active: teams.filter((t) => t.status === 'active').length,
  };

  const utilization = Math.round((stats.currentWorkload / stats.totalCapacity) * 100) || 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">팀 배정 관리</h1>
          <p className="mt-1 text-gray-600">팀 구성, 역량, 작업량을 관리하세요.</p>
        </div>
        <Link
          href="/harness/teams/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          data-testid="new-team-btn"
        >
          새 팀 추가
        </Link>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">전체 팀</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-600">활동중</p>
          <p className="mt-2 text-2xl font-bold text-blue-900">{stats.active}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-600">총 역량</p>
          <p className="mt-2 text-2xl font-bold text-green-900">{stats.totalCapacity}</p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <p className="text-sm text-purple-600">가용률</p>
          <p className={`mt-2 text-2xl font-bold ${getTeamUtilizationColor(utilization)}`}>
            {utilization}%
          </p>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-900">
              팀 유형
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="mt-2 block rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
              data-testid="team-type-filter"
            >
              <option value="">모든 유형</option>
              <option value="maintenance">유지보수팀</option>
              <option value="production">생산팀</option>
              <option value="inspection">검사팀</option>
              <option value="quality">품질팀</option>
            </select>
          </div>
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-900">
              상태
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-2 block rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
              data-testid="status-filter"
            >
              <option value="">모든 상태</option>
              <option value="active">활동중</option>
              <option value="inactive">비활동</option>
              <option value="on_break">휴식중</option>
            </select>
          </div>
        </div>
      </div>

      {/* 팀 테이블 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="team-list">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <p className="py-8 text-center text-gray-600">팀이 없습니다.</p>
        ) : (
          <>
            {/* 데스크톱: 테이블 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full" data-testid="team-table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      팀 이름
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      유형
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      인원 / 역량
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      가용률
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => {
                    const utilization = calculateTeamUtilization(
                      team.current_workload || 0,
                      team.max_capacity,
                    );
                    return (
                      <tr
                        key={team.id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedTeam(team)}
                        data-testid="team-item"
                        data-team-type={team.team_type}
                        data-facility={team.facility_id}
                      >
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-900">{team.team_name}</p>
                          {team.specialization && (
                            <p className="text-xs text-gray-600">{team.specialization}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {getTeamTypeLabel(team.team_type)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                              team.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : team.status === 'on_break'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {getTeamStatusLabel(team.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {team.member_count} / {team.max_capacity}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2" data-testid="utilization-bar" data-utilization={utilization}>
                            <div className="flex-1 rounded-full bg-gray-200 h-2">
                              <div
                                className={`h-full rounded-full ${
                                  utilization >= 90
                                    ? 'bg-red-600'
                                    : utilization >= 75
                                    ? 'bg-yellow-600'
                                    : 'bg-green-600'
                                }`}
                                style={{ width: `${utilization}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${getTeamUtilizationColor(utilization)}`}>
                              {utilization}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <button className="text-blue-600 hover:text-blue-700 font-medium">
                            상세
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 모바일: 카드 */}
            <div className="md:hidden space-y-4">
              {teams.map((team) => {
                const utilization = calculateTeamUtilization(
                  team.current_workload || 0,
                  team.max_capacity,
                );
                return (
                  <div
                    key={team.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:shadow-md"
                    onClick={() => setSelectedTeam(team)}
                    data-testid="team-card"
                    data-team-type={team.team_type}
                    data-facility={team.facility_id}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{team.team_name}</p>
                        <p className="text-xs text-gray-600">{getTeamTypeLabel(team.team_type)}</p>
                      </div>
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                          team.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : team.status === 'on_break'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getTeamStatusLabel(team.status)}
                      </span>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-gray-600">인원 / 역량</dt>
                        <dd className="font-medium text-gray-900">
                          {team.member_count} / {team.max_capacity}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-600">가용률</dt>
                        <dd className="font-medium text-gray-900">
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 rounded-full bg-gray-200 h-1.5">
                              <div
                                className={`h-full rounded-full ${
                                  utilization >= 90
                                    ? 'bg-red-600'
                                    : utilization >= 75
                                    ? 'bg-yellow-600'
                                    : 'bg-green-600'
                                }`}
                                style={{ width: `${utilization}%` }}
                              />
                            </div>
                            <span className="text-xs">{utilization}%</span>
                          </div>
                        </dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 상세정보 패널 */}
      {selectedTeam && (
        <div className="rounded-lg border border-gray-200 bg-white p-6" data-testid="team-detail">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">팀 상세정보</h2>
            <button
              onClick={() => setSelectedTeam(null)}
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
                  <dt className="text-sm font-medium text-gray-600">팀 ID</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">{selectedTeam.team_id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">팀 이름</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedTeam.team_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">팀 유형</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {getTeamTypeLabel(selectedTeam.team_type)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">상태</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                        selectedTeam.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : selectedTeam.status === 'on_break'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      data-testid="status-badge"
                      data-status-color={
                        selectedTeam.status === 'active'
                          ? 'green'
                          : selectedTeam.status === 'on_break'
                          ? 'blue'
                          : 'gray'
                      }
                    >
                      {getTeamStatusLabel(selectedTeam.status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">시설 ID</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">{selectedTeam.facility_id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">팀 리더 ID</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">{selectedTeam.leader_id}</dd>
                </div>
              </dl>
            </div>

            {/* 역량 정보 */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-900">역량 정보</h3>
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">팀원 수</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedTeam.member_count}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">최대 역량</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedTeam.max_capacity}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">현재 작업량</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedTeam.current_workload || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">가용률</dt>
                  <dd className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full bg-gray-200 h-2">
                        <div
                          className={`h-full rounded-full ${
                            calculateTeamUtilization(
                              selectedTeam.current_workload || 0,
                              selectedTeam.max_capacity,
                            ) >= 90
                              ? 'bg-red-600'
                              : calculateTeamUtilization(
                                    selectedTeam.current_workload || 0,
                                    selectedTeam.max_capacity,
                                  ) >= 75
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{
                            width: `${calculateTeamUtilization(selectedTeam.current_workload || 0, selectedTeam.max_capacity)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {calculateTeamUtilization(
                          selectedTeam.current_workload || 0,
                          selectedTeam.max_capacity,
                        )}
                        %
                      </span>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>

            {/* 전문성 및 자산 */}
            {(selectedTeam.specialization || selectedTeam.assigned_assets?.length) && (
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">전문성 및 자산</h3>
                <dl className="space-y-4">
                  {selectedTeam.specialization && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-1">전문 분야</dt>
                      <dd className="inline-block rounded-lg bg-blue-50 px-3 py-1 text-sm text-blue-900">
                        {selectedTeam.specialization}
                      </dd>
                    </div>
                  )}
                  {selectedTeam.assigned_assets && selectedTeam.assigned_assets.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-2">배정된 자산</dt>
                      <dd className="space-y-2">
                        {selectedTeam.assigned_assets.map((assetId) => (
                          <span
                            key={assetId}
                            className="inline-block rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700 mr-2"
                          >
                            {assetId}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* 감시 정보 */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-gray-900">감시 정보</h3>
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">생성자</dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900">{selectedTeam.created_by}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">생성 시간</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateTime(selectedTeam.created_at)}
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
