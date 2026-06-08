export function SkeletonCard() {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    >
      <div
        style={{
          height: '1.5rem',
          background: '#e5e7eb',
          borderRadius: '0.25rem',
          marginBottom: '1rem',
        }}
      />
      <div style={{ space: '0.75rem' }}>
        <div
          style={{
            height: '1rem',
            background: '#e5e7eb',
            borderRadius: '0.25rem',
            marginBottom: '0.75rem',
          }}
        />
        <div
          style={{
            height: '1rem',
            background: '#e5e7eb',
            borderRadius: '0.25rem',
            marginBottom: '0.75rem',
            width: '80%',
          }}
        />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonLine({ width = '100%' }) {
  return (
    <div
      style={{
        height: '1rem',
        background: '#e5e7eb',
        borderRadius: '0.25rem',
        width,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 16, md: 24, lg: 32 };
  const s = sizes[size] || 24;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="2" />
      <path
        d="M 12 2 A 10 10 0 0 1 22 12"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
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
