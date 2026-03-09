'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // This page is only a fallback — the actual verification happens via
  // GET /api/v1/auth/verify-email?token=xxx which redirects to /login?verified=true|error
  // If user lands here directly, we show a message

  if (!token) {
    return (
      <VerifyLayout>
        <XCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-white font-medium text-lg mt-4">Enlace no válido</h2>
        <p className="text-surface-400 text-sm mt-2">
          El enlace de verificación no es válido. Comprueba que has copiado la URL completa.
        </p>
        <a
          href="/login"
          className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-500 transition-colors"
        >
          Ir al login
        </a>
      </VerifyLayout>
    );
  }

  // Redirect to backend endpoint for verification
  if (typeof window !== 'undefined') {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    window.location.href = `${apiBase}/api/v1/auth/verify-email?token=${token}`;
  }

  return (
    <VerifyLayout>
      <Loader2 className="w-12 h-12 text-brand-400 mx-auto animate-spin" />
      <h2 className="text-white font-medium text-lg mt-4">Verificando tu email...</h2>
      <p className="text-surface-400 text-sm mt-2">Un momento, estamos verificando tu cuenta.</p>
    </VerifyLayout>
  );
}

function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative w-full max-w-sm mx-4 text-center">
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-2xl font-semibold text-white tracking-tight">CIE Platform</span>
        </div>
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
