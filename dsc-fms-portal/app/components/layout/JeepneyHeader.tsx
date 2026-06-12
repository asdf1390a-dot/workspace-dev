/**
 * JeepneyHeader — sticky top bar.
 * - Logo on the left (links to /).
 * - Main tabs (Home / DSC HUB / Personal / Settings / Profile) inline on tablet+.
 * - Hamburger menu drops a dropdown panel on mobile.
 *
 * Uses CSS variables from app/styles/jeepney.css. Pure client component.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CSSProperties, useEffect, useState } from 'react';
import { Icon, type IconName } from '../icons/HeroiconsWrapper';

export interface HeaderTab {
  href: string;
  label: string;
  icon: IconName;
  matchPrefix?: string;
}

export const DEFAULT_TABS: HeaderTab[] = [
  { href: '/',            label: 'Home',     icon: 'home',     matchPrefix: '/' },
  { href: '/dsc-hub',     label: 'DSC HUB',  icon: 'hub',      matchPrefix: '/dsc-hub' },
  { href: '/jeepney-personal', label: 'Personal', icon: 'user', matchPrefix: '/jeepney-personal' },
  { href: '/settings',    label: 'Settings', icon: 'settings', matchPrefix: '/settings' },
  { href: '/profile',     label: 'Profile',  icon: 'profile',  matchPrefix: '/profile' },
];

interface JeepneyHeaderProps {
  tabs?: HeaderTab[];
  brand?: string;
}

function isActive(path: string | null, tab: HeaderTab): boolean {
  if (!path) return false;
  const prefix = tab.matchPrefix ?? tab.href;
  if (prefix === '/') return path === '/';
  return path === prefix || path.startsWith(prefix + '/');
}

export default function JeepneyHeader({ tabs = DEFAULT_TABS, brand = 'JEEPNEY' }: JeepneyHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change.
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <header style={S.header}>
      <div style={S.inner}>
        <Link href="/" style={S.brand} aria-label={`${brand} home`}>
          <span style={S.brandDot} />
          <span style={S.brandText}>{brand}</span>
        </Link>

        <nav style={S.tabs} aria-label="Primary" data-jp-header-tabs>
          {tabs.map(tab => {
            const active = isActive(pathname, tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="jp-focus-ring"
                style={{
                  ...S.tab,
                  color: active ? 'var(--jp-accent)' : 'var(--jp-text-muted)',
                  background: active ? 'var(--jp-accent-soft)' : 'transparent',
                  fontWeight: active ? 600 : 500,
                }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          className="jp-focus-ring"
          style={S.menuBtn}
          data-jp-header-menu
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
        </button>
      </div>

      {menuOpen && (
        <div style={S.dropdown} role="menu">
          {tabs.map(tab => {
            const active = isActive(pathname, tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                role="menuitem"
                className="jp-focus-ring"
                style={{
                  ...S.menuItem,
                  color: active ? 'var(--jp-accent)' : 'var(--jp-text)',
                  background: active ? 'var(--jp-accent-soft)' : 'transparent',
                }}
              >
                <Icon name={tab.icon} size={18} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

const S: Record<string, CSSProperties> = {
  header: {
    position: 'sticky', top: 0, zIndex: 40,
    background: 'var(--jp-bg)',
    borderBottom: '1px solid var(--jp-border)',
    color: 'var(--jp-text)',
    fontFamily: 'var(--jp-font-sans)',
  },
  inner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 'var(--jp-header-h, 56px)',
    paddingInline: 'var(--jp-space-4, 16px)',
    maxWidth: 'var(--jp-container-desktop, 1200px)',
    marginInline: 'auto',
    gap: 'var(--jp-space-3, 12px)',
  },
  brand: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color: 'var(--jp-text)', textDecoration: 'none',
    fontWeight: 700, letterSpacing: 0.4,
    minHeight: 'var(--jp-tap-min, 44px)',
  },
  brandDot: {
    width: 10, height: 10, borderRadius: 999,
    background: 'var(--jp-accent)',
    boxShadow: '0 0 12px var(--jp-accent)',
  },
  brandText: {
    fontSize: 15,
  },
  tabs: {
    display: 'none',
    alignItems: 'center', gap: 4,
    // Becomes flex on tablet+ via container query fallback below
  },
  tab: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 12px',
    borderRadius: 'var(--jp-radius-md, 8px)',
    textDecoration: 'none',
    fontSize: 14,
    minHeight: 36,
    transition: 'color var(--jp-duration-2) var(--jp-ease), background var(--jp-duration-2) var(--jp-ease)',
  },
  menuBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 'var(--jp-tap-min, 44px)', height: 'var(--jp-tap-min, 44px)',
    background: 'transparent', border: 'none',
    color: 'var(--jp-text-muted)', cursor: 'pointer',
    borderRadius: 'var(--jp-radius-md, 8px)',
  },
  dropdown: {
    position: 'absolute', right: 8, top: 'calc(var(--jp-header-h, 56px) + 4px)',
    background: 'var(--jp-bg-elev-1)',
    border: '1px solid var(--jp-border)',
    borderRadius: 'var(--jp-radius-md, 8px)',
    minWidth: 240, padding: 6,
    boxShadow: 'var(--jp-shadow-lg)',
    animation: 'jp-slide-up var(--jp-duration-2) var(--jp-ease)',
  },
  menuItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderRadius: 'var(--jp-radius-sm, 4px)',
    textDecoration: 'none', fontSize: 14, fontWeight: 500,
    minHeight: 'var(--jp-tap-min, 44px)',
  },
};

// Tablet+: surface inline tabs. We rely on a tiny media query injected once
// at the bottom of the component tree via a <style> tag to avoid pulling in
// a CSS-in-JS lib.
JeepneyHeader.MediaCSS = `
@media (min-width: 768px) {
  [data-jp-header-tabs] { display: flex !important; }
  [data-jp-header-menu]  { display: none !important; }
}
`;
