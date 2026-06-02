'use client';

interface AlertBoxProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  message: string;
  details?: string[];
  onClose?: () => void;
}

const alertStyles = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'text-red-900',
    text: 'text-red-800',
    icon: '❌',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    title: 'text-green-900',
    text: 'text-green-800',
    icon: '✅',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    title: 'text-yellow-900',
    text: 'text-yellow-800',
    icon: '⚠️',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'text-blue-900',
    text: 'text-blue-800',
    icon: 'ℹ️',
  },
};

export function AlertBox({ type, title, message, details, onClose }: AlertBoxProps) {
  const styles = alertStyles[type];

  return (
    <div className={`rounded-lg border ${styles.bg} ${styles.border} p-4 relative`}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="닫기"
        >
          ×
        </button>
      )}

      <div className="flex gap-3">
        <span className="text-xl" aria-hidden="true">
          {styles.icon}
        </span>
        <div className="flex-1">
          {title && <h3 className={`font-semibold ${styles.title}`}>{title}</h3>}
          <p className={styles.text}>{message}</p>

          {details && details.length > 0 && (
            <ul className={`mt-2 space-y-1 text-sm ${styles.text}`}>
              {details.map((detail, i) => (
                <li key={i} className="ml-4 list-disc">
                  {detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
