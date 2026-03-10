import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: 'noindex',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link href="/" className="text-lg font-bold text-slate-900">
            CIE Platform
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-slate-200 mt-16">
        <div className="mx-auto max-w-4xl px-6 py-6 flex flex-wrap gap-4 text-xs text-slate-400">
          <Link href="/legal/aviso" className="hover:text-slate-600">Aviso Legal</Link>
          <Link href="/legal/terminos" className="hover:text-slate-600">Terminos y Condiciones</Link>
          <Link href="/legal/privacidad" className="hover:text-slate-600">Politica de Privacidad</Link>
          <Link href="/legal/cookies" className="hover:text-slate-600">Politica de Cookies</Link>
          <Link href="/legal/dpa" className="hover:text-slate-600">DPA</Link>
        </div>
      </footer>
    </div>
  );
}
