/**
 * JeepneyLayout — root shell for portal pages.
 * Composes: <JeepneyHeader> + <main><JeepneyContainer/></main> + <BottomNav>.
 *
 * Responsive rules (CSS injected once at the bottom):
 * - <768px: header tabs hidden, hamburger visible, BottomNav visible.
 * - ≥768px: header tabs visible, hamburger hidden, BottomNav hidden.
 */
'use client';

import { ReactNode } from 'react';
import JeepneyHeader, { type HeaderTab } from './JeepneyHeader';
import BottomNav, { type BottomNavItem } from './BottomNav';
import JeepneyContainer, { type ContainerWidth } from './JeepneyContainer';

interface JeepneyLayoutProps {
  children: ReactNode;
  headerTabs?: HeaderTab[];
  bottomItems?: BottomNavItem[];
  brand?: string;
  containerWidth?: ContainerWidth;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

export default function JeepneyLayout({
  children,
  headerTabs,
  bottomItems,
  brand,
  containerWidth = 'wide',
  showBottomNav = true,
  showHeader = true,
}: JeepneyLayoutProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--jp-bg)',
      color: 'var(--jp-text)',
      fontFamily: 'var(--jp-font-sans)',
      paddingBottom: showBottomNav
        ? 'calc(var(--jp-bottomnav-h, 60px) + env(safe-area-inset-bottom, 0))'
        : 'env(safe-area-inset-bottom, 0)',
    }}>
      {showHeader && <JeepneyHeader tabs={headerTabs} brand={brand} />}
      <main style={{ paddingBlock: 'var(--jp-space-4, 16px)' }}>
        <JeepneyContainer width={containerWidth}>
          {children}
        </JeepneyContainer>
      </main>
      {showBottomNav && <BottomNav items={bottomItems} />}

      {/* Inline responsive CSS — surfaces inline header tabs at tablet+ and
          hides the bottom nav on desktop. Kept here so the layout is fully
          self-contained without touching globals.css. */}
      <style>{`
        [data-jp-header-tabs] { display: none; }
        [data-jp-header-menu] { display: inline-flex; }
        @media (min-width: 768px) {
          [data-jp-header-tabs] { display: flex !important; }
          [data-jp-header-menu] { display: none !important; }
          [data-jp-bottom-nav]  { display: none !important; }
        }
      `}</style>
    </div>
  );
}
