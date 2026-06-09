'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  changed_by: string;
  changed_at: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  change_description: string;
}

interface AuditLogTabProps {
  assetId: string;
}

const operationColors: Record<string, string> = {
  INSERT: 'bg-green-50 border-green-200 text-green-800',
  UPDATE: 'bg-blue-50 border-blue-200 text-blue-800',
  DELETE: 'bg-red-50 border-red-200 text-red-800',
};

const operationLabels: Record<string, string> = {
  INSERT: '✓ Created',
  UPDATE: '✎ Modified',
  DELETE: '✕ Deleted',
};

export default function AuditLogTab({ assetId }: AuditLogTabProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [assetId]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assets/${assetId}/audit-log?page=1&per_page=50`);
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setAuditLogs(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading audit log...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (auditLogs.length === 0) {
    return <div className="text-center py-12 text-slate-600">No changes recorded yet</div>;
  }

  return (
    <div className="space-y-3">
      {auditLogs.map((log) => (
        <div
          key={log.id}
          className={`border rounded-lg overflow-hidden transition-colors ${operationColors[log.operation] || 'bg-slate-50 border-slate-200'}`}
        >
          <button
            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            className="w-full p-4 hover:bg-opacity-75 transition-opacity text-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold">
                    {operationLabels[log.operation] || log.operation}
                  </span>
                  <span className="text-xs opacity-75">in {log.table_name}</span>
                </div>
                <p className="text-sm font-medium truncate">{log.change_description}</p>
                <p className="text-xs opacity-75 mt-1">
                  {new Date(log.changed_at).toLocaleString()} • by {log.changed_by}
                </p>
              </div>
              <div className="text-slate-400 flex-shrink-0">
                {expandedId === log.id ? '▼' : '▶'}
              </div>
            </div>
          </button>

          {expandedId === log.id && (
            <div className="border-t border-inherit px-4 py-3 bg-opacity-50">
              <div className="space-y-4">
                {log.operation === 'UPDATE' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-semibold opacity-75 mb-2">Previous Values</h4>
                      <div className="text-xs space-y-1 font-mono bg-opacity-50">
                        {Object.entries(log.old_values || {}).map(([key, value]) => (
                          <div key={key} className="break-words">
                            <span className="font-semibold">{key}:</span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold opacity-75 mb-2">New Values</h4>
                      <div className="text-xs space-y-1 font-mono bg-opacity-50">
                        {Object.entries(log.new_values || {}).map(([key, value]) => (
                          <div key={key} className="break-words">
                            <span className="font-semibold">{key}:</span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {log.operation === 'INSERT' && (
                  <div>
                    <h4 className="text-xs font-semibold opacity-75 mb-2">Created With</h4>
                    <div className="text-xs space-y-1 font-mono bg-opacity-50">
                      {Object.entries(log.new_values || {}).map(([key, value]) => (
                        <div key={key} className="break-words">
                          <span className="font-semibold">{key}:</span>{' '}
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {log.operation === 'DELETE' && (
                  <div>
                    <h4 className="text-xs font-semibold opacity-75 mb-2">Deleted Values</h4>
                    <div className="text-xs space-y-1 font-mono bg-opacity-50">
                      {Object.entries(log.old_values || {}).map(([key, value]) => (
                        <div key={key} className="break-words">
                          <span className="font-semibold">{key}:</span>{' '}
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
