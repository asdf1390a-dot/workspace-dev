'use client';

import { useState, useEffect } from 'react';

interface BackupSettings {
  scheduleHour?: string;
  scheduleDayOfWeek?: string;
  notificationChannels?: string[];
  storageQuotaGb?: number;
}

interface BackupMetrics {
  dailyBackupCount?: number;
  storageUsageGb?: number;
  lastBackupTime?: string;
}

interface StorageInfo {
  usedGb?: number;
  quotaGb?: number;
}

export default function BackupPage() {
  const [settings, setSettings] = useState<BackupSettings>({});
  const [metrics, setMetrics] = useState<BackupMetrics>({});
  const [storage, setStorage] = useState<StorageInfo>({});
  const [notifications, setNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch backup configuration
        const settingsRes = await fetch('/api/backup/settings', { method: 'GET' });
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings(data);
        }

        // Fetch metrics
        const metricsRes = await fetch('/api/backup/metrics', { method: 'GET' });
        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data);
        }

        // Fetch storage
        const storageRes = await fetch('/api/backup/storage', { method: 'GET' });
        if (storageRes.ok) {
          const data = await storageRes.json();
          setStorage(data);
        }

        // Fetch notifications
        const notifRes = await fetch('/api/backup/notifications', { method: 'GET' });
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.channels || []);
        }

        setError(null);
      } catch (err) {
        setError('Failed to load backup data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/backup/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setError(null);
    } catch (err) {
      setError('Failed to save backup settings');
    }
  };

  const handleNotificationToggle = async (channel: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/backup/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, enabled }),
      });
      if (!res.ok) throw new Error('Failed to update notification');
      if (enabled) {
        setNotifications([...notifications, channel]);
      } else {
        setNotifications(notifications.filter(c => c !== channel));
      }
      setError(null);
    } catch (err) {
      setError('Failed to update notification settings');
    }
  };

  if (loading) {
    return <div className="p-6">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">백업 관리</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Auto Backup Settings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">자동 백업 설정</h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">스케줄 시간</label>
                <input
                  type="text"
                  placeholder="HH:MM"
                  value={settings.scheduleHour || ''}
                  onChange={(e) => setSettings({ ...settings, scheduleHour: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">요일</label>
                <input
                  type="text"
                  placeholder="요일"
                  value={settings.scheduleDayOfWeek || ''}
                  onChange={(e) => setSettings({ ...settings, scheduleDayOfWeek: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                설정 저장
              </button>
            </form>
          </div>

          {/* Storage Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">저장소 관리</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">할당량 : {storage.quotaGb || 0}GB</p>
                <p className="text-sm text-gray-600 mt-2">사용량 : {storage.usedGb || 0}GB</p>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      storage.quotaGb && storage.usedGb
                        ? storage.usedGb / storage.quotaGb >= 0.8
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                        : 'bg-blue-500'
                    }`}
                    style={{
                      width:
                        storage.quotaGb && storage.usedGb
                          ? `${(storage.usedGb / storage.quotaGb) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
              <input
                type="number"
                placeholder="새 할당량 (GB)"
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                onChange={(e) => setSettings({ ...settings, storageQuotaGb: parseInt(e.target.value) })}
              />
              <button className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700">
                클린업 수행
              </button>
            </div>
          </div>
        </div>

        {/* Backup Metrics */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">백업 메트릭</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">일일 백업 수</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.dailyBackupCount || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">저장소 사용량</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.storageUsageGb || 0}GB</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">마지막 백업</p>
              <p className="text-sm font-mono text-gray-900">{metrics.lastBackupTime || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">알림 설정</h2>
          <div className="space-y-3">
            {['Email', 'Telegram', 'InApp'].map((channel) => (
              <div key={channel} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                <label className="text-gray-700">{channel}</label>
                <button
                  onClick={() => handleNotificationToggle(channel, !notifications.includes(channel))}
                  className={`px-4 py-2 rounded ${
                    notifications.includes(channel)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {notifications.includes(channel) ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
