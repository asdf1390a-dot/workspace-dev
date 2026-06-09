'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, AlertCircle } from 'lucide-react';

interface AllocationData {
  memberId: string;
  totalCapacityHours: number;
  allocatedHours: number;
  availableHours: number;
  allocationPercentage: number;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'scheduled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'border-l-4 border-red-500';
    case 'medium':
      return 'border-l-4 border-yellow-500';
    case 'low':
      return 'border-l-4 border-green-500';
    default:
      return 'border-l-4 border-gray-500';
  }
}

export default function ResourcesPage() {
  const [availabilityData, setAvailabilityData] = useState<AllocationData[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [availRes, allocRes] = await Promise.all([
          fetch('/api/team/resources/availability?month=2026-06'),
          fetch('/api/team/resources/allocations?limit=20'),
        ]);

        const availData = await availRes.json();
        const allocData = await allocRes.json();

        setAvailabilityData(availData.data || []);
        setAllocations(allocData.data || []);
      } catch (error) {
        console.error('Failed to fetch resource data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalMembers = availabilityData.length;
  const totalCapacity = availabilityData.reduce((sum, item) => sum + item.totalCapacityHours, 0);
  const totalAllocated = availabilityData.reduce((sum, item) => sum + item.allocatedHours, 0);
  const totalAvailable = availabilityData.reduce((sum, item) => sum + item.availableHours, 0);
  const allocationPercentage = totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

  if (loading) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-500">Loading resource data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-green-600" />
            리소스 관리
          </h1>
          <p className="text-slate-600 mt-1">팀 역량 및 자원 배분 현황</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <p className="text-xs text-slate-600 mb-2">팀원 수</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalMembers}</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <p className="text-xs text-slate-600 mb-2">전체 역량</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600">{totalCapacity}h</span>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <p className="text-xs text-slate-600 mb-2">배분된 시간</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-600">{totalAllocated}h</span>
            <AlertCircle className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <p className="text-xs text-slate-600 mb-2">가용 시간</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-green-600">{totalAvailable}h</span>
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">배분 현황 (2026년 6월)</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-700">전체 배분율</span>
            <span className="text-2xl font-bold text-blue-600">{allocationPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-600">
            <span>{totalAllocated}h 배분</span>
            <span>{totalAvailable}h 가용</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">활성 배분</h2>
        <div className="space-y-3">
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              배분 데이터 없음
            </div>
          ) : (
            allocations.map((allocation) => (
              <div
                key={allocation.id}
                className={`border rounded-lg p-4 ${getPriorityColor(allocation.priority)} bg-white hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{allocation.project_id || `배분 ${allocation.id}`}</h4>
                    <p className="text-sm text-slate-600">담당자: {allocation.member_id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(allocation.status)}`}>
                    {allocation.status === 'active' ? '진행중' : allocation.status === 'completed' ? '완료' : allocation.status === 'scheduled' ? '예정' : '일시중지'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">시작일</p>
                    <p className="font-semibold text-slate-900">{new Date(allocation.start_date).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">종료일</p>
                    <p className="font-semibold text-slate-900">{new Date(allocation.end_date).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">배분 시간</p>
                    <p className="font-semibold text-slate-900">{allocation.allocated_hours}h</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
