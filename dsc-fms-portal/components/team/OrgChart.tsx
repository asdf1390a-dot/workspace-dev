'use client';

import { ReactNode } from 'react';
import { TeamStructure, TeamMember } from '@/lib/types/team-dashboard';
import Link from 'next/link';

interface OrgChartProps {
  structures: TeamStructure[];
  members: Map<string, TeamMember>;
}

export default function OrgChart({ structures, members }: OrgChartProps) {
  const buildTree = (parentId?: string, level: number = 0): ReactNode[] => {
    return structures
      .filter((s) => s.reports_to_id === parentId)
      .sort((a, b) => a.position_level - b.position_level)
      .map((structure) => {
        const member = members.get(structure.member_id);
        if (!member) return null;

        const children = buildTree(structure.id, level + 1);

        return (
          <div key={structure.id} className={`ml-${level * 8} mb-4`}>
            <Link href={`/team/members/${member.id}`}>
              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow cursor-pointer">
                {member.avatar_url && (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
            </Link>
            {children.length > 0 && (
              <div className="border-l-2 border-blue-200 ml-5 mt-2">
                {children}
              </div>
            )}
          </div>
        );
      });
  };

  if (structures.length === 0) {
    return <p className="text-gray-500">No organizational structure data available</p>;
  }

  return (
    <div className="space-y-2">
      {buildTree()}
    </div>
  );
}
