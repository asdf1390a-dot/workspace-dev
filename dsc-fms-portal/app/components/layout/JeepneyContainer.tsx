/**
 * Responsive container for JEEPNEY portal content.
 * Caps width at 1200px on desktop, 768px on tablet, full-bleed on mobile.
 * Padding follows the 4px spacing grid.
 */
'use client';

import { CSSProperties, ReactNode, type JSX } from 'react';

export type ContainerWidth = 'narrow' | 'default' | 'wide' | 'full';

interface JeepneyContainerProps {
  children: ReactNode;
  width?: ContainerWidth;
  padded?: boolean;
  style?: CSSProperties;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const MAX_WIDTHS: Record<ContainerWidth, string> = {
  narrow:  '640px',
  default: '960px',
  wide:    '1200px',
  full:    '100%',
};

export default function JeepneyContainer({
  children,
  width = 'default',
  padded = true,
  style,
  className,
  as: Tag = 'div',
}: JeepneyContainerProps) {
  const merged: CSSProperties = {
    width: '100%',
    maxWidth: MAX_WIDTHS[width],
    marginInline: 'auto',
    paddingInline: padded ? 'var(--jp-space-4, 16px)' : 0,
    boxSizing: 'border-box',
    ...style,
  };
  return (
    <Tag style={merged} className={className}>
      {children}
    </Tag>
  );
}
