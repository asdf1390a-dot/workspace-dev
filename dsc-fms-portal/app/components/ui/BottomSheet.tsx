/**
 * BottomSheet — mobile-optimized drawer that slides up from the bottom.
 * On tablet+ (≥768px) it visually behaves like a centered modal but still
 * anchors to the bottom of the screen.
 */
'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  height?: 'auto' | 'half' | 'full';
}

const HEIGHT: Record<NonNullable<BottomSheetProps['height']>, string> = {
  auto: 'auto',
  half: '50vh',
  full: '90vh',
};

export default function BottomSheet({
  open, onClose, title, children, closeOnBackdrop = true, height = 'auto',
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="presentation"
      onClick={() => closeOnBackdrop && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(2, 6, 23, 0.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'jp-fade-in var(--jp-duration-2) var(--jp-ease)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: HEIGHT[height],
          background: 'var(--jp-bg-elev-1)',
          color: 'var(--jp-text)',
          borderTopLeftRadius: 'var(--jp-radius-xl, 16px)',
          borderTopRightRadius: 'var(--jp-radius-xl, 16px)',
          borderTop: '1px solid var(--jp-border)',
          boxShadow: 'var(--jp-shadow-xl)',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
          fontFamily: 'var(--jp-font-sans)',
          display: 'flex', flexDirection: 'column',
          animation: 'jp-sheet-up var(--jp-duration-3) var(--jp-ease)',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <span style={{
            width: 40, height: 4, borderRadius: 999,
            background: 'var(--jp-border-strong)',
          }} />
        </div>

        {title && (
          <div style={{
            padding: 'var(--jp-space-3, 12px) var(--jp-space-5, 20px) var(--jp-space-4, 16px)',
            borderBottom: '1px solid var(--jp-border)',
            fontSize: 18, fontWeight: 600,
          }}>
            {title}
          </div>
        )}
        <div style={{
          padding: 'var(--jp-space-5, 20px)',
          overflowY: 'auto',
          fontSize: 16, lineHeight: 1.5,
        }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
