export function LoadingSpinner({ label = '로딩 중' }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}
