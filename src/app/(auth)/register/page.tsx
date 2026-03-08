'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email no válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  tenantName: z.string().optional(),
  acceptedPrivacy: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar la política de privacidad' }),
  }),
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
    defaultValues: { acceptedPrivacy: false as any },
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
      router.push('/');
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

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-brand-950 p-10 text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              CIE Platform
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight text-balance">
            Empieza a generar
            <br />
            certificados hoy.
          </h1>
          <p className="text-base text-brand-200 leading-relaxed max-w-sm">
            Regístrate gratis y genera tu primer CIE en minutos.
            Sin tarjeta de crédito.
          </p>
        </div>

        <p className="text-sm text-brand-400">
          DASO Ingenieros © {new Date().getFullYear()}
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">
              CIE Platform
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900">
              Crear cuenta
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Rellena tus datos para empezar
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-fade-in">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan García"
                autoComplete="name"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenantName">Nombre de empresa <span className="text-slate-400">(opcional)</span></Label>
              <Input
                id="tenantName"
                type="text"
                placeholder="Instalaciones García S.L."
                {...register('tenantName')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mín. 8 caracteres"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* RGPD Checkbox */}
            <div className="space-y-1.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  {...register('acceptedPrivacy')}
                />
                <span className="text-sm text-slate-600 leading-snug">
                  He leído y acepto la{' '}
                  <a
                    href="/privacidad"
                    target="_blank"
                    className="font-medium text-brand-600 hover:text-brand-700 underline"
                  >
                    Política de Privacidad
                  </a>{' '}
                  y el tratamiento de mis datos personales conforme al RGPD.
                </span>
              </label>
              {errors.acceptedPrivacy && (
                <p className="text-xs text-red-500">{errors.acceptedPrivacy.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta…
                </>
              ) : (
                'Crear cuenta'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <a
              href="/login"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
