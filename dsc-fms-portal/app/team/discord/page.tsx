'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';

export default function DiscordPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/discord/messages');
        const data = await res.json();
        setMessages(data.data || []);
      } catch (error) {
        console.error('Failed to fetch discord messages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
            Discord 채널
          </h1>
          <p className="text-slate-600 mt-1">팀 커뮤니케이션 및 메시지 기록</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Send className="w-4 h-4" />
          메시지 발송
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-200 rounded-lg h-16 animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-500">메시지 데이터 없음</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-700">
                  {msg.author?.[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{msg.author || 'Unknown'}</h4>
                    <span className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p className="text-slate-700">{msg.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
