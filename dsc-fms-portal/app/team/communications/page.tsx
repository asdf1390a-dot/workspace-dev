'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Filter } from 'lucide-react';

interface ChannelStats {
  channel: 'slack' | 'discord' | 'telegram';
  name: string;
  messageCount: number;
  participantCount: number;
  mostActiveTime: string;
  topParticipants: Array<{ name: string; messageCount: number }>;
}

function getChannelColor(channel: string) {
  switch (channel) {
    case 'slack':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'discord':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'telegram':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case 'slack':
      return '💬';
    case 'discord':
      return '🎮';
    case 'telegram':
      return '✈️';
    default:
      return '📨';
  }
}

export default function CommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'stats'>('stats');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [stats, setStats] = useState<ChannelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/team/communications/statistics?days=7');
        const data = await res.json();
        setStats(data.channels || []);
      } catch (error) {
        console.error('Failed to fetch communication stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredStats = filterChannel === 'all' ? stats : stats.filter((s) => s.channel === filterChannel);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            팀 커뮤니케이션
          </h1>
          <p className="text-slate-600 mt-1">채널별 팀 커뮤니케이션 통계</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-slate-600" />
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">모든 채널</option>
          <option value="slack">Slack</option>
          <option value="discord">Discord</option>
          <option value="telegram">Telegram</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-200 rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredStats.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg col-span-full border border-slate-200">
              <p className="text-slate-500">통계 데이터 없음</p>
            </div>
          ) : (
            filteredStats.map((channel) => (
              <div key={channel.channel} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">#{channel.name}</h3>
                  <span className="text-2xl">{getChannelIcon(channel.channel)}</span>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-4">
                    <p className="text-xs text-slate-600 mb-1">총 메시지</p>
                    <p className="text-2xl font-bold text-blue-600">{channel.messageCount}</p>
                  </div>

                  <div className="border-b border-slate-200 pb-4">
                    <p className="text-xs text-slate-600 mb-1">참여자</p>
                    <p className="text-2xl font-bold text-slate-900">{channel.participantCount}</p>
                  </div>

                  <div className="border-b border-slate-200 pb-4">
                    <p className="text-xs text-slate-600 mb-1">가장 활발한 시간</p>
                    <p className="text-sm font-semibold text-slate-900">{channel.mostActiveTime}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 mb-2">상위 참여자</p>
                    <div className="space-y-2">
                      {channel.topParticipants.map((participant, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-slate-900">{participant.name}</span>
                          <span className="font-semibold text-slate-600">{participant.messageCount}건</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
