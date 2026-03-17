'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { subscriptionsApi } from '@/lib/api-client';
import type { UsageData } from '@/lib/types';
import {
  CreditCard,
  Zap,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileText,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    subscriptionsApi
      .getUsage()
      .then(setUsage)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await subscriptionsApi.createPortal();
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = usage?.plan?.toUpperCase() ?? 'FREE';
  const isFreePlan = plan === 'FREE';
  const isPro = plan === 'PRO';
  const isEnterprise = plan === 'ENTERPRISE';
  const credits = usage?.availableCredits ?? 0;
  const certsGenerated = usage?.certsGenerated ?? 0;

  const planLabel = isEnterprise ? 'Enterprise' : isPro ? 'Pro' : 'Free';
  const planPrice = isEnterprise ? '29€/mes + IVA' : isPro ? '9€/mes + IVA' : 'Gratis';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Facturación</h1>
        <p className="mt-0.5 text-sm text-surface-500">
          Gestiona tu plan y facturación
        </p>
      </div>

      {/* Plan actual */}
      <div className="bg-white rounded-xl border border-surface-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
            <Zap className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-surface-900">Plan {planLabel}</h2>
            <p className="text-sm text-surface-500">{planPrice}</p>
          </div>
        </div>

        {isFreePlan ? (
          <div className="flex items-center justify-between pt-2 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              {credits > 0
                ? `${credits} certificado${credits !== 1 ? 's' : ''} disponible${credits !== 1 ? 's' : ''}`
                : 'Sin certificados disponibles'}
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors"
            >
              Mejorar plan
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t border-surface-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500">Estado</span>
              <span className="text-sm font-medium text-emerald-600">Activa</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500">Certificados</span>
              <span className="text-sm font-medium text-surface-900">Ilimitados</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortal}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                )}
                Gestionar facturación
              </Button>
              <Link href="/pricing">
                <Button variant="ghost" size="sm">
                  Cambiar plan
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Créditos puntuales */}
      {credits > 0 && (
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <Coins className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-surface-900">Créditos puntuales</h2>
              <p className="text-sm text-surface-500">
                {credits} crédito{credits !== 1 ? 's' : ''} disponible{credits !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100">
            <FileText className="h-4 w-4 text-surface-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-surface-900">Certificados generados</h2>
            <p className="text-sm text-surface-500">
              {certsGenerated} certificado{certsGenerated !== 1 ? 's' : ''} en total
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
