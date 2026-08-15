# CLAUDE.md — Memoria del proyecto

## Qué es este proyecto

Sistema de **control de caja diario** para el negocio "María Vallunas". Permite a empleados registrar el cierre de caja al final del día y a administradores supervisar los cierres, detectar descuadres y gestionar catálogos.

## Dos propietarios — dato estructural del negocio

**El negocio es una sola caja pero tiene dos propietarios.** Esto condiciona el diseño de reportes y liquidaciones:

| Propietario | Unidades de negocio |
|---|---|
| **1** | Empanadas, Arepas, Bebidas/Limonadas |
| **2** | Pizzería (incluye las adiciones de pizza) |

El cierre diario calcula y persiste **cuánto le corresponde al propietario 2**: `pizzeria_ingresos − pizzeria_gastos`. Ver "Liquidación de Pizzería" más abajo.

⚠️ **Estado real de las unidades** (verificado contra la DB, ago 2026) — no coincide con lo que sugiere el catálogo:

- **Activas**: Empanadas, Pizzería
- **Inactivas pero con ventas reales**: Arepas ($2.4M) y Bebidas ($0.9M) — juntas son ~20% de la facturación. Como `loadCatalogos()` filtra unidades por `activo = true`, no aparecen como chip de filtro en el paso de Ventas, aunque sus productos siguen activos y vendiéndose. Pendiente de decidir si se reactivan.
- **Vacías**: Adiciones y Compartido (sus productos se movieron a Pizzería). La unidad `Compartido` se conserva porque `v_rentabilidad_unidad` la usa por nombre para prorratear gastos comunes.
- Hoy **ningún gasto se registra como Compartido**: se reparten entre Empanadas y Pizzería directamente.

## Stack técnico

- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **React**: 19.2.4
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **UI**: shadcn/ui + Base UI
- **Animations**: Framer Motion (motion/react)
- **Forms**: React Hook Form + Zod
- **Data fetching**: TanStack React Query
- **Auto-animate lists**: @formkit/auto-animate
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
        │   ├── cierre/     ← wizard de cierre de caja (7 pasos)
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
| Admin | `lib/supabase/admin.ts` | Gestión de usuarios, Server Actions de cierre (service_role key, bypasa RLS) |

## Base de datos

### Tablas principales

**`profiles`** — Usuarios del sistema
- `id` (uuid, FK a auth.users), `nombre`, `role` ('admin'|'empleado'), `activo` (boolean)

**`cierres_diarios`** — Cierre de caja por día/empleado
- `id`, `fecha`, `empleado_id`, `base_inicial`, `base_billetes`, `base_monedas`, `base_editado`, `ventas_tpv_total`, `efectivo_contado`, `ingresos_digitales_total`, `arqueo_monedas`, `efectivo_esperado`, `diferencia`, `cuadrado`, `nota_diferencia`, `estado` ('abierto'|'cerrado'), `created_at`, `updated_at`
- Liquidación del propietario 2: `pizzeria_ingresos`, `pizzeria_gastos`, `pizzeria_liquidacion` (columna **generada** = ingresos − gastos), `pizzas_tradicionales`, `pizzas_especiales`
- Constraint: un cierre por empleado por día
- `base_billetes` + `base_monedas` = `base_inicial` (desglose de la base)
- `base_editado`: true si el empleado modificó la base tras confirmarla (visible al admin con alerta amarilla)
- `arqueo_monedas`: valor de monedas contadas, desglosado de `efectivo_contado` (billetes + monedas)

**`ventas_producto`** — Líneas de venta (hijo de cierres_diarios)
- `cierre_id`, `producto_id`, `cantidad`, `precio_unitario`, `total` (generado)

**`ingresos_digitales`** — Pagos digitales (hijo de cierres_diarios)
- `cierre_id`, `cuenta_digital_id` (FK a `cuentas_digitales`), `monto`, `descripcion`
- El enum `metodo` ('nequi'|'transferencia'|'datafono') **ya no existe**: se reemplazó por cuentas administrables

**`egresos`** — Gastos (hijo de cierres_diarios)
- `cierre_id`, `concepto`, `categoria_id`, `unidad_id`, `monto`, `metodo_pago` ('efectivo'|'transferencia')

**`arqueo_billetes`** — Conteo de billetes (hijo de cierres_diarios)
- `cierre_id`, `denominacion_id`, `cantidad`, `subtotal`

**`inventario_pizza`** — Inventario diario de pizza (independiente del cierre)
- `id`, `fecha`, `empleado_id`, `ruedas_inicio`, `porciones_inicio`, `horneada`, `ruedas_final`, `porciones_final`, `porciones_vendidas_tpv`, `diferencia`, `notas`
- Constraint: `UNIQUE(fecha)` — un solo registro por día (NO por empleado)
- `porciones_vendidas_tpv`: calculado al cerrar, contando ventas de productos con `tipo_pizza` no nulo. **Importante**: no basta filtrar por unidad Pizzería — las adiciones (queso extra, peperoni) viven en esa unidad pero no consumen porciones
- `diferencia`: consumidas - porciones_vendidas_tpv (merma real)

### Catálogos

- `productos` — Precio, unidad, `loyverse_item_id` (vinculado al TPV), `multiplicador` (unidades consumidas por línea) y `tipo_pizza` ('tradicional'|'especial'|null)
- `categorias_egreso` — Categorías de gasto
- `unidades_negocio` — Ver "Dos propietarios" arriba para el estado real de cada unidad
- `denominaciones_billete` — Denominaciones de billetes
- `cuentas_digitales` — Cuentas de pago digital administrables por el admin (`nombre`, `activo`, `es_datafono`, `orden`). Solo una puede tener `es_datafono = true` (índice único parcial) — es la que recibe los pagos con tarjeta importados de Loyverse
- `sync_loyverse_pendientes` — Cambios detectados en Loyverse pendientes de aprobación del admin

### Vistas

- `v_cuadre_diario` — Resumen de cierres con datos calculados. **No incluye** las columnas `pizzeria_*`
- `v_alertas_admin` — Cierres cerrados y descuadrados
- `v_rentabilidad_unidad` — Rentabilidad por unidad/día: prorratea ingresos digitales y gastos "Compartido" según proporción de ventas. ⚠️ **Sin uso**: existe `loadRentabilidad()` en `features/dashboard/loaders.ts` pero no tiene ningún llamador y ninguna pantalla la renderiza

## Inventario de pizza

### Constante y ecuación

- `PORCIONES_POR_RUEDA = 8` (siempre fijo)
- El cajero cuenta manualmente al abrir y al cerrar (NO se auto-llena del día anterior)
- El cajero registra ruedas horneadas (producción del día)

```
Disponible = (ruedas_inicio × 8 + porciones_inicio) + (horneada × 8)
Restante   = ruedas_final × 8 + porciones_final
Consumidas = Disponible - Restante
Merma      = Consumidas - Porciones vendidas TPV  (calculado al cerrar, visible al admin)
```

### Persistencia

- Upsert con `onConflict: "fecha"` (un registro por día)
- `guardarCierre()`: calcula `porciones_vendidas_tpv` cruzando ventas de productos de la unidad Pizzería (`unidad_id = 75340370-d308-44ff-9cce-74bcfc0358ed`)
- `guardarCierreDraft()`: guarda sin cálculo de vendidas (datos parciales)
- La tabla es independiente de `cierres_diarios` (no tiene FK al cierre)

### Ruta `/inventario`

Redirige a `/cierre` — el inventario de pizza se registra dentro del wizard, no en página independiente. El análisis de mermas se mostrará en el dashboard del admin (pendiente de diseño).

## Ecuación maestra del cierre

```
Efectivo Esperado = Base Inicial + Ventas TPV - Ingresos Digitales - Egresos Efectivo
Diferencia = Efectivo Arqueo (contado) - Efectivo Esperado (calculado)
Cuadrado = |Diferencia| < $1
```

## Liquidación de Pizzería

Como el negocio tiene dos propietarios, cada cierre calcula cuánto le corresponde al dueño de Pizzería:

```
Liquidación Pizzería = Ingresos Pizzería - Gastos Pizzería
```

- **Ingresos**: ventas de productos de la unidad Pizzería (incluye las adiciones de pizza)
- **Gastos**: egresos con `unidad_id` de Pizzería, sin importar el método de pago
- **Pizzas vendidas**: `cantidad × multiplicador`, agrupadas por `tipo_pizza`. Las adiciones (`tipo_pizza = null`) suman a los ingresos pero **no** se cuentan como pizzas

`calcPizzeria(values, productos)` en `features/cierre/schema.ts` es la única implementación — a diferencia de `calcTotales()`, necesita el catálogo porque el formulario solo guarda `producto_id`.

**Snapshot, no vista**: los valores se persisten en `cierres_diarios` al cerrar (mismo patrón que `porciones_vendidas_tpv`). Así una liquidación ya pagada no cambia si mañana el admin reclasifica una pizza. El wizard la calcula en vivo; el admin lee lo guardado.

La constante `UNIDAD_PIZZERIA_ID` y los tipos de pizza viven en `lib/negocio.ts` (compartidos entre `cierre` y `catalogos`).

## Cierre de caja — Wizard (detalle completo)

### Estructura de archivos

```
features/cierre/
├── cierre-wizard.tsx          ← Orquestador principal (React Hook Form + 7 pasos)
├── schema.ts                  ← Zod schemas (estricto + draft) + calcTotales() + calcPizza() + calcPizzeria()
├── actions.ts                 ← Server Actions (guardar, guardarDraft, importar Loyverse, reordenar)
├── loaders.ts                 ← Loaders server-side (catálogos, cierre existente, Loyverse, pizza)
├── hooks/
│   └── use-auto-save.ts      ← Auto-guardado 3 capas (beforeunload + localStorage + DB)
├── components/
│   ├── progress-steps.tsx       ← Indicador de progreso con navegación por pasos
│   ├── date-selector.tsx        ← Navegación de fecha (±2 días máx)
│   ├── money-input.tsx          ← Input de moneda con $ y formato miles (COP, sin decimales)
│   ├── qty-stepper.tsx          ← Selector +/- con haptic feedback
│   ├── qty-sheet.tsx            ← Bottom sheet para editar cantidad de producto
│   ├── product-tile.tsx         ← Card de producto con soporte drag-n-drop
│   ├── save-status.tsx          ← Indicador visual de estado de auto-guardado
│   ├── restore-draft-banner.tsx ← Banner para restaurar borrador local
│   └── summary-panel.tsx        ← Panel lateral sticky con resumen en vivo (tablet+)
└── steps/
    ├── step-base.tsx          ← Paso 1: Base inicial (billetes + monedas con confirmación)
    ├── step-pizza.tsx         ← Paso 2: Inventario pizza (ruedas, porciones, producción)
    ├── step-egresos.tsx       ← Paso 3: Gastos (useFieldArray)
    ├── step-ventas.tsx        ← Paso 4: Ventas (tabla spreadsheet + import Loyverse + filtros)
    ├── step-digitales.tsx     ← Paso 5: Pagos digitales (useFieldArray)
    ├── step-arqueo.tsx        ← Paso 6: Conteo de billetes + monedas
    └── step-resumen.tsx       ← Paso 7: Resumen, cuadre y nota si descuadrado
```

Hooks compartidos:
```
lib/hooks/
└── use-debounced-callback.ts  ← Hook genérico de debounce [debouncedFn, cancelFn]
```

### Flujo general

7 pasos: **Base inicial → Pizza → Egresos → Ventas → Digitales → Arqueo → Resumen**

- Se puede guardar borrador en cualquier paso (estado = `'abierto'`)
- "Cerrar día" en el último paso (estado = `'cerrado'`, no editable después)
- Server action `guardarCierre()`: upsert padre + delete/insert hijos

### Orquestador (`cierre-wizard.tsx`)

**Props que recibe**:
- `catalogos`: productos, unidades, categorías de egreso, denominaciones
- `existente`: cierre previo (borrador o cerrado) para la fecha (incluye `updated_at`, `arqueo_monedas`)
- `loyverseData`: ventas y pagos digitales pre-cargados del TPV
- `pizzaExistente`: inventario de pizza del día (`PizzaExistente | null`)
- `fecha`: string YYYY-MM-DD
- `userId`: string UUID del empleado autenticado (para auto-save)

**Estado**:
- `step` (0-6): paso actual
- `cerrado`: boolean, si ya está cerrado es read-only
- `showConfirm`: dialog de confirmación si descuadrado
- `totales`: computed cada cambio (cálculos en tiempo real)
- `formValues`: watch completo del formulario (para SummaryPanel)

**Lógica clave**:
- `buildDefaults()`: prioridad → draft existente > datos Loyverse > vacío (incluye `arqueo_monedas`)
- `calcTotales()` se ejecuta en cada cambio (cálculos en tiempo real, separación billetes/monedas)
- Validación por paso solo en pasos 0, 2 y 4 (base, egresos, digitales)
- Footer sticky muestra diferencia en vivo (verde si cuadra, ámbar/rojo si no)
- **Layout**: dos columnas (md+): wizard izquierda, `SummaryPanel` derecha

**Problema resuelto: Fecha cambia**:
- `useEffect` con `useRef` resetea form cuando `fecha` cambia (evita persistencia cross-date)
- Dependencias en `use-auto-save.ts` actualizadas para fecha

### Detalle por paso

| Paso | Componente | Descripción | Complejidad |
|------|-----------|-------------|-------------|
| 1 | `step-base.tsx` | Dos inputs (Billetes + Monedas) con auto-suma, alerta de confirmación, tracking de edición (`base_editado`). Admin ve si fue editada con alerta amarilla | Baja |
| 2 | `step-pizza.tsx` | Inventario de pizza: 3 secciones (Apertura, Producción, Cierre). QtyStepper para ruedas y porciones. Footer sticky con disponible/restante/consumidas. Nota opcional | Baja |
| 3 | `step-egresos.tsx` | `useFieldArray` para gastos con concepto, categoría, unidad, monto y método de pago. Dos totales: efectivo y transferencia | Media |
| 4 | `step-ventas.tsx` | Tabla spreadsheet filtrable por unidad (pills de categoría). Import de Loyverse. Bottom sheet para editar cantidades. Total sticky en footer | Media |
| 5 | `step-digitales.tsx` | `useFieldArray` para Nequi/Transferencia/Datáfono. Pre-llenado con datáfono de Loyverse. Add/remove dinámico | Media |
| 6 | `step-arqueo.tsx` | Grid de denominaciones con `QtyStepper` por cada una + separación de monedas con `MoneyInput`. Subtotal por fila. Total contado (billetes + monedas) en footer sticky | Baja |
| 7 | `step-resumen.tsx` | Tarjeta de cuadre (verde/rojo). Desglose: Base + Ventas - Digital - Egresos = Esperado. Alerta si \|diferencia\| > $10,000. Nota obligatoria si descuadrado (max 280 chars) | Baja |

### Step 4 (Ventas) — detalles adicionales

- **Tabla spreadsheet**: desktop muestra tabla con columnas Artículo|P.Unit|Cantidad|Total|✕ (table-fixed)
- **Mobile**: rows compactos con nombre, precio × qty = total, tap abre QtySheet
- **Filtros por categoría**: pills de unidad de negocio + "Venta" (solo productos con qty > 0)
- **Import Loyverse**: botón que llama `importarVentasLoyverse(fecha)` y llena el formulario
- **Bottom sheet**: tap en producto abre `QtySheet` con `QtyStepper`
- **Estado local**: `imported`, `selectedUnidad`, `sheetProduct`

### Flujo de datos

```
Page Load (RSC)
  ↓
loadCatalogos() + loadCierreByFecha() + loadVentasLoyverse() + loadInventarioPizza()
  ↓
CierreWizard recibe props
  ↓
buildDefaults() → pre-llena form (draft > Loyverse > vacío, pizza desde pizzaExistente)
  ↓
Usuario navega pasos (useState)
  ↓
Cada step lee/escribe vía useFormContext
  ↓
calcTotales() en cada cambio (cálculo en vivo)
  ↓
"Guardar" → guardarCierre(values, false) → upsert + hijos
  ↓
"Cerrar día" → validación → confirmación → guardarCierre(values, true)
```

### Server Actions (`actions.ts`)

- **`guardarCierre(raw, cerrar, fecha?)`**: auth vía `createClient()` + DB vía `createAdminClient()` (bypasa RLS). Valida con Zod (schema estricto) → carga productos de Pizzería y calcula la liquidación → upsert `cierres_diarios` (incluye los campos `pizzeria_*`) → delete hijos → insert hijos (solo rows con qty/monto > 0) → upsert `inventario_pizza` (con cálculo de vendidas TPV, reutilizando la misma carga de productos) → revalidate `/cierre` y `/dashboard`
- **`guardarCierreDraft(raw, fecha)`**: misma estrategia auth+admin. Valida con `cierreDraftSchema` (relajado) → upsert como `estado: 'abierto'` → delete/insert hijos (filtra incompletos) → upsert `inventario_pizza` (sin vendidas) → **NO revalidate** (evita re-render durante auto-save) → retorna `{ ok, cierreId, savedAt }`
- **`importarVentasLoyverse(fecha)`**: llama `loadVentasLoyverse()` para importar bajo demanda
- **`reorderProductosAction(orden[])`**: actualiza campo `orden` en tabla `productos`

### Patrones importantes

- **Form como source of truth**: React Hook Form maneja todo el estado, sin state manager externo
- **Delete + reinsert**: al guardar, se borran todos los hijos y se reinsertan (más seguro que upsert para arrays)
- **Mobile-first**: targets grandes (h-12, h-14), bottom sheets, teclado numérico, haptic feedback, footers sticky
- **Loyverse pre-carga en SSR**: los datos se cargan en el server component y se pasan como props; el import en paso 2 es bajo demanda
- **Validación escalonada**: por paso al navegar, completa al cerrar
- **Doble Zod schema**: `cierreFullSchema` (estricto, para cierre final) + `cierreDraftSchema` (relajado, para auto-save de borradores parciales)

### Auto-guardado (3 capas de protección)

El wizard protege contra pérdida de datos con 3 capas combinadas en `hooks/use-auto-save.ts`:

| Capa | Mecanismo | Trigger | Delay |
|------|-----------|---------|-------|
| 1 | `beforeunload` + `visibilitychange` | Cerrar pestaña / cambiar app (iOS Safari) | Inmediato |
| 2 | `localStorage` | Cada cambio en el formulario | Debounce 2s |
| 3 | `guardarCierreDraft()` a DB | Cada cambio / al cambiar de paso | Debounce 30s / inmediato |

**localStorage key**: `cierre-draft-{userId}-{fecha}` — almacena `{ values, step, timestamp }`

**Flujo al montar**: lee localStorage → compara `draft.timestamp` con `existente.updated_at` → si local es más reciente, muestra `RestoreDraftBanner`; si DB es más reciente, descarta local.

**Coordinación con guardado manual**: `notifyManualSave()` actualiza snapshot, cancela debounce pendiente y limpia localStorage.

**UI**:
- `SaveStatusIndicator`: en footer sticky, muestra "Guardando..." / "Guardado HH:MM" / "Error al guardar"
- `RestoreDraftBanner`: después del ProgressSteps, ofrece restaurar o descartar borrador local

**No hace auto-save si**: el cierre ya está cerrado (`cerrado === true`)

### SummaryPanel (componente nuevo)

Panel lateral sticky que muestra resumen en tiempo real mientras el empleado llena el wizard.

**Props**:
- `totales`: objeto calculado por `calcTotales()` (base, ventasTpv, digital, egresosEfectivo, arqueo, efectivoEsperado, diferencia, cuadrado)
- `formValues`: valores actuales del formulario (watch completo)
- `currentStep`: índice del paso actual (0-6)

**Estructura**:
- Fila por concepto: Base (+), Ventas (+), Digitales (-), Egresos (-), sep, Efectivo esperado, Arqueo, Diferencia
- Active step destacado con `bg-primary/8 ring-1 ring-primary/20`
- Diferencia color-coded: verde (cuadrado), ámbar (sobra), rojo (falta)
- Detail text: "3 productos", "2 transacciones", "1 gasto"
- Footer: ecuación "Esperado = Base + Ventas − Digital − Egresos"
- Hidden en mobile (<md), visible en tablet/desktop (md+)
- Glassmorphism styling (glass-panel class)

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
- Tablas que ya tienen GRANT para `service_role`: `profiles`, `productos`, `unidades_negocio`, `sync_loyverse_pendientes`, `cierres_diarios`, `ventas_producto`, `ingresos_digitales`, `egresos`, `arqueo_billetes`, `inventario_pizza`, `cuentas_digitales`.

### RLS: `FOR ALL` no cubre INSERT

Una policy `FOR ALL` con solo cláusula `USING` **no permite INSERT** — PostgreSQL exige `WITH CHECK` para inserciones. Si el admin recibe un error al crear un registro, revisar esto primero. El patrón correcto es separar en tres policies (`FOR INSERT ... WITH CHECK`, `FOR UPDATE ... USING + WITH CHECK`, `FOR DELETE ... USING`), como en `cuentas_digitales`.

### Eliminación de registros con tablas hijas

- Aunque las FK tienen `ON DELETE CASCADE` en PostgreSQL, al eliminar vía la API REST de Supabase (PostgREST), el CASCADE puede no ejecutarse correctamente.
- **Patrón seguro**: eliminar las tablas hijas manualmente primero, luego el padre. Ver `eliminarCierresAction` en `features/dashboard/actions.ts` como referencia.
- Tablas hijas de `cierres_diarios`: `ventas_producto`, `ingresos_digitales`, `egresos`, `arqueo_billetes`.

### RLS — Políticas existentes

- Todas las tablas tienen RLS habilitado.
- Patrón general: empleados acceden solo a sus propios registros del día actual; admin tiene acceso total (`ALL`).
- Helper functions: `get_my_role()` y `is_my_cierre(cierre_id)` para las policies.

## Layout por rol

### Admin
- Sidebar (navigation left side, desktop only)
- Bottom nav (mobile only)
- max-w-5xl container
- Acceso a `/dashboard/*`, `/dashboard/catalogos`, `/dashboard/cierres`, `/dashboard/usuarios`, etc.

### Empleado
- **Sin sidebar ni bottom nav** (pantalla limpia, optimizada para tablet)
- max-w-5xl container
- Wizard de cierre con layout dos columnas (wizard left, SummaryPanel right en md+)
- Acceso solo a `/cierre` (redirige a `/cierre` en login)

## Convenciones del código

- Server Actions en archivos `actions.ts` dentro de cada feature
- Loaders (queries) en archivos `loaders.ts`
- Validación con Zod schemas en `schema.ts`
- Componentes de UI en `components/ui/` (shadcn)
- Layout components en `components/layout/`
- Para eliminar registros con hijos, usar el patrón de eliminación manual de hijos antes del padre (no confiar en CASCADE vía PostgREST)
- **Glassmorphism**: clases `glass-panel` y `btn-gradient` en `globals.css`
- **Animations**: usar `motion/react` (Framer Motion) y `@formkit/auto-animate` para listas

## Dashboard Admin — Estado actual y brechas

### Qué ve el admin HOY

- **KPIs de hoy**: Ventas TPV, Efectivo esperado, Digital, Diferencia (color-coded)
- **Alertas TOP 5**: Últimos cierres descuadrados con magnitud
- **Tabla cierres últimos 14 días**: Fecha | Empleado | Ventas | Digital | Arqueo | Diferencia | Estado
- **Vista detalle por cierre**: Resumen completo, desglose de ventas, digitales, egresos, arqueo
- **Gestión**: Productos, categorías, unidades, denominaciones, usuarios, sync Loyverse
- **Eliminación bulk**: Multi-select de cierres con delete

### Qué FALTA (según necesidades del dueño)

| # | Módulo | Por qué | Prioridad |
|----|--------|--------|-----------|
| 1 | **Gráficas históricas** (ventas/día, egresos/día, diferencias trend) | Sin tendencias, navega a ciegas | 🔴 Alta |
| 2 | **Rentabilidad por unidad** (v_rentabilidad_unidad existe pero no se usa) | Saber qué línea de negocio es rentable | 🔴 Alta |
| 3 | **Merma de pizza** (inventario_pizza se captura pero es invisible) | Detectar pérdidas/robos en pizza | 🟠 Media |
| 4 | **Resumen egresos** (por categoría, por empleado, por período) | Controlar gastos es crítico | 🟠 Media |
| 5 | **Alertas inteligentes** (día sin cierre, merma alta, caída ventas, egreso inusual) | Supervisión proactiva | 🟠 Media |
| 6 | **Resumen mensual/acumulados** (ventas $X, gastos $Y, utilidad $Z) | Cierre mensual del dueño | 🟠 Media |
| 7 | **Exportación CSV/PDF** (reporte para contador, cruce bancario) | Integración con contabilidad | 🟡 Baja |
| 8 | **Comparativo entre empleados** (quién vende más, quién descuadra más) | Benchmarking y gestión | 🟡 Baja |
| 9 | **Facturas a proveedores** (código existe pero tabla no está en migration) | Gestión de compras | 🟡 Baja |

### Datos ya capturados que no se muestran

- `base_billetes` / `base_monedas` — Mostrados en detalle como desglose ✅
- `base_editado` — Mostrado como alerta amarilla en detalle ✅
- `arqueo_monedas` — Mostrado en detalle, separado de billetes ✅
- `inventario_pizza` completo — **Invisible** (ruedas, porciones, merma)
- `v_rentabilidad_unidad` — View SQL existe, nunca se renderiza
- `egresos` detallado — Solo visible en detalle de cierre individual, no hay resumen cross-cierres

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
