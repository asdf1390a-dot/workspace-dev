/**
 * JEEPNEY Portal — Main Dashboard (/)
 *
 * - Auth gate via localStorage.session (redirects to /auth/login if missing).
 * - Wrapped in <JeepneyLayout> so header tabs + bottom nav are consistent.
 * - 3 hub cards (DSC HUB / Personal / Travels) + recent activity preview.
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JeepneyLayout } from './components/layout';
import { Icon } from './components/icons/HeroiconsWrapper';

interface SessionUser {
  name?: string;
  email?: string;
  employee_id?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('session');
      if (!raw) {
        router.replace('/auth/login');
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed?.user ?? parsed ?? null);
      } catch {
        // Treat any non-empty token as valid; user info optional.
        setUser(null);
      }
      setChecked(true);
    } catch {
      router.replace('/auth/login');
    }
  }, [router]);

  if (!checked) {
    return (
      <JeepneyLayout>
        <div style={{ padding: 32, color: 'var(--jp-text-muted)' }}>
          <Icon name="spinner" size={20} /> Loading...
        </div>
      </JeepneyLayout>
    );
  }

  const displayName = user?.name || user?.email || 'Operator';

  return (
    <JeepneyLayout>
      <section style={S.hero}>
        <div style={S.heroEyebrow}>JEEPNEY</div>
        <h1 style={S.heroTitle}>Welcome back, {displayName}</h1>
        <p style={S.heroSub}>
          Personal operations hub — DSC FMS, your career timeline, and travel logs in one place.
        </p>
      </section>

      <section style={S.grid}>
        <HubCard
          href="/dsc-hub"
          icon="hub"
          accent="var(--jp-accent)"
          title="DSC HUB"
          desc="FMS operations, BM/PM workflows, asset master."
        />
        <HubCard
          href="/jeepney-personal"
          icon="user"
          accent="#a78bfa"
          title="개인이력"
          desc="Career timeline, companies, projects, achievements."
        />
        <HubCard
          href="/jeepney-personal/dsc-hub/travels"
          icon="career"
          accent="#f59e0b"
          title="여행기록"
          desc="Trip planning, approvals, and travel reports."
        />
      </section>

      <section style={S.activity}>
        <div style={S.activityHead}>
          <h2 style={S.h2}>Recent Activity</h2>
          <Link href="/jeepney-personal" style={S.linkMuted}>
            View all <Icon name="forward" size={14} />
          </Link>
        </div>
        <TimelinePreview />
      </section>
    </JeepneyLayout>
  );
}

function HubCard({
  href, icon, accent, title, desc,
}: { href: string; icon: 'hub' | 'user' | 'career'; accent: string; title: string; desc: string }) {
  return (
    <Link href={href} style={{ ...S.card, borderColor: 'var(--jp-border)' }} className="jp-focus-ring">
      <div style={{ ...S.cardIcon, color: accent, background: 'var(--jp-bg-elev-2)' }}>
        <Icon name={icon} size={22} />
      </div>
      <div style={S.cardBody}>
        <div style={S.cardTitle}>{title}</div>
        <div style={S.cardDesc}>{desc}</div>
      </div>
      <Icon name="forward" size={18} />
    </Link>
  );
}

function TimelinePreview() {
  // Static preview — real data wired in Phase 3.
  const items = [
    { date: '2026-06-12', label: 'Phase 2 layout rolled out', kind: 'system' },
    { date: '2026-06-11', label: 'Travel request approved', kind: 'travel' },
    { date: '2026-06-10', label: 'BM event #353 closed', kind: 'fms' },
  ];
  return (
    <ul style={S.timeline}>
      {items.map((it, i) => (
        <li key={i} style={S.tlItem}>
          <span style={S.tlDot} />
          <div style={S.tlBody}>
            <div style={S.tlLabel}>{it.label}</div>
            <div style={S.tlMeta}>{it.date} · {it.kind}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const S: Record<string, React.CSSProperties> = {
  hero: {
    padding: '24px 4px 8px',
  },
  heroEyebrow: {
    fontSize: 12, letterSpacing: 2, color: 'var(--jp-accent)',
    fontWeight: 700, textTransform: 'uppercase',
  },
  heroTitle: {
    margin: '6px 0 8px',
    fontSize: 'clamp(22px, 4vw, 30px)',
    fontWeight: 700, color: 'var(--jp-text)',
  },
  heroSub: {
    margin: 0, color: 'var(--jp-text-muted)',
    fontSize: 14, maxWidth: 640, lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
    marginTop: 20,
  },
  card: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: 16,
    background: 'var(--jp-bg-elev-1)',
    border: '1px solid var(--jp-border)',
    borderRadius: 'var(--jp-radius-lg, 12px)',
    textDecoration: 'none', color: 'var(--jp-text)',
    minHeight: 88,
    transition: 'transform var(--jp-duration-2) var(--jp-ease), border-color var(--jp-duration-2) var(--jp-ease)',
  },
  cardIcon: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 44, height: 44, borderRadius: 10,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  cardDesc: { fontSize: 13, color: 'var(--jp-text-muted)', lineHeight: 1.4 },
  activity: { marginTop: 28 },
  activityHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  h2: { margin: 0, fontSize: 18, fontWeight: 700 },
  linkMuted: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    color: 'var(--jp-text-muted)', fontSize: 13, textDecoration: 'none',
  },
  timeline: {
    listStyle: 'none', margin: 0, padding: 0,
    background: 'var(--jp-bg-elev-1)',
    border: '1px solid var(--jp-border)',
    borderRadius: 'var(--jp-radius-lg, 12px)',
  },
  tlItem: {
    display: 'flex', gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid var(--jp-border)',
  },
  tlDot: {
    flexShrink: 0,
    width: 8, height: 8, marginTop: 7,
    borderRadius: 999, background: 'var(--jp-accent)',
  },
  tlBody: { flex: 1, minWidth: 0 },
  tlLabel: { fontSize: 14, fontWeight: 600, color: 'var(--jp-text)' },
  tlMeta: { fontSize: 12, color: 'var(--jp-text-subtle)', marginTop: 2 },
};
