'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function HarnessLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: '/harness', label: '대시보드', icon: '📊' },
    { href: '/harness/schedule', label: '생산일정', icon: '📅' },
    { href: '/harness/maintenance', label: '유지보수', icon: '🔧' },
    { href: '/harness/conflicts', label: '충돌 감지', icon: '⚠️' },
    { href: '/harness/teams', label: '팀 배정', icon: '👥' },
    { href: '/harness/audit-logs', label: '감시 로그', icon: '📝' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 transform bg-gray-900 text-white transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } z-50 md:z-auto`}
      >
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="border-b border-gray-700 p-6">
            <h1 className="text-xl font-bold">Harness</h1>
            <p className="text-sm text-gray-400">검증 시스템</p>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 space-y-2 overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* 푸터 */}
          <div className="border-t border-gray-700 p-4">
            <p className="text-xs text-gray-500">Harness Engineering v2.0</p>
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 바 */}
        <header className="border-b border-gray-200 bg-white px-6 py-4 md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 md:hidden hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">생산-보전 검증</h2>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-gray-600">
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
