'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SettlementDisplay from '@/components/travel/SettlementDisplay';
import TravelCostsTab from '@/components/travel/TravelCostsTab';
import TravelChecklistTab from '@/components/travel/TravelChecklistTab';
import TravelScheduleTab from '@/components/travel/TravelScheduleTab';
import TravelDocumentsTab from '@/components/travel/TravelDocumentsTab';
import TravelNotificationsTab from '@/components/travel/TravelNotificationsTab';
import CostModal from '@/components/travel/CostModal';
import EventModal from '@/components/travel/EventModal';
import TravelEditModal from '@/components/travel/TravelEditModal';
import MemberManagementModal from '@/components/travel/MemberManagementModal';
import { TravelChecklistItem, TravelEvent, TravelDocument } from '@/types/travel';

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

interface TransformedTravelCost {
  id: string;
  title: string;
  amount: number;
  currency: string;
  cost_type: string;
  cost_date: string;
  payer_id: string;
  workflow_status?: 'request' | 'pending_approval' | 'approved' | 'reimbursed';
  approved_by?: string;
  approved_at?: string;
}

export default function TravelDetailPage() {
  const params = useParams();
  const travelId = (params?.id as string) || '';

  const [travel, setTravel] = useState<Travel | null>(null);
  const [events, setEvents] = useState<TravelEvent[]>([]);
  const [costs, setCosts] = useState<TravelCost[]>([]);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [checklistItems, setChecklistItems] = useState<TravelChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'documents' | 'events' | 'checklist' | 'notifications'>('overview');

  // Modal states
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [travelEditModalOpen, setTravelEditModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  const refetchCosts = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const costsRes = await fetch(`/api/travels/${travelId}/costs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (costsRes.ok) {
        const costsData = await costsRes.json();
        setCosts(costsData.data || []);
      }
    } catch (err) {
      console.error('Failed to refetch costs:', err);
    }
  }, [travelId]);

  const refetchChecklist = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const checklistRes = await fetch(`/api/travels/${travelId}/checklist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (checklistRes.ok) {
        const checklistData = await checklistRes.json();
        setChecklistItems(checklistData.data || []);
      }
    } catch (err) {
      console.error('Failed to refetch checklist:', err);
    }
  }, [travelId]);

  const refetchEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const eventsRes = await fetch(`/api/travels/${travelId}/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.data || []);
      }
    } catch (err) {
      console.error('Failed to refetch events:', err);
    }
  }, [travelId]);

  const refetchDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const docsRes = await fetch(`/api/travels/${travelId}/documents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.data || []);
      }
    } catch (err) {
      console.error('Failed to refetch documents:', err);
    }
  }, [travelId]);

  const refetchNotifications = useCallback(async () => {
    // TravelNotificationsTab handles its own refresh internally via onRefresh prop
  }, [travelId]);

  const refetchMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const membersRes = await fetch(`/api/travels/${travelId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.data || []);
      }
    } catch (err) {
      console.error('Failed to refetch members:', err);
    }
  }, [travelId]);

  useEffect(() => {
    if (!travelId) return;
    fetchTravelData();
  }, [travelId]);

  async function fetchTravelData() {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const [travelRes, eventsRes, costsRes, docsRes, checklistRes, membersRes] = await Promise.all([
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
        }),
        fetch(`/api/travels/${travelId}/checklist`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/travels/${travelId}/members`, {
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

      if (checklistRes.ok) {
        const checklistData = await checklistRes.json();
        setChecklistItems(checklistData.data || []);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.data || []);
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

  const transformCosts = (rawCosts: TravelCost[]): TransformedTravelCost[] => {
    return rawCosts.map(cost => ({
      id: cost.id,
      title: cost.item_name,
      amount: cost.amount,
      currency: 'INR',
      cost_type: cost.category.toLowerCase().replace(/\s+/g, '_'),
      cost_date: cost.created_at,
      payer_id: cost.payer_id,
    }));
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
            <div className="flex gap-3 items-start">
              <button
                onClick={() => setTravelEditModalOpen(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                여행 수정
              </button>
              <button
                onClick={() => setMemberModalOpen(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                멤버 관리
              </button>
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
            <button
              onClick={() => setActiveTab('checklist')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'checklist'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              체크리스트 ({checklistItems.length})
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-2 border-b-2 font-medium ${
                activeTab === 'notifications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              알림
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
            <div className="mb-6">
              <button
                onClick={() => setCostModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + 비용 추가
              </button>
            </div>

            <TravelCostsTab
              travelId={travelId}
              costs={transformCosts(costs)}
              onRefresh={refetchCosts}
            />

            <div className="mt-8">
              <SettlementDisplay travelId={travelId} />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <TravelDocumentsTab
            travelId={travelId}
            documents={documents}
            onRefresh={refetchDocuments}
          />
        )}

        {activeTab === 'events' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setEventModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + 일정 추가
              </button>
            </div>

            <TravelScheduleTab
              travelId={travelId}
              events={events}
              onRefresh={refetchEvents}
            />
          </div>
        )}

        {activeTab === 'checklist' && (
          <TravelChecklistTab
            travelId={travelId}
            items={checklistItems}
            onRefresh={refetchChecklist}
          />
        )}

        {activeTab === 'notifications' && (
          <TravelNotificationsTab
            travelId={travelId}
            onRefresh={refetchNotifications}
          />
        )}
      </div>

      {/* Modals */}
      <CostModal
        open={costModalOpen}
        onOpenChange={setCostModalOpen}
        travelId={travelId}
        onSuccess={refetchCosts}
      />

      <EventModal
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
        travelId={travelId}
        onSuccess={refetchEvents}
      />

      <TravelEditModal
        open={travelEditModalOpen}
        onOpenChange={setTravelEditModalOpen}
        travelId={travelId}
        initialData={travel ? {
          name: travel.name,
          location: travel.location,
          start_date: travel.start_date,
          end_date: travel.end_date,
          budget: travel.budget,
          purpose: travel.purpose,
          status: travel.status,
        } : undefined}
        onSuccess={() => {
          fetchTravelData();
        }}
      />

      <MemberManagementModal
        open={memberModalOpen}
        onOpenChange={setMemberModalOpen}
        travelId={travelId}
        members={members}
        onSuccess={refetchMembers}
      />
    </div>
  );
}
