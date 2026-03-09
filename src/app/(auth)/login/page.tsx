'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Zap, Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const verified = searchParams.get('verified');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ email, password });
      // Check if onboarding is needed
      if (user.onboardingCompleted === false) {
        router.push('/onboarding');
      } else {
        const from = searchParams.get('from') || '/';
        router.push(from);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message;
      if (typeof message === 'string' && message.includes('not verified')) {
        setError('Tu email no está verificado. Revisa tu bandeja de entrada.');
      } else {
        setError(typeof message === 'string' ? message : 'Error de autenticación. Revisa tus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">CIE Platform</span>
          </div>
          <p className="text-surface-500 text-sm">Certificados de Instalaciones Eléctricas</p>
        </div>

        {/* Verified banner */}
        {verified === 'true' && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-400">Email verificado correctamente. Ya puedes iniciar sesión.</p>
          </div>
        )}
        {verified === 'error' && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            El enlace de verificación no es válido o ha caducado.
          </div>
        )}

        {/* Form */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white font-medium text-lg mb-6">Iniciar sesión</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-surface-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-800 border border-surface-700
                  text-white placeholder-surface-500 text-sm
                  focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600
                  transition-colors"
                placeholder="tu@email.com"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-surface-400 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-800 border border-surface-700
                  text-white placeholder-surface-500 text-sm
                  focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600
                  transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm
                hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-surface-500 text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <a href="/register" className="font-medium text-brand-400 hover:text-brand-300">
            Regístrate gratis
          </a>
        </p>

        <p className="text-center text-surface-600 text-xs mt-4">
          CIE Platform v0.1 — DASO Ingenieros
        </p>
      </div>
    </div>
  );
}
