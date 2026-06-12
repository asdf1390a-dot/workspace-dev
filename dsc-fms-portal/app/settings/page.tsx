/**
 * Settings — Index (/settings)
 * 5 section links: 프로필 / 언어 / 테마 / 알림 / 프라이버시
 */
'use client';

import Link from 'next/link';
import { JeepneyLayout } from '../components/layout';
import { Icon, type IconName } from '../components/icons/HeroiconsWrapper';

const SECTIONS: { href: string; label: string; desc: string; icon: IconName }[] = [
  { href: '/settings/profile',       label: '프로필',     desc: '이름, 이메일, 아바타',      icon: 'profile' },
  { href: '/settings/language',      label: '언어',       desc: '한국어 / English / தமிழ்', icon: 'info' },
  { href: '/settings/theme',         label: '테마',       desc: '다크 / 라이트 모드',         icon: 'settings' },
  { href: '/settings/notifications', label: '알림',       desc: '이메일, 푸시, Discord',     icon: 'bell' },
  { href: '/settings/privacy',       label: '프라이버시', desc: '데이터 공유, 세션 관리',     icon: 'check' },
];

export default function SettingsPage() {
  return (
    <JeepneyLayout>
      <header style={S.head}>
        <h1 style={S.title}>설정</h1>
        <p style={S.sub}>계정과 앱 동작을 관리합니다.</p>
      </header>

      <ul style={S.list}>
        {SECTIONS.map(s => (
          <li key={s.href}>
            <Link href={s.href} style={S.row} className="jp-focus-ring">
              <div style={S.icon}><Icon name={s.icon} size={20} /></div>
              <div style={S.body}>
                <div style={S.label}>{s.label}</div>
                <div style={S.desc}>{s.desc}</div>
              </div>
              <Icon name="forward" size={18} />
            </Link>
          </li>
        ))}
      </ul>
    </JeepneyLayout>
  );
}

const S: Record<string, React.CSSProperties> = {
  head: { padding: '20px 4px 8px' },
  title: { margin: 0, fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700 },
  sub: { margin: '6px 0 0', color: 'var(--jp-text-muted)', fontSize: 14 },
  list: {
    listStyle: 'none', padding: 0, margin: '20px 0 0',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 14, minHeight: 64,
    background: 'var(--jp-bg-elev-1)',
    border: '1px solid var(--jp-border)',
    borderRadius: 12,
    textDecoration: 'none', color: 'var(--jp-text)',
  },
  icon: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--jp-bg-elev-2)', color: 'var(--jp-accent)',
  },
  body: { flex: 1, minWidth: 0 },
  label: { fontSize: 15, fontWeight: 600 },
  desc: { fontSize: 12, color: 'var(--jp-text-muted)', marginTop: 2 },
};
