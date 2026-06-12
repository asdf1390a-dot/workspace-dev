/**
 * DSC HUB — Operations Dashboard (/dsc-hub)
 * 3 tabs: 개인이력 | DSC FMS | 여행기록
 * Each tab surfaces a quick-access card grid.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JeepneyLayout } from '../components/layout';
import { Icon, type IconName } from '../components/icons/HeroiconsWrapper';

type TabKey = 'personal' | 'fms' | 'travels';

interface QuickLink {
  href: string;
  label: string;
  desc: string;
  icon: IconName;
}

const TAB_DATA: Record<TabKey, { label: string; links: QuickLink[] }> = {
  personal: {
    label: '개인이력',
    links: [
      { href: '/jeepney-personal', label: 'Timeline', desc: '연도별 활동 요약', icon: 'user' },
      { href: '/jeepney-personal#companies', label: '회사', desc: '근무 이력', icon: 'factory' },
      { href: '/jeepney-personal#projects', label: '프로젝트', desc: '참여 프로젝트', icon: 'clipboard' },
      { href: '/jeepney-personal#achievements', label: '성과', desc: '주요 성과 및 수상', icon: 'chart' },
    ],
  },
  fms: {
    label: 'DSC FMS',
    links: [
      { href: '/assets', label: 'Assets', desc: 'Asset master & search', icon: 'factory' },
      { href: '/bm', label: 'BM', desc: 'Breakdown maintenance', icon: 'wrench' },
      { href: '/pm', label: 'PM', desc: 'Preventive maintenance', icon: 'clipboard' },
      { href: '/kpi', label: 'KPI', desc: 'Operations metrics', icon: 'chart' },
    ],
  },
  travels: {
    label: '여행기록',
    links: [
      { href: '/jeepney-personal/dsc-hub/travels', label: 'Dashboard', desc: 'All trips', icon: 'hub' },
      { href: '/jeepney-personal/dsc-hub/travels/requests', label: 'Plan Travel', desc: 'New request', icon: 'plus' },
      { href: '/jeepney-personal/dsc-hub/travels/approvals', label: 'Approvals', desc: 'Pending sign-offs', icon: 'check' },
    ],
  },
};

export default function DscHubPage() {
  const [tab, setTab] = useState<TabKey>('fms');
  const data = TAB_DATA[tab];

  return (
    <JeepneyLayout>
      <header style={S.head}>
        <h1 style={S.title}>DSC HUB</h1>
        <p style={S.sub}>운영 통합 대시보드 — 빠른 접근을 위한 단축 링크</p>
      </header>

      <nav style={S.tabs} role="tablist" aria-label="DSC HUB sections">
        {(Object.keys(TAB_DATA) as TabKey[]).map(key => {
          const active = key === tab;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className="jp-focus-ring"
              style={{
                ...S.tabBtn,
                color: active ? 'var(--jp-accent)' : 'var(--jp-text-muted)',
                borderBottomColor: active ? 'var(--jp-accent)' : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
            >
              {TAB_DATA[key].label}
            </button>
          );
        })}
      </nav>

      <div style={S.grid}>
        {data.links.map(link => (
          <Link key={link.href} href={link.href} style={S.card} className="jp-focus-ring">
            <div style={S.cardIcon}><Icon name={link.icon} size={22} /></div>
            <div style={S.cardBody}>
              <div style={S.cardTitle}>{link.label}</div>
              <div style={S.cardDesc}>{link.desc}</div>
            </div>
            <Icon name="forward" size={16} />
          </Link>
        ))}
      </div>
    </JeepneyLayout>
  );
}

const S: Record<string, React.CSSProperties> = {
  head: { padding: '20px 4px 8px' },
  title: { margin: 0, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700 },
  sub: { margin: '6px 0 0', color: 'var(--jp-text-muted)', fontSize: 14 },
  tabs: {
    display: 'flex', gap: 4, marginTop: 16,
    borderBottom: '1px solid var(--jp-border)',
    overflowX: 'auto',
  },
  tabBtn: {
    background: 'transparent', border: 'none',
    padding: '10px 14px', minHeight: 44, fontSize: 15,
    cursor: 'pointer', borderBottom: '2px solid transparent',
    whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid', gap: 12, marginTop: 20,
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  },
  card: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 14, minHeight: 76,
    background: 'var(--jp-bg-elev-1)',
    border: '1px solid var(--jp-border)',
    borderRadius: 'var(--jp-radius-lg, 12px)',
    textDecoration: 'none', color: 'var(--jp-text)',
  },
  cardIcon: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--jp-bg-elev-2)', color: 'var(--jp-accent)',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: 600 },
  cardDesc: { fontSize: 12, color: 'var(--jp-text-muted)', marginTop: 2 },
};
