'use client';

import Link from 'next/link';
import { useTeamMembers, usePortfolioItems, useActivityLog } from '@/lib/hooks/useTeamData';
import { ArrowRight, Users, Briefcase, Clock } from 'lucide-react';

export default function TeamDashboardPage() {
  const { data: members, loading: membersLoading } = useTeamMembers({ limit: 1 });
  const { data: portfolioItems, loading: portfolioLoading } = usePortfolioItems();
  const { data: activities, loading: activitiesLoading } = useActivityLog();

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
          count={membersLoading ? '-' : String(members.length)}
          icon={<Users className="w-8 h-8 text-blue-500" />}
        />
        <DashboardCard
          title="Team Structure"
          description="View organizational hierarchy"
          href="/team/structure"
          count="Org Chart"
          icon={<Users className="w-8 h-8 text-purple-500" />}
        />
        <DashboardCard
          title="Portfolio"
          description="Track member portfolios and projects"
          href="/team/portfolio"
          count={portfolioLoading ? '-' : String(portfolioItems.length)}
          icon={<Briefcase className="w-8 h-8 text-green-500" />}
        />
        <DashboardCard
          title="Activity Log"
          description="View team activity and history"
          href="/team/activity"
          count={activitiesLoading ? '-' : String(activities.length)}
          icon={<Clock className="w-8 h-8 text-orange-500" />}
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
  icon?: React.ReactNode;
}

function DashboardCard({ title, description, href, count, icon }: DashboardCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
        </div>
        <div className="flex items-end justify-between">
          {icon && <div>{icon}</div>}
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Count</p>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
