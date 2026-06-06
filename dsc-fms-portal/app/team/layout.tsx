import { ReactNode } from 'react';
import Link from 'next/link';
import { Users, GitBranch, Briefcase, Activity } from 'lucide-react';

interface TeamLayoutProps {
  children: ReactNode;
}

export default function TeamLayout({ children }: TeamLayoutProps) {
  const navItems = [
    { href: '/team/members', label: 'Members', icon: Users },
    { href: '/team/structure', label: 'Structure', icon: GitBranch },
    { href: '/team/portfolio', label: 'Portfolio', icon: Briefcase },
    { href: '/team/activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-blue-500 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
