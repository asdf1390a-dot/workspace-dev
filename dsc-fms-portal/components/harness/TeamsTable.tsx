'use client';

import { TeamAssignment } from '@/lib/harness.types';
import {
  getTeamTypeLabel,
  getTeamStatusLabel,
  getTeamStatusColor,
  calculateTeamUtilization,
  getTeamUtilizationColor,
} from '@/lib/harness.utils';

interface TeamsTableProps {
  teams: TeamAssignment[];
  isLoading?: boolean;
  onSelectTeam?: (team: TeamAssignment) => void;
}

export function TeamsTable({ teams, isLoading, onSelectTeam }: TeamsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">팀이 없습니다</p>
      </div>
    );
  }

  return (
    <>
      {/* 데스크톱 테이블 */}
      <div className="hidden overflow-x-auto md:block rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">팀 이름</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">팀 유형</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">상태</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">팀원 수</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">용량</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">시설</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, i) => {
              const statusColor = getTeamStatusColor(team.status);
              const utilization = calculateTeamUtilization(team.current_workload || 0, team.max_capacity);
              const utilizationColor = getTeamUtilizationColor(utilization);

              return (
                <tr
                  key={team.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  onClick={() => onSelectTeam?.(team)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectTeam?.(team);
                  }}
                  data-testid="team-item"
                  data-team-id={team.id}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900" data-testid="team-name">{team.team_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600" data-testid="team-type">{getTeamTypeLabel(team.team_type)}</td>
                  <td className="px-6 py-4" data-testid="team-status">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}
                      data-testid="status-badge"
                      data-status={team.status}
                    >
                      {getTeamStatusLabel(team.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600" data-testid="team-members">{team.member_count}명</td>
                  <td className="px-6 py-4" data-testid="team-utilization">
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">{team.max_capacity}시간/주</div>
                      <div className={`text-xs font-semibold ${utilizationColor}`} data-testid="utilization-percentage" data-utilization={utilization}>
                        {utilization}% 활용
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600" data-testid="team-facility">{team.facility_id}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 */}
      <div className="space-y-3 md:hidden">
        {teams.map((team) => {
          const statusColor = getTeamStatusColor(team.status);
          const utilization = calculateTeamUtilization(team.current_workload || 0, team.max_capacity);
          const utilizationColor = getTeamUtilizationColor(utilization);

          return (
            <div
              key={team.id}
              className="rounded-lg border border-gray-200 bg-white p-4 cursor-pointer hover:shadow-md"
              onClick={() => onSelectTeam?.(team)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelectTeam?.(team);
              }}
              data-testid="team-card"
              data-team-id={team.id}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-gray-900" data-testid="team-name-mobile">{team.team_name}</h3>
                  <p className="text-xs text-gray-600" data-testid="team-type-mobile">{getTeamTypeLabel(team.team_type)}</p>
                </div>
                <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${statusColor.bg} ${statusColor.text}`} data-testid="status-badge-mobile" data-status={team.status}>
                  {getTeamStatusLabel(team.status)}
                </span>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between" data-testid="team-members-mobile">
                  <dt className="text-gray-600">팀원 수</dt>
                  <dd className="font-medium text-gray-900">{team.member_count}명</dd>
                </div>
                <div className="flex justify-between" data-testid="team-capacity-mobile">
                  <dt className="text-gray-600">용량</dt>
                  <dd className="font-medium text-gray-900">{team.max_capacity}시간/주</dd>
                </div>
                <div className="flex justify-between" data-testid="team-utilization-mobile">
                  <dt className="text-gray-600">활용률</dt>
                  <dd className={`font-semibold ${utilizationColor}`} data-utilization={utilization}>{utilization}%</dd>
                </div>
                <div className="flex justify-between" data-testid="team-facility-mobile">
                  <dt className="text-gray-600">시설</dt>
                  <dd className="font-medium text-gray-900">{team.facility_id}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}
