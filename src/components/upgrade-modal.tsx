'use client';

import { Zap, X, Check, Loader2, Star } from 'lucide-react';
import { useState } from 'react';
import { subscriptionsApi } from '@/lib/api-client';

const PRICE_PUNTUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_PUNTUAL!;
const PRICE_PRO = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!;
const PRICE_ENTERPRISE = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!;

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const options = [
  {
    key: 'PUNTUAL',
    name: 'Puntual',
    price: '12€ + IVA',
    subtitle: 'Solo este certificado',
    priceId: PRICE_PUNTUAL,
    highlight: false,
    features: ['1 certificado por compra', 'Sin suscripción', 'Sin marca de agua'],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: '9€/mes + IVA',
    subtitle: 'Ilimitado',
    priceId: PRICE_PRO,
    highlight: true,
    badge: 'Recomendado',
    features: ['Certificados ilimitados', 'Sin marca de agua', 'Precio de lanzamiento'],
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: '29€/mes + IVA',
    subtitle: 'Para equipos',
    priceId: PRICE_ENTERPRISE,
    highlight: false,
    features: ['Todo lo de Pro', 'Hasta 5 usuarios', 'Soporte prioritario'],
  },
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleCheckout = async (priceId: string, key: string) => {
    setLoading(key);
    setError(null);
    try {
      const { url } = await subscriptionsApi.createCheckout(priceId);
      window.location.href = url;
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error al crear la sesión de pago');
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 sm:p-8 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-surface-400 hover:text-surface-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-surface-900">
            Has alcanzado el límite de tu plan Free
          </h2>
          <p className="text-sm text-surface-500 mt-1">
            Elige una opción para seguir generando certificados
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {options.map((opt) => {
            const isLoading = loading === opt.key;
            return (
              <div
                key={opt.key}
                className={`relative rounded-xl border p-4 flex flex-col ${
                  opt.highlight
                    ? 'border-brand-600 ring-1 ring-brand-600'
                    : 'border-surface-200'
                }`}
              >
                {opt.badge && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-semibold inline-flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" />
                      {opt.badge}
                    </span>
                  </div>
                )}
                <h3 className="font-semibold text-surface-900">{opt.name}</h3>
                <p className="text-xl font-bold text-surface-900 mt-1">{opt.price}</p>
                <p className="text-xs text-surface-500 mb-3">{opt.subtitle}</p>
                <ul className="space-y-1.5 flex-1">
                  {opt.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-surface-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(opt.priceId, opt.key)}
                  disabled={isLoading || loading !== null}
                  className={`mt-4 block w-full text-center py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    opt.highlight
                      ? 'bg-brand-600 text-white hover:bg-brand-500'
                      : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                  }`}
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Redirigiendo...
                    </span>
                  ) : opt.key === 'PUNTUAL' ? (
                    'Comprar certificado'
                  ) : (
                    'Suscribirse'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-surface-400 mb-4">
          Precios sin IVA. Se aplicará 21% de IVA en el checkout.
        </p>

        {/* Dismiss */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-sm text-surface-400 hover:text-surface-600 transition-colors"
          >
            Quizás más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
