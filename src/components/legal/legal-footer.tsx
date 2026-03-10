import Link from 'next/link';

export function LegalFooter() {
  return (
    <footer className="border-t border-surface-200 py-4 px-6 text-center">
      <div className="flex flex-wrap justify-center gap-3 text-xs text-surface-400">
        <Link href="/legal/aviso" className="hover:text-surface-600">Aviso Legal</Link>
        <span>|</span>
        <Link href="/legal/terminos" className="hover:text-surface-600">Terminos y Condiciones</Link>
        <span>|</span>
        <Link href="/legal/privacidad" className="hover:text-surface-600">Politica de Privacidad</Link>
        <span>|</span>
        <Link href="/legal/cookies" className="hover:text-surface-600">Politica de Cookies</Link>
      </div>
    </footer>
  );
}
