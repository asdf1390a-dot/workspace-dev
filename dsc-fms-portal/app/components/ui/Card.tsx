/**
 * Card — surface container with optional Header, Body, Footer subcomponents.
 *
 * Usage:
 *   <Card>
 *     <Card.Header>Title</Card.Header>
 *     <Card.Body>...</Card.Body>
 *     <Card.Footer>...</Card.Footer>
 *   </Card>
 */
'use client';

import { CSSProperties, HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padded?: boolean;
  interactive?: boolean;
  children: ReactNode;
}

const VARIANT: Record<CardVariant, CSSProperties> = {
  default: {
    background: 'var(--jp-bg-elev-1)',
    border: '1px solid var(--jp-border)',
    boxShadow: 'var(--jp-shadow-sm)',
  },
  elevated: {
    background: 'var(--jp-bg-elev-1)',
    border: '1px solid var(--jp-border)',
    boxShadow: 'var(--jp-shadow-md)',
  },
  outlined: {
    background: 'transparent',
    border: '1px solid var(--jp-border-strong)',
    boxShadow: 'none',
  },
};

function Card({
  variant = 'default',
  padded = false,
  interactive = false,
  style,
  children,
  className,
  ...rest
}: CardProps) {
  const merged: CSSProperties = {
    borderRadius: 'var(--jp-radius-lg, 12px)',
    color: 'var(--jp-text)',
    fontFamily: 'var(--jp-font-sans)',
    overflow: 'hidden',
    transition: 'transform var(--jp-duration-2) var(--jp-ease), box-shadow var(--jp-duration-2) var(--jp-ease)',
    padding: padded ? 'var(--jp-space-4, 16px)' : 0,
    cursor: interactive ? 'pointer' : 'default',
    ...VARIANT[variant],
    ...style,
  };
  return (
    <div className={className} style={merged} {...rest}>
      {children}
    </div>
  );
}

interface PartProps extends HTMLAttributes<HTMLDivElement> { children: ReactNode; }

function Header({ children, style, ...rest }: PartProps) {
  return (
    <div
      style={{
        padding: 'var(--jp-space-4, 16px) var(--jp-space-5, 20px)',
        borderBottom: '1px solid var(--jp-border)',
        fontSize: 'var(--jp-text-lg, 18px)',
        fontWeight: 600,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function Body({ children, style, ...rest }: PartProps) {
  return (
    <div
      style={{
        padding: 'var(--jp-space-5, 20px)',
        fontSize: 'var(--jp-text-base, 16px)',
        lineHeight: 1.5,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function Footer({ children, style, ...rest }: PartProps) {
  return (
    <div
      style={{
        padding: 'var(--jp-space-3, 12px) var(--jp-space-5, 20px)',
        borderTop: '1px solid var(--jp-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--jp-bg)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

Card.Header = Header;
Card.Body = Body;
Card.Footer = Footer;

export default Card;
