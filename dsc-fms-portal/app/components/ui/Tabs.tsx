/**
 * Tabs — accessible tab navigation, responsive.
 * - Desktop/tablet: horizontal pills.
 * - Mobile (<480px): same horizontal but scrollable (overflow-x: auto).
 *
 * Controlled component: parent owns the active value.
 *
 * Usage:
 *   <Tabs value={tab} onChange={setTab} items={[
 *     { value: 'overview', label: 'Overview' },
 *     { value: 'history',  label: 'History' },
 *   ]} />
 */
'use client';

import { CSSProperties, KeyboardEvent, ReactNode, useId, useRef } from 'react';

export interface TabItem<V extends string = string> {
  value: V;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps<V extends string = string> {
  items: TabItem<V>[];
  value: V;
  onChange: (next: V) => void;
  ariaLabel?: string;
  fullWidth?: boolean;
}

export default function Tabs<V extends string = string>({
  items, value, onChange, ariaLabel = 'Tabs', fullWidth = false,
}: TabsProps<V>) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const enabled = items.map((t, i) => ({ t, i })).filter(x => !x.t.disabled);
    if (enabled.length === 0) return;
    const pos = enabled.findIndex(x => x.i === idx);
    let nextPos = pos;
    if (e.key === 'ArrowLeft')  nextPos = (pos - 1 + enabled.length) % enabled.length;
    if (e.key === 'ArrowRight') nextPos = (pos + 1) % enabled.length;
    if (e.key === 'Home')       nextPos = 0;
    if (e.key === 'End')        nextPos = enabled.length - 1;
    const nextItem = enabled[nextPos].t;
    onChange(nextItem.value);
    const btn = listRef.current?.querySelector<HTMLButtonElement>(`#${baseId}-tab-${nextItem.value}`);
    btn?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: 4,
        background: 'var(--jp-bg-elev-1)',
        border: '1px solid var(--jp-border)',
        borderRadius: 'var(--jp-radius-md, 8px)',
        padding: 4,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        width: fullWidth ? '100%' : 'fit-content',
        fontFamily: 'var(--jp-font-sans)',
      }}
    >
      {items.map((item, idx) => {
        const active = item.value === value;
        const style: CSSProperties = {
          flex: fullWidth ? 1 : '0 0 auto',
          minHeight: 40,
          padding: '8px 14px',
          fontSize: 14,
          fontWeight: active ? 600 : 500,
          border: 'none',
          borderRadius: 'var(--jp-radius-sm, 4px)',
          background: active ? 'var(--jp-accent-soft)' : 'transparent',
          color: active ? 'var(--jp-accent)' : 'var(--jp-text-muted)',
          cursor: item.disabled ? 'not-allowed' : 'pointer',
          opacity: item.disabled ? 0.5 : 1,
          whiteSpace: 'nowrap',
          transition: 'background var(--jp-duration-2) var(--jp-ease), color var(--jp-duration-2) var(--jp-ease)',
        };
        return (
          <button
            key={item.value}
            id={`${baseId}-tab-${item.value}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-disabled={item.disabled || undefined}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className="jp-focus-ring"
            style={style}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
