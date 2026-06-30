'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4 text-center p-8 max-w-sm animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red/10 ring-1 ring-red/20">
          <AlertTriangle size={28} className="text-red" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text">Something went wrong</h2>
          <p className="mt-1.5 text-xs text-muted max-w-xs">{error.message || 'An unexpected error occurred.'}</p>
        </div>
        <button onClick={reset} className="btn-primary gap-2">
          <RefreshCw size={13} /> Try again
        </button>
      </div>
    </div>
  );
}
