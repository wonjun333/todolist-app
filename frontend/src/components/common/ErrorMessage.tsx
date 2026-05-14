interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div role="alert" aria-live="polite" style={{ color: 'var(--color-error-600)', fontSize: 'var(--text-sm)' }}>
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{ marginLeft: 8, color: 'var(--color-primary-600)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)' }}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
