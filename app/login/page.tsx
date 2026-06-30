'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Truck, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/features/authentication/components/AuthProvider';
import { getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const onSubmit = async ({ email, password }: FormValues) => {
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-panel border-r border-line relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-5"
          style={{ backgroundImage: 'repeating-linear-gradient(#f59e0b 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #f59e0b 0 1px, transparent 1px 100%)', backgroundSize: '40px 40px' }} />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 ring-1 ring-gold/30">
            <Truck size={20} className="text-gold" />
          </div>
          <div>
            <div className="font-bold text-text">Vendor Control Tower</div>
            <div className="text-xs text-muted">Enterprise Logistics System</div>
          </div>
        </div>

        <div className="relative">
          <div className="mb-4 inline-block rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-semibold text-gold">
            Real-time visibility
          </div>
          <h2 className="text-3xl font-bold text-text mb-3 leading-tight">
            Complete Vendor<br />Movement Intelligence
          </h2>
          <p className="text-muted text-sm leading-relaxed max-w-sm">
            Monitor every vehicle, every container, every minute. Replace messy Excel sheets with real-time analytics and automated alerts.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3">
          {[
            { label: 'Live tracking', value: '24/7' },
            { label: '>25H alerts',   value: 'Auto' },
            { label: 'Excel import',  value: 'Smart' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-line bg-panel2 p-3 text-center">
              <div className="text-lg font-bold font-mono text-gold">{s.value}</div>
              <div className="text-[10px] text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 ring-1 ring-gold/30">
              <Lock size={24} className="text-gold" />
            </div>
            <h1 className="text-2xl font-bold text-text">Sign in</h1>
            <p className="mt-1 text-sm text-muted">Access the control tower</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="admin@logistics.com"
                  className="input-field pl-9"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red">{errors.email.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted2 pointer-events-none" />
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input-field pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted2 hover:text-text transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center py-2.5 text-sm mt-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-line bg-panel2 p-3">
            <p className="text-[10px] text-muted2 font-mono text-center">
              Default: <span className="text-gold">admin@logistics.com</span> / <span className="text-gold">Admin@1234</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
