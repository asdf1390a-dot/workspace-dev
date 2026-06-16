import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/use-auth';
import AssetEditHistoryViewer from '../../../components/AssetEditHistoryViewer';

// Admin Asset Detail — Phase 3-1
// Integrates AssetEditHistoryViewer with a minimal asset summary header.
// Route: /admin/assets/[id]

const pageStyles = {
  shell: {
    maxWidth: 960,
    margin: '0 auto',
    padding: 16,
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', sans-serif",
  },
  crumbs: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
    marginTop: 12,
  },
  field: {
    fontSize: 13,
  },
  fieldLabel: {
    color: '#64748b',
    marginBottom: 2,
  },
  fieldValue: {
    color: '#0f172a',
    fontWeight: 500,
    wordBreak: 'break-word',
  },
  notice: {
    padding: 12,
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    color: '#92400e',
    borderRadius: 6,
    fontSize: 13,
  },
};

export default function AdminAssetDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthed } = useAuth();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('assets')
          .select('id, asset_code, name, name_ta, category, asset_class, location, status, updated_at')
          .eq('id', id)
          .maybeSingle();
        if (cancelled) return;
        if (err) throw err;
        setAsset(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'load_failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const title = asset ? `${asset.asset_code || asset.id} · 편집 이력` : '자산 편집 이력';

  return (
    <>
      <Head>
        <title>{title} | DSC FMS</title>
      </Head>
      <div style={pageStyles.shell}>
        <div style={pageStyles.crumbs}>
          <Link href="/" style={pageStyles.link}>홈</Link>
          {' / '}
          <Link href="/admin/assets" style={pageStyles.link}>자산 관리</Link>
          {' / '}
          <span>{id || '…'}</span>
        </div>

        {!isAuthed && (
          <div style={{ ...pageStyles.notice, marginBottom: 16 }}>
            로그인이 필요할 수 있습니다. 일부 데이터는 권한이 있어야 표시됩니다.
          </div>
        )}

        <div style={pageStyles.card}>
          {loading && <div style={{ color: '#64748b', fontSize: 14 }}>자산 정보 로딩 중…</div>}
          {!loading && error && (
            <div style={{ color: '#b91c1c', fontSize: 14 }}>오류: {error}</div>
          )}
          {!loading && !error && !asset && (
            <div style={{ color: '#64748b', fontSize: 14 }}>
              자산을 찾을 수 없습니다 (id: {id}). 편집 이력은 ID 기반으로 그대로 조회합니다.
            </div>
          )}
          {asset && (
            <>
              <h1 style={pageStyles.title}>
                {asset.name || asset.asset_code || asset.id}
              </h1>
              <div style={pageStyles.subtitle}>
                {asset.asset_code} · {asset.category || '—'} / {asset.asset_class || '—'}
              </div>
              <div style={pageStyles.grid}>
                <div style={pageStyles.field}>
                  <div style={pageStyles.fieldLabel}>Location</div>
                  <div style={pageStyles.fieldValue}>{asset.location || '—'}</div>
                </div>
                <div style={pageStyles.field}>
                  <div style={pageStyles.fieldLabel}>Status</div>
                  <div style={pageStyles.fieldValue}>{asset.status || '—'}</div>
                </div>
                <div style={pageStyles.field}>
                  <div style={pageStyles.fieldLabel}>Name (TA)</div>
                  <div style={pageStyles.fieldValue}>{asset.name_ta || '—'}</div>
                </div>
                <div style={pageStyles.field}>
                  <div style={pageStyles.fieldLabel}>Updated</div>
                  <div style={pageStyles.fieldValue}>{asset.updated_at || '—'}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {id && <AssetEditHistoryViewer assetId={String(id)} />}
      </div>
    </>
  );
}
