'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Achievement {
  id: string;
  title: string;
  achievement_type: string;
  issuer?: string;
  achievement_date?: string;
  description?: string;
  credential_url?: string;
  visible_to: string;
}

export default function AchievementsPage() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  async function fetchAchievements() {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/career/achievements', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('성과 목록 조회 실패');
      const result = await response.json();
      setAchievements(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }

  async function deleteAchievement(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      setDeleting(id);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/career/achievements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('삭제 실패');
      setAchievements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setDeleting(null);
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'skill':
        return '스킬';
      case 'certification':
        return '인증서';
      case 'award':
        return '상장';
      case 'publication':
        return '출판물';
      default:
        return type;
    }
  };

  const filteredAchievements = filterType === 'all'
    ? achievements
    : achievements.filter(a => a.achievement_type === filterType);

  if (loading) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/jeepney-personal" className="text-blue-600 hover:underline text-sm">
              ← 뒤로 가기
            </Link>
            <h1 className="text-3xl font-bold mt-2">성과</h1>
            <p className="text-gray-600 mt-1">스킬, 인증서, 상장을 관리하세요</p>
          </div>
          <Link
            href="/jeepney-personal/career/achievements/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + 성과 추가
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          {[
            { value: 'all', label: '전체' },
            { value: 'skill', label: '스킬' },
            { value: 'certification', label: '인증서' },
            { value: 'award', label: '상장' },
            { value: 'publication', label: '출판물' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                filterType === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredAchievements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">등록된 성과가 없습니다</p>
            <Link
              href="/jeepney-personal/career/achievements/new"
              className="text-blue-600 hover:underline mt-2"
            >
              첫 성과를 추가하세요
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAchievements.map(achievement => (
              <div
                key={achievement.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {achievement.title}
                    </h3>
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                      {getTypeLabel(achievement.achievement_type)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/jeepney-personal/career/achievements/${achievement.id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                    >
                      편집
                    </Link>
                    <button
                      onClick={() => deleteAchievement(achievement.id)}
                      disabled={deleting === achievement.id}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      {deleting === achievement.id ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </div>

                {achievement.issuer && (
                  <p className="text-sm text-gray-600 mt-2">발급자: {achievement.issuer}</p>
                )}

                {achievement.achievement_date && (
                  <p className="text-sm text-gray-600">
                    날짜: {new Date(achievement.achievement_date).toLocaleDateString('ko-KR')}
                  </p>
                )}

                {achievement.description && (
                  <p className="text-sm text-gray-700 mt-2">{achievement.description}</p>
                )}

                {achievement.credential_url && (
                  <a
                    href={achievement.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    자격증 보기 →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
