'use client';

import { useState } from 'react';
import { useActivityLog } from '@/lib/hooks/useTeamData';
import { LoadingState, ErrorState } from '@/components/team/shared';
import Modal from '@/components/team/Modal';
import { Clock } from 'lucide-react';
import { ActivityLog } from '@/lib/types/team-dashboard';

export default function ActivityPage() {
  const { data: activities, loading, error } = useActivityLog();
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

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
            <button
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              className="w-full bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-blue-500 text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{activity.activity_type}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {activity.activity_description}
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                  {new Date(activity.created_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedActivity && (
        <Modal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title={selectedActivity.activity_type}
        >
          <div className="space-y-4">
            {selectedActivity.activity_description && (
              <div>
                <h4 className="font-semibold text-gray-900">Details</h4>
                <p className="text-gray-600 mt-2">{selectedActivity.activity_description}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">Date</h4>
              <p className="text-gray-600 mt-1">
                {new Date(selectedActivity.created_at).toLocaleString()}
              </p>
            </div>
            {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Metadata</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-600 overflow-auto">
                    {JSON.stringify(selectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
