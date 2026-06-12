'use client';

import Link from 'next/link';
import { JeepneyLayout } from '../../components/layout';
import { Icon } from '../../components/icons/HeroiconsWrapper';

export default function PrivacySettingsPage() {
  return (
    <JeepneyLayout>
      <header style={{ padding: '20px 4px 8px' }}>
        <Link href="/settings" style={{ color: 'var(--jp-text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <Icon name="back" size={16} /> 설정
        </Link>
        <h1 style={{ margin: '8px 0 4px', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700 }}>프라이버시</h1>
        <p style={{ margin: 0, color: 'var(--jp-text-muted)', fontSize: 14 }}>데이터 공유 및 세션 관리를 설정합니다.</p>
      </header>
      <section style={{ marginTop: 16, padding: 24, background: 'var(--jp-bg-elev-1)', border: '1px dashed var(--jp-border-strong)', borderRadius: 12, color: 'var(--jp-text-muted)' }}>
        세션 토큰 회수 및 데이터 내보내기는 Phase 4에 제공됩니다.
      </section>
    </JeepneyLayout>
  );
}
