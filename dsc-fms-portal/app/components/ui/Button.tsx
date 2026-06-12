/**
 * Button — 5 variants: primary | secondary | danger | ghost + loading state.
 * Mobile-first: ≥44px tap target, 16px font.
 * Wraps `lucide-react` spinner for loading.
 */
'use client';

import { ButtonHTMLAttributes, CSSProperties, forwardRef, ReactNode } from 'react';
import { SpinnerIcon } from '../icons/HeroiconsWrapper';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--jp-accent)',
    color: '#001317',
    border: '1px solid var(--jp-accent)',
  },
  secondary: {
    background: 'var(--jp-bg-elev-2)',
    color: 'var(--jp-text)',
    border: '1px solid var(--jp-border-strong)',
  },
  danger: {
    background: 'var(--jp-danger)',
    color: '#fff',
    border: '1px solid var(--jp-danger)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--jp-text-muted)',
    border: '1px solid transparent',
  },
};

const SIZE_STYLES: Record<ButtonSize, CSSProperties> = {
  sm: { fontSize: 14, padding: '6px 12px', minHeight: 36, borderRadius: 'var(--jp-radius-sm, 4px)' },
  md: { fontSize: 16, padding: '10px 16px', minHeight: 44, borderRadius: 'var(--jp-radius-md, 8px)' },
  lg: { fontSize: 16, padding: '14px 22px', minHeight: 52, borderRadius: 'var(--jp-radius-md, 8px)' },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    style,
    children,
    className,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const merged: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'var(--jp-font-sans)',
    fontWeight: 600,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    transition: 'background var(--jp-duration-2) var(--jp-ease), transform var(--jp-duration-1) var(--jp-ease), opacity var(--jp-duration-2) var(--jp-ease)',
    ...VARIANT_STYLES[variant],
    ...SIZE_STYLES[size],
    ...style,
  };

  return (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={['jp-focus-ring', className].filter(Boolean).join(' ')}
      style={merged}
      {...rest}
    >
      {loading ? (
        <SpinnerIcon size={16} style={{ animation: 'jp-spin 0.8s linear infinite' }} aria-hidden="true" />
      ) : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
});

export default Button;
