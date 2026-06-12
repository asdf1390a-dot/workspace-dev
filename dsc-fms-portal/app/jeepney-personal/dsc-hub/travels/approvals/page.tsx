'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Travel {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  budget?: number;
  user_id: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  permission: string;
  created_at: string;
}

export default function ApprovalsPage() {
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTravel, setSelectedTravel] = useState<Travel | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchTravels();
  }, []);

  async function fetchTravels() {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/travels', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('여행 목록 조회 실패');
      const result = await response.json();
      setTravels(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (travelId: string, newStatus: 'upcoming' | 'ongoing' | 'completed') => {
    try {
      setStatusUpdating(travelId);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/travels/${travelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('상태 업데이트 실패');

      setTravels(prev => prev.map(t =>
        t.id === travelId ? { ...t, status: newStatus } : t
      ));

      if (selectedTravel?.id === travelId) {
        setSelectedTravel({ ...selectedTravel, status: newStatus });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '상태 업데이트 실패');
    } finally {
      setStatusUpdating(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const pendingTravels = travels.filter(t => t.status === 'upcoming');
  const ongoingTravels = travels.filter(t => t.status === 'ongoing');

  if (loading) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">여행 승인 관리</h1>
            <p className="text-gray-600 mt-2">팀원의 여행 요청을 검토하고 승인하세요</p>
          </div>
          <Link href="/jeepney-personal/dsc-hub/travels" className="text-blue-600 hover:underline">
            대시보드로 돌아가기
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 승인 대기 중 */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">승인 대기</h2>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
              {pendingTravels.length}
            </span>
          </div>

          {pendingTravels.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">승인 대기 중인 여행 요청이 없습니다</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {pendingTravels.map(travel => (
                <div key={travel.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{travel.name}</h3>
                      <p className="text-gray-600 mt-1">{travel.location}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      대기 중
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 py-4 border-y border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">출발</p>
                      <p className="font-medium">{formatDate(travel.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">귀가</p>
                      <p className="font-medium">{formatDate(travel.end_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">일정</p>
                      <p className="font-medium">
                        {Math.ceil((new Date(travel.end_date).getTime() - new Date(travel.start_date).getTime()) / (1000 * 60 * 60 * 24))}일
                      </p>
                    </div>
                    {travel.budget && (
                      <div>
                        <p className="text-sm text-gray-600">예산</p>
                        <p className="font-medium">₹{travel.budget?.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedTravel(travel)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      상세 보기
                    </button>
                    <button
                      onClick={() => handleStatusChange(travel.id, 'ongoing')}
                      disabled={statusUpdating === travel.id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400"
                    >
                      {statusUpdating === travel.id ? '처리 중...' : '승인'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 진행 중 */}
        {ongoingTravels.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold">진행 중</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {ongoingTravels.length}
              </span>
            </div>

            <div className="grid gap-6">
              {ongoingTravels.map(travel => (
                <div key={travel.id} className="bg-white rounded-lg shadow p-6 opacity-75">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{travel.name}</h3>
                      <p className="text-gray-600 mt-1">{travel.location}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      진행 중
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-y border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">출발</p>
                      <p className="font-medium">{formatDate(travel.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">귀가</p>
                      <p className="font-medium">{formatDate(travel.end_date)}</p>
                    </div>
                  </div>

                  <Link
                    href={`/jeepney-personal/dsc-hub/travels/${travel.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    상세 보기 →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상세 보기 모달 */}
        {selectedTravel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{selectedTravel.name}</h3>
                <button
                  onClick={() => setSelectedTravel(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 mb-6 py-4 border-t border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">목적지</p>
                  <p className="font-medium">{selectedTravel.location}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">출발</p>
                    <p className="font-medium">{formatDate(selectedTravel.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">귀가</p>
                    <p className="font-medium">{formatDate(selectedTravel.end_date)}</p>
                  </div>
                </div>
                {selectedTravel.budget && (
                  <div>
                    <p className="text-sm text-gray-600">예산</p>
                    <p className="font-medium text-lg">₹{selectedTravel.budget?.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedTravel.status === 'upcoming' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTravel(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    닫기
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedTravel.id, 'ongoing')}
                    disabled={statusUpdating === selectedTravel.id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
                  >
                    {statusUpdating === selectedTravel.id ? '처리 중...' : '승인'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
