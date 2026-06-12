/**
 * Input — text input with label, hint, and error message.
 * - 16px+ font (iOS doesn't zoom on focus).
 * - Tap target ≥44px (minHeight 44).
 * - Accessible: label associated via htmlFor + id, aria-invalid on error.
 */
'use client';

import { CSSProperties, InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, fullWidth = true, id, style, className, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? `jp-input-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId  = error ? `${inputId}-err` : undefined;

  const fieldStyle: CSSProperties = {
    width: '100%',
    minHeight: 44,
    padding: '10px 14px',
    fontSize: 16,
    fontFamily: 'var(--jp-font-sans)',
    color: 'var(--jp-text)',
    background: 'var(--jp-bg-elev-2)',
    border: `1px solid ${error ? 'var(--jp-danger)' : 'var(--jp-border-strong)'}`,
    borderRadius: 'var(--jp-radius-md, 8px)',
    outline: 'none',
    transition: 'border-color var(--jp-duration-2) var(--jp-ease), box-shadow var(--jp-duration-2) var(--jp-ease)',
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 14, fontWeight: 600,
            color: 'var(--jp-text-muted)',
            fontFamily: 'var(--jp-font-sans)',
          }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={['jp-focus-ring', className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
        style={fieldStyle}
        {...rest}
      />
      {hint && !error && (
        <span id={hintId} style={{ fontSize: 12, color: 'var(--jp-text-subtle)' }}>{hint}</span>
      )}
      {error && (
        <span id={errId} role="alert" style={{ fontSize: 12, color: 'var(--jp-danger)' }}>{error}</span>
      )}
    </div>
  );
});

export default Input;
