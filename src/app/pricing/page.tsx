'use client';

import { Zap, Check, ChevronDown, Loader2, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subscriptionsApi } from '@/lib/api-client';
import type { UsageData } from '@/lib/types';

const PRICE_PUNTUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_PUNTUAL!;
const PRICE_PRO = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!;
const PRICE_ENTERPRISE = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE!;

interface PlanDef {
  key: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: { text: string; included: boolean; warn?: boolean }[];
  highlight: boolean;
  badge?: string;
  priceId?: string;
  note?: string;
}

const plans: PlanDef[] = [
  {
    key: 'FREE',
    name: 'Free',
    price: '0€',
    period: 'para siempre',
    description: 'Ideal para probar la plataforma',
    highlight: false,
    features: [
      { text: 'Motor cálculo REBT (13 ITCs)', included: true },
      { text: 'Generación MTD PDF', included: true },
      { text: 'Generación CIE Excel', included: true },
      { text: 'Solicitud BT Word', included: true },
      { text: 'Esquema Unifilar SVG', included: true },
      { text: '1 certificado completo gratis', included: false, warn: true },
    ],
  },
  {
    key: 'PUNTUAL',
    name: 'Puntual',
    price: '12€',
    period: '+ IVA / certificado',
    description: 'Pago único, sin suscripción',
    highlight: false,
    priceId: PRICE_PUNTUAL,
    features: [
      { text: 'Todo lo de Free', included: true },
      { text: '1 certificado por compra', included: true },
      { text: 'Sin marca de agua', included: true },
      { text: 'Datos empresa/instalador en docs', included: true },
      { text: 'Sin compromiso ni suscripción', included: true },
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: '9€',
    period: '/mes + IVA',
    description: 'Para instaladores autónomos',
    highlight: true,
    badge: 'Recomendado',
    priceId: PRICE_PRO,
    note: 'Precio de lanzamiento: 9€/mes. Se mantiene para siempre si te suscribes ahora.',
    features: [
      { text: 'Todo lo de Free', included: true },
      { text: 'Certificados ilimitados', included: true },
      { text: 'Sin marca de agua', included: true },
      { text: 'Export PDF, DXF, SVG', included: true },
      { text: 'Datos empresa/instalador en docs', included: true },
    ],
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: '29€',
    period: '/mes + IVA',
    description: 'Para equipos y empresas',
    highlight: false,
    priceId: PRICE_ENTERPRISE,
    features: [
      { text: 'Todo lo de Pro', included: true },
      { text: 'Hasta 5 usuarios', included: true },
      { text: 'Soporte prioritario', included: true },
      { text: 'Gestión de instaladores', included: true },
    ],
  },
];

const faqs = [
  {
    q: '¿Qué incluye cada certificado?',
    a: 'Cada certificado incluye la Memoria Técnica de Diseño (MTD), el Certificado de Instalación Eléctrica (CIE), la Solicitud BT y el Esquema Unifilar automático. Todo calculado según REBT con 13 ITCs.',
  },
  {
    q: '¿Cómo funciona el plan Puntual?',
    a: 'Compras un crédito por 12€ + IVA y lo usas cuando quieras para generar un certificado completo. Sin suscripción, sin compromiso. Si necesitas más, simplemente compra otro.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí. No hay permanencia ni penalización. Puedes cancelar tu suscripción desde el panel de facturación y seguirás teniendo acceso hasta fin del periodo pagado.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus datos e instalaciones se conservan. Si vuelves al plan Free, mantendrás acceso de lectura a todo lo generado. Si mejoras de nuevo, todo estará donde lo dejaste.',
  },
  {
    q: '¿El precio de lanzamiento del Pro se mantiene?',
    a: 'Sí. Si te suscribes ahora a 9€/mes, ese precio se mantiene para siempre mientras tu suscripción esté activa. Es nuestra forma de agradecer a los primeros usuarios.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      subscriptionsApi.getUsage().then(setUsage).catch(() => {});
    }
  }, [isAuthenticated]);

  const currentPlan = usage?.plan?.toUpperCase() ?? null;

  const handleCheckout = async (priceId: string, planKey: string) => {
    if (!isAuthenticated) {
      window.location.href = '/register';
      return;
    }
    setLoadingPlan(planKey);
    setCheckoutError(null);
    try {
      const { url } = await subscriptionsApi.createCheckout(priceId);
      window.location.href = url;
    } catch (e: any) {
      setCheckoutError(e?.response?.data?.message || 'Error al crear la sesión de pago');
      setLoadingPlan(null);
    }
  };

  const getButtonLabel = (plan: PlanDef) => {
    if (plan.key === 'FREE') {
      if (!isAuthenticated) return 'Empezar gratis';
      if (currentPlan === 'FREE') return 'Plan actual';
      return 'Plan actual';
    }
    if (plan.key === 'PUNTUAL') return 'Comprar certificado';
    if (currentPlan === plan.key) return 'Plan actual';
    return 'Suscribirse';
  };

  const isCurrentPlan = (plan: PlanDef) => {
    if (plan.key === 'FREE' && isAuthenticated && currentPlan === 'FREE') return true;
    if (plan.key !== 'FREE' && plan.key !== 'PUNTUAL' && currentPlan === plan.key) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-surface-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-surface-900 tracking-tight">CIE Platform</span>
          </a>
          <div className="flex items-center gap-3">
            {!isAuthenticated && !authLoading && (
              <>
                <a href="/login" className="text-sm text-surface-600 hover:text-surface-900 transition-colors">
                  Iniciar sesión
                </a>
                <a
                  href="/register"
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors"
                >
                  Empezar gratis
                </a>
              </>
            )}
            {isAuthenticated && (
              <a href="/" className="text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors">
                Ir al dashboard
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-surface-900 max-w-2xl mx-auto leading-tight">
          Genera certificados eléctricos en minutos
        </h1>
        <p className="mt-4 text-lg text-surface-500 max-w-xl mx-auto">
          Motor de cálculo REBT completo. MTD, CIE, Solicitud BT y Esquema Unifilar automáticos.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        {checkoutError && (
          <div className="max-w-lg mx-auto mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 text-center">
            {checkoutError}
          </div>
        )}
        <div className="grid md:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const isLoading = loadingPlan === plan.key;

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.highlight
                    ? 'border-brand-600 shadow-lg shadow-brand-600/10 ring-1 ring-brand-600'
                    : 'border-surface-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold inline-flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-surface-900">{plan.name}</h3>
                  <p className="text-sm text-surface-500 mt-0.5">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-surface-900">{plan.price}</span>
                  <span className="text-surface-500 text-sm ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2 text-sm">
                      {f.warn ? (
                        <span className="text-amber-500 mt-0.5 flex-shrink-0 text-xs">&#9888;</span>
                      ) : (
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={f.warn ? 'text-amber-700' : 'text-surface-700'}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                {plan.note && (
                  <p className="text-xs text-brand-600 font-medium mb-4 bg-brand-50 rounded-lg p-2.5 leading-relaxed">
                    {plan.note}
                  </p>
                )}

                {plan.key === 'FREE' ? (
                  isCurrent ? (
                    <button
                      disabled
                      className="block w-full text-center py-2.5 rounded-lg font-medium text-sm bg-surface-100 text-surface-400 cursor-not-allowed"
                    >
                      Plan actual
                    </button>
                  ) : (
                    <a
                      href="/register"
                      className="block w-full text-center py-2.5 rounded-lg font-medium text-sm bg-surface-100 text-surface-700 hover:bg-surface-200 transition-colors"
                    >
                      Empezar gratis
                    </a>
                  )
                ) : isCurrent ? (
                  <button
                    disabled
                    className="block w-full text-center py-2.5 rounded-lg font-medium text-sm bg-surface-100 text-surface-400 cursor-not-allowed"
                  >
                    Plan actual
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.priceId!, plan.key)}
                    disabled={isLoading}
                    className={`block w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      plan.highlight
                        ? 'bg-brand-600 text-white hover:bg-brand-500'
                        : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                    } disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirigiendo...
                      </span>
                    ) : (
                      getButtonLabel(plan)
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Tax note */}
      <div className="text-center pb-12">
        <p className="text-xs text-surface-400">
          Precios sin IVA. Se aplicará 21% de IVA en el checkout.
        </p>
      </div>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-surface-900 text-center mb-8">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-surface-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-surface-900">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-surface-400 transition-transform ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-surface-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-brand-600 flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-surface-900 text-sm">CIE Platform</span>
        </div>
        <p className="text-xs text-surface-500">DASO Ingenieros S.L.P.</p>
        <p className="text-xs text-surface-400 mt-1">Certificados de Instalación Eléctrica</p>
      </footer>
    </div>
  );
}
