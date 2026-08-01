# CLAUDE.md — Memoria del proyecto

## Qué es este proyecto

Sistema de **control de caja diario** para el negocio "María Vallunas". Permite a empleados registrar el cierre de caja al final del día y a administradores supervisar los cierres, detectar descuadres y gestionar catálogos.

## Stack técnico

- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **React**: 19.2.4
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **UI**: shadcn/ui + Base UI
- **Forms**: React Hook Form + Zod
- **Data fetching**: TanStack React Query
- **Auth + DB**: Supabase (PostgreSQL + Auth + RLS)
- **Deploy**: Vercel

## Estructura del proyecto

```
/                           ← raíz del repo (NO tiene package.json)
├── CLAUDE.md               ← este archivo
├── dev.sh                  ← script para levantar dev server desde la raíz
├── vercel.json             ← config de deploy (rootDirectory: app)
├── docs/                   ← documentación del proyecto
└── app/                    ← proyecto Next.js (aquí está el package.json)
    ├── package.json
    ├── next.config.ts
    ├── .env.local          ← variables de entorno (no commiteado)
    └── src/
        ├── proxy.ts        ← middleware de Next.js 16 (se llama "proxy", NO "middleware")
        ├── app/            ← App Router de Next.js (convención del framework)
        │   ├── layout.tsx
        │   ├── page.tsx    ← redirige a /login
        │   ├── login/
        │   └── (app)/      ← route group para rutas protegidas
        │       ├── layout.tsx
        │       ├── cierre/
        │       ├── inventario/
        │       └── dashboard/
        ├── components/     ← componentes compartidos (ui, layout, icons)
        ├── features/       ← módulos de negocio
        │   ├── auth/       ← login/logout
        │   ├── cierre/     ← wizard de cierre de caja (6 pasos)
        │   ├── catalogos/  ← CRUD de productos, categorías, unidades, denominaciones
        │   ├── dashboard/  ← vista admin de cierres y alertas
        │   └── usuarios/   ← gestión de usuarios (admin only)
        └── lib/
            ├── supabase/   ← clientes Supabase (client, server, admin, middleware, session)
            └── database.types.ts  ← tipos auto-generados de Supabase
```

**Por qué `app/` dentro de `app/`**: la carpeta raíz `app/` es el nombre elegido para el proyecto Next.js. La subcarpeta `src/app/` es la convención obligatoria del App Router de Next.js. Son cosas distintas con el mismo nombre.

## Cómo correr el proyecto

```bash
# Requiere Node.js 22+ (Next.js 16 lo exige)
nvm use 22

# Desde la raíz del repo:
./dev.sh

# O manualmente:
cd app && npm run dev
```

**No existe `package.json` en la raíz** — se eliminó porque Vercel lo detectaba primero y rompía el deploy. `dev.sh` es el reemplazo.

## Variables de entorno

Archivo: `app/.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://pweomcrwlghsfadmnryf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<jwt anon>
SUPABASE_SERVICE_ROLE_KEY=<jwt service role>
LOYVERSE_API_TOKEN=<token de acceso Loyverse>
```

- `NEXT_PUBLIC_*` → expuestas al browser
- `SUPABASE_SERVICE_ROLE_KEY` → solo servidor, bypasea RLS
- `LOYVERSE_API_TOKEN` → solo servidor, acceso a la API de Loyverse

## Autenticación

- **Proveedor**: Supabase Auth (email + password)
- **Sesiones**: cookies httpOnly manejadas por `@supabase/ssr`
- **Middleware** (`proxy.ts`): refresca tokens, redirige según auth/rol
- **Rutas públicas**: `/login`, `/auth`
- **Todo lo demás**: requiere sesión activa

### Roles (solo 2)

| Rol | Acceso | Redirect |
|-----|--------|----------|
| `admin` | `/dashboard/*`, gestión de usuarios y catálogos | `/dashboard` |
| `empleado` | `/cierre`, `/inventario` | `/cierre` |

No existe super_admin ni otros roles.

### Clientes Supabase (3 variantes)

| Cliente | Archivo | Uso |
|---------|---------|-----|
| Browser | `lib/supabase/client.ts` | Client Components (login, logout) |
| Server | `lib/supabase/server.ts` | Server Components, Server Actions |
| Admin | `lib/supabase/admin.ts` | Gestión de usuarios (service_role key) |

## Base de datos

### Tablas principales

**`profiles`** — Usuarios del sistema
- `id` (uuid, FK a auth.users), `nombre`, `role` ('admin'|'empleado'), `activo` (boolean)

**`cierres_diarios`** — Cierre de caja por día/empleado
- `id`, `fecha`, `empleado_id`, `base_inicial`, `ventas_tpv_total`, `efectivo_contado`, `ingresos_digitales_total`, `efectivo_esperado`, `diferencia`, `cuadrado`, `nota_diferencia`, `estado` ('abierto'|'cerrado')
- Constraint: un cierre por empleado por día

**`ventas_producto`** — Líneas de venta (hijo de cierres_diarios)
- `cierre_id`, `producto_id`, `cantidad`, `precio_unitario`, `total` (generado)

**`ingresos_digitales`** — Pagos digitales (hijo de cierres_diarios)
- `cierre_id`, `metodo` ('nequi'|'transferencia'|'datafono'), `monto`, `descripcion`

**`egresos`** — Gastos (hijo de cierres_diarios)
- `cierre_id`, `concepto`, `categoria_id`, `unidad_id`, `monto`, `metodo_pago` ('efectivo'|'transferencia')

**`arqueo_billetes`** — Conteo de billetes (hijo de cierres_diarios)
- `cierre_id`, `denominacion_id`, `cantidad`, `subtotal`

### Catálogos

- `productos` — Productos con precio, unidad y `loyverse_item_id` (vinculado al TPV)
- `categorias_egreso` — Categorías de gasto
- `unidades_negocio` — Unidades de negocio (Empanadas, Pizzeria, Bebidas, Arepas, Adiciones, Domicilios, Compartido)
- `denominaciones_billete` — Denominaciones de billetes
- `sync_loyverse_pendientes` — Cambios detectados en Loyverse pendientes de aprobación del admin

### Vistas

- `v_cuadre_diario` — Resumen de cierres con datos calculados
- `v_alertas_admin` — Cierres cerrados y descuadrados

## Ecuación maestra del cierre

```
Efectivo Esperado = Base Inicial + Ventas TPV - Ingresos Digitales - Egresos Efectivo
Diferencia = Efectivo Arqueo (contado) - Efectivo Esperado (calculado)
Cuadrado = |Diferencia| < $1
```

## Cierre de caja — flujo del wizard

6 pasos: Base inicial → Ventas → Digitales → Egresos → Arqueo → Resumen

- Se puede guardar borrador en cualquier paso (estado = 'abierto')
- "Cerrar día" en el último paso (estado = 'cerrado', no editable después)
- Server action `guardarCierre()`: upsert padre + delete/insert hijos

## Loyverse (TPV del establecimiento)

El negocio usa **Loyverse** como punto de venta (caja registradora). La API REST está verificada y funcional.

- **API docs**: https://developer.loyverse.com/docs/
- **Base URL**: `https://api.loyverse.com/v1.0`
- **Auth**: Header `Authorization: Bearer <token>` (token en `LOYVERSE_API_TOKEN` del .env.local)
- **Moneda**: COP, sin decimales (los montos son enteros: 23600 = $23,600)
- **Tienda única**: `1c0e1ec9-32b7-4e47-802f-dc9423cc31a4` (María Vallunas)
- **Limitación**: solo últimos 31 días de recibos sin el add-on de historial ilimitado

### Endpoints disponibles

| Endpoint | Método | Qué devuelve |
|----------|--------|--------------|
| `/merchant` | GET | Datos del negocio (nombre, email, moneda, país) |
| `/stores` | GET | Tiendas (solo 1: María Vallunas) |
| `/items?limit=250` | GET | Productos del menú (28 activos) con precios y categoría |
| `/categories` | GET | Categorías: Empanadas, Pizza, Bebidas, Arepas, Adiciones, Domicilios |
| `/receipts?limit=250&created_at_min=...&created_at_max=...` | GET | Recibos de venta con line_items y payments |
| `/payment_types` | GET | Métodos de pago configurados |
| `/customers?limit=250` | GET | Clientes registrados (nombre, teléfono, dirección, visitas, gasto total) |
| `/employees` | GET | Empleados del TPV |
| `/inventory?store_id=...` | GET | Niveles de inventario (no activado actualmente) |
| `/shifts` | GET | Turnos de empleados (no configurado actualmente) |

### Estructura de un recibo (`/receipts`)

```
receipt
├── receipt_number: "2-23720"
├── receipt_type: "SALE" | "REFUND"
├── receipt_date: ISO timestamp
├── total_money: 23600 (entero, COP)
├── store_id, employee_id, customer_id
├── line_items[]
│   ├── item_id, item_name
│   ├── quantity: 3
│   ├── price: 2500 (precio unitario)
│   └── total_money: 7500
└── payments[]
    ├── payment_type_id
    ├── type: "CASH" | "NONINTEGRATEDCARD"
    ├── name: "Efectivo" | "Tarjeta"
    └── money_amount: 23600
```

### Métodos de pago configurados

| ID | Nombre | Tipo | Mapeo al cierre |
|----|--------|------|-----------------|
| `c02a61e7-22b8-484a-8c81-a32d45794649` | Efectivo | CASH | Ventas en efectivo |
| `d5d62413-222e-4a7f-a43b-249bfe04cfa6` | Tarjeta | NONINTEGRATEDCARD | → ingresos digitales (datafono) |

### Paginación

- Parámetro `limit` (1-250, default 50)
- Respuesta incluye `cursor` si hay más páginas
- Siguiente página: agregar `&cursor=<valor>` al request
- Fin: respuesta sin campo `cursor`

### Mapeo Loyverse → Cierre de caja

| Dato Loyverse | Campo del cierre |
|---------------|-----------------|
| `line_items` agrupados por item_id | Paso 2: ventas (producto, cantidad, precio) |
| `payments` tipo CASH (suma) | Parte del cálculo de ventas TPV en efectivo |
| `payments` tipo NONINTEGRATEDCARD (suma) | Paso 3: ingresos digitales (datafono) |
| `total_money` de todos los recibos del día | `ventas_tpv_total` |

## Supabase — Lecciones aprendidas

### service_role y RLS

- `createAdminClient()` usa `SUPABASE_SERVICE_ROLE_KEY` que **bypasea RLS** por defecto.
- Sin embargo, `service_role` necesita **GRANTs explícitos** sobre las tablas. Sin ellos, las operaciones fallan silenciosamente (sin error, pero sin efecto).
- Cada vez que se crea una tabla nueva o se necesita operar con `service_role`, ejecutar:
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON <tabla> TO service_role;
  ```
- Tablas que ya tienen GRANT para `service_role`: `profiles`, `productos`, `unidades_negocio`, `sync_loyverse_pendientes`, `cierres_diarios`, `ventas_producto`, `ingresos_digitales`, `egresos`, `arqueo_billetes`.

### Eliminación de registros con tablas hijas

- Aunque las FK tienen `ON DELETE CASCADE` en PostgreSQL, al eliminar vía la API REST de Supabase (PostgREST), el CASCADE puede no ejecutarse correctamente.
- **Patrón seguro**: eliminar las tablas hijas manualmente primero, luego el padre. Ver `eliminarCierresAction` en `features/dashboard/actions.ts` como referencia.
- Tablas hijas de `cierres_diarios`: `ventas_producto`, `ingresos_digitales`, `egresos`, `arqueo_billetes`.

### RLS — Políticas existentes

- Todas las tablas tienen RLS habilitado.
- Patrón general: empleados acceden solo a sus propios registros del día actual; admin tiene acceso total (`ALL`).
- Helper functions: `get_my_role()` y `is_my_cierre(cierre_id)` para las policies.

## Convenciones del código

- Server Actions en archivos `actions.ts` dentro de cada feature
- Loaders (queries) en archivos `loaders.ts`
- Validación con Zod schemas en `schema.ts`
- Componentes de UI en `components/ui/` (shadcn)
- Layout components en `components/layout/`
- Para eliminar registros con hijos, usar el patrón de eliminación manual de hijos antes del padre (no confiar en CASCADE vía PostgREST)
