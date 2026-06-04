'use client';

import { useEffect, useState, useCallback } from 'react';
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

export default function PortfolioDashboard() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'in_progress' as const,
    impact_score: 0,
    visibility: 'team' as const,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  const userId = 'user-1'; // In production, get from session/auth

  const fetchPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portfolio', {
        headers: { 'x-user-id': userId },
      });

      if (!response.ok) throw new Error('Failed to fetch portfolios');
      const data = await response.json();
      setPortfolios(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching portfolios');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create portfolio');

      await fetchPortfolios();
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        status: 'in_progress',
        impact_score: 0,
        visibility: 'team',
        tags: [],
      });
      setTagInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating portfolio');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      in_progress: '🟡 진행중',
      completed: '✅ 완료',
      on_hold: '⏸️ 보류',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">포트폴리오 관리</h1>
            <p className="text-slate-600">{portfolios.length}개의 포트폴리오</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg"
          >
            {showCreateForm ? '취소' : '➕ 새 포트폴리오'}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border-2 border-blue-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">새 포트폴리오 생성</h2>
          <form onSubmit={handleCreatePortfolio} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="포트폴리오 제목"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="on_hold">보류</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                설명
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="포트폴리오 설명"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  영향도 스코어
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.impact_score}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      impact_score: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  공개범위
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      visibility: e.target.value as any,
                    }))
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="team">팀</option>
                  <option value="private">비공개</option>
                  <option value="public">공개</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                태그
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="태그 입력 후 + 버튼 또는 Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(i)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                생성
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
          <p className="text-red-800">오류: {error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-slate-500">포트폴리오 로드 중...</p>
        </div>
      )}

      {/* Portfolio Grid */}
      {!loading && portfolios.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-slate-500 text-lg mb-4">포트폴리오가 없습니다</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            첫 포트폴리오 생성
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <Link
              key={portfolio.id}
              href={`/dashboard/portfolio/${portfolio.id}`}
            >
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition cursor-pointer border-l-4 border-blue-500 h-full flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                    {portfolio.title}
                  </h3>
                  {portfolio.description && (
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {portfolio.description}
                    </p>
                  )}

                  <div className="flex-1">
                    {portfolio.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {portfolio.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                        {portfolio.tags.length > 3 && (
                          <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                            +{portfolio.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        portfolio.status
                      )}`}>
                        {getStatusLabel(portfolio.status)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {getVisibilityLabel(portfolio.visibility)}
                      </span>
                    </div>

                    {portfolio.impact_score > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">영향도</p>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${portfolio.impact_score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-400">
                      {new Date(portfolio.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
