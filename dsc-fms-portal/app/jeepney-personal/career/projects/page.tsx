'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
  id: string;
  project_name: string;
  role?: string;
  status: string;
  start_date: string;
  end_date?: string;
  tech_stack?: string[];
  company?: { company_name: string };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/career/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('프로젝트 목록 조회 실패');
      const result = await response.json();
      setProjects(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      setDeleting(id);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/career/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('삭제 실패');
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setDeleting(null);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '진행 중';
      case 'completed':
        return '완료';
      case 'archived':
        return '보관됨';
      default:
        return status;
    }
  };

  if (loading) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/jeepney-personal" className="text-blue-600 hover:underline text-sm">
              ← 뒤로 가기
            </Link>
            <h1 className="text-3xl font-bold mt-2">프로젝트</h1>
            <p className="text-gray-600 mt-1">담당 프로젝트를 관리하세요</p>
          </div>
          <Link
            href="/jeepney-personal/career/projects/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + 프로젝트 추가
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">등록된 프로젝트가 없습니다</p>
            <Link
              href="/jeepney-personal/career/projects/new"
              className="text-blue-600 hover:underline mt-2"
            >
              첫 프로젝트를 추가하세요
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map(project => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {project.project_name}
                    </h3>
                    {project.role && (
                      <p className="text-sm text-gray-600 mt-1">역할: {project.role}</p>
                    )}
                    {project.company && (
                      <p className="text-sm text-gray-600">회사: {project.company.company_name}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">시작 날짜</p>
                    <p className="text-sm font-medium">{new Date(project.start_date).toLocaleDateString('ko-KR')}</p>
                  </div>
                  {project.end_date && (
                    <div>
                      <p className="text-xs text-gray-600">종료 날짜</p>
                      <p className="text-sm font-medium">{new Date(project.end_date).toLocaleDateString('ko-KR')}</p>
                    </div>
                  )}
                </div>

                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech_stack.map((tech: string) => (
                      <span key={tech} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    href={`/jeepney-personal/career/projects/${project.id}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                  >
                    편집
                  </Link>
                  <button
                    onClick={() => deleteProject(project.id)}
                    disabled={deleting === project.id}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm disabled:bg-gray-200 disabled:text-gray-500"
                  >
                    {deleting === project.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
