# Módulo: Facturas a Proveedores

## Estado: MVP funcional — pendiente de iterar

Módulo para que el admin controle las facturas de compras a proveedores. Accesible desde `/dashboard/facturas`.

## Lo que ya está implementado

### Base de datos
- **Tabla**: `facturas_proveedor` en Supabase (migración aplicada)
- **RLS**: solo admin (`get_my_role() = 'admin'`)
- **GRANTs**: service_role tiene SELECT, INSERT, UPDATE, DELETE
- **Columnas**: id, proveedor, numero_factura, fecha, fecha_vencimiento, monto, estado (pendiente|pagada|vencida), metodo_pago (efectivo|transferencia), fecha_pago, nota, created_at

### Archivos del feature

| Archivo | Propósito |
|---------|-----------|
| `src/app/(app)/dashboard/facturas/page.tsx` | Página RSC con `requireRole("admin")` |
| `src/features/facturas/schema.ts` | Schema Zod (`facturaSchema`) + tipo `Factura` + tipo `FacturaEstado` |
| `src/features/facturas/loaders.ts` | `loadFacturas()` — carga todas las facturas ordenadas por fecha DESC |
| `src/features/facturas/actions.ts` | 4 server actions: `crearFactura`, `editarFactura`, `marcarPagada`, `eliminarFactura` |
| `src/features/facturas/factura-form.tsx` | Formulario crear/editar con MoneyInput, dates, select método pago |
| `src/features/facturas/facturas-table.tsx` | Tabla con búsqueda, filtro por estado, badges de color, dropdown de acciones |

### Navegación
- Item "Facturas" con icono `FileText` agregado en `src/components/layout/nav-items.ts` (array `adminNav`)
- Posición: entre Catálogos y Usuarios

### Tipos
- Tabla agregada manualmente en `src/lib/database.types.ts` (buscar `facturas_proveedor`)

## Funcionalidades actuales

1. **Listado** — Todas las facturas con proveedor, #factura, fecha, vencimiento, monto, estado
2. **Crear** — Dialog con formulario completo
3. **Editar** — Misma dialog con datos pre-llenados
4. **Marcar pagada** — Desde dropdown: efectivo o transferencia. Registra `fecha_pago = hoy`
5. **Eliminar** — Con `confirm()` nativo
6. **Filtros** — Búsqueda por proveedor/número + filtro por estado
7. **Resumen** — Card con total pendiente de pago (solo si hay facturas pendientes)

## Lo que falta por hacer (ideas para iterar)

### Prioridad alta
- **Categorización**: agregar campo `categoria` (insumos, servicios, arriendo, etc.) — posiblemente un catálogo editable como `categorias_egreso`
- **Adjuntar imagen/PDF**: almacenar foto de la factura en Supabase Storage
- **Vencimiento automático**: cron o lógica que marque como "vencida" las facturas cuya `fecha_vencimiento < hoy` y estado = 'pendiente'

### Prioridad media
- **Historial de pagos**: si una factura se paga en cuotas, registrar cada pago parcial (tabla hija `pagos_factura`)
- **Dashboard de facturas**: gráfico de gastos por proveedor/mes, facturas vencidas pendientes
- **Exportar a Excel/CSV**: descarga del listado filtrado
- **Proveedor como catálogo**: tabla `proveedores` con datos de contacto, en vez de campo texto libre

### Prioridad baja
- **Recurrencia**: facturas que se repiten mensualmente (arriendo, servicios)
- **Alertas**: notificación al admin cuando una factura está por vencer (3 días antes)
- **Vinculación con egresos**: conectar una factura pagada con el egreso correspondiente del cierre

## Relación con otros módulos

- **Egresos del cierre**: las facturas pagadas en efectivo podrían cruzarse con los egresos registrados por el empleado en el cierre diario
- **Catálogos**: si se agrega categorización, reutilizar el patrón de `categorias_egreso`
- **MoneyInput**: el formulario reutiliza el componente de `features/cierre/components/money-input.tsx`

## SQL de la migración (referencia)

```sql
CREATE TABLE facturas_proveedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor text NOT NULL,
  numero_factura text,
  fecha date NOT NULL,
  fecha_vencimiento date,
  monto numeric NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'pagada', 'vencida')),
  metodo_pago text
    CHECK (metodo_pago IS NULL OR metodo_pago IN ('efectivo', 'transferencia')),
  fecha_pago date,
  nota text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE facturas_proveedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON facturas_proveedor
  FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON facturas_proveedor TO service_role;
CREATE INDEX idx_facturas_estado ON facturas_proveedor (estado);
CREATE INDEX idx_facturas_fecha ON facturas_proveedor (fecha DESC);
```
