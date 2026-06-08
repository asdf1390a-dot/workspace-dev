export default function Card({
  title,
  subtitle,
  icon: Icon,
  footer,
  actions,
  children,
  style = {},
  onClick,
}) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = '#d1d5db';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
    >
      {(title || Icon) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {Icon && <Icon />}
            <div>
              {title && (
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}

      {children && (
        <div style={{ marginBottom: footer ? '1rem' : 0 }}>
          {children}
        </div>
      )}

      {footer && (
        <div
          style={{
            borderTop: '1px solid #f3f4f6',
            paddingTop: '1rem',
            marginTop: '1rem',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
