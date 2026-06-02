# Control de Cuentas — María Vallunas

App web para reemplazar la hoja de Excel con la que el negocio (empanadas + pizzería) cierra la caja cada noche. Dos roles: **empleado** (registra cierre nocturno) y **admin** (consulta dashboards de rentabilidad y alertas).

## Stack

| Capa | Herramienta |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind v4 + shadcn/ui (base-nova) |
| Auth & DB | Supabase (Postgres + RLS + Auth) |
| Forms | react-hook-form + zod |
| Datos cliente | TanStack Query |
| Deploy | Vercel |

## Estructura

```
docs/                    contexto, migración SQL, tipos DB
app/                     app Next.js
  src/
    app/                 App Router (rutas + layouts)
      (app)/             route group autenticado
      login/
    components/
      ui/                componentes shadcn
      layout/            topbar, nav, sidebar
    features/
      auth/              login, signOut
      cierre/            wizard + steps + acciones
      dashboard/         KPIs, tabla cierres
    lib/
      supabase/          clients SSR/browser + middleware
      database.types.ts  generado vía Supabase MCP
      format.ts          helpers COP, fechas
```

## Empezar local

```bash
nvm use            # Node 20 (ver .nvmrc)
cd app
npm install
npm run dev
```

Abre `http://localhost:3000` → te manda a `/login`.

### Crear el primer admin

1. En el panel de Supabase → **Authentication → Users → Add user** (con email + password).
2. El trigger `handle_new_user` crea el profile con rol `empleado` por defecto.
3. Para hacerlo admin, en el SQL editor:
   ```sql
   update profiles set role = 'admin' where id = '<uuid del usuario>';
   ```

## Deploy a Vercel

1. Push del repo a GitHub.
2. En vercel.com → **Add New → Project → Import**.
3. Root directory: `app/`.
4. Env vars (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy. El primer push hace dominio `*.vercel.app`; luego se le puede asignar dominio propio.

## Próximos pasos

- [ ] Editor de catálogos (admin)
- [ ] Vista de rentabilidad por unidad con prorrateo
- [ ] Módulo de inventario pizza
- [ ] Notificaciones de alertas vía email/WhatsApp
- [ ] Tests E2E con Playwright
