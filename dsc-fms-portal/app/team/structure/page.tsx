'use client';

import { useTeamStructure, useTeamMembers } from '@/lib/hooks/useTeamData';
import { LoadingState, ErrorState } from '@/components/team/shared';
import OrgChart from '@/components/team/OrgChart';
import { Users } from 'lucide-react';

export default function StructurePage() {
  const { data, loading, error } = useTeamStructure();
  const { data: members, loading: membersLoading } = useTeamMembers({ limit: 100 });

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Structure</h1>
        <p className="text-gray-600 mt-1">View your organizational hierarchy</p>
      </div>

      {error && <ErrorState message={error} />}
      {loading || membersLoading ? (
        <LoadingState />
      ) : (
        <>
          {data?.flat && data.flat.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900">Organization Chart</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                {data.flat.length} members in organizational structure
              </p>
              <OrgChart structures={data.flat} members={memberMap} />
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No structure data available</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
