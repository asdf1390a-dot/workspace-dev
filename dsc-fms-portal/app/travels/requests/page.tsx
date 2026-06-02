'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ItineraryLeg {
  id: string;
  location: string;
  start_date: string;
  end_date: string;
  notes: string;
}

export default function NewTravelRequest() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legs, setLegs] = useState<ItineraryLeg[]>([
    { id: '1', location: '', start_date: '', end_date: '', notes: '' }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    purpose: '',
    budget: '',
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLegChange = (id: string, field: keyof ItineraryLeg, value: string) => {
    setLegs(prev => prev.map(leg =>
      leg.id === id ? { ...leg, [field]: value } : leg
    ));
  };

  const addLeg = () => {
    const newId = Date.now().toString();
    setLegs(prev => [...prev, {
      id: newId,
      location: '',
      start_date: '',
      end_date: '',
      notes: ''
    }]);
  };

  const removeLeg = (id: string) => {
    if (legs.length > 1) {
      setLegs(prev => prev.filter(leg => leg.id !== id));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('여행명을 입력해주세요');
      return false;
    }
    if (!formData.location.trim()) {
      setError('목적지를 입력해주세요');
      return false;
    }
    if (!formData.start_date) {
      setError('시작 날짜를 선택해주세요');
      return false;
    }
    if (!formData.end_date) {
      setError('종료 날짜를 선택해주세요');
      return false;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('종료 날짜는 시작 날짜보다 이후여야 합니다');
      return false;
    }
    if (legs.some(leg => !leg.location.trim() || !leg.start_date || !leg.end_date)) {
      setError('모든 일정 구간을 완성해주세요');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('인증이 필요합니다');
        return;
      }

      const response = await fetch('/api/travels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          start_date: formData.start_date,
          end_date: formData.end_date,
          purpose: formData.purpose,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          status: 'upcoming',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || '여행 생성 실패');
      }

      const result = await response.json();
      router.push(`/travels/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/travels" className="text-blue-600 hover:underline">
            ← 뒤로 가기
          </Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">새 여행 계획</h1>
          <p className="text-gray-600">여행 일정, 예산, 일정을 관리해보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* 기본 정보 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">기본 정보</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  여행명 *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="예: 인도 출장"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  목적지 *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="예: Chennai, India"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    출발 날짜 *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    귀가 날짜 *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  여행 목적
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleFormChange}
                  placeholder="예: 공장 방문, 미팅, 협력사 업무"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예산 (INR)
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleFormChange}
                  placeholder="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 여행 일정 (다중 구간) */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">여행 일정</h2>
              <button
                type="button"
                onClick={addLeg}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
              >
                + 일정 추가
              </button>
            </div>

            <div className="space-y-6">
              {legs.map((leg, idx) => (
                <div key={leg.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-700">구간 {idx + 1}</h3>
                    {legs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLeg(leg.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                      >
                        제거
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        위치 *
                      </label>
                      <input
                        type="text"
                        value={leg.location}
                        onChange={(e) => handleLegChange(leg.id, 'location', e.target.value)}
                        placeholder="예: Chennai"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          도착 날짜 *
                        </label>
                        <input
                          type="date"
                          value={leg.start_date}
                          onChange={(e) => handleLegChange(leg.id, 'start_date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          출발 날짜 *
                        </label>
                        <input
                          type="date"
                          value={leg.end_date}
                          onChange={(e) => handleLegChange(leg.id, 'end_date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        메모
                      </label>
                      <textarea
                        value={leg.notes}
                        onChange={(e) => handleLegChange(leg.id, 'notes', e.target.value)}
                        placeholder="일정 메모"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4">
            <Link
              href="/travels"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {loading ? '생성 중...' : '여행 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
