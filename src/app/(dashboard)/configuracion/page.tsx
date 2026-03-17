'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { tenantApi, teamApi, tramitacionApi } from '@/lib/api-client';
import type { Installer, Technician, TramitacionConfig } from '@/lib/types';
import { OCA_EICI_OPTIONS } from '@/lib/types';
import { TIPO_VIA_OPTIONS, PROVINCIA_OPTIONS, PROVINCIA_DEFAULT } from '@/lib/portal-constants';
import { LocalidadCombobox } from '@/components/localidad-combobox';
import {
  User, Building2, Shield, Wrench, Save, Loader2, CheckCircle2,
  Pencil, Trash2, Plus, Star, GraduationCap, X, Send, Eye, EyeOff, Wifi, XCircle,
  FileText, Upload, FileDown,
} from 'lucide-react';

const TIPOS_VIA = TIPO_VIA_OPTIONS;

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

// ─── Modal Component ────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface-100">
            <X className="h-5 w-5 text-surface-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  const { user } = useAuth();

  // Empresa state
  const [empresa, setEmpresa] = useState<Record<string, any>>({});
  const [empresaDirty, setEmpresaDirty] = useState(false);
  const [empresaSaving, setEmpresaSaving] = useState(false);
  const [empresaSaved, setEmpresaSaved] = useState(false);

  // Team state
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [teamTab, setTeamTab] = useState<'installers' | 'technicians'>('installers');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalType, setModalType] = useState<'installer' | 'technician'>('installer');
  const [modalData, setModalData] = useState<Record<string, any>>({});
  const [modalEditId, setModalEditId] = useState<string | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'installer' | 'technician'; id: string; nombre: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Portal ASEICAM state
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [portalEiciId, setPortalEiciId] = useState('');
  const [portalDirty, setPortalDirty] = useState(false);
  const [portalSaving, setPortalSaving] = useState(false);
  const [portalSaved, setPortalSaved] = useState(false);
  const [portalHasCredentials, setPortalHasCredentials] = useState(false);
  const [portalTesting, setPortalTesting] = useState(false);
  const [portalTestResult, setPortalTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Tenant documents state
  const [certEmpresaName, setCertEmpresaName] = useState<string | null>(null);
  const [anexoUsuarioName, setAnexoUsuarioName] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  // Load empresa
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
        setCertEmpresaName(data.certificadoEmpresaName ?? null);
        setAnexoUsuarioName(data.anexoUsuarioName ?? null);
      })
      .catch(console.error);

    // Load portal config
    tramitacionApi.getConfig()
      .then((cfg) => {
        setPortalHasCredentials(cfg.hasCredentials);
        setPortalEiciId(cfg.portalEiciId ?? '');
      })
      .catch(console.error);
  }, []);

  // Load team
  const loadTeam = useCallback(() => {
    teamApi.listInstallers().then(setInstallers).catch(console.error);
    teamApi.listTechnicians().then(setTechnicians).catch(console.error);
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

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

  // ─── Modal handlers ───────────────────────────────────────────────────────

  const openCreateModal = (type: 'installer' | 'technician') => {
    setModalType(type);
    setModalMode('create');
    setModalData(type === 'installer'
      ? { nombre: '', nif: '', certNum: '', categoria: '', isDefault: false }
      : { nombre: '', nif: '', titulacion: '', numColegiado: '', colegioOficial: '', telefono: '', email: '', direccion: '', localidad: '', provincia: '', cp: '', isDefault: false }
    );
    setModalEditId(null);
    setModalOpen(true);
  };

  const openEditModal = (type: 'installer' | 'technician', item: Installer | Technician) => {
    setModalType(type);
    setModalMode('edit');
    setModalEditId(item.id);
    if (type === 'installer') {
      const inst = item as Installer;
      setModalData({ nombre: inst.nombre, nif: inst.nif ?? '', certNum: inst.certNum ?? '', categoria: inst.categoria ?? '', isDefault: inst.isDefault });
    } else {
      const tech = item as Technician;
      setModalData({ nombre: tech.nombre, nif: tech.nif ?? '', titulacion: tech.titulacion ?? '', numColegiado: tech.numColegiado ?? '', colegioOficial: tech.colegioOficial ?? '', telefono: tech.telefono ?? '', email: tech.email ?? '', direccion: tech.direccion ?? '', localidad: tech.localidad ?? '', provincia: tech.provincia ?? '', cp: tech.cp ?? '', isDefault: tech.isDefault });
    }
    setModalOpen(true);
  };

  const saveModal = async () => {
    setModalSaving(true);
    try {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(modalData)) {
        clean[k] = v === '' ? undefined : v;
      }
      // nombre is required
      if (!clean.nombre) { setModalSaving(false); return; }

      if (modalType === 'installer') {
        if (modalMode === 'create') {
          const created = await teamApi.createInstaller(clean as any);
          setInstallers((prev) => clean.isDefault ? [created, ...prev.map((i) => ({ ...i, isDefault: false }))] : [...prev, created]);
        } else {
          const updated = await teamApi.updateInstaller(modalEditId!, clean as any);
          setInstallers((prev) => prev.map((i) => i.id === modalEditId ? updated : clean.isDefault ? { ...i, isDefault: false } : i));
        }
      } else {
        if (modalMode === 'create') {
          const created = await teamApi.createTechnician(clean as any);
          setTechnicians((prev) => clean.isDefault ? [created, ...prev.map((t) => ({ ...t, isDefault: false }))] : [...prev, created]);
        } else {
          const updated = await teamApi.updateTechnician(modalEditId!, clean as any);
          setTechnicians((prev) => prev.map((t) => t.id === modalEditId ? updated : clean.isDefault ? { ...t, isDefault: false } : t));
        }
      }
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setModalSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'installer') {
        await teamApi.deleteInstaller(deleteTarget.id);
        setInstallers((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      } else {
        await teamApi.deleteTechnician(deleteTarget.id);
        setTechnicians((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Portal handlers ─────────────────────────────────────────────────────

  const savePortal = async () => {
    setPortalSaving(true);
    try {
      const dto: Record<string, string> = {};
      if (portalUsername) dto.portalUsername = portalUsername;
      if (portalPassword) dto.portalPassword = portalPassword;
      if (portalEiciId) {
        dto.portalEiciId = portalEiciId;
        dto.portalEiciName = OCA_EICI_OPTIONS.find((o) => o.value === portalEiciId)?.label ?? '';
      }
      await tramitacionApi.updateConfig(dto);
      setPortalDirty(false);
      setPortalSaved(true);
      setPortalHasCredentials(true);
      setPortalPassword('');
      setTimeout(() => setPortalSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setPortalSaving(false);
    }
  };

  const testPortal = async () => {
    setPortalTesting(true);
    setPortalTestResult(null);
    try {
      const result = await tramitacionApi.testConexion();
      setPortalTestResult(result);
    } catch (err: any) {
      setPortalTestResult({ success: false, message: err?.response?.data?.message || 'Error de conexión' });
    } finally {
      setPortalTesting(false);
    }
  };

  const setDefault = async (type: 'installer' | 'technician', id: string) => {
    try {
      if (type === 'installer') {
        const updated = await teamApi.updateInstaller(id, { isDefault: true });
        setInstallers((prev) => prev.map((i) => i.id === id ? updated : { ...i, isDefault: false }));
      } else {
        const updated = await teamApi.updateTechnician(id, { isDefault: true });
        setTechnicians((prev) => prev.map((t) => t.id === id ? updated : { ...t, isDefault: false }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Configuración</h1>
        <p className="mt-0.5 text-sm text-surface-500">Gestiona tu cuenta, empresa y equipo</p>
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
                {TIPOS_VIA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
              <LocalidadCombobox value={empresa.empresaLocalidad ?? ''} onChange={(v) => setE('empresaLocalidad', v)} />
            </div>
            <div>
              <label className={labelCls}>Provincia</label>
              <select className={selectCls} value={empresa.empresaProvincia ?? ''} onChange={(e) => setE('empresaProvincia', e.target.value)}>
                <option value="">Seleccionar...</option>
                {PROVINCIA_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
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

      {/* DOCUMENTOS DE EMPRESA */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Documentos de empresa</CardTitle>
            <p className="text-xs text-surface-500 mt-0.5">Certificado de empresa instaladora y anexo del usuario</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Certificado empresa */}
          <div className="flex items-center justify-between rounded-lg border border-surface-200 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-surface-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-surface-700">Certificado de empresa</p>
                {certEmpresaName ? (
                  <p className="text-xs text-surface-500 truncate">{certEmpresaName}</p>
                ) : (
                  <p className="text-xs text-surface-400">No subido</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {certEmpresaName ? (
                <>
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      const blob = await tenantApi.downloadCertificadoEmpresa();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a'); link.href = url; link.download = certEmpresaName;
                      document.body.appendChild(link); link.click(); document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (e) { console.error(e); }
                  }}>
                    <FileDown className="mr-1 h-3 w-3" />Descargar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    disabled={deletingDoc === 'cert'}
                    onClick={async () => {
                      setDeletingDoc('cert');
                      try { await tenantApi.deleteCertificadoEmpresa(); setCertEmpresaName(null); } catch (e) { console.error(e); }
                      finally { setDeletingDoc(null); }
                    }}>
                    {deletingDoc === 'cert' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </>
              ) : (
                <label className="cursor-pointer">
                  <input type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { alert('El archivo no puede superar 10 MB'); return; }
                    setUploadingDoc('cert');
                    try {
                      const res = await tenantApi.uploadCertificadoEmpresa(file);
                      setCertEmpresaName(res.certificadoEmpresaName ?? file.name);
                    } catch (err) { console.error(err); }
                    finally { setUploadingDoc(null); e.target.value = ''; }
                  }} />
                  <Button size="sm" asChild disabled={uploadingDoc === 'cert'}>
                    <span>{uploadingDoc === 'cert' ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}Subir PDF</span>
                  </Button>
                </label>
              )}
            </div>
          </div>

          {/* Anexo usuario */}
          <div className="flex items-center justify-between rounded-lg border border-surface-200 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-surface-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-surface-700">Anexo del usuario</p>
                {anexoUsuarioName ? (
                  <p className="text-xs text-surface-500 truncate">{anexoUsuarioName}</p>
                ) : (
                  <p className="text-xs text-surface-400">No subido</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {anexoUsuarioName ? (
                <>
                  <Button size="sm" variant="outline" onClick={async () => {
                    try {
                      const blob = await tenantApi.downloadAnexoUsuario();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a'); link.href = url; link.download = anexoUsuarioName;
                      document.body.appendChild(link); link.click(); document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (e) { console.error(e); }
                  }}>
                    <FileDown className="mr-1 h-3 w-3" />Descargar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    disabled={deletingDoc === 'anexo'}
                    onClick={async () => {
                      setDeletingDoc('anexo');
                      try { await tenantApi.deleteAnexoUsuario(); setAnexoUsuarioName(null); } catch (e) { console.error(e); }
                      finally { setDeletingDoc(null); }
                    }}>
                    {deletingDoc === 'anexo' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </>
              ) : (
                <label className="cursor-pointer">
                  <input type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) { alert('El archivo no puede superar 10 MB'); return; }
                    setUploadingDoc('anexo');
                    try {
                      const res = await tenantApi.uploadAnexoUsuario(file);
                      setAnexoUsuarioName(res.anexoUsuarioName ?? file.name);
                    } catch (err) { console.error(err); }
                    finally { setUploadingDoc(null); e.target.value = ''; }
                  }} />
                  <Button size="sm" asChild disabled={uploadingDoc === 'anexo'}>
                    <span>{uploadingDoc === 'anexo' ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}Subir PDF</span>
                  </Button>
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PORTAL DEL INSTALADOR (ASEICAM) */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <Send className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Portal del Instalador (ASEICAM)</CardTitle>
            <p className="text-xs text-surface-500 mt-0.5">Credenciales para tramitación automática de solicitudes</p>
          </div>
          {portalHasCredentials && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />Configurado
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Usuario del portal</label>
              <input
                className={inputCls}
                value={portalUsername}
                onChange={(e) => { setPortalUsername(e.target.value); setPortalDirty(true); }}
                placeholder={portalHasCredentials ? '••••••••' : 'Tu usuario ASEICAM'}
                autoComplete="off"
              />
            </div>
            <div>
              <label className={labelCls}>Contraseña del portal</label>
              <div className="relative">
                <input
                  className={inputCls}
                  type={showPassword ? 'text' : 'password'}
                  value={portalPassword}
                  onChange={(e) => { setPortalPassword(e.target.value); setPortalDirty(true); }}
                  placeholder={portalHasCredentials ? '••••••••' : 'Tu contraseña'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>OCA / EICI preferida</label>
            <select
              className={selectCls}
              value={portalEiciId}
              onChange={(e) => { setPortalEiciId(e.target.value); setPortalDirty(true); }}
            >
              <option value="">Seleccionar EICI...</option>
              {OCA_EICI_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Test result */}
          {portalTestResult && (
            <div className={`rounded-lg border p-3 flex items-center gap-2 ${
              portalTestResult.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              {portalTestResult.success
                ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                : <XCircle className="h-4 w-4 flex-shrink-0" />}
              <p className="text-sm">{portalTestResult.message}</p>
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-surface-200 pt-4">
            <Button size="sm" onClick={savePortal} disabled={portalSaving || !portalDirty}>
              {portalSaving ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Guardando...</> :
               portalSaved ? <><CheckCircle2 className="mr-2 h-3 w-3 text-emerald-500" />Guardado</> :
               <><Save className="mr-2 h-3 w-3" />Guardar credenciales</>}
            </Button>
            <Button size="sm" variant="outline" onClick={testPortal} disabled={portalTesting || !portalHasCredentials}>
              {portalTesting ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Probando...</> :
               <><Wifi className="mr-2 h-3 w-3" />Probar conexión</>}
            </Button>
            {portalDirty && <span className="text-xs text-amber-600">Cambios sin guardar</span>}
          </div>
        </CardContent>
      </Card>

      {/* EQUIPO: INSTALADORES Y TÉCNICOS */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
            <Wrench className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Equipo</CardTitle>
            <p className="text-xs text-surface-500 mt-0.5">Instaladores autorizados y técnicos que firman documentos</p>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="mb-4 flex items-center gap-1 border-b border-surface-200">
            <button
              onClick={() => setTeamTab('installers')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                teamTab === 'installers'
                  ? 'border-violet-500 text-violet-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              <Wrench className="h-4 w-4" />
              Instaladores
              <Badge variant="secondary" className="ml-1 text-xs">{installers.length}</Badge>
            </button>
            <button
              onClick={() => setTeamTab('technicians')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                teamTab === 'technicians'
                  ? 'border-violet-500 text-violet-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Técnicos
              <Badge variant="secondary" className="ml-1 text-xs">{technicians.length}</Badge>
            </button>
          </div>

          {/* Installers Tab */}
          {teamTab === 'installers' && (
            <div className="space-y-3">
              {installers.length === 0 ? (
                <p className="text-sm text-surface-400 py-4 text-center">No hay instaladores registrados.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-surface-200">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-50 text-left text-xs text-surface-500">
                      <tr>
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">NIF</th>
                        <th className="px-3 py-2">Nº Certificado</th>
                        <th className="px-3 py-2">Categoría</th>
                        <th className="px-3 py-2 text-center">Principal</th>
                        <th className="px-3 py-2 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {installers.map((inst) => (
                        <tr key={inst.id} className="hover:bg-surface-50">
                          <td className="px-3 py-2.5 font-medium text-surface-900">{inst.nombre}</td>
                          <td className="px-3 py-2.5 text-surface-600">{inst.nif || '—'}</td>
                          <td className="px-3 py-2.5 text-surface-600">{inst.certNum || '—'}</td>
                          <td className="px-3 py-2.5 text-surface-600">{inst.categoria || '—'}</td>
                          <td className="px-3 py-2.5 text-center">
                            {inst.isDefault ? (
                              <Star className="mx-auto h-4 w-4 fill-amber-400 text-amber-400" />
                            ) : (
                              <button onClick={() => setDefault('installer', inst.id)} className="mx-auto block rounded p-0.5 hover:bg-amber-50" title="Marcar como principal">
                                <Star className="h-4 w-4 text-surface-300 hover:text-amber-400" />
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditModal('installer', inst)} className="rounded p-1 hover:bg-surface-100" title="Editar">
                                <Pencil className="h-3.5 w-3.5 text-surface-400" />
                              </button>
                              <button onClick={() => setDeleteTarget({ type: 'installer', id: inst.id, nombre: inst.nombre })} className="rounded p-1 hover:bg-red-50" title="Eliminar">
                                <Trash2 className="h-3.5 w-3.5 text-surface-400 hover:text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => openCreateModal('installer')}>
                <Plus className="mr-2 h-3.5 w-3.5" />Añadir instalador
              </Button>
            </div>
          )}

          {/* Technicians Tab */}
          {teamTab === 'technicians' && (
            <div className="space-y-3">
              {technicians.length === 0 ? (
                <p className="text-sm text-surface-400 py-4 text-center">No hay técnicos registrados.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-surface-200">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-50 text-left text-xs text-surface-500">
                      <tr>
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">NIF</th>
                        <th className="px-3 py-2">Titulación</th>
                        <th className="px-3 py-2">Nº Colegiado</th>
                        <th className="px-3 py-2">Colegio</th>
                        <th className="px-3 py-2 text-center">Principal</th>
                        <th className="px-3 py-2 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {technicians.map((tech) => (
                        <tr key={tech.id} className="hover:bg-surface-50">
                          <td className="px-3 py-2.5 font-medium text-surface-900">{tech.nombre}</td>
                          <td className="px-3 py-2.5 text-surface-600">{tech.nif || '—'}</td>
                          <td className="px-3 py-2.5 text-surface-600">{tech.titulacion || '—'}</td>
                          <td className="px-3 py-2.5 text-surface-600">{tech.numColegiado || '—'}</td>
                          <td className="px-3 py-2.5 text-surface-600">{tech.colegioOficial || '—'}</td>
                          <td className="px-3 py-2.5 text-center">
                            {tech.isDefault ? (
                              <Star className="mx-auto h-4 w-4 fill-amber-400 text-amber-400" />
                            ) : (
                              <button onClick={() => setDefault('technician', tech.id)} className="mx-auto block rounded p-0.5 hover:bg-amber-50" title="Marcar como principal">
                                <Star className="h-4 w-4 text-surface-300 hover:text-amber-400" />
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditModal('technician', tech)} className="rounded p-1 hover:bg-surface-100" title="Editar">
                                <Pencil className="h-3.5 w-3.5 text-surface-400" />
                              </button>
                              <button onClick={() => setDeleteTarget({ type: 'technician', id: tech.id, nombre: tech.nombre })} className="rounded p-1 hover:bg-red-50" title="Eliminar">
                                <Trash2 className="h-3.5 w-3.5 text-surface-400 hover:text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => openCreateModal('technician')}>
                <Plus className="mr-2 h-3.5 w-3.5" />Añadir técnico
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create/Edit Modal ─────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalMode === 'create'
            ? (modalType === 'installer' ? 'Nuevo instalador' : 'Nuevo técnico')
            : (modalType === 'installer' ? 'Editar instalador' : 'Editar técnico')
        }
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input className={inputCls} value={modalData.nombre ?? ''} onChange={(e) => setModalData((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre y apellidos" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>NIF</label>
              <input className={inputCls} value={modalData.nif ?? ''} onChange={(e) => setModalData((p) => ({ ...p, nif: e.target.value }))} placeholder="12345678A" />
            </div>
            {modalType === 'installer' ? (
              <div>
                <label className={labelCls}>Nº Certificado</label>
                <input className={inputCls} value={modalData.certNum ?? ''} onChange={(e) => setModalData((p) => ({ ...p, certNum: e.target.value }))} />
              </div>
            ) : (
              <div>
                <label className={labelCls}>Nº Colegiado</label>
                <input className={inputCls} value={modalData.numColegiado ?? ''} onChange={(e) => setModalData((p) => ({ ...p, numColegiado: e.target.value }))} />
              </div>
            )}
          </div>
          {modalType === 'installer' ? (
            <div>
              <label className={labelCls}>Categoría</label>
              <select className={selectCls} value={modalData.categoria ?? ''} onChange={(e) => setModalData((p) => ({ ...p, categoria: e.target.value }))}>
                <option value="">Seleccionar...</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className={labelCls}>Titulación</label>
                <input className={inputCls} value={modalData.titulacion ?? ''} onChange={(e) => setModalData((p) => ({ ...p, titulacion: e.target.value }))} placeholder="Ing. Industrial, Ing. Telecomunicaciones..." />
              </div>
              <div>
                <label className={labelCls}>Colegio Oficial</label>
                <input className={inputCls} value={modalData.colegioOficial ?? ''} onChange={(e) => setModalData((p) => ({ ...p, colegioOficial: e.target.value }))} placeholder="COIIM, COITT..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Teléfono</label>
                  <input className={inputCls} value={modalData.telefono ?? ''} onChange={(e) => setModalData((p) => ({ ...p, telefono: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input className={inputCls} value={modalData.email ?? ''} onChange={(e) => setModalData((p) => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Dirección</label>
                <input className={inputCls} value={modalData.direccion ?? ''} onChange={(e) => setModalData((p) => ({ ...p, direccion: e.target.value }))} placeholder="C/ Ejemplo, 1" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Localidad</label>
                  <LocalidadCombobox value={modalData.localidad ?? ''} onChange={(v) => setModalData((p) => ({ ...p, localidad: v }))} />
                </div>
                <div>
                  <label className={labelCls}>Provincia</label>
                  <select className={selectCls} value={modalData.provincia ?? ''} onChange={(e) => setModalData((p) => ({ ...p, provincia: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {PROVINCIA_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>C.P.</label>
                  <input className={inputCls} value={modalData.cp ?? ''} onChange={(e) => setModalData((p) => ({ ...p, cp: e.target.value }))} placeholder="28001" />
                </div>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="modal-default"
              checked={modalData.isDefault ?? false}
              onChange={(e) => setModalData((p) => ({ ...p, isDefault: e.target.checked }))}
              className="h-4 w-4 rounded border-surface-300 text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="modal-default" className="text-sm text-surface-700">
              Marcar como principal (se usará por defecto en nuevos expedientes)
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-surface-200">
            <Button size="sm" onClick={saveModal} disabled={modalSaving || !modalData.nombre?.trim()}>
              {modalSaving ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Guardando…</> :
               <><Save className="mr-2 h-3 w-3" />{modalMode === 'create' ? 'Crear' : 'Guardar'}</>}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete Confirmation Modal ─────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            ¿Estás seguro de que quieres eliminar a <strong>{deleteTarget?.nombre}</strong>?
          </p>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3" />}
              Eliminar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
