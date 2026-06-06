'use client';

import { useState } from 'react';
import { Shield, Filter, Download } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  targetType: 'member' | 'project' | 'allocation' | 'system';
  changes: {
    field: string;
    before: string;
    after: string;
  }[];
  status: 'success' | 'failed' | 'warning';
}

const mockAuditLog: AuditEntry[] = [
  {
    id: '1',
    timestamp: '2026-06-06 10:30 AM',
    action: 'CREATED',
    actor: 'System',
    target: 'Phase 2B UI Foundation',
    targetType: 'project',
    changes: [
      { field: 'status', before: 'draft', after: 'active' },
      { field: 'completion', before: '0%', after: '100%' },
    ],
    status: 'success',
  },
  {
    id: '2',
    timestamp: '2026-06-06 09:15 AM',
    action: 'UPDATED',
    actor: 'Web-Builder #2',
    target: 'Member Detail Page',
    targetType: 'project',
    changes: [
      { field: 'implementation', before: 'pending', after: 'completed' },
    ],
    status: 'success',
  },
  {
    id: '3',
    timestamp: '2026-06-06 08:45 AM',
    action: 'ALLOCATED',
    actor: 'CEO',
    target: 'John Doe - Team Dashboard P2',
    targetType: 'allocation',
    changes: [
      { field: 'hours', before: '100h', after: '120h' },
      { field: 'status', before: 'scheduled', after: 'active' },
    ],
    status: 'success',
  },
  {
    id: '4',
    timestamp: '2026-06-05 6:30 PM',
    action: 'DELETED',
    actor: 'System',
    target: 'Deprecated API Endpoint',
    targetType: 'system',
    changes: [
      { field: 'endpoint', before: '/api/v1/old', after: 'removed' },
    ],
    status: 'warning',
  },
  {
    id: '5',
    timestamp: '2026-06-05 4:00 PM',
    action: 'FAILED',
    actor: 'Auto-Backup',
    target: 'Database Backup',
    targetType: 'system',
    changes: [
      { field: 'status', before: 'initiated', after: 'failed' },
      { field: 'error', before: 'none', after: 'Timeout after 5min' },
    ],
    status: 'failed',
  },
];

function getActionColor(action: string, status: string) {
  if (status === 'failed') return 'bg-red-100 text-red-800';
  if (status === 'warning') return 'bg-yellow-100 text-yellow-800';

  switch (action) {
    case 'CREATED':
      return 'bg-green-100 text-green-800';
    case 'UPDATED':
      return 'bg-blue-100 text-blue-800';
    case 'DELETED':
      return 'bg-red-100 text-red-800';
    case 'ALLOCATED':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return '✓';
    case 'failed':
      return '✗';
    case 'warning':
      return '⚠';
    default:
      return '•';
  }
}

function getTargetTypeColor(type: string) {
  switch (type) {
    case 'member':
      return 'bg-blue-50 text-blue-900';
    case 'project':
      return 'bg-green-50 text-green-900';
    case 'allocation':
      return 'bg-purple-50 text-purple-900';
    case 'system':
      return 'bg-gray-50 text-gray-900';
    default:
      return 'bg-gray-50 text-gray-900';
  }
}

export default function AuditPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLog = mockAuditLog.filter((entry) => {
    if (filterType !== 'all' && entry.targetType !== filterType) return false;
    if (filterAction !== 'all' && entry.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-orange-600" />
            Audit Log
          </h1>
          <p className="text-gray-600 mt-1">System activity and change tracking</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-2" />
            Filter by Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="member">Member</option>
            <option value="project">Project</option>
            <option value="allocation">Allocation</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Action
          </label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Actions</option>
            <option value="CREATED">Created</option>
            <option value="UPDATED">Updated</option>
            <option value="DELETED">Deleted</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredLog.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No audit entries found</p>
          </div>
        ) : (
          filteredLog.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <button
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full text-left p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">
                        {getStatusIcon(entry.status)}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getActionColor(entry.action, entry.status)}`}>
                            {entry.action}
                          </span>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTargetTypeColor(entry.targetType)}`}>
                            {entry.targetType}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mt-1">{entry.target}</h3>
                        <p className="text-sm text-gray-600 mt-1">by {entry.actor}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-xs text-gray-500">{entry.timestamp}</p>
                  </div>
                </div>

                {expandedId === entry.id && entry.changes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3">Changes:</h4>
                    <div className="space-y-2">
                      {entry.changes.map((change, idx) => (
                        <div key={idx} className="bg-gray-50 rounded p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{change.field}</span>
                            <span className="text-gray-600">
                              <span className="text-red-600">{change.before}</span>
                              <span className="mx-2 text-gray-400">→</span>
                              <span className="text-green-600">{change.after}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
