import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CIE Platform — Certificados de Instalaciones Eléctricas',
    template: '%s | CIE Platform',
  },
  description:
    'Genera certificados eléctricos CIE/BRIE en minutos. Cálculo automático según REBT, memoria técnica y esquema unifilar.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
