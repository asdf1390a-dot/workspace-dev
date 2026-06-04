'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Portfolio {
  id: string;
  member_id: string;
  title: string;
  description: string | null;
  status: 'in_progress' | 'completed' | 'on_hold';
  impact_score: number;
  visibility: 'team' | 'private' | 'public';
  tags: string[];
  media: any[];
  created_at: string;
  updated_at: string;
}

interface Milestone {
  id: string;
  portfolio_id: string;
  title: string;
  description: string | null;
  target_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  weight: number;
  created_at: string;
  updated_at: string;
}

export default function PortfolioDetail() {
  const params = useParams();
  const router = useRouter();
  const portfolioId = (params?.id as string) || '';

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    status: 'pending' as const,
    weight: 1.0,
  });

  const userId = 'user-1'; // In production, get from session/auth

  const fetchPortfolioData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch portfolio
      const portfolioResponse = await fetch('/api/portfolio', {
        headers: { 'x-user-id': userId },
      });
      if (!portfolioResponse.ok) throw new Error('Failed to fetch portfolio');

      const portfolios = await portfolioResponse.json();
      const currentPortfolio = portfolios.find((p: Portfolio) => p.id === portfolioId);
      if (!currentPortfolio) throw new Error('Portfolio not found');

      setPortfolio(currentPortfolio);

      // Fetch milestones
      const milestonesResponse = await fetch(`/api/milestones?portfolioId=${portfolioId}`);
      if (!milestonesResponse.ok) throw new Error('Failed to fetch milestones');

      const milestonesData = await milestonesResponse.json();
      setMilestones(milestonesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, userId]);

  useEffect(() => {
    if (portfolioId) {
      fetchPortfolioData();
    }
  }, [portfolioId, fetchPortfolioData]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolio_id: portfolioId,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to create milestone');

      await fetchPortfolioData();
      setShowMilestoneForm(false);
      setFormData({
        title: '',
        description: '',
        target_date: '',
        status: 'pending',
        weight: 1.0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete milestone');

      await fetchPortfolioData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting milestone');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-red-100 text-red-800',
      pending: 'bg-slate-100 text-slate-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      in_progress: '🟡 진행중',
      completed: '✅ 완료',
      on_hold: '⏸️ 보류',
      pending: '⏳ 대기',
    };
    return labels[status] || status;
  };

  const getVisibilityLabel = (visibility: string) => {
    const labels: Record<string, string> = {
      team: '👥 팀',
      private: '🔒 비공개',
      public: '🌐 공개',
    };
    return labels[visibility] || visibility;
  };

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const completionRate = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <p className="text-slate-500">로드 중...</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-500 mb-4">포트폴리오를 찾을 수 없습니다</p>
          <Link href="/dashboard/portfolio" className="text-blue-600 hover:underline">
            포트폴리오 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Back Button & Header */}
      <div className="mb-8">
        <Link href="/dashboard/portfolio" className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-1">
          ← 목록으로
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{portfolio.title}</h1>
            {portfolio.description && (
              <p className="text-slate-600 text-lg">{portfolio.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
          <p className="text-red-800">오류: {error}</p>
        </div>
      )}

      {/* Portfolio Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-slate-500 text-sm mb-1">상태</p>
          <p className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${getStatusColor(
            portfolio.status
          )}`}>
            {getStatusLabel(portfolio.status)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-slate-500 text-sm mb-1">공개범위</p>
          <p className="text-lg font-bold text-slate-900">
            {getVisibilityLabel(portfolio.visibility)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-slate-500 text-sm mb-1">영향도</p>
          <p className="text-lg font-bold text-slate-900">{portfolio.impact_score}/100</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-slate-500 text-sm mb-1">마일스톤 진도</p>
          <p className="text-lg font-bold text-slate-900">
            {completedMilestones}/{milestones.length}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {milestones.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-slate-700 font-medium">마일스톤 완성도</p>
            <p className="text-slate-600 text-sm">{Math.round(completionRate)}%</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      {portfolio.tags.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <p className="text-slate-700 font-medium mb-3">태그</p>
          <div className="flex flex-wrap gap-2">
            {portfolio.tags.map((tag, i) => (
              <span
                key={i}
                className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Milestones Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">마일스톤</h2>
          <button
            onClick={() => setShowMilestoneForm(!showMilestoneForm)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            {showMilestoneForm ? '취소' : '➕ 마일스톤 추가'}
          </button>
        </div>

        {/* Create Milestone Form */}
        {showMilestoneForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-green-200">
            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="마일스톤 제목"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="마일스톤 설명"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    목표날짜 *
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, target_date: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    상태
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as any,
                      }))
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="pending">대기</option>
                    <option value="in_progress">진행중</option>
                    <option value="completed">완료</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    중요도
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        weight: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  생성
                </button>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(false)}
                  className="flex-1 px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Milestones List */}
        {milestones.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-lg">
            <p className="text-slate-500 mb-4">마일스톤이 없습니다</p>
            <button
              onClick={() => setShowMilestoneForm(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              첫 마일스톤 추가
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {milestone.title}
                    </h3>
                    {milestone.description && (
                      <p className="text-slate-600 text-sm mb-2">{milestone.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMilestone(milestone.id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm font-medium transition"
                  >
                    삭제
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">상태</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      milestone.status
                    )}`}>
                      {getStatusLabel(milestone.status)}
                    </span>
                  </div>

                  <div>
                    <p className="text-slate-500 mb-1">목표날짜</p>
                    <p className="font-medium text-slate-900">
                      {new Date(milestone.target_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 mb-1">중요도</p>
                    <p className="font-medium text-slate-900">{milestone.weight.toFixed(1)}배</p>
                  </div>

                  <div>
                    <p className="text-slate-500 mb-1">생성일</p>
                    <p className="font-medium text-slate-900 text-xs">
                      {new Date(milestone.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>

                {/* Days until target */}
                {new Date(milestone.target_date) > new Date() && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-blue-700 text-sm">
                      📅 {Math.ceil((new Date(milestone.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 남음
                    </p>
                  </div>
                )}

                {new Date(milestone.target_date) <= new Date() && milestone.status !== 'completed' && (
                  <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                    <p className="text-orange-700 text-sm">
                      ⚠️ 목표날짜 경과
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-lg shadow p-4 text-xs text-slate-500">
        <p>생성: {new Date(portfolio.created_at).toLocaleString('ko-KR')}</p>
        <p>수정: {new Date(portfolio.updated_at).toLocaleString('ko-KR')}</p>
      </div>
    </div>
  );
}
