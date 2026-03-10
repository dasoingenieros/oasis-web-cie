'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { Zap, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email no válido'),
  tenantName: z.string().optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  acceptedTos: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los Términos y Condiciones' }),
  }),
  acceptedPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la Política de Privacidad' }),
  }),
  acceptedCompetence: z.literal(true, {
    errorMap: () => ({ message: 'Debes declarar tu habilitación profesional' }),
  }),
  acceptedMarketing: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptedTos: false as any, acceptedPrivacy: false as any, acceptedCompetence: false as any, acceptedMarketing: false },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        tenantName: data.tenantName,
        acceptedPrivacy: true,
      });
      // Redirect to check-email screen instead of auto-login
      router.push(`/check-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      if (Array.isArray(message)) {
        setError(message[0] ?? 'Error al crear la cuenta');
      } else {
        setError(typeof message === 'string' ? message : 'Error al crear la cuenta');
      }
    }
  };

  const inputCls =
    'w-full px-3 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-white placeholder-surface-500 text-sm focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-semibold text-white tracking-tight">CIE Platform</span>
          </div>
          <p className="text-surface-500 text-sm">Crea tu cuenta para empezar</p>
        </div>

        {/* Form */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white font-medium text-lg mb-6">Crear cuenta</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-surface-400 mb-1.5">Nombre completo</label>
              <input className={inputCls} placeholder="Juan García" autoComplete="name" {...register('name')} />
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-surface-400 mb-1.5">Email</label>
              <input className={inputCls} type="email" placeholder="tu@email.com" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-surface-400 mb-1.5">
                Nombre de empresa <span className="text-surface-600">(opcional)</span>
              </label>
              <input className={inputCls} placeholder="Instalaciones García S.L." {...register('tenantName')} />
            </div>

            <div>
              <label className="block text-sm text-surface-400 mb-1.5">Contraseña</label>
              <input className={inputCls} type="password" placeholder="Mín. 8 caracteres" autoComplete="new-password" {...register('password')} />
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-surface-400 mb-1.5">Confirmar contraseña</label>
              <input className={inputCls} type="password" placeholder="Repite la contraseña" autoComplete="new-password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {/* Legal checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-surface-700 bg-surface-800 text-brand-600 focus:ring-brand-600"
                  {...register('acceptedTos')}
                />
                <span className="text-sm text-surface-400 leading-snug">
                  He leído y acepto los{' '}
                  <a href="/legal/terminos" target="_blank" className="font-medium text-brand-400 hover:text-brand-300 underline">
                    Términos y Condiciones de Uso
                  </a>.
                </span>
              </label>
              {errors.acceptedTos && <p className="text-xs text-red-400 -mt-1 ml-7">{errors.acceptedTos.message}</p>}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-surface-700 bg-surface-800 text-brand-600 focus:ring-brand-600"
                  {...register('acceptedPrivacy')}
                />
                <span className="text-sm text-surface-400 leading-snug">
                  He leído y acepto la{' '}
                  <a href="/legal/privacidad" target="_blank" className="font-medium text-brand-400 hover:text-brand-300 underline">
                    Política de Privacidad
                  </a>.
                </span>
              </label>
              {errors.acceptedPrivacy && <p className="text-xs text-red-400 -mt-1 ml-7">{errors.acceptedPrivacy.message}</p>}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-surface-700 bg-surface-800 text-brand-600 focus:ring-brand-600"
                  {...register('acceptedCompetence')}
                />
                <span className="text-sm text-surface-400 leading-snug">
                  Declaro que soy técnico competente habilitado conforme al artículo 12 del REBT (RD 842/2002).
                </span>
              </label>
              {errors.acceptedCompetence && <p className="text-xs text-red-400 -mt-1 ml-7">{errors.acceptedCompetence.message}</p>}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-surface-700 bg-surface-800 text-brand-600 focus:ring-brand-600"
                  {...register('acceptedMarketing')}
                />
                <span className="text-sm text-surface-400 leading-snug">
                  Acepto recibir comunicaciones comerciales y novedades de DASO Ingenieros por correo electrónico.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-brand-600 text-white font-medium text-sm
                hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-surface-500 text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
