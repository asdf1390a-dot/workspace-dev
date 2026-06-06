'use client';

import { useTeamStructure } from '@/lib/hooks/useTeamData';
import { LoadingState, ErrorState } from '@/components/team/shared';
import { ChevronRight } from 'lucide-react';

export default function StructurePage() {
  const { data, loading, error } = useTeamStructure();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Structure</h1>
        <p className="text-gray-600 mt-1">View your organizational hierarchy</p>
      </div>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState />}

      {!loading && !error && data && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Chart</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Organizational structure with {data.flat?.length || 0} members
            </p>
            {data.flat && data.flat.length > 0 ? (
              <div className="text-sm text-gray-500">
                Chart visualization coming soon...
              </div>
            ) : (
              <p className="text-gray-500">No structure data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
