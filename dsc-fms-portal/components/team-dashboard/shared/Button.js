const VARIANTS = {
  primary: {
    bg: '#3B82F6',
    fg: '#ffffff',
    border: '1px solid #3B82F6',
    hover: '#2563EB',
  },
  secondary: {
    bg: '#6B7280',
    fg: '#ffffff',
    border: '1px solid #6B7280',
    hover: '#4B5563',
  },
  ghost: {
    bg: 'transparent',
    fg: '#3B82F6',
    border: '1px solid #3B82F6',
    hover: '#EFF6FF',
  },
  danger: {
    bg: '#EF4444',
    fg: '#ffffff',
    border: '1px solid #EF4444',
    hover: '#DC2626',
  },
};

const SIZES = {
  sm: { padding: '0.5rem 1rem', fontSize: '0.875rem', minHeight: '2rem' },
  md: { padding: '0.75rem 1.5rem', fontSize: '1rem', minHeight: '2.5rem' },
  lg: { padding: '1rem 2rem', fontSize: '1.125rem', minHeight: '3rem' },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  type = 'button',
  children,
  style = {},
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;

  const baseStyle = {
    ...s,
    background: v.bg,
    color: v.fg,
    border: v.border,
    borderRadius: '0.375rem',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    transition: 'background-color 0.2s ease',
    ...style,
  };

  return (
    <button
      type={type}
      style={baseStyle}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.target.style.backgroundColor = v.hover;
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = v.bg;
      }}
    >
      {loading ? <Spinner size="sm" /> : Icon && <Icon />}
      {!loading && children}
    </button>
  );
}

function Spinner({ size = 'sm' }) {
  const s = size === 'sm' ? 16 : 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <path
        d="M 12 2 A 10 10 0 0 1 22 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ animation: 'spin 1s linear infinite' }}
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
}
