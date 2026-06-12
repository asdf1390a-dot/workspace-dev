'use client';

import Link from 'next/link';
import { JeepneyLayout } from '../../components/layout';
import { Icon } from '../../components/icons/HeroiconsWrapper';

export default function ThemeSettingsPage() {
  return (
    <JeepneyLayout>
      <header style={{ padding: '20px 4px 8px' }}>
        <Link href="/settings" style={{ color: 'var(--jp-text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <Icon name="back" size={16} /> 설정
        </Link>
        <h1 style={{ margin: '8px 0 4px', fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700 }}>테마</h1>
        <p style={{ margin: 0, color: 'var(--jp-text-muted)', fontSize: 14 }}>다크 / 라이트 모드를 전환합니다.</p>
      </header>
      <section style={{ marginTop: 16, padding: 24, background: 'var(--jp-bg-elev-1)', border: '1px dashed var(--jp-border-strong)', borderRadius: 12, color: 'var(--jp-text-muted)' }}>
        현재 다크 모드만 지원합니다. 라이트 모드는 Phase 4에서 추가됩니다.
      </section>
    </JeepneyLayout>
  );
}
