'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingApi } from '@/lib/api-client';
import { Zap, Building2, HardHat, Gift, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [saving, setSaving] = useState(false);

  // Step 1: Company
  const [company, setCompany] = useState({
    empresaNif: '',
    empresaNombre: '',
    empresaNombreVia: '',
    empresaLocalidad: '',
    empresaProvincia: '',
    empresaTelefono: '',
    empresaEmail: '',
  });

  // Step 2: Installer
  const [installer, setInstaller] = useState({
    instaladorNombre: '',
    instaladorNif: '',
    instaladorCertNum: '',
    empresaCategoria: '',
  });

  const goTo = (s: Step, dir: 'next' | 'prev') => {
    setDirection(dir);
    setStep(s);
  };

  const saveStep1 = async () => {
    setSaving(true);
    try {
      const data = Object.fromEntries(
        Object.entries(company).filter(([, v]) => v.trim() !== ''),
      );
      if (Object.keys(data).length > 0) {
        await onboardingApi.saveCompany(data);
      }
      goTo(2, 'next');
    } catch { /* continue */ }
    finally { setSaving(false); }
  };

  const saveStep2 = async () => {
    setSaving(true);
    try {
      const data = Object.fromEntries(
        Object.entries(installer).filter(([, v]) => v.trim() !== ''),
      );
      if (Object.keys(data).length > 0) {
        await onboardingApi.saveInstaller(data);
      }
      goTo(3, 'next');
    } catch { /* continue */ }
    finally { setSaving(false); }
  };

  const complete = async () => {
    setSaving(true);
    try {
      await onboardingApi.complete();
      router.push('/');
    } catch { router.push('/'); }
    finally { setSaving(false); }
  };

  const inputCls =
    'w-full px-3 py-2.5 rounded-lg bg-white border border-surface-300 text-surface-900 placeholder-surface-400 text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-colors';

  const steps = [
    { num: 1, label: 'Empresa', icon: Building2 },
    { num: 2, label: 'Instalador', icon: HardHat },
    { num: 3, label: 'Tu plan', icon: Gift },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  step === s.num
                    ? 'bg-brand-600 text-white'
                    : step > s.num
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-surface-100 text-surface-400'
                }`}
              >
                {step > s.num ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <s.icon className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.num}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${step > s.num ? 'bg-emerald-300' : 'bg-surface-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white border border-surface-200 rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Step 1: Company */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-surface-900 mb-1">Datos de tu empresa</h2>
              <p className="text-sm text-surface-500 mb-6">
                Estos datos se usarán en tus certificados. Puedes completarlos después.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-surface-600 mb-1">NIF/CIF</label>
                    <input className={inputCls} placeholder="B12345678" value={company.empresaNif} onChange={(e) => setCompany({ ...company, empresaNif: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-600 mb-1">Nombre empresa</label>
                    <input className={inputCls} placeholder="Instalaciones García S.L." value={company.empresaNombre} onChange={(e) => setCompany({ ...company, empresaNombre: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-surface-600 mb-1">Dirección</label>
                  <input className={inputCls} placeholder="Calle Mayor, 1" value={company.empresaNombreVia} onChange={(e) => setCompany({ ...company, empresaNombreVia: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-surface-600 mb-1">Localidad</label>
                    <input className={inputCls} placeholder="Madrid" value={company.empresaLocalidad} onChange={(e) => setCompany({ ...company, empresaLocalidad: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-600 mb-1">Provincia</label>
                    <input className={inputCls} placeholder="Madrid" value={company.empresaProvincia} onChange={(e) => setCompany({ ...company, empresaProvincia: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-surface-600 mb-1">Teléfono</label>
                    <input className={inputCls} placeholder="912345678" value={company.empresaTelefono} onChange={(e) => setCompany({ ...company, empresaTelefono: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-600 mb-1">Email empresa</label>
                    <input className={inputCls} type="email" placeholder="info@empresa.com" value={company.empresaEmail} onChange={(e) => setCompany({ ...company, empresaEmail: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => goTo(2, 'next')}
                  className="text-sm text-surface-400 hover:text-surface-600 transition-colors"
                >
                  Saltar
                </button>
                <button
                  onClick={saveStep1}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-500 disabled:opacity-40 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Installer */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-surface-900 mb-1">Datos del instalador</h2>
              <p className="text-sm text-surface-500 mb-6">
                Estos datos aparecerán en el CIE y la Solicitud BT.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-surface-600 mb-1">Nombre completo</label>
                  <input className={inputCls} placeholder="Juan García López" value={installer.instaladorNombre} onChange={(e) => setInstaller({ ...installer, instaladorNombre: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-surface-600 mb-1">NIF instalador</label>
                    <input className={inputCls} placeholder="12345678A" value={installer.instaladorNif} onChange={(e) => setInstaller({ ...installer, instaladorNif: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm text-surface-600 mb-1">N.º registro industrial</label>
                    <input className={inputCls} placeholder="RI-001234" value={installer.instaladorCertNum} onChange={(e) => setInstaller({ ...installer, instaladorCertNum: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-surface-600 mb-1">Categoría instalador</label>
                  <select
                    className={inputCls}
                    value={installer.empresaCategoria}
                    onChange={(e) => setInstaller({ ...installer, empresaCategoria: e.target.value })}
                  >
                    <option value="">Selecciona categoría</option>
                    <option value="Básica">Básica</option>
                    <option value="Especialista">Especialista</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => goTo(1, 'prev')}
                    className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    onClick={() => goTo(3, 'next')}
                    className="text-sm text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    Saltar
                  </button>
                </div>
                <button
                  onClick={saveStep2}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-500 disabled:opacity-40 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Plan summary */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-surface-900 mb-1">Tu plan</h2>
              <p className="text-sm text-surface-500 mb-6">
                Empiezas con el plan Free. Puedes mejorar en cualquier momento.
              </p>

              <div className="bg-surface-50 border border-surface-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900">Plan Free</h3>
                    <p className="text-sm text-surface-500">0€ — para siempre</p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-surface-700">Motor de cálculo REBT completo (13 ITCs)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-surface-700">Generación MTD, CIE, Solicitud BT</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-surface-700">Esquema unifilar automático</span>
                  </li>
                  <li className="flex items-start gap-2 text-amber-600">
                    <span className="mt-0.5 flex-shrink-0">⚠️</span>
                    <span>Límite: 2 certificados totales</span>
                  </li>
                  <li className="flex items-start gap-2 text-amber-600">
                    <span className="mt-0.5 flex-shrink-0">⚠️</span>
                    <span>Marca de agua en documentos</span>
                  </li>
                </ul>

                <a
                  href="/pricing"
                  className="inline-block mt-4 text-sm font-medium text-brand-600 hover:text-brand-500 transition-colors"
                >
                  Ver planes Pro y Empresa →
                </a>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => goTo(2, 'prev')}
                  className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  onClick={complete}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm hover:bg-brand-500 disabled:opacity-40 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Empezar gratis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
