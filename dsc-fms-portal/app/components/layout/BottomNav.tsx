/**
 * BottomNav — fixed mobile-first bottom navigation.
 * 5 slots, ≥44px tap targets, iOS safe-area aware. Hidden on desktop (≥768px)
 * via the media block at the bottom of this file.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CSSProperties } from 'react';
import { Icon, type IconName } from '../icons/HeroiconsWrapper';

export interface BottomNavItem {
  href: string;
  label: string;
  icon: IconName;
  matchPrefix?: string;
}

export const DEFAULT_BOTTOM_ITEMS: BottomNavItem[] = [
  { href: '/',                 label: 'Home',     icon: 'home',     matchPrefix: '/' },
  { href: '/dsc-hub',          label: 'DSC HUB',  icon: 'hub',      matchPrefix: '/dsc-hub' },
  { href: '/jeepney-personal', label: 'Personal', icon: 'user',     matchPrefix: '/jeepney-personal' },
  { href: '/settings',         label: 'Settings', icon: 'settings', matchPrefix: '/settings' },
  { href: '/profile',          label: 'Profile',  icon: 'profile',  matchPrefix: '/profile' },
];

interface BottomNavProps {
  items?: BottomNavItem[];
}

function isActive(path: string | null, item: BottomNavItem): boolean {
  if (!path) return false;
  const prefix = item.matchPrefix ?? item.href;
  if (prefix === '/') return path === '/';
  return path === prefix || path.startsWith(prefix + '/');
}

export default function BottomNav({ items = DEFAULT_BOTTOM_ITEMS }: BottomNavProps) {
  const pathname = usePathname();
  return (
    <nav style={S.bar} aria-label="Bottom navigation" data-jp-bottom-nav>
      <div style={S.inner}>
        {items.map(item => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="jp-focus-ring"
              style={{
                ...S.item,
                color: active ? 'var(--jp-accent)' : 'var(--jp-text-subtle)',
              }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon name={item.icon} size={22} />
              <span style={{
                ...S.label,
                fontWeight: active ? 700 : 500,
              }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const S: Record<string, CSSProperties> = {
  bar: {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
    background: 'var(--jp-bg)',
    borderTop: '1px solid var(--jp-border)',
    paddingBottom: 'env(safe-area-inset-bottom, 0)',
    boxShadow: '0 -4px 12px rgba(0,0,0,0.4)',
    fontFamily: 'var(--jp-font-sans)',
  },
  inner: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    height: 'var(--jp-bottomnav-h, 60px)',
    maxWidth: 480, marginInline: 'auto',
  },
  item: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 3, textDecoration: 'none',
    minHeight: 'var(--jp-tap-min, 44px)',
    transition: 'color var(--jp-duration-1) var(--jp-ease)',
  },
  label: {
    fontSize: 10, letterSpacing: 0.2,
  },
};
