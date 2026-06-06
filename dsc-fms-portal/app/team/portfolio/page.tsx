'use client';

import { usePortfolioItems } from '@/lib/hooks/useTeamData';
import { LoadingState, ErrorState } from '@/components/team/shared';
import { Briefcase } from 'lucide-react';

export default function PortfolioPage() {
  const { data: portfolioItems, loading, error } = usePortfolioItems();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
        <p className="text-gray-600 mt-1">Team member projects and accomplishments</p>
      </div>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState />}

      {!loading && !error && portfolioItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No portfolio items yet</p>
        </div>
      )}

      {!loading && !error && portfolioItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
              <h3 className="font-semibold text-gray-900">{item.project_name}</h3>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span className={`px-2 py-1 rounded ${
                  item.status === 'completed' ? 'bg-green-100 text-green-800' :
                  item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
