# CIE Platform — Frontend (apps/web)

## Sesión 5: Setup Next.js + Auth + Layout + Dashboard

### Archivos generados: 34 archivos

```
apps/web/
├── .env.local                          # Variables de entorno (API URL)
├── .eslintrc.json                      # ESLint config
├── components.json                     # shadcn/ui config
├── next-env.d.ts                       # Next.js types
├── next.config.js                      # Next.js config (API proxy)
├── package.json                        # Dependencies
├── postcss.config.js                   # PostCSS + Tailwind
├── tailwind.config.ts                  # Tailwind theme (colores brand, status, sidebar)
├── tsconfig.json                       # TypeScript strict
│
└── src/
    ├── middleware.ts                    # Route protection (refresh token cookie check)
    │
    ├── app/
    │   ├── globals.css                 # Tailwind + DM Sans font + custom classes
    │   ├── layout.tsx                  # Root layout (AuthProvider)
    │   │
    │   ├── (auth)/
    │   │   └── login/page.tsx          # Login con Zod validation
    │   │
    │   └── (dashboard)/
    │       ├── layout.tsx              # Sidebar + Topbar + auth guard
    │       ├── page.tsx                # Dashboard (stats + grid + empty state)
    │       ├── instalaciones/
    │       │   ├── page.tsx            # Lista instalaciones con búsqueda
    │       │   └── [id]/page.tsx       # Detalle con tabs (placeholder S6/S7)
    │       └── configuracion/
    │           └── page.tsx            # Página configuración básica
    │
    ├── components/
    │   ├── sidebar.tsx                 # Sidebar dark colapsable
    │   ├── topbar.tsx                  # Topbar con user dropdown
    │   ├── installation-card.tsx       # Card instalación (status, dirección, acciones)
    │   ├── new-installation-dialog.tsx # Dialog crear instalación (titular, dirección, tipo)
    │   └── ui/                         # shadcn components
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       └── select.tsx
    │
    ├── hooks/
    │   └── use-installations.ts        # Hook CRUD instalaciones
    │
    └── lib/
        ├── api-client.ts               # Axios + JWT interceptors + refresh automático
        ├── auth-context.tsx             # AuthProvider + useAuth()
        ├── types.ts                     # TypeScript types (mirrors Prisma schema)
        └── utils.ts                     # cn(), formatDate(), getStatusLabel(), etc.
```

### Setup

1. Copia esta carpeta completa a `apps/web/` en tu monorepo:
   ```bash
   # Desde la raíz del monorepo (C:\cie-oasisplatform)
   # Si ya existe apps/web/ vacío, bórralo primero
   rm -rf apps/web
   # Copia los archivos descomprimidos
   cp -r [ruta-descarga]/apps-web apps/web
   ```

2. Instala dependencias:
   ```bash
   cd apps/web
   yarn install
   ```

3. Verifica que Docker + API están corriendo:
   ```bash
   # Desde la raíz del monorepo
   docker-compose up -d
   cd apps/api && yarn start:dev
   ```

4. Arranca el frontend:
   ```bash
   cd apps/web
   yarn dev
   ```

5. Abre http://localhost:3000

### Notas técnicas

- **Auth flow**: Access token en memoria (no localStorage). Refresh token en httpOnly cookie.
  El interceptor de Axios refresca automáticamente cuando recibe un 401.
- **API proxy**: `next.config.js` reescribe `/api/*` a `http://localhost:3001/api/*` para evitar CORS en dev.
- **Route groups**: `(auth)` para login/register, `(dashboard)` para páginas autenticadas con sidebar.
- **Design system**: Tailwind custom theme con colores `brand-*`, `sidebar-*`, `status-*`. Font: DM Sans.
- **Sidebar colapsable**: Se encoge a iconos con un toggle en la parte inferior.

### Pendiente para S6
- Formulario datos administrativos (tab "Datos")
- Formulario cuadro eléctrico (tab "Cuadro") con circuitos C1-C12
- Botón "Calcular" que llama al motor vía API

### Pendiente para S7
- Visualización resultados (tab "Resultados")
- Listado documentos (tab "Documentos")
- Pulido general
