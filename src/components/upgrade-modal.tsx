'use client';

import { Zap, X, Check, ArrowRight } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const plans = [
  {
    name: 'Pro',
    price: '19€/mes',
    features: ['Certificados ilimitados', 'Sin marca de agua', 'Export PDF, DXF, SVG'],
    highlight: true,
  },
  {
    name: 'Empresa',
    price: '49€/mes',
    features: ['Todo lo de Pro', 'Hasta 3 usuarios', 'Soporte prioritario'],
    highlight: false,
  },
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 sm:p-8 relative">
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
            Mejora a Pro para generar certificados ilimitados
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-4 ${
                plan.highlight
                  ? 'border-brand-600 ring-1 ring-brand-600'
                  : 'border-surface-200'
              }`}
            >
              <h3 className="font-semibold text-surface-900">{plan.name}</h3>
              <p className="text-2xl font-bold text-surface-900 mt-1">{plan.price}</p>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-surface-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/pricing"
                className={`mt-4 block w-full text-center py-2 rounded-lg text-sm font-medium transition-colors ${
                  plan.highlight
                    ? 'bg-brand-600 text-white hover:bg-brand-500'
                    : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                }`}
              >
                Suscribirse
                <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </a>
            </div>
          ))}
        </div>

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
