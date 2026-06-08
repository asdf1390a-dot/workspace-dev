const STATUS_COLORS = {
  active: { bg: '#DCFCE7', fg: '#166534', border: '#86EFAC' },
  in_progress: { bg: '#FEF3C7', fg: '#92400E', border: '#FCD34D' },
  blocked: { bg: '#FEE2E2', fg: '#7F1D1D', border: '#FECACA' },
  inactive: { bg: '#F3F4F6', fg: '#374151', border: '#D1D5DB' },
  pending: { bg: '#EDE9FE', fg: '#5B21B6', border: '#DDD6FE' },
  completed: { bg: '#D1FAE5', fg: '#065F46', border: '#6EE7B7' },
};

const DEPARTMENT_COLORS = {
  기술: { bg: '#EFF6FF', fg: '#0C4A6E', border: '#7DD3FC' },
  관리: { bg: '#F0FDF4', fg: '#14532D', border: '#86EFAC' },
  운영: { bg: '#FEF3C7', fg: '#713F12', border: '#FCD34D' },
  품질: { bg: '#FCE7F3', fg: '#500724', border: '#F472B6' },
};

export default function Badge({
  variant = 'status',
  color,
  status,
  department,
  children,
  icon: Icon,
}) {
  let colorScheme;

  if (variant === 'status') {
    colorScheme = STATUS_COLORS[status] || STATUS_COLORS.inactive;
  } else if (variant === 'department') {
    colorScheme = DEPARTMENT_COLORS[department] || DEPARTMENT_COLORS.기술;
  } else if (color) {
    colorScheme = color;
  } else {
    colorScheme = STATUS_COLORS.inactive;
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        background: colorScheme.bg,
        color: colorScheme.fg,
        border: `1px solid ${colorScheme.border}`,
        borderRadius: '0.25rem',
        whiteSpace: 'nowrap',
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </span>
  );
}
