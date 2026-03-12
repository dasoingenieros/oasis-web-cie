import axios, {
  type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig,
} from 'axios';
import type {
  AuthResponse, Installation, CreateInstallationDto, UpdateInstallationDto,
  Circuit, CreateCircuitDto, CalculationResult, LoginDto, RegisterDto,
  Document, ElectricalPanel, SavePanelWithDifferentialsDto, UsageData,
  WaitlistDto, Installer, Technician, CreateInstallerDto, CreateTechnicianDto,
  TramitacionExpediente, TramitacionConfig,
} from './types';

let accessToken: string | null = null;
export function getAccessToken(): string | null { return accessToken; }
export function setAccessToken(token: string | null): void { accessToken = token; }

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 15_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => { if (error) reject(error); else if (token) resolve(token); });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => { if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`; resolve(api(originalRequest)); },
            reject,
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data: refreshBody } = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {}, { withCredentials: true });
        const refreshed = unwrap<{ accessToken: string }>(refreshBody);
        setAccessToken(refreshed.accessToken);
        processQueue(null, refreshed.accessToken);
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(error);
  },
);

// Helper: unwrap API responses that use { success, data } envelope
function unwrap<T>(body: any): T {
  return body && body.success !== undefined && body.data !== undefined ? body.data : body;
}

export const authApi = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data: body } = await api.post('/auth/login', dto);
    const { accessToken } = unwrap<{ accessToken: string }>(body);
    setAccessToken(accessToken);
    const user = await authApi.me();
    return { accessToken, user };
  },
  /** Register — does NOT auto-login (email verification required) */
  async register(dto: RegisterDto): Promise<void> {
    await api.post('/auth/register', dto);
  },
  async refresh(): Promise<AuthResponse> {
    const { data: body } = await api.post('/auth/refresh');
    const { accessToken } = unwrap<{ accessToken: string }>(body);
    setAccessToken(accessToken);
    const user = await authApi.me();
    return { accessToken, user };
  },
  async logout(): Promise<void> { try { await api.post('/auth/logout'); } finally { setAccessToken(null); } },
  async me(): Promise<AuthResponse['user']> {
    const { data: body } = await api.get('/auth/me');
    return unwrap<AuthResponse['user']>(body);
  },
  async resendVerify(email: string): Promise<void> {
    await api.post('/auth/resend-verify', { email });
  },
};

export const installationsApi = {
  async list(): Promise<Installation[]> { const { data } = await api.get<Installation[]>('/installations'); return data; },
  async get(id: string): Promise<Installation> { const { data } = await api.get<Installation>(`/installations/${id}`); return data; },
  async create(dto: CreateInstallationDto): Promise<Installation> { const { data } = await api.post<Installation>('/installations', dto); return data; },
  async update(id: string, dto: UpdateInstallationDto): Promise<Installation> { const { data } = await api.put<Installation>(`/installations/${id}`, dto); return data; },
  async delete(id: string): Promise<void> { await api.delete(`/installations/${id}`); },
};

export const circuitsApi = {
  async list(installationId: string): Promise<Circuit[]> { const { data } = await api.get<Circuit[]>(`/installations/${installationId}/circuits`); return data; },
  async replaceAll(installationId: string, circuits: CreateCircuitDto[]): Promise<Circuit[]> { const { data } = await api.put<Circuit[]>(`/installations/${installationId}/circuits`, circuits); return data; },
};

export const calculationsApi = {
  async calculate(installationId: string): Promise<CalculationResult> { const { data } = await api.post<CalculationResult>(`/installations/${installationId}/calculate`); return data; },
  async calculateSupply(installationId: string): Promise<any> { const { data } = await api.post(`/installations/${installationId}/calculate-supply`); return data; },
  async getLatest(installationId: string): Promise<CalculationResult | null> { try { const { data } = await api.get<CalculationResult>(`/installations/${installationId}/calculations/latest`); return data; } catch { return null; } },
};

export const documentsApi = {
  async list(installationId: string): Promise<Document[]> { const { data } = await api.get<Document[]>(`/installations/${installationId}/documents`); return data; },
  async generate(installationId: string, type: 'MEMORIA_TECNICA' | 'CERTIFICADO' | 'UNIFILAR'): Promise<Document> { const { data } = await api.post<Document>(`/installations/${installationId}/documents/generate`, { type }); return data; },
  async generateCie(installationId: string, format: 'xls' | 'pdf' = 'xls'): Promise<{ blob: Blob; filename: string }> { const resp = await api.post(`/installations/${installationId}/documents/generate-cie?format=${format}`, {}, { responseType: 'blob', timeout: 60_000 }); const cd = resp.headers['content-disposition'] || ''; const match = cd.match(/filename="?([^";\n]+)"?/); const filename = match ? match[1] : `CIE_${installationId.slice(0, 8)}.${format}`; return { blob: resp.data, filename }; },
  async generateSolicitud(installationId: string, format: 'docx' | 'pdf' = 'docx'): Promise<Blob> { const { data } = await api.post(`/installations/${installationId}/documents/generate-solicitud?format=${format}`, {}, { responseType: 'blob', timeout: 60_000 }); return data; },
  async download(installationId: string, documentId: string): Promise<Blob> { const { data } = await api.get(`/installations/${installationId}/documents/${documentId}/download`, { responseType: 'blob' }); return data; },
  async remove(installationId: string, documentId: string): Promise<void> { await api.delete(`/installations/${installationId}/documents/${documentId}`); },
};

export const panelsApi = {
  async get(installationId: string): Promise<ElectricalPanel | null> { try { const { data } = await api.get<ElectricalPanel>(`/installations/${installationId}/panel`); return data; } catch { return null; } },
  async save(installationId: string, dto: SavePanelWithDifferentialsDto): Promise<ElectricalPanel> { const { data } = await api.put<ElectricalPanel>(`/installations/${installationId}/panel`, dto); return data; },
  async saveAll(installationId: string, dto: { circuits: any[]; panel: SavePanelWithDifferentialsDto; installationUpdates?: Record<string, any> }): Promise<{ circuits: Circuit[]; panel: ElectricalPanel }> { const { data } = await api.put(`/installations/${installationId}/panel/save-all`, dto); return data; },
  async createFromTemplate(installationId: string): Promise<ElectricalPanel> { const { data } = await api.post<ElectricalPanel>(`/installations/${installationId}/panel/template`); return data; },
  async reset(installationId: string): Promise<void> { await api.delete(`/installations/${installationId}/panel/reset`); },
};

export const unifilarApi = {
  async getLayout(installationId: string): Promise<any | null> { try { const { data } = await api.get(`/installations/${installationId}/unifilar`); return data; } catch { return null; } },
  async saveLayout(installationId: string, layoutJson: any): Promise<any> { const { data } = await api.put(`/installations/${installationId}/unifilar`, { layoutJson }); return data; },
};

export const onboardingApi = {
  async saveCompany(data: Record<string, any>): Promise<any> { const { data: res } = await api.put('/onboarding/company', data); return res; },
  async saveInstaller(data: Record<string, any>): Promise<any> { const { data: res } = await api.put('/onboarding/installer', data); return res; },
  async complete(): Promise<void> { await api.post('/onboarding/complete'); },
};

export const subscriptionsApi = {
  async getUsage(): Promise<UsageData> { const { data } = await api.get<UsageData>('/subscriptions/usage'); return data; },
};

export const consentApi = {
  async log(dto: { consentType: string; documentVersion: string; accepted: boolean; method?: string; certificateId?: string }): Promise<void> {
    await api.post('/consent', dto);
  },
  async logBulk(consents: Array<{ consentType: string; documentVersion: string; accepted: boolean; method?: string }>): Promise<void> {
    await api.post('/consent/bulk', { consents });
  },
  async list(): Promise<any[]> { const { data } = await api.get('/consent'); return data; },
};

export const waitlistApi = {
  async submit(dto: WaitlistDto): Promise<void> { await api.post('/waitlist', dto); },
};

export const teamApi = {
  async listInstallers(): Promise<Installer[]> { const { data } = await api.get<Installer[]>('/team/installers'); return data; },
  async createInstaller(dto: CreateInstallerDto): Promise<Installer> { const { data } = await api.post<Installer>('/team/installers', dto); return data; },
  async updateInstaller(id: string, dto: Partial<CreateInstallerDto>): Promise<Installer> { const { data } = await api.put<Installer>(`/team/installers/${id}`, dto); return data; },
  async deleteInstaller(id: string): Promise<void> { await api.delete(`/team/installers/${id}`); },
  async listTechnicians(): Promise<Technician[]> { const { data } = await api.get<Technician[]>('/team/technicians'); return data; },
  async createTechnician(dto: CreateTechnicianDto): Promise<Technician> { const { data } = await api.post<Technician>('/team/technicians', dto); return data; },
  async updateTechnician(id: string, dto: Partial<CreateTechnicianDto>): Promise<Technician> { const { data } = await api.put<Technician>(`/team/technicians/${id}`, dto); return data; },
  async deleteTechnician(id: string): Promise<void> { await api.delete(`/team/technicians/${id}`); },
};

export const tenantApi = {
  async getProfile(): Promise<any> { const { data } = await api.get('/tenant/profile'); return data; },
  async updateProfile(dto: Record<string, any>): Promise<any> { const { data } = await api.put('/tenant/profile', dto); return data; },
  async getInstallers(): Promise<any[]> { const { data } = await api.get('/tenant/installers'); return data; },
  async updateInstaller(userId: string, dto: Record<string, any>): Promise<any> { const { data } = await api.put(`/tenant/installers/${userId}`, dto); return data; },
};

export const tramitacionApi = {
  async getConfig(): Promise<TramitacionConfig> {
    const { data } = await api.get<TramitacionConfig>('/tramitacion/config');
    return data;
  },
  async updateConfig(dto: { portalUsername?: string; portalPassword?: string; portalEiciId?: string; portalEiciName?: string }): Promise<void> {
    await api.put('/tramitacion/config', dto);
  },
  async testConexion(): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post<{ success: boolean; message: string }>('/tramitacion/config/test', {}, { timeout: 30_000 });
    return data;
  },
  async tramitar(installationId: string, dto?: { eiciId?: string }): Promise<{ expedienteId: string; status: string }> {
    const { data } = await api.post(`/tramitacion/${installationId}/tramitar`, dto ?? {});
    return data;
  },
  async getStatus(expedienteId: string): Promise<TramitacionExpediente> {
    const { data } = await api.get<TramitacionExpediente>(`/tramitacion/${expedienteId}/status`);
    return data;
  },
  async getExpedientes(installationId: string): Promise<TramitacionExpediente[]> {
    const { data } = await api.get<TramitacionExpediente[]>(`/tramitacion/${installationId}/expedientes`);
    return data;
  },
  async resolve(expedienteId: string, dto: { field: string; selectedValue: string; selectedLabel?: string }): Promise<void> {
    await api.post(`/tramitacion/${expedienteId}/resolve`, dto);
  },
};

export default api;
