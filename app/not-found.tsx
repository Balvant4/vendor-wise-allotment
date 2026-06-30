import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-up">
        <div className="font-mono text-8xl font-bold text-gold/20 select-none">404</div>
        <div>
          <h2 className="text-lg font-bold text-text">Page not found</h2>
          <p className="mt-1 text-xs text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
        </div>
        <Link href="/dashboard" className="btn-primary gap-2">
          <Home size={13} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
