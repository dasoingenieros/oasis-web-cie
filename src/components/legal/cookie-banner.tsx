'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { consentApi } from '@/lib/api-client';
import { LEGAL_VERSIONS } from '@/lib/legal-versions';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = document.cookie.split(';').find((c) => c.trim().startsWith('cookie_consent='));
    if (!consent) setVisible(true);
  }, []);

  const accept = async () => {
    document.cookie = 'cookie_consent=accepted; max-age=31536000; path=/; SameSite=Lax';
    setVisible(false);
    try {
      await consentApi.log({ consentType: 'cookies', documentVersion: LEGAL_VERSIONS.COOKIES, accepted: true, method: 'banner' });
    } catch { /* ignore if not logged in */ }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Utilizamos cookies estrictamente necesarias para el funcionamiento de la plataforma.
          Consulta nuestra{' '}
          <Link href="/legal/cookies" className="text-blue-600 hover:underline">Politica de Cookies</Link>{' '}
          para mas informacion.
        </p>
        <div className="flex gap-2">
          <Link href="/legal/cookies" className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
            Configurar cookies
          </Link>
          <button onClick={accept} className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
