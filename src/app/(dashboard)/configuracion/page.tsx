'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { tenantApi } from '@/lib/api-client';
import { User, Building2, Shield, Wrench, Save, Loader2, CheckCircle2, Pencil } from 'lucide-react';

const TIPOS_VIA = [
  'CALLE','ACCESO','ALAMEDA','AVENIDA','BAJADA','BULEVAR','CAMINO','CARRETERA',
  'GLORIETA','GRAN VIA','PARQUE','PASAJE','PASEO','PLAZA','RONDA','TRAVESIA',
];

const CATEGORIAS = ['Básica', 'Especialista'];

const DISTRIBUIDORAS = [
  '0021 I-DE REDES ELÉCTRICAS INTELIGENTES',
  '0022 UFD DISTRIBUCIÓN ELECTRICIDAD',
  '0026 HIDROCANTÁBRICO DISTRIBUCIÓN ELÉCTRICA',
  '0483 DISTRIBUCIÓN ELÉCTRICA DEL TAJUÑA',
  '0494 DISTRIBUCIÓN ELÉCTRICA EL POZO DEL TIO RAIMUNDO, S.L.U',
  '0314 HIDROELÉCTRICA VEGA, S.A.',
];

const inputCls = 'h-9 rounded-md border border-surface-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full';
const selectCls = 'h-9 rounded-md border border-surface-300 bg-white px-2 text-sm w-full';
const labelCls = 'text-xs text-surface-500 mb-1 block';

export default function ConfiguracionPage() {
  const { user } = useAuth();

  const [empresa, setEmpresa] = useState<Record<string, any>>({});
  const [empresaDirty, setEmpresaDirty] = useState(false);
  const [empresaSaving, setEmpresaSaving] = useState(false);
  const [empresaSaved, setEmpresaSaved] = useState(false);

  const [installers, setInstallers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [installerSaving, setInstallerSaving] = useState(false);

  useEffect(() => {
    tenantApi.getProfile()
      .then((data) => {
        setEmpresa({
          empresaNif: data.empresaNif ?? '',
          empresaNombre: data.empresaNombre ?? '',
          empresaCategoria: data.empresaCategoria ?? '',
          empresaRegNum: data.empresaRegNum ?? '',
          empresaTipoVia: data.empresaTipoVia ?? '',
          empresaNombreVia: data.empresaNombreVia ?? '',
          empresaNumero: data.empresaNumero ?? '',
          empresaLocalidad: data.empresaLocalidad ?? '',
          empresaProvincia: data.empresaProvincia ?? '',
          empresaCp: data.empresaCp ?? '',
          empresaTelefono: data.empresaTelefono ?? '',
          empresaMovil: data.empresaMovil ?? '',
          empresaEmail: data.empresaEmail ?? '',
          distribuidoraHab: data.distribuidoraHab ?? '',
        });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    tenantApi.getInstallers().then(setInstallers).catch(console.error);
  }, []);

  const setE = (k: string, v: string) => {
    setEmpresa((prev) => ({ ...prev, [k]: v }));
    setEmpresaDirty(true);
  };

  const saveEmpresa = async () => {
    setEmpresaSaving(true);
    try {
      const body: Record<string, any> = {};
      for (const [k, v] of Object.entries(empresa)) {
        body[k] = v === '' ? null : v;
      }
      await tenantApi.updateProfile(body);
      setEmpresaDirty(false);
      setEmpresaSaved(true);
      setTimeout(() => setEmpresaSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setEmpresaSaving(false);
    }
  };

  const startEdit = (inst: any) => {
    setEditingId(inst.id);
    setEditData({
      instaladorNombre: inst.instaladorNombre ?? inst.name ?? '',
      instaladorNif: inst.instaladorNif ?? '',
      instaladorCertNum: inst.instaladorCertNum ?? '',
    });
  };

  const saveInstaller = async () => {
    if (!editingId) return;
    setInstallerSaving(true);
    try {
      const updated = await tenantApi.updateInstaller(editingId, editData);
      setInstallers((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
      setEditingId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setInstallerSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Configuración</h1>
        <p className="mt-0.5 text-sm text-surface-500">Gestiona tu cuenta, empresa e instaladores</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle>Mi perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-surface-500">Nombre</p>
              <p className="text-sm font-medium text-surface-900">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Email</p>
              <p className="text-sm font-medium text-surface-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Rol</p>
              <Badge variant="secondary" className="mt-0.5">
                {user?.role === 'OPERATOR' ? 'Operador' : user?.role === 'SIGNER' ? 'Firmante' : 'Administrador'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle>Seguridad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-surface-500">Cambio de contraseña disponible próximamente.</p>
          </CardContent>
        </Card>
      </div>

      {/* EMPRESA INSTALADORA */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Empresa Instaladora</CardTitle>
            <p className="text-xs text-surface-500 mt-0.5">Estos datos se auto-rellenarán en cada nuevo expediente</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>NIF empresa</label>
              <input className={inputCls} value={empresa.empresaNif ?? ''} onChange={(e) => setE('empresaNif', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Nombre / Razón Social</label>
              <input className={inputCls} value={empresa.empresaNombre ?? ''} onChange={(e) => setE('empresaNombre', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Categoría</label>
              <select className={selectCls} value={empresa.empresaCategoria ?? ''} onChange={(e) => setE('empresaCategoria', e.target.value)}>
                <option value="">Seleccionar...</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Nº Registro Industrial</label>
              <input className={inputCls} value={empresa.empresaRegNum ?? ''} onChange={(e) => setE('empresaRegNum', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Distribuidora habitual</label>
              <select className={selectCls} value={empresa.distribuidoraHab ?? ''} onChange={(e) => setE('distribuidoraHab', e.target.value)}>
                <option value="">Seleccionar...</option>
                {DISTRIBUIDORAS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Tipo vía</label>
              <select className={selectCls} value={empresa.empresaTipoVia ?? ''} onChange={(e) => setE('empresaTipoVia', e.target.value)}>
                <option value="">Seleccionar...</option>
                {TIPOS_VIA.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Nombre vía</label>
              <input className={inputCls} value={empresa.empresaNombreVia ?? ''} onChange={(e) => setE('empresaNombreVia', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Nº</label>
              <input className={inputCls} value={empresa.empresaNumero ?? ''} onChange={(e) => setE('empresaNumero', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Localidad</label>
              <input className={inputCls} value={empresa.empresaLocalidad ?? ''} onChange={(e) => setE('empresaLocalidad', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Provincia</label>
              <input className={inputCls} value={empresa.empresaProvincia ?? ''} onChange={(e) => setE('empresaProvincia', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>C.P.</label>
              <input className={inputCls} value={empresa.empresaCp ?? ''} onChange={(e) => setE('empresaCp', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Teléfono</label>
              <input className={inputCls} value={empresa.empresaTelefono ?? ''} onChange={(e) => setE('empresaTelefono', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Móvil</label>
              <input className={inputCls} value={empresa.empresaMovil ?? ''} onChange={(e) => setE('empresaMovil', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Correo-e</label>
              <input className={inputCls} value={empresa.empresaEmail ?? ''} onChange={(e) => setE('empresaEmail', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-surface-200 pt-4">
            <Button size="sm" onClick={saveEmpresa} disabled={empresaSaving || !empresaDirty}>
              {empresaSaving ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Guardando…</> :
               empresaSaved ? <><CheckCircle2 className="mr-2 h-3 w-3 text-emerald-500" />Guardado</> :
               <><Save className="mr-2 h-3 w-3" />Guardar empresa</>}
            </Button>
            {empresaDirty && <span className="text-xs text-amber-600">Cambios sin guardar</span>}
          </div>
        </CardContent>
      </Card>

      {/* INSTALADORES */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
            <Wrench className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Instaladores / Técnicos</CardTitle>
            <p className="text-xs text-surface-500 mt-0.5">Personas que firman los certificados</p>
          </div>
        </CardHeader>
        <CardContent>
          {installers.length === 0 ? (
            <p className="text-sm text-surface-400">No hay instaladores registrados.</p>
          ) : (
            <div className="space-y-3">
              {installers.map((inst) => (
                <div key={inst.id} className="rounded-lg border border-surface-200 p-3">
                  {editingId === inst.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls}>Nombre completo</label>
                          <input className={inputCls} value={editData.instaladorNombre ?? ''} onChange={(e) => setEditData((p) => ({ ...p, instaladorNombre: e.target.value }))} />
                        </div>
                        <div>
                          <label className={labelCls}>NIF</label>
                          <input className={inputCls} value={editData.instaladorNif ?? ''} onChange={(e) => setEditData((p) => ({ ...p, instaladorNif: e.target.value }))} />
                        </div>
                        <div>
                          <label className={labelCls}>Nº Certificado</label>
                          <input className={inputCls} value={editData.instaladorCertNum ?? ''} onChange={(e) => setEditData((p) => ({ ...p, instaladorCertNum: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveInstaller} disabled={installerSaving}>
                          {installerSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="mr-1 h-3 w-3" />Guardar</>}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm font-medium text-surface-900">{inst.instaladorNombre || inst.name}</p>
                          <p className="text-xs text-surface-500">{inst.email}</p>
                        </div>
                        {inst.instaladorNif && <span className="text-xs text-surface-400">NIF: {inst.instaladorNif}</span>}
                        {inst.instaladorCertNum && <span className="text-xs text-surface-400">Cert: {inst.instaladorCertNum}</span>}
                        <Badge variant="secondary" className="text-xs">
                          {inst.role === 'OPERATOR' ? 'Operador' : inst.role === 'SIGNER' ? 'Firmante' : 'Admin'}
                        </Badge>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(inst)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
