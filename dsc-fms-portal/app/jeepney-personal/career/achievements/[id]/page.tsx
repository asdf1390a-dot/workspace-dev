'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Achievement {
  id: string;
  achievement_type: string;
  title: string;
  description?: string;
  issuer?: string;
  achievement_date?: string;
  credential_url?: string;
  visible_to: string;
}

export default function AchievementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    achievement_type: 'certification',
    title: '',
    description: '',
    issuer: '',
    achievement_date: '',
    credential_url: '',
    visible_to: 'private',
  });

  useEffect(() => {
    if (id) {
      fetchAchievement();
    }
  }, [id]);

  async function fetchAchievement() {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/career/achievements/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('성과 정보 조회 실패');
      const result = await response.json();
      setAchievement(result.data);
      setFormData({
        achievement_type: result.data.achievement_type || 'certification',
        title: result.data.title || '',
        description: result.data.description || '',
        issuer: result.data.issuer || '',
        achievement_date: result.data.achievement_date || '',
        credential_url: result.data.credential_url || '',
        visible_to: result.data.visible_to || 'private',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.achievement_type) {
      setError('성과 유형을 선택해주세요');
      return;
    }

    if (!formData.title.trim()) {
      setError('제목은 필수입니다');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/career/achievements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '저장 실패');
      }

      router.push('/jeepney-personal/career/achievements');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setSaving(false);
    }
  };

  async function deleteAchievement() {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/career/achievements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('삭제 실패');
      router.push('/jeepney-personal/career/achievements');
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">로딩 중...</div>;
  if (!achievement) return <div className="p-8 text-red-600">성과를 찾을 수 없습니다</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/jeepney-personal/career/achievements" className="text-blue-600 hover:underline text-sm">
          ← 뒤로 가기
        </Link>

        <h1 className="text-3xl font-bold mt-4 mb-8">{achievement.title}</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성과 유형 *
              </label>
              <select
                name="achievement_type"
                value={formData.achievement_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="certification">인증서</option>
                <option value="skill">스킬</option>
                <option value="award">상장</option>
                <option value="publication">출판물</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  발급 기관 / 출처
                </label>
                <input
                  type="text"
                  name="issuer"
                  value={formData.issuer}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  발급 날짜
                </label>
                <input
                  type="date"
                  name="achievement_date"
                  value={formData.achievement_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                자격증 URL / 링크
              </label>
              <input
                type="url"
                name="credential_url"
                value={formData.credential_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공개 범위
              </label>
              <select
                name="visible_to"
                value={formData.visible_to}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="private">비공개</option>
                <option value="connections">인맥에게만 공개</option>
                <option value="public">공개</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Link
              href="/jeepney-personal/career/achievements"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={deleteAchievement}
              disabled={saving}
              className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium disabled:bg-gray-200 disabled:text-gray-500"
            >
              {saving ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
