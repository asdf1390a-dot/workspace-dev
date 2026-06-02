'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Travel {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  budget?: number;
  purpose?: string;
  user_id: string;
  created_at: string;
}

interface TravelEvent {
  id: string;
  travel_id: string;
  event_date: string;
  event_type: string;
  description: string;
  created_at: string;
}

interface TravelCost {
  id: string;
  travel_id: string;
  item_name: string;
  category: string;
  amount: number;
  payer_id: string;
  split_type: string;
  created_at: string;
}

interface TravelDocument {
  id: string;
  travel_id: string;
  file_name: string;
  file_type: string;
  document_type: string;
  file_size: number;
  uploaded_at: string;
}

export default function TravelDetailPage() {
  const params = useParams();
  const travelId = (params?.id as string) || '';

  const [travel, setTravel] = useState<Travel | null>(null);
  const [events, setEvents] = useState<TravelEvent[]>([]);
  const [costs, setCosts] = useState<TravelCost[]>([]);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'documents' | 'events'>('overview');

  useEffect(() => {
    if (!travelId) return;
    fetchTravelData();
  }, [travelId]);

  async function fetchTravelData() {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const [travelRes, eventsRes, costsRes, docsRes] = await Promise.all([
        fetch(`/api/travels/${travelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/travels/${travelId}/events`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/travels/${travelId}/costs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/travels/${travelId}/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!travelRes.ok) throw new Error('여행 정보를 불러올 수 없습니다');

      const travelData = await travelRes.json();
      setTravel(travelData.data);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.data || []);
      }

      if (costsRes.ok) {
        const costsData = await costsRes.json();
        setCosts(costsData.data || []);
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
  const durationDays = travel ? Math.ceil((new Date(travel.end_date).getTime() - new Date(travel.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  if (loading) return <div className="p-8">로딩 중...</div>;
  if (!travel) return <div className="p-8 text-red-600">여행을 찾을 수 없습니다</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link href="/travels" className="text-blue-600 hover:underline text-sm mb-4 block">
            ← 뒤로 가기
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{travel.name}</h1>
              <p className="text-gray-600 text-lg">{travel.location}</p>
            </div>
            <span className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: travel.status === 'upcoming' ? '#dbeafe' :
                                travel.status === 'ongoing' ? '#fef08a' :
                                '#dcfce7',
                color: travel.status === 'upcoming' ? '#0369a1' :
                       travel.status === 'ongoing' ? '#854d0e' :
                       '#166534'
              }}>
              {travel.status === 'upcoming' ? '대기 중' :
               travel.status === 'ongoing' ? '진행 중' :
               '완료'}
            </span>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 요약 정보 */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">출발</p>
            <p className="font-semibold text-lg">{formatDate(travel.start_date)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">귀가</p>
            <p className="font-semibold text-lg">{formatDate(travel.end_date)}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">일정</p>
            <p className="font-semibold text-lg">{durationDays}일</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">예산</p>
            <p className="font-semibold text-lg">₹{travel.budget?.toLocaleString() || '-'}</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">지출</p>
            <p className="font-semibold text-lg">₹{totalCost.toLocaleString()}</p>
          </div>
        </div>

        {travel.purpose && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-3">여행 목적</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{travel.purpose}</p>
          </div>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'expenses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              지출 ({costs.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              문서 ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'events'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              일정 ({events.length})
            </button>
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">여행 요약</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">여행명</p>
                    <p className="font-medium">{travel.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">목적지</p>
                    <p className="font-medium">{travel.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">상태</p>
                    <p className="font-medium">{travel.status === 'upcoming' ? '대기 중' : travel.status === 'ongoing' ? '진행 중' : '완료'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">재정 요약</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">예산</p>
                    <p className="font-medium">₹{travel.budget?.toLocaleString() || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">총 지출</p>
                    <p className="font-medium text-lg">₹{totalCost.toLocaleString()}</p>
                  </div>
                  {travel.budget && (
                    <div>
                      <p className="text-sm text-gray-600">남은 예산</p>
                      <p className={`font-medium ${(travel.budget - totalCost) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(travel.budget - totalCost).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">지출 관리</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                + 지출 추가
              </button>
            </div>

            {costs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">등록된 지출이 없습니다</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">항목</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">카테고리</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">금액</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">분담 방식</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {costs.map(cost => (
                      <tr key={cost.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{cost.item_name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {cost.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">₹{cost.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{cost.split_type}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <button className="text-red-600 hover:text-red-800 font-medium">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 font-semibold">합계</td>
                      <td className="px-6 py-4 font-bold text-lg">₹{totalCost.toLocaleString()}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">문서 관리</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                + 파일 업로드
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">업로드된 문서가 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-white rounded-lg shadow p-6 flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs uppercase">{doc.file_type}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{doc.file_name}</h3>
                      <p className="text-sm text-gray-600">{doc.document_type}</p>
                      <p className="text-xs text-gray-500 mt-2">{(doc.file_size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">여행 일정</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                + 일정 추가
              </button>
            </div>

            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">등록된 일정이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map(event => (
                  <div key={event.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{event.event_type}</h3>
                        <p className="text-sm text-gray-600">{formatDate(event.event_date)}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2">{event.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
