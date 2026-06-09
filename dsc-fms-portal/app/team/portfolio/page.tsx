'use client';

import { useState } from 'react';
import { usePortfolioItems } from '@/lib/hooks/useTeamData';
import { LoadingState, ErrorState } from '@/components/team/shared';
import Modal from '@/components/team/Modal';
import { Briefcase } from 'lucide-react';
import { PortfolioItem } from '@/lib/types/team-dashboard';

export default function PortfolioPage() {
  const { data: portfolioItems, loading, error } = usePortfolioItems();
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

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
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 text-left"
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.project_name}
                  className="w-full h-32 object-cover rounded mb-3"
                />
              )}
              <h3 className="font-semibold text-gray-900">{item.project_name}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : item.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.project_name}
        >
          <div className="space-y-4">
            {selectedItem.image_url && (
              <img
                src={selectedItem.image_url}
                alt={selectedItem.project_name}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            {selectedItem.description && (
              <div>
                <h4 className="font-semibold text-gray-900">Description</h4>
                <p className="text-gray-600 mt-1">{selectedItem.description}</p>
              </div>
            )}
            {selectedItem.role && (
              <div>
                <h4 className="font-semibold text-gray-900">Role</h4>
                <p className="text-gray-600 mt-1">{selectedItem.role}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {selectedItem.start_date && (
                <div>
                  <h4 className="font-semibold text-gray-900">Start Date</h4>
                  <p className="text-gray-600 mt-1">
                    {new Date(selectedItem.start_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedItem.end_date && (
                <div>
                  <h4 className="font-semibold text-gray-900">End Date</h4>
                  <p className="text-gray-600 mt-1">
                    {new Date(selectedItem.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            {selectedItem.skills_used && Array.isArray(selectedItem.skills_used) && selectedItem.skills_used.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900">Skills Used</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedItem.skills_used.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedItem.impact && (
              <div>
                <h4 className="font-semibold text-gray-900">Impact</h4>
                <p className="text-gray-600 mt-1">{selectedItem.impact}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">Status</h4>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                  selectedItem.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : selectedItem.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {selectedItem.status}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
