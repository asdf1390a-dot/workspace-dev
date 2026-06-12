'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CareerStats {
  companies: number;
  projects: number;
  achievements: number;
}

export default function CareerOverviewPage() {
  const [stats, setStats] = useState<CareerStats>({
    companies: 0,
    projects: 0,
    achievements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const token = localStorage.getItem('access_token');

      const [companiesRes, projectsRes, achievementsRes] = await Promise.all([
        fetch('/api/career/companies', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/career/projects', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/career/achievements', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const companiesData = await companiesRes.json();
      const projectsData = await projectsRes.json();
      const achievementsData = await achievementsRes.json();

      setStats({
        companies: companiesData.data?.length || 0,
        projects: projectsData.data?.length || 0,
        achievements: achievementsData.data?.length || 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <Link href="/jeepney-personal" className="text-blue-600 hover:underline text-sm">
            ← 뒤로 가기
          </Link>
          <h1 className="text-4xl font-bold mt-4 mb-2">경력 기록</h1>
          <p className="text-gray-600">회사, 프로젝트, 성과를 한눈에 관리하세요</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-600">로딩 중...</div>
        ) : (
          <div className="grid grid-cols-3 gap-6 mb-12">
            {/* Companies Card */}
            <Link
              href="/jeepney-personal/career/companies"
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">회사</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{stats.companies}</p>
                </div>
                <div className="text-4xl">🏢</div>
              </div>
            </Link>

            {/* Projects Card */}
            <Link
              href="/jeepney-personal/career/projects"
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">프로젝트</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{stats.projects}</p>
                </div>
                <div className="text-4xl">💼</div>
              </div>
            </Link>

            {/* Achievements Card */}
            <Link
              href="/jeepney-personal/career/achievements"
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">성과</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{stats.achievements}</p>
                </div>
                <div className="text-4xl">🏆</div>
              </div>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-6">빠른 추가</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link
              href="/jeepney-personal/career/companies/new"
              className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-center transition"
            >
              + 회사 추가
            </Link>
            <Link
              href="/jeepney-personal/career/projects/new"
              className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-center transition"
            >
              + 프로젝트 추가
            </Link>
            <Link
              href="/jeepney-personal/career/achievements/new"
              className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium text-center transition"
            >
              + 성과 추가
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
