/**
 * Modal — centered dialog with backdrop, ESC-to-close, focus trap-lite.
 * Headless: caller renders header/body/footer however they want.
 */
'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../icons/HeroiconsWrapper';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
}

const SIZE: Record<NonNullable<ModalProps['size']>, number> = {
  sm: 400, md: 560, lg: 800,
};

export default function Modal({
  open, onClose, title, children, footer, size = 'md', closeOnBackdrop = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Focus the dialog when it opens.
    dialogRef.current?.focus();
    // Lock body scroll.
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--jp-space-4, 16px)',
        animation: 'jp-fade-in var(--jp-duration-2) var(--jp-ease)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: SIZE[size],
          maxHeight: 'calc(100vh - 32px)',
          background: 'var(--jp-bg-elev-1)',
          color: 'var(--jp-text)',
          border: '1px solid var(--jp-border)',
          borderRadius: 'var(--jp-radius-lg, 12px)',
          boxShadow: 'var(--jp-shadow-xl)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'var(--jp-font-sans)',
          animation: 'jp-slide-up var(--jp-duration-3) var(--jp-ease)',
          overflow: 'hidden',
        }}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 'var(--jp-space-4, 16px) var(--jp-space-5, 20px)',
            borderBottom: '1px solid var(--jp-border)',
          }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="jp-focus-ring"
              style={{
                width: 36, height: 36, borderRadius: 'var(--jp-radius-md, 8px)',
                background: 'transparent', border: 'none',
                color: 'var(--jp-text-muted)', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <CloseIcon size={20} />
            </button>
          </div>
        )}
        <div style={{
          padding: 'var(--jp-space-5, 20px)',
          overflowY: 'auto',
          fontSize: 16, lineHeight: 1.5,
        }}>
          {children}
        </div>
        {footer && (
          <div style={{
            padding: 'var(--jp-space-3, 12px) var(--jp-space-5, 20px)',
            borderTop: '1px solid var(--jp-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
            background: 'var(--jp-bg)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
