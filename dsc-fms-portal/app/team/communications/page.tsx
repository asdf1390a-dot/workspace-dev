'use client';

import { useState } from 'react';
import { MessageSquare, Send, Filter } from 'lucide-react';

interface Message {
  id: string;
  memberName: string;
  channel: 'slack' | 'discord' | 'telegram';
  content: string;
  timestamp: string;
  threadCount?: number;
}

interface Thread {
  id: string;
  channel: string;
  subject: string;
  messageCount: number;
  participants: number;
  lastUpdated: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    memberName: 'John Doe',
    channel: 'slack',
    content: 'Team Dashboard Phase 2 UI foundation is complete. Ready for testing.',
    timestamp: '2026-06-06 10:30 AM',
    threadCount: 3,
  },
  {
    id: '2',
    memberName: 'Jane Smith',
    channel: 'discord',
    content: 'Coordinating db/36 migration execution. Estimated completion: today 6pm.',
    timestamp: '2026-06-06 09:15 AM',
    threadCount: 5,
  },
  {
    id: '3',
    memberName: 'Bob Johnson',
    channel: 'telegram',
    content: 'Performance metrics dashboard mockup is ready for review.',
    timestamp: '2026-06-06 08:45 AM',
    threadCount: 2,
  },
];

const mockThreads: Thread[] = [
  {
    id: '1',
    channel: 'slack',
    subject: 'Q2 Planning & Team Alignment',
    messageCount: 24,
    participants: 8,
    lastUpdated: '2026-06-05 4:30 PM',
  },
  {
    id: '2',
    channel: 'discord',
    subject: 'Technical Architecture Discussion',
    messageCount: 18,
    participants: 6,
    lastUpdated: '2026-06-04 2:15 PM',
  },
  {
    id: '3',
    channel: 'telegram',
    subject: 'Urgent: db/36 Migration Status',
    messageCount: 12,
    participants: 4,
    lastUpdated: '2026-06-06 10:00 AM',
  },
];

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
  const [activeTab, setActiveTab] = useState<'messages' | 'threads'>('messages');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  const filteredMessages =
    filterChannel === 'all' ? mockMessages : mockMessages.filter((m) => m.channel === filterChannel);

  const filteredThreads =
    filterChannel === 'all' ? mockThreads : mockThreads.filter((t) => t.channel === filterChannel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-purple-600" />
            Team Communications
          </h1>
          <p className="text-gray-600 mt-1">Centralized team communication across channels</p>
        </div>
      </div>

      <div className="flex gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'threads'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Threads
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Channels</option>
            <option value="slack">Slack</option>
            <option value="discord">Discord</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>
      </div>

      {activeTab === 'messages' && (
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No messages found</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div key={message.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{message.memberName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getChannelColor(message.channel)}`}>
                      {getChannelIcon(message.channel)} {message.channel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">{message.timestamp}</span>
                  {message.threadCount && message.threadCount > 0 && (
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {message.threadCount} replies
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'threads' && (
        <div className="space-y-4">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No threads found</p>
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                className="w-full bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getChannelColor(thread.channel)}`}>
                        {getChannelIcon(thread.channel)} {thread.channel}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{thread.subject}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm border-t border-gray-200 pt-4">
                  <div>
                    <p className="text-gray-600">Messages</p>
                    <p className="font-semibold text-gray-900">{thread.messageCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Participants</p>
                    <p className="font-semibold text-gray-900">{thread.participants}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">Last Updated</p>
                    <p className="font-semibold text-gray-900 text-sm">{thread.lastUpdated}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
