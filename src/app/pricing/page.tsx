'use client';

import { Zap, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface PlanFeature {
  text: string;
  included: boolean;
  warn?: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  ctaHref: string;
  highlight: boolean;
  badge?: string;
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '0€',
    period: 'para siempre',
    description: 'Ideal para probar la plataforma',
    cta: 'Empezar gratis',
    ctaHref: '/register',
    highlight: false,
    features: [
      { text: 'Motor cálculo REBT (13 ITCs)', included: true },
      { text: 'Generación MTD PDF', included: true },
      { text: 'Generación CIE Excel', included: true },
      { text: 'Solicitud BT Word', included: true },
      { text: 'Esquema Unifilar SVG', included: true },
      { text: '2 certificados totales', included: false, warn: true },
      { text: 'Marca de agua en documentos', included: false, warn: true },
    ],
  },
  {
    name: 'Pro',
    price: '19€',
    period: '/mes',
    description: 'Para instaladores autónomos',
    cta: 'Suscribirse',
    ctaHref: '/register',
    highlight: true,
    badge: 'Popular',
    features: [
      { text: 'Todo lo de Free', included: true },
      { text: 'Certificados ilimitados', included: true },
      { text: 'Sin marca de agua', included: true },
      { text: 'Export PDF, DXF, SVG', included: true },
      { text: 'Datos empresa/instalador en docs', included: true },
    ],
  },
  {
    name: 'Empresa',
    price: '49€',
    period: '/mes',
    description: 'Para equipos y empresas',
    cta: 'Suscribirse',
    ctaHref: '/register',
    highlight: false,
    features: [
      { text: 'Todo lo de Pro', included: true },
      { text: 'Hasta 3 usuarios', included: true },
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
    q: '¿Cómo funciona el motor de cálculo?',
    a: 'El motor aplica automáticamente el REBT completo: secciones, protecciones, caídas de tensión, diferenciales y esquema unifilar. Solo introduces los datos de la instalación y el motor genera toda la documentación.',
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí. No hay permanencia ni penalización. Puedes cancelar tu suscripción desde el panel de facturación y seguirás teniendo acceso hasta fin del periodo pagado.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus datos e instalaciones se conservan. Si vuelves al plan Free, mantendrás acceso de lectura a todo lo generado. Si mejoras de nuevo, todo estará donde lo dejaste.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <a href="/login" className="text-sm text-surface-600 hover:text-surface-900 transition-colors">
              Iniciar sesión
            </a>
            <a
              href="/register"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors"
            >
              Empezar gratis
            </a>
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
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'border-brand-600 shadow-lg shadow-brand-600/10 ring-1 ring-brand-600'
                  : 'border-surface-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold">
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

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm">
                    {f.warn ? (
                      <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠️</span>
                    ) : (
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={f.warn ? 'text-amber-700' : 'text-surface-700'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaHref}
                className={`block w-full text-center py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-brand-600 text-white hover:bg-brand-500'
                    : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

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
