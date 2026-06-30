export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-gold" />
        <span className="text-xs text-muted">Loading…</span>
      </div>
    </div>
  );
}
