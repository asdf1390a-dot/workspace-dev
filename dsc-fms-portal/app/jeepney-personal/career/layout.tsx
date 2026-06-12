import Link from 'next/link';

export default function CareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Career Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-8">
            <Link
              href="/jeepney-personal/career"
              className="px-0 py-4 border-b-2 border-transparent hover:border-blue-600 font-medium text-gray-700 hover:text-blue-600 transition"
            >
              개요
            </Link>
            <Link
              href="/jeepney-personal/career/companies"
              className="px-0 py-4 border-b-2 border-transparent hover:border-blue-600 font-medium text-gray-700 hover:text-blue-600 transition"
            >
              회사
            </Link>
            <Link
              href="/jeepney-personal/career/projects"
              className="px-0 py-4 border-b-2 border-transparent hover:border-blue-600 font-medium text-gray-700 hover:text-blue-600 transition"
            >
              프로젝트
            </Link>
            <Link
              href="/jeepney-personal/career/achievements"
              className="px-0 py-4 border-b-2 border-transparent hover:border-blue-600 font-medium text-gray-700 hover:text-blue-600 transition"
            >
              성과
            </Link>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
