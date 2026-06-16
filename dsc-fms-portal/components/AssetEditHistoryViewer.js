import React, { useEffect, useState, useCallback } from 'react';

// AssetEditHistoryViewer
// Phase 3-1 — UI for asset edit history.
//
// Props:
//   assetId   (string, required)  Asset to load history for.
//   pageSize  (number, optional)  Entries per page (default 20).
//
// API:
//   GET /api/asset-edit-history/{assetId}?limit=&offset=
//   GET /api/asset-edit-history/{assetId}/diff/{entryId}   (optional, falls back
//        to the {old_value, new_value} already returned by the list endpoint
//        when the dedicated diff endpoint is not available)
//
// Style: inline CSS-in-JS, matches AssetHistoryTabs.js conventions.

const styles = {
  wrapper: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#0f172a',
    margin: 0,
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
  },
  loading: {
    padding: 24,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
  },
  error: {
    padding: 12,
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    fontSize: 13,
  },
  empty: {
    padding: 24,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 14,
  },
  entry: {
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  entrySummary: {
    flex: 1,
    minWidth: 0,
  },
  entryFieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  fieldBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
  },
  changedBy: {
    fontSize: 12,
    color: '#475569',
  },
  changedAt: {
    fontSize: 12,
    color: '#64748b',
  },
  note: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
  },
  toggleBtn: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#2563eb',
    backgroundColor: 'transparent',
    border: '1px solid #bfdbfe',
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    minHeight: 32,
  },
  diffBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
  },
  diffRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  diffCol: {
    padding: 8,
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  diffOld: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
  diffNew: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #bbf7d0',
  },
  diffLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  pager: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #e5e7eb',
  },
  pagerBtn: {
    padding: '6px 12px',
    fontSize: 13,
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    backgroundColor: '#fff',
    cursor: 'pointer',
    minHeight: 32,
  },
  pagerBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function renderValue(v) {
  if (v === null || v === undefined || v === '') return '(empty)';
  if (typeof v === 'object') {
    try { return JSON.stringify(v, null, 2); } catch (_) { return String(v); }
  }
  return String(v);
}

function HistoryEntry({ entry, assetId }) {
  const [open, setOpen] = useState(false);
  const [diff, setDiff] = useState(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState(null);

  const loadDiff = useCallback(async () => {
    if (diff) return;
    setDiffLoading(true);
    setDiffError(null);
    try {
      const res = await fetch(
        `/api/asset-edit-history/${encodeURIComponent(assetId)}/diff/${encodeURIComponent(entry.id)}`
      );
      if (res.ok) {
        const data = await res.json();
        setDiff({
          old_value: data.old_value ?? entry.old_value,
          new_value: data.new_value ?? entry.new_value,
          field_name: data.field_name ?? entry.field_name,
        });
      } else {
        // Fallback: API may not exist yet — use values from list entry.
        setDiff({
          old_value: entry.old_value,
          new_value: entry.new_value,
          field_name: entry.field_name,
        });
      }
    } catch (e) {
      // Network failure — still try to show what we have.
      setDiff({
        old_value: entry.old_value,
        new_value: entry.new_value,
        field_name: entry.field_name,
      });
      setDiffError(e?.message || 'diff_fetch_failed');
    } finally {
      setDiffLoading(false);
    }
  }, [assetId, entry, diff]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !diff) loadDiff();
  };

  return (
    <div style={styles.entry}>
      <div style={styles.entryHeader}>
        <div style={styles.entrySummary}>
          <div style={styles.entryFieldRow}>
            <span style={styles.fieldBadge}>{entry.field_name || '—'}</span>
            <span style={styles.changedBy}>
              수정자: <strong>{entry.changed_by || '(unknown)'}</strong>
            </span>
            <span style={styles.changedAt}>{formatDateTime(entry.changed_at)}</span>
          </div>
          {entry.note && <div style={styles.note}>메모: {entry.note}</div>}
        </div>
        <button
          type="button"
          onClick={handleToggle}
          style={styles.toggleBtn}
          aria-expanded={open}
        >
          {open ? '접기' : '변경 상세보기'}
        </button>
      </div>

      {open && (
        <div style={styles.diffBox}>
          {diffLoading && <div style={{ fontSize: 13, color: '#64748b' }}>변경 내역 로딩 중…</div>}
          {!diffLoading && diff && (
            <div style={styles.diffRow}>
              <div>
                <div style={styles.diffLabel}>이전 값 (old)</div>
                <div style={{ ...styles.diffCol, ...styles.diffOld }}>
                  {renderValue(diff.old_value)}
                </div>
              </div>
              <div>
                <div style={styles.diffLabel}>변경 값 (new)</div>
                <div style={{ ...styles.diffCol, ...styles.diffNew }}>
                  {renderValue(diff.new_value)}
                </div>
              </div>
            </div>
          )}
          {diffError && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#b91c1c' }}>
              상세 API 호출 실패 — 목록 데이터로 표시: {diffError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AssetEditHistoryViewer({ assetId, pageSize = 20 }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [available, setAvailable] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!assetId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/asset-edit-history/${encodeURIComponent(assetId)}?limit=${pageSize}&offset=${offset}`;
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setTotal(data.pagination?.total || 0);
        setAvailable(data.available !== false);
        setMessage(data.message || null);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'load_failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [assetId, offset, pageSize]);

  const canPrev = offset > 0;
  const canNext = offset + pageSize < total;
  const page = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h3 style={styles.title}>편집 이력</h3>
        <span style={styles.meta}>
          총 {total}건 · 페이지 {page}/{totalPages}
        </span>
      </div>

      {!available && message && (
        <div style={{ ...styles.error, backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
          {message}
        </div>
      )}

      {loading && <div style={styles.loading}>로딩 중…</div>}

      {!loading && error && (
        <div style={styles.error}>오류: {error}</div>
      )}

      {!loading && !error && entries.length === 0 && available && (
        <div style={styles.empty}>편집 이력이 없습니다.</div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div>
          {entries.map((entry) => (
            <HistoryEntry key={entry.id} entry={entry} assetId={assetId} />
          ))}
        </div>
      )}

      {total > pageSize && (
        <div style={styles.pager}>
          <button
            type="button"
            onClick={() => setOffset(Math.max(0, offset - pageSize))}
            disabled={!canPrev}
            style={{ ...styles.pagerBtn, ...(canPrev ? {} : styles.pagerBtnDisabled) }}
          >
            ← 이전
          </button>
          <span style={styles.meta}>
            {offset + 1}–{Math.min(offset + pageSize, total)} / {total}
          </span>
          <button
            type="button"
            onClick={() => setOffset(offset + pageSize)}
            disabled={!canNext}
            style={{ ...styles.pagerBtn, ...(canNext ? {} : styles.pagerBtnDisabled) }}
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
