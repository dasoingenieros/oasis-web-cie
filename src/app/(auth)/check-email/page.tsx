'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api-client';
import { Zap, Mail, Loader2 } from 'lucide-react';

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailInner />
    </Suspense>
  );
}

function CheckEmailInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    if (!email || countdown > 0 || sending) return;
    setSending(true);
    try {
      await authApi.resendVerify(email);
      setSent(true);
      setCountdown(60);
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  }, [email, countdown, sending]);

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
        {/* Logo */}
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-2xl font-semibold text-white tracking-tight">CIE Platform</span>
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8 shadow-2xl">
          {/* Email icon */}
          <div className="w-16 h-16 rounded-full bg-brand-600/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-brand-400" />
          </div>

          <h2 className="text-white font-medium text-xl mb-2">Revisa tu email</h2>
          <p className="text-surface-400 text-sm leading-relaxed mb-6">
            Hemos enviado un enlace de verificación a{' '}
            {email ? (
              <span className="font-medium text-white">{email}</span>
            ) : (
              'tu dirección de email'
            )}
            . Haz click en el enlace para activar tu cuenta.
          </p>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={countdown > 0 || sending}
            className="w-full py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-white font-medium text-sm
              hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </span>
            ) : countdown > 0 ? (
              `Reenviar email (${countdown}s)`
            ) : sent ? (
              'Reenviar email de nuevo'
            ) : (
              'Reenviar email de verificación'
            )}
          </button>

          {sent && countdown > 0 && (
            <p className="text-xs text-emerald-400 mt-3">Email reenviado correctamente</p>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-surface-500 text-sm">
            ¿Email incorrecto?{' '}
            <a href="/register" className="font-medium text-brand-400 hover:text-brand-300">
              Volver a registrarse
            </a>
          </p>
          <p className="text-surface-500 text-sm">
            ¿Ya lo has verificado?{' '}
            <a href="/login" className="font-medium text-brand-400 hover:text-brand-300">
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
