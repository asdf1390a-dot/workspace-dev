/**
 * Personal History — Overview (/jeepney-personal)
 * 4 tabs: Timeline | 회사 | 프로젝트 | 성과
 * Phase 2 stub — real data binding lands in Phase 3.
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JeepneyLayout } from '../components/layout';
import { Icon } from '../components/icons/HeroiconsWrapper';

type TabKey = 'timeline' | 'companies' | 'projects' | 'achievements';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'timeline',     label: 'Timeline' },
  { key: 'companies',    label: '회사' },
  { key: 'projects',     label: '프로젝트' },
  { key: 'achievements', label: '성과' },
];

const TIMELINE_PLACEHOLDER = [
  { year: 2026, items: ['JEEPNEY Portal Phase 2 출시', 'DSC FMS 운영 안정화'] },
  { year: 2025, items: ['Team Dashboard P1/P2 완료', 'BM workflow 353건 처리'] },
  { year: 2024, items: ['DSC Mannur 입사', 'Asset master 506건 등록'] },
];

export default function JeepneyPersonalPage() {
  const [tab, setTab] = useState<TabKey>('timeline');

  return (
    <JeepneyLayout>
      <header style={S.head}>
        <div style={S.headRow}>
          <div>
            <h1 style={S.title}>개인이력</h1>
            <p style={S.sub}>연도별 활동 · 회사 · 프로젝트 · 성과</p>
          </div>
          <Link href="/jeepney-personal/new" style={S.cta} className="jp-focus-ring">
            <Icon name="plus" size={16} />
            <span>새 항목 추가</span>
          </Link>
        </div>
      </header>

      <nav style={S.tabs} role="tablist" aria-label="Personal sections">
        {TABS.map(t => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className="jp-focus-ring"
              style={{
                ...S.tabBtn,
                color: active ? 'var(--jp-accent)' : 'var(--jp-text-muted)',
                borderBottomColor: active ? 'var(--jp-accent)' : 'transparent',
                fontWeight: active ? 700 : 500,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      <section style={S.panel} role="tabpanel">
        {tab === 'timeline' && (
          <ul style={S.yearList}>
            {TIMELINE_PLACEHOLDER.map(yr => (
              <li key={yr.year} style={S.yearItem}>
                <div style={S.yearLabel}>{yr.year}</div>
                <ul style={S.yearInner}>
                  {yr.items.map((it, i) => (
                    <li key={i} style={S.yearEntry}>{it}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        {tab === 'companies' && (
          <div style={S.redirectPanel}>
            <Empty label="회사 이력 관리" />
            <Link href="/jeepney-personal/career/companies" style={S.redirectLink} className="jp-focus-ring">
              회사 목록 →
            </Link>
          </div>
        )}
        {tab === 'projects' && (
          <div style={S.redirectPanel}>
            <Empty label="프로젝트 관리" />
            <Link href="/jeepney-personal/career/projects" style={S.redirectLink} className="jp-focus-ring">
              프로젝트 목록 →
            </Link>
          </div>
        )}
        {tab === 'achievements' && (
          <div style={S.redirectPanel}>
            <Empty label="성과 항목 관리" />
            <Link href="/jeepney-personal/career/achievements" style={S.redirectLink} className="jp-focus-ring">
              성과 목록 →
            </Link>
          </div>
        )}
      </section>
    </JeepneyLayout>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div style={S.empty}>
      <Icon name="info" size={20} />
      <span>{label}</span>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  head: { padding: '20px 4px 8px' },
  headRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  title: { margin: 0, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700 },
  sub: { margin: '6px 0 0', color: 'var(--jp-text-muted)', fontSize: 14 },
  cta: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 14px', minHeight: 44,
    background: 'var(--jp-accent)', color: '#001016',
    borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14,
  },
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
  panel: { marginTop: 20 },
  yearList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  yearItem: {
    background: 'var(--jp-bg-elev-1)',
    border: '1px solid var(--jp-border)',
    borderRadius: 12, padding: 16,
  },
  yearLabel: { fontSize: 18, fontWeight: 700, color: 'var(--jp-accent)' },
  yearInner: { listStyle: 'disc', paddingLeft: 20, margin: '8px 0 0', color: 'var(--jp-text-muted)' },
  yearEntry: { fontSize: 14, lineHeight: 1.6 },
  empty: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: 24, borderRadius: 12,
    background: 'var(--jp-bg-elev-1)',
    border: '1px dashed var(--jp-border-strong)',
    color: 'var(--jp-text-muted)', fontSize: 14,
  },
  redirectPanel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  redirectLink: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', minHeight: 44,
    background: 'var(--jp-accent)', color: '#001016',
    borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14,
  },
};
