import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function TeamDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your team members, structure, portfolio, and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="Team Members"
          description="View and manage all team members"
          href="/team/members"
          count="15"
        />
        <DashboardCard
          title="Team Structure"
          description="View organizational hierarchy"
          href="/team/structure"
          count="Org Chart"
        />
        <DashboardCard
          title="Portfolio"
          description="Track member portfolios and projects"
          href="/team/portfolio"
          count="Projects"
        />
        <DashboardCard
          title="Activity Log"
          description="View team activity and history"
          href="/team/activity"
          count="Recent"
        />
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  count: string;
}

function DashboardCard({ title, description, href, count }: DashboardCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </div>
        <div className="mt-4 text-2xl font-bold text-blue-600">{count}</div>
      </div>
    </Link>
  );
}
