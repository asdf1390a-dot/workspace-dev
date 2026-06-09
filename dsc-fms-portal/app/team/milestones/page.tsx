'use client';

import { useState, useEffect } from 'react';
import { Flag, Calendar, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '@/components/team/Modal';
import { LoadingState, ErrorState } from '@/components/team/shared';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  target_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  owner_id?: string;
  completion_date?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
  });

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/team-dashboard/milestones');
      if (!response.ok) throw new Error('Failed to fetch milestones');
      const data = await response.json();
      setMilestones(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/team-dashboard/milestones', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'pending',
        }),
      });
      if (!response.ok) throw new Error('Failed to create milestone');
      const newMilestone = await response.json();
      setMilestones([...milestones, newMilestone]);
      setFormData({ title: '', description: '', target_date: '' });
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Milestones</h1>
          <p className="text-gray-600 mt-1">Track project milestones and deliverables</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Milestone
        </button>
      </div>

      {error && <ErrorState message={error} />}
      {loading && <LoadingState />}

      {!loading && !error && milestones.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <Flag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No milestones yet</p>
        </div>
      )}

      {!loading && !error && sortedMilestones.length > 0 && (
        <div className="space-y-4">
          {sortedMilestones.map((milestone) => (
            <button
              key={milestone.id}
              onClick={() => setSelectedMilestone(milestone)}
              className="w-full bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${getStatusColor(milestone.status)}`}>
                      {getStatusIcon(milestone.status)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
                  </div>
                  {milestone.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{milestone.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(milestone.target_date).toLocaleDateString()}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Milestone Modal */}
      {showCreateForm && (
        <Modal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          title="Create New Milestone"
        >
          <form onSubmit={handleCreateMilestone} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Milestone Detail Modal */}
      {selectedMilestone && (
        <Modal
          isOpen={!!selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          title={selectedMilestone.title}
        >
          <div className="space-y-4">
            {selectedMilestone.description && (
              <div>
                <h4 className="font-semibold text-gray-900">Description</h4>
                <p className="text-gray-600 mt-1">{selectedMilestone.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900">Target Date</h4>
                <p className="text-gray-600 mt-1">
                  {new Date(selectedMilestone.target_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Status</h4>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(selectedMilestone.status)}`}>
                  {selectedMilestone.status}
                </span>
              </div>
            </div>
            {selectedMilestone.completion_date && (
              <div>
                <h4 className="font-semibold text-gray-900">Completion Date</h4>
                <p className="text-gray-600 mt-1">
                  {new Date(selectedMilestone.completion_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div className="text-xs text-gray-500 pt-4 border-t">
              <p>Created: {new Date(selectedMilestone.created_at).toLocaleString()}</p>
              <p>Updated: {new Date(selectedMilestone.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
