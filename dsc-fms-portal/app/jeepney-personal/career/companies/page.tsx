'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Company {
  id: string;
  company_name: string;
  industry?: string;
  location?: string;
  logo_url?: string;
  created_at: string;
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/career/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('회사 목록 조회 실패');
      const result = await response.json();
      setCompanies(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }

  async function deleteCompany(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      setDeleting(id);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/career/companies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('삭제 실패');
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setDeleting(null);
    }
  }

  if (loading) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/jeepney-personal" className="text-blue-600 hover:underline text-sm">
              ← 뒤로 가기
            </Link>
            <h1 className="text-3xl font-bold mt-2">회사</h1>
            <p className="text-gray-600 mt-1">경력 정보를 관리하세요</p>
          </div>
          <Link
            href="/jeepney-personal/career/companies/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + 회사 추가
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {companies.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">등록된 회사가 없습니다</p>
            <Link
              href="/jeepney-personal/career/companies/new"
              className="text-blue-600 hover:underline mt-2"
            >
              첫 회사를 추가하세요
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {companies.map(company => (
              <div
                key={company.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {company.logo_url && (
                      <img
                        src={company.logo_url}
                        alt={company.company_name}
                        className="w-16 h-16 object-cover rounded mb-3"
                      />
                    )}
                    <h3 className="text-xl font-semibold text-gray-900">
                      {company.company_name}
                    </h3>
                    {company.industry && (
                      <p className="text-sm text-gray-600 mt-1">업종: {company.industry}</p>
                    )}
                    {company.location && (
                      <p className="text-sm text-gray-600">위치: {company.location}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/jeepney-personal/career/companies/${company.id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                    >
                      편집
                    </Link>
                    <button
                      onClick={() => deleteCompany(company.id)}
                      disabled={deleting === company.id}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      {deleting === company.id ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
