'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { NavScrollProvider, useNavScroll } from '@/lib/nav-scroll-context';
import { subscriptionsApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { UsageData } from '@/lib/types';
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  LogOut,
  Zap,
  Menu,
  X,
  ArrowUpRight,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { LegalFooter } from '@/components/legal/legal-footer';
import { CookieBanner } from '@/components/legal/cookie-banner';

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instalaciones', label: 'Instalaciones', icon: FolderOpen },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
  { href: '/settings/billing', label: 'Facturación', icon: CreditCard },
];

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { navHidden } = useNavScroll();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect to onboarding if needed (skip if already on /onboarding)
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.onboardingCompleted === false && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // Fetch usage for sidebar upgrade button
  useEffect(() => {
    if (isAuthenticated) {
      subscriptionsApi.getUsage().then(setUsage).catch(() => {});
    }
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = usage?.plan?.toUpperCase() ?? 'FREE';
  const isFreePlan = plan === 'FREE';
  const isPaidPlan = plan === 'PRO' || plan === 'ENTERPRISE';

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen w-56 bg-surface-950 flex flex-col transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-surface-800">
          <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight">CIE Platform</span>
          <button className="lg:hidden ml-auto text-surface-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {nav.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-brand-600/10 text-brand-400 font-medium'
                    : 'text-surface-400 hover:text-white hover:bg-surface-800/60',
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Plan action button */}
        {isFreePlan && (
          <div className="px-3 pb-2">
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-lg
                bg-gradient-to-r from-brand-600 to-blue-600 text-white text-sm font-medium
                hover:from-brand-500 hover:to-blue-500 transition-all"
            >
              <Zap className="w-4 h-4" />
              Mejorar plan
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
        {isPaidPlan && (
          <div className="px-3 pb-2">
            <button
              onClick={async () => {
                setPortalLoading(true);
                try {
                  const { url } = await subscriptionsApi.createPortal();
                  window.location.href = url;
                } catch {
                  setPortalLoading(false);
                }
              }}
              disabled={portalLoading}
              className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-lg
                bg-surface-800 text-surface-300 text-sm font-medium
                hover:bg-surface-700 hover:text-white transition-all disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Gestionar plan
            </button>
          </div>
        )}

        {/* User */}
        <div className="p-3 border-t border-surface-800">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-surface-700 flex items-center justify-center text-xs text-white font-medium">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-surface-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-2 px-3 py-1.5 w-full rounded-lg text-sm text-surface-400 hover:text-red-400 hover:bg-surface-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className={cn(
          'sticky top-0 z-20 h-14 bg-white/80 backdrop-blur-sm border-b border-surface-200 flex items-center px-4 gap-3 transition-all duration-300',
          navHidden && '-translate-y-full -mb-14',
        )}>
          <button className="lg:hidden text-surface-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <Zap className="w-4 h-4" />
            <span>Certificados de Instalaciones Eléctricas</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>

        <LegalFooter />
      </div>

      <CookieBanner />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavScrollProvider>
      <DashboardInner>{children}</DashboardInner>
    </NavScrollProvider>
  );
}
