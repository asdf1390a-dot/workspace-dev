'use client';

import { useActivityLog } from '@/lib/hooks/useTeamData';
import { LoadingState, ErrorState } from '@/components/team/shared';
import { Clock } from 'lucide-react';

export default function ActivityPage() {
  const { data: activities, loading, error } = useActivityLog();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-600 mt-1">Recent team activities</p>
      </div>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState />}

      {!loading && !error && activities.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No activities logged yet</p>
        </div>
      )}

      {!loading && !error && activities.length > 0 && (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{activity.activity_type}</p>
                  <p className="text-sm text-gray-600 mt-1">{activity.activity_description}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
