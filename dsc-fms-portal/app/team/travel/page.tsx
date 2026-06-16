'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Filter } from 'lucide-react';

interface TravelEntry {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  attendees: string[];
  purpose: string;
  status: 'planned' | 'ongoing' | 'completed';
}

export default function TravelPage() {
  const [travels, setTravels] = useState<TravelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/travels');
        const data = await res.json();
        setTravels(data.data || []);
      } catch (error) {
        console.error('Failed to fetch travels:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned':
        return '예정';
      case 'ongoing':
        return '진행중';
      case 'completed':
        return '완료';
      default:
        return status;
    }
  };

  const filteredTravels = travels.filter((travel) => {
    if (filterStatus !== 'all' && travel.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-8 h-8 text-emerald-600" />
            출장 관리
          </h1>
          <p className="text-slate-600 mt-1">팀 출장 일정 및 계획 관리</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          출장 등록
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Filter className="w-4 h-4 inline mr-2" />
          상태 필터
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">모든 상태</option>
          <option value="planned">예정</option>
          <option value="ongoing">진행중</option>
          <option value="completed">완료</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-200 rounded-lg h-24 animate-pulse" />
            ))}
          </div>
        ) : filteredTravels.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-500">출장 데이터 없음</p>
          </div>
        ) : (
          filteredTravels.map((travel) => (
            <div key={travel.id} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{travel.destination}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(travel.status)}`}>
                      {getStatusLabel(travel.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{travel.purpose}</p>
                  <div className="text-xs text-slate-500">
                    <p>{new Date(travel.startDate).toLocaleDateString('ko-KR')} ~ {new Date(travel.endDate).toLocaleDateString('ko-KR')}</p>
                    <p className="mt-1">참석자: {travel.attendees.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
