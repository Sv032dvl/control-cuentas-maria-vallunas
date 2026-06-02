# Control de Cuentas María Vallunas — Contexto del Proyecto

> Documento de traspaso para continuar el desarrollo en un chat nuevo.
> Última actualización: 2026-06-01

---

## 1. Objetivo del sistema

Sistema web para reemplazar la hoja de Numbers/Excel que el negocio usa actualmente para el cierre diario de caja. Dos roles:

- **Empleado**: registra cada noche el cierre (ventas por producto, egresos, ingresos digitales, arqueo de billetes).
- **Admin**: consulta dashboards de rentabilidad por unidad de negocio, edita catálogos, recibe alertas de cierres no cuadrados.

El negocio tiene flujo de caja constante con ventas diarias > 2M COP.

---

## 2. Decisiones de alcance (ya cerradas)

| Decisión | Valor |
|---|---|
| Alcance v1 | **MVP funcional**: login + roles, formulario cierre diario, dashboard básico ingresos vs egresos |
| Usuarios | 1 empleado, 1 sede |
| Stack | **React + Supabase + Vercel + Tailwind** |
| Mobile | Web responsive (PWA-ready) |
| Idioma | Español |

---

## 3. Particularidad clave del negocio: dos unidades en una caja

En el mismo local operan **dos unidades de negocio** que comparten una sola caja física:

- **Empanadas**
- **Pizzería**
- **Bebidas** (limonada — se vende cruzada entre ambos)
- **Compartido** (gastos comunes: luz, agua, arriendo, cebolla, etc.)

### Reglas operativas

- La caja física es **una sola** → el cuadre diario es global, no por unidad.
- Los pagos digitales (Nequi/transferencia/datáfono) caen a **una sola cuenta**, sin etiqueta de unidad.
- La separación por unidad es **contable**, se calcula en reportes mediante prorrateo.

### Prorrateo

- **Ingresos digitales**: se reparten por unidad proporcionalmente al % de ventas TPV del día.
- **Egresos `Compartido`**: misma lógica (proporcional a ventas).
- **Bebidas**: proporcional por defecto, pero **el admin puede sobreescribir el %** desde panel de configuración.
- Las reglas de prorrateo tienen **vigencia temporal** (`vigente_desde`/`vigente_hasta`) para que reportes históricos no se distorsionen si la regla cambia.

---

## 4. Ecuación maestra del cierre (validación de integridad)

```
Ventas TPV = Ingresos digitales + Efectivo contado + Egresos pagados en efectivo ± Diferencia
```

**Comportamiento al guardar un cierre no cuadrado:**
- El sistema **guarda igual** (no bloquea operación).
- Marca el cierre `cuadrado=false` y dispara alerta al admin.
- Empleado puede añadir `nota_diferencia` opcional.

---

## 5. Modelo de datos (esquema definitivo)

### Catálogos (editables por admin)

```
unidades_negocio
  └─ id, nombre ('Empanadas' | 'Pizzería' | 'Bebidas' | 'Compartido'), activo

productos
  └─ id, nombre, precio, unidad_id (FK), activo

categorias_egreso
  └─ id, nombre ('nómina' | 'insumos' | 'cortesía' | 'servicios' | 'otros'), activo

denominaciones_billete
  └─ id, valor (2000, 5000, 10000, 20000, 50000, 100000), activo

reglas_prorrateo
  └─ id, unidad_origen, regla_tipo
     ('proporcional_ventas' | 'fijo_porcentual' | 'asignacion_directa'),
     config_json, vigente_desde, vigente_hasta, activo
```

### Operativo (datos del día a día)

```
profiles
  └─ id (FK auth.users), role ('empleado' | 'admin'), nombre, activo

cierres_diarios       (1 registro padre por noche)
  └─ id, fecha, empleado_id (FK profiles), base_inicial,
     efectivo_contado, ventas_tpv_total (calculado),
     ingresos_digitales_total (calculado), efectivo_esperado (calculado),
     diferencia (calculado), cuadrado (bool), nota_diferencia,
     estado ('abierto' | 'cerrado'), created_at, updated_at

ventas_producto       (N hijos por cierre)
  └─ id, cierre_id (FK), producto_id (FK), cantidad, precio_unitario,
     total (calculado: cantidad * precio_unitario)

egresos               (N hijos por cierre)
  └─ id, cierre_id (FK), concepto, categoria_id (FK), unidad_id (FK),
     monto, metodo_pago ('efectivo' | 'transferencia')

ingresos_digitales    (N hijos por cierre)
  └─ id, cierre_id (FK), metodo ('nequi' | 'transferencia' | 'datafono'),
     monto, descripcion (opcional)

arqueo_billetes       (N hijos por cierre, uno por denominación)
  └─ id, cierre_id (FK), denominacion_id (FK), cantidad,
     subtotal (calculado: denominacion.valor * cantidad)
```

### Módulo paralelo

```
inventario_pizza      (control de mermas masa de pizza)
  └─ id, fecha, ruedas_inicio, porciones_inicio,
     ruedas_final, porciones_final, horneada,
     porciones_consumidas (calculado),
     porciones_vendidas_tpv (cruce con ventas_producto),
     diferencia (calculado), notas
```

### Vistas calculadas (NO se persisten)

```
v_rentabilidad_unidad   → aplica reglas_prorrateo vigentes para reportes
v_cuadre_diario         → ventas vs digital vs efectivo vs egresos
v_alertas_admin         → cierres sin cuadrar, diferencias grandes, etc.
```

---

## 6. RLS (Row Level Security) — política a aplicar

| Tabla | Empleado | Admin |
|---|---|---|
| profiles | SELECT propio | SELECT/UPDATE todos |
| cierres_diarios | INSERT propios, SELECT/UPDATE propios del día actual | SELECT/UPDATE/DELETE todos |
| ventas_producto, egresos, ingresos_digitales, arqueo_billetes | INSERT/SELECT/UPDATE solo cierres propios del día actual | SELECT/UPDATE/DELETE todos |
| catálogos (productos, categorías, etc.) | SELECT (solo activos) | SELECT/INSERT/UPDATE/DELETE |
| reglas_prorrateo | sin acceso | SELECT/INSERT/UPDATE/DELETE |
| inventario_pizza | INSERT/SELECT/UPDATE propio del día | SELECT/UPDATE/DELETE todos |

**Activar:** RLS automático sobre todas las tablas nuevas (ya configurado al crear el proyecto).

---

## 7. Datos a sembrar (extraídos de la hoja original)

### Productos con precios reales

| Producto | Precio | Unidad |
|---|---|---|
| Empanada | 3.700 | Empanadas |
| Combo 2 empanadas + limonada | 9.500 | Empanadas |
| Box 5 empanadas | 18.000 | Empanadas |
| Box 10 empanadas | 36.000 | Empanadas |
| Mini empanada | 1.700 | Empanadas |
| Arepa huevo-carne | 5.700 | Empanadas |
| Arepa de huevo | 4.000 | Empanadas |
| Pizza | 9.800 | Pizzería |
| Pizza especial | 11.000 | Pizzería |
| Limonada | 2.500 | Bebidas |

### Denominaciones de billetes

2.000 / 5.000 / 10.000 / 20.000 / 50.000 / 100.000

### Categorías de egreso iniciales

nómina, insumos, cortesías/consumo interno, servicios, otros

### Métodos de pago digital

nequi, transferencia, datáfono

---

## 8. Setup de Supabase (estado actual)

- **Proyecto nuevo creado** en organización `SeVaLinc` (el anterior fue eliminado por seguridad — service_role expuesta).
- **Project URL**: `https://pweomcrwlghsfadmnryf.supabase.co`
- **Project ref**: `pweomcrwlghsfadmnryf`
- **Region**: Americas
- **Security flags recomendados al crear**:
  - ☑ Enable Data API
  - ☐ Automatically expose new tables (DESACTIVADO — exposición manual)
  - ☑ Enable automatic RLS (ACTIVADO)

### Credenciales (manejo seguro)

- `Project URL` y `anon key` → van en `.env.local` del frontend (variables `VITE_SUPABASE_*`)
- `service_role key` → NUNCA al frontend ni al chat. Solo para migraciones server-side vía SQL Editor o MCP local de Supabase configurado en Claude Desktop.

### Aplicación de migraciones — método seguro

**Opción recomendada**: el agente entrega un archivo `.sql` y el usuario lo aplica manualmente en Supabase Dashboard → SQL Editor → New Query → pegar → Run.

Esto evita compartir `service_role` keys en chats.

---

## 9. Plan de ejecución (actualizado 2026-06-01)

```
✅ FASE 0 — Discovery y arquitectura
✅ FASE 3 — Frontend MVP base (deployado, SIN BD aún)
   - Repo: github.com/Sv032dvl/control-cuentas-maria-vallunas
   - Prod: https://app-rho-mauve-39.vercel.app
   - Stack real: Next.js 16.2.6 + Tailwind (no Vite — cambio en implementación)
   - Auth básica + rutas protegidas por rol
   - 14 rutas montadas: /, /login, /cierre, /dashboard,
     /dashboard/usuarios, /dashboard/catalogos, /dashboard/cierres,
     /dashboard/cierres/[id], /inventario
   - Variables de entorno configuradas en Vercel
   - ⚠️ Las páginas existen pero hacen queries a tablas que aún no existen

🔜 FASE 1.2 — Base de datos (BLOQUEANTE: sin esto el sistema NO opera)
   1.2.1. Generar SQL completo (tablas + RLS + catálogos + vistas)
   1.2.2. Aplicar manualmente en Supabase SQL Editor
   1.2.3. Autogenerar tipos TypeScript: `supabase gen types typescript`
   1.2.4. Conectar componentes existentes a queries reales

⏳ FASE 2 — Validación UX
   2.1. Probar formulario nocturno con empleado real
   2.2. Ajustar según feedback

⏳ FASE 4 — Dashboard avanzado
   4.1. Reportes con prorrateo (vistas SQL calculadas)
   4.2. Alertas de cierre no cuadrado
   4.3. Editor de catálogos y reglas (vista admin)
   4.4. Módulo inventario pizza
```

### Decisión técnica: Next.js en vez de Vite
Cambio respecto al stack inicial. Ventajas que justifican el cambio:
- Rutas anidadas con `app/` directory (más limpio para múltiples vistas admin)
- Server Components → menos JS al cliente, mejor performance móvil
- Integración nativa con Vercel (deploy + edge functions)
- Middleware nativo para auth gating por rol

### Estado de seguridad
- ✅ `anon key` con prefijo `NEXT_PUBLIC_` (correcto, va al cliente)
- ✅ `service_role` nunca en código ni chats
- ✅ `.gitignore` cubre `.env*`
- ⚠️ RLS policies aún sin definir (parte de Fase 1.2)

### Decisiones para la migración SQL (Fase 1.2)
- **Datos de prueba**: SÍ, incluir 5-7 cierres ficticios de días pasados para que el dashboard admin tenga datos visibles desde el primer login. Marcarlos con flag o nota para borrarlos fácilmente cuando empiece operación real.
- **Usuarios iniciales**: NINGUNO creado aún. La migración debe incluir instrucciones para:
  1. Crear admin manualmente desde Supabase Dashboard → Authentication → Users
  2. Asignarle rol `admin` insertando fila en `profiles`
  3. Mismo proceso para empleado (después del admin)

---

## 10. Preferencias del usuario (Sebastián)

- Responder en español, tono directo, sin formalidades.
- Stack: React, Supabase, Vercel, Tailwind.
- Pensar en escalabilidad y arquitectura a largo plazo.
- Anti-dispersión: no abrir más de 2 hilos en paralelo.
- Optimización de tokens: prioridad alta.
- Cuando se escribe código: explicar brevemente qué hace cada paso y por qué.
- Sugerir proactivamente herramientas/patrones mejores aunque el usuario no los conozca.

---

## 11. Decisiones de diseño importantes (no olvidar)

1. **Cuadre de caja es operativo (global), rentabilidad por unidad es contable (calculada).** Dos capas separadas.
2. **Reglas de prorrateo con vigencia temporal** → no reescriben historia.
3. **Vistas SQL calculadas** para reportes → cambiar regla recalcula todo automáticamente.
4. **Catálogos editables por admin** → sin necesidad de tocar código para añadir productos/categorías.
5. **PWA-ready desde el día 1** → mobile-first.

---

## 12. Próximo paso al abrir chat nuevo

> "Lee `00_CONTEXTO_PROYECTO.md` y continuamos desde la Fase 1.2: generar el SQL completo (tablas + RLS + seeds) para aplicar en Supabase."
