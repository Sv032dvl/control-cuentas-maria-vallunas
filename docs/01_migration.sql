-- =============================================================
-- MIGRACIÓN COMPLETA — Control de Cuentas María Vallunas
-- Fase 1.2: Tablas + RLS + Seeds
-- Aplicar en: Supabase SQL Editor (una sola ejecución)
-- =============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONES
-- ─────────────────────────────────────────────────────────────
-- uuid_generate_v4() como fallback; Supabase ya tiene gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─────────────────────────────────────────────────────────────
-- 1. CATÁLOGOS
-- ─────────────────────────────────────────────────────────────

-- 1.1 Unidades de negocio
CREATE TABLE unidades_negocio (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true
);

-- 1.2 Productos
CREATE TABLE productos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         text NOT NULL,
  precio         numeric(12,2) NOT NULL CHECK (precio >= 0),
  unidad_id      uuid NOT NULL REFERENCES unidades_negocio(id),
  activo         boolean NOT NULL DEFAULT true
);

-- 1.3 Categorías de egreso
CREATE TABLE categorias_egreso (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  activo boolean NOT NULL DEFAULT true
);

-- 1.4 Denominaciones de billete
CREATE TABLE denominaciones_billete (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valor  integer NOT NULL UNIQUE CHECK (valor > 0),
  activo boolean NOT NULL DEFAULT true
);

-- 1.5 Reglas de prorrateo
-- config_json almacena parámetros específicos según regla_tipo:
--   proporcional_ventas → {} (sin config adicional)
--   fijo_porcentual     → {"porcentaje": 30}
--   asignacion_directa  → {"unidad_destino_id": "<uuid>"}
CREATE TABLE reglas_prorrateo (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad_origen   uuid NOT NULL REFERENCES unidades_negocio(id),
  regla_tipo      text NOT NULL CHECK (
    regla_tipo IN ('proporcional_ventas','fijo_porcentual','asignacion_directa')
  ),
  config_json     jsonb NOT NULL DEFAULT '{}',
  vigente_desde   date NOT NULL,
  vigente_hasta   date,              -- NULL = vigente indefinidamente
  activo          boolean NOT NULL DEFAULT true,
  CONSTRAINT vigencia_valida CHECK (
    vigente_hasta IS NULL OR vigente_hasta >= vigente_desde
  )
);


-- ─────────────────────────────────────────────────────────────
-- 2. OPERATIVO
-- ─────────────────────────────────────────────────────────────

-- 2.1 Profiles (extiende auth.users de Supabase)
-- Se crea automáticamente via trigger al hacer signup
CREATE TABLE profiles (
  id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role    text NOT NULL DEFAULT 'empleado' CHECK (role IN ('empleado','admin')),
  nombre  text NOT NULL,
  activo  boolean NOT NULL DEFAULT true
);

-- Trigger: crear profile vacío al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, nombre)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- 2.2 Cierres diarios (registro padre)
-- Los campos calculados se almacenan para rendimiento; se recalculan en el frontend/RPC.
CREATE TABLE cierres_diarios (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha                     date NOT NULL,
  empleado_id               uuid NOT NULL REFERENCES profiles(id),
  base_inicial              numeric(12,2) NOT NULL DEFAULT 0 CHECK (base_inicial >= 0),
  -- Calculados (actualizados al cerrar via RPC desde la app)
  ventas_tpv_total          numeric(12,2) NOT NULL DEFAULT 0,
  efectivo_contado          numeric(12,2) NOT NULL DEFAULT 0,
  ingresos_digitales_total  numeric(12,2) NOT NULL DEFAULT 0,
  efectivo_esperado         numeric(12,2) NOT NULL DEFAULT 0,
  diferencia                numeric(12,2) NOT NULL DEFAULT 0,
  cuadrado                  boolean NOT NULL DEFAULT false,
  nota_diferencia           text,
  estado                    text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','cerrado')),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT un_cierre_por_dia UNIQUE (fecha, empleado_id)
);

-- Recalcular updated_at automáticamente
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON cierres_diarios
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- 2.3 Ventas por producto
CREATE TABLE ventas_producto (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cierre_id       uuid NOT NULL REFERENCES cierres_diarios(id) ON DELETE CASCADE,
  producto_id     uuid NOT NULL REFERENCES productos(id),
  cantidad        integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
  total           numeric(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);


-- 2.4 Egresos
CREATE TABLE egresos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cierre_id    uuid NOT NULL REFERENCES cierres_diarios(id) ON DELETE CASCADE,
  concepto     text NOT NULL,
  categoria_id uuid NOT NULL REFERENCES categorias_egreso(id),
  unidad_id    uuid NOT NULL REFERENCES unidades_negocio(id),
  monto        numeric(12,2) NOT NULL CHECK (monto > 0),
  metodo_pago  text NOT NULL CHECK (metodo_pago IN ('efectivo','transferencia'))
);


-- 2.5 Ingresos digitales
CREATE TABLE ingresos_digitales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cierre_id   uuid NOT NULL REFERENCES cierres_diarios(id) ON DELETE CASCADE,
  metodo      text NOT NULL CHECK (metodo IN ('nequi','transferencia','datafono')),
  monto       numeric(12,2) NOT NULL CHECK (monto > 0),
  descripcion text
);


-- 2.6 Arqueo de billetes
CREATE TABLE arqueo_billetes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cierre_id        uuid NOT NULL REFERENCES cierres_diarios(id) ON DELETE CASCADE,
  denominacion_id  uuid NOT NULL REFERENCES denominaciones_billete(id),
  cantidad         integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  subtotal         numeric(12,2) NOT NULL DEFAULT 0,  -- calculado en v_cuadre_diario
  UNIQUE (cierre_id, denominacion_id)
);
-- subtotal se calcula en la vista v_cuadre_diario, no en columna generada.


-- 2.7 Inventario pizza
CREATE TABLE inventario_pizza (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha                  date NOT NULL,
  empleado_id            uuid NOT NULL REFERENCES profiles(id),
  ruedas_inicio          numeric(5,1) NOT NULL DEFAULT 0,
  porciones_inicio       integer NOT NULL DEFAULT 0,
  ruedas_final           numeric(5,1) NOT NULL DEFAULT 0,
  porciones_final        integer NOT NULL DEFAULT 0,
  horneada               integer NOT NULL DEFAULT 0,
  -- porciones_consumidas = (inicio + horneada) - final - vendidas_tpv
  porciones_vendidas_tpv integer,  -- se cruza con ventas_producto al cerrar
  diferencia             integer,  -- calculado al guardar
  notas                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (fecha)
);


-- ─────────────────────────────────────────────────────────────
-- 3. VISTAS CALCULADAS
-- ─────────────────────────────────────────────────────────────

-- 3.1 Cuadre diario (muestra todos los componentes de la ecuación maestra)
CREATE OR REPLACE VIEW v_cuadre_diario AS
SELECT
  cd.id,
  cd.fecha,
  cd.empleado_id,
  p.nombre AS empleado_nombre,
  cd.base_inicial,
  -- Total ventas TPV (suma de líneas de venta)
  COALESCE(vp_sum.ventas_tpv, 0) AS ventas_tpv_total,
  -- Total ingresos digitales
  COALESCE(id_sum.ingresos_digitales, 0) AS ingresos_digitales_total,
  -- Total egresos en efectivo
  COALESCE(eg_sum.egresos_efectivo, 0) AS egresos_efectivo_total,
  -- Total egresos en transferencia
  COALESCE(eg_sum.egresos_transferencia, 0) AS egresos_transferencia_total,
  -- Efectivo contado en arqueo
  COALESCE(ab_sum.efectivo_arqueo, 0) AS efectivo_arqueo,
  -- Efectivo esperado = base_inicial + ventas_tpv - ingresos_digitales - egresos_efectivo
  cd.base_inicial
    + COALESCE(vp_sum.ventas_tpv, 0)
    - COALESCE(id_sum.ingresos_digitales, 0)
    - COALESCE(eg_sum.egresos_efectivo, 0) AS efectivo_esperado,
  -- Diferencia = arqueo - esperado
  COALESCE(ab_sum.efectivo_arqueo, 0)
    - (cd.base_inicial
       + COALESCE(vp_sum.ventas_tpv, 0)
       - COALESCE(id_sum.ingresos_digitales, 0)
       - COALESCE(eg_sum.egresos_efectivo, 0)) AS diferencia,
  cd.cuadrado,
  cd.nota_diferencia,
  cd.estado
FROM cierres_diarios cd
JOIN profiles p ON p.id = cd.empleado_id
LEFT JOIN (
  SELECT cierre_id, SUM(total) AS ventas_tpv
  FROM ventas_producto GROUP BY cierre_id
) vp_sum ON vp_sum.cierre_id = cd.id
LEFT JOIN (
  SELECT cierre_id, SUM(monto) AS ingresos_digitales
  FROM ingresos_digitales GROUP BY cierre_id
) id_sum ON id_sum.cierre_id = cd.id
LEFT JOIN (
  SELECT
    cierre_id,
    SUM(CASE WHEN metodo_pago = 'efectivo' THEN monto ELSE 0 END) AS egresos_efectivo,
    SUM(CASE WHEN metodo_pago = 'transferencia' THEN monto ELSE 0 END) AS egresos_transferencia
  FROM egresos GROUP BY cierre_id
) eg_sum ON eg_sum.cierre_id = cd.id
LEFT JOIN (
  SELECT ab.cierre_id, SUM(ab.cantidad * db.valor) AS efectivo_arqueo
  FROM arqueo_billetes ab
  JOIN denominaciones_billete db ON db.id = ab.denominacion_id
  GROUP BY ab.cierre_id
) ab_sum ON ab_sum.cierre_id = cd.id;


-- 3.2 Rentabilidad por unidad (aplica reglas de prorrateo vigentes)
-- Lógica: ventas directas + prorrateo de digitales + prorrateo de gastos compartidos
CREATE OR REPLACE VIEW v_rentabilidad_unidad AS
WITH
-- Ventas directas por unidad y cierre
ventas_por_unidad AS (
  SELECT
    cd.fecha,
    un.id AS unidad_id,
    un.nombre AS unidad_nombre,
    COALESCE(SUM(vp.total), 0) AS ventas_directas
  FROM cierres_diarios cd
  CROSS JOIN unidades_negocio un
  LEFT JOIN ventas_producto vp ON vp.cierre_id = cd.id
  LEFT JOIN productos pr ON pr.id = vp.producto_id AND pr.unidad_id = un.id
  GROUP BY cd.fecha, un.id, un.nombre
),
-- Total ventas del día (para calcular proporciones)
total_ventas_dia AS (
  SELECT fecha, SUM(ventas_directas) AS total
  FROM ventas_por_unidad
  WHERE unidad_nombre != 'Compartido'  -- excluir compartido del total de proporción
  GROUP BY fecha
),
-- Proporción de cada unidad sobre el total del día
proporciones AS (
  SELECT
    vpu.fecha,
    vpu.unidad_id,
    vpu.unidad_nombre,
    vpu.ventas_directas,
    CASE WHEN tvd.total > 0
      THEN vpu.ventas_directas / tvd.total
      ELSE 0
    END AS proporcion
  FROM ventas_por_unidad vpu
  LEFT JOIN total_ventas_dia tvd ON tvd.fecha = vpu.fecha
),
-- Egresos directos por unidad
egresos_directos AS (
  SELECT
    cd.fecha,
    eg.unidad_id,
    SUM(eg.monto) AS egresos
  FROM egresos eg
  JOIN cierres_diarios cd ON cd.id = eg.cierre_id
  WHERE eg.unidad_id NOT IN (
    SELECT id FROM unidades_negocio WHERE nombre = 'Compartido'
  )
  GROUP BY cd.fecha, eg.unidad_id
),
-- Egresos compartidos totales del día
egresos_compartidos AS (
  SELECT
    cd.fecha,
    SUM(eg.monto) AS total_compartido
  FROM egresos eg
  JOIN cierres_diarios cd ON cd.id = eg.cierre_id
  JOIN unidades_negocio un ON un.id = eg.unidad_id AND un.nombre = 'Compartido'
  GROUP BY cd.fecha
),
-- Ingresos digitales totales del día
ingresos_dig_dia AS (
  SELECT
    cd.fecha,
    SUM(id2.monto) AS total_digital
  FROM ingresos_digitales id2
  JOIN cierres_diarios cd ON cd.id = id2.cierre_id
  GROUP BY cd.fecha
)
SELECT
  p.fecha,
  p.unidad_id,
  p.unidad_nombre,
  p.ventas_directas,
  -- Ingresos digitales prorrateados
  ROUND(COALESCE(idd.total_digital, 0) * p.proporcion, 2) AS digitales_prorrateados,
  -- Total ingresos
  p.ventas_directas + ROUND(COALESCE(idd.total_digital, 0) * p.proporcion, 2) AS ingresos_totales,
  -- Egresos directos
  COALESCE(ed.egresos, 0) AS egresos_directos,
  -- Egresos compartidos prorrateados
  ROUND(COALESCE(ec.total_compartido, 0) * p.proporcion, 2) AS compartidos_prorrateados,
  -- Total egresos
  COALESCE(ed.egresos, 0) + ROUND(COALESCE(ec.total_compartido, 0) * p.proporcion, 2) AS egresos_totales,
  -- Rentabilidad neta
  (p.ventas_directas + ROUND(COALESCE(idd.total_digital, 0) * p.proporcion, 2))
  - (COALESCE(ed.egresos, 0) + ROUND(COALESCE(ec.total_compartido, 0) * p.proporcion, 2))
  AS rentabilidad_neta
FROM proporciones p
LEFT JOIN egresos_directos ed ON ed.fecha = p.fecha AND ed.unidad_id = p.unidad_id
LEFT JOIN egresos_compartidos ec ON ec.fecha = p.fecha
LEFT JOIN ingresos_dig_dia idd ON idd.fecha = p.fecha
WHERE p.unidad_nombre != 'Compartido'  -- compartido no tiene P&L propio
ORDER BY p.fecha DESC, p.unidad_nombre;


-- 3.3 Alertas admin
CREATE OR REPLACE VIEW v_alertas_admin AS
SELECT
  cd.id AS cierre_id,
  cd.fecha,
  p.nombre AS empleado,
  'cierre_no_cuadrado' AS tipo_alerta,
  ABS(v.diferencia) AS magnitud,
  cd.nota_diferencia AS detalle
FROM cierres_diarios cd
JOIN profiles p ON p.id = cd.empleado_id
JOIN v_cuadre_diario v ON v.id = cd.id
WHERE cd.cuadrado = false
  AND cd.estado = 'cerrado'
ORDER BY cd.fecha DESC;


-- ─────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
-- Helper: obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Helper: verificar si un cierre pertenece al usuario actual
CREATE OR REPLACE FUNCTION is_my_cierre(p_cierre_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM cierres_diarios
    WHERE id = p_cierre_id AND empleado_id = auth.uid()
  );
$$;


-- Habilitar RLS en todas las tablas
ALTER TABLE profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_negocio       ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_egreso      ENABLE ROW LEVEL SECURITY;
ALTER TABLE denominaciones_billete ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglas_prorrateo       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierres_diarios        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_producto        ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos_digitales     ENABLE ROW LEVEL SECURITY;
ALTER TABLE arqueo_billetes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_pizza       ENABLE ROW LEVEL SECURITY;


-- ── profiles ──────────────────────────────────────────────────
CREATE POLICY "empleado_lee_propio" ON profiles FOR SELECT
  USING (id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "admin_gestiona_profiles" ON profiles FOR ALL
  USING (get_my_role() = 'admin');


-- ── catálogos (empleado solo lee activos) ────────────────────
CREATE POLICY "todos_leen_unidades_activas" ON unidades_negocio FOR SELECT
  USING (activo = true OR get_my_role() = 'admin');
CREATE POLICY "admin_gestiona_unidades" ON unidades_negocio FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "todos_leen_productos_activos" ON productos FOR SELECT
  USING (activo = true OR get_my_role() = 'admin');
CREATE POLICY "admin_gestiona_productos" ON productos FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "todos_leen_categorias_activas" ON categorias_egreso FOR SELECT
  USING (activo = true OR get_my_role() = 'admin');
CREATE POLICY "admin_gestiona_categorias" ON categorias_egreso FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "todos_leen_denominaciones_activas" ON denominaciones_billete FOR SELECT
  USING (activo = true OR get_my_role() = 'admin');
CREATE POLICY "admin_gestiona_denominaciones" ON denominaciones_billete FOR ALL
  USING (get_my_role() = 'admin');


-- ── reglas_prorrateo (solo admin) ───────────────────────────
CREATE POLICY "admin_gestiona_reglas" ON reglas_prorrateo FOR ALL
  USING (get_my_role() = 'admin');


-- ── cierres_diarios ──────────────────────────────────────────
-- Empleado: INSERT propio + SELECT/UPDATE propios del día actual
CREATE POLICY "empleado_inserta_cierre" ON cierres_diarios FOR INSERT
  WITH CHECK (empleado_id = auth.uid() AND get_my_role() = 'empleado');

CREATE POLICY "empleado_lee_cierres_propios" ON cierres_diarios FOR SELECT
  USING (
    empleado_id = auth.uid()
    OR get_my_role() = 'admin'
  );

CREATE POLICY "empleado_actualiza_cierre_del_dia" ON cierres_diarios FOR UPDATE
  USING (
    empleado_id = auth.uid()
    AND fecha = CURRENT_DATE
    AND estado = 'abierto'
    AND get_my_role() = 'empleado'
  );

CREATE POLICY "admin_gestiona_cierres" ON cierres_diarios FOR ALL
  USING (get_my_role() = 'admin');


-- ── tablas hijas (ventas, egresos, digitales, arqueo) ────────
-- Política genérica: INSERT/SELECT/UPDATE solo en cierres propios del día
-- DELETE solo admin

CREATE POLICY "empleado_gestiona_ventas" ON ventas_producto FOR ALL
  USING (
    is_my_cierre(cierre_id)
    AND (SELECT fecha FROM cierres_diarios WHERE id = cierre_id) = CURRENT_DATE
    AND get_my_role() = 'empleado'
  );
CREATE POLICY "admin_gestiona_ventas" ON ventas_producto FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "empleado_gestiona_egresos" ON egresos FOR ALL
  USING (
    is_my_cierre(cierre_id)
    AND (SELECT fecha FROM cierres_diarios WHERE id = cierre_id) = CURRENT_DATE
    AND get_my_role() = 'empleado'
  );
CREATE POLICY "admin_gestiona_egresos" ON egresos FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "empleado_gestiona_digitales" ON ingresos_digitales FOR ALL
  USING (
    is_my_cierre(cierre_id)
    AND (SELECT fecha FROM cierres_diarios WHERE id = cierre_id) = CURRENT_DATE
    AND get_my_role() = 'empleado'
  );
CREATE POLICY "admin_gestiona_digitales" ON ingresos_digitales FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "empleado_gestiona_arqueo" ON arqueo_billetes FOR ALL
  USING (
    is_my_cierre(cierre_id)
    AND (SELECT fecha FROM cierres_diarios WHERE id = cierre_id) = CURRENT_DATE
    AND get_my_role() = 'empleado'
  );
CREATE POLICY "admin_gestiona_arqueo" ON arqueo_billetes FOR ALL
  USING (get_my_role() = 'admin');


-- ── inventario_pizza ──────────────────────────────────────────
CREATE POLICY "empleado_gestiona_inventario_propio" ON inventario_pizza FOR ALL
  USING (
    (empleado_id = auth.uid() AND fecha = CURRENT_DATE AND get_my_role() = 'empleado')
    OR get_my_role() = 'admin'
  );


-- ─────────────────────────────────────────────────────────────
-- 5. SEEDS — Datos iniciales
-- ─────────────────────────────────────────────────────────────

-- 5.1 Unidades de negocio
INSERT INTO unidades_negocio (nombre) VALUES
  ('Empanadas'),
  ('Pizzería'),
  ('Bebidas'),
  ('Compartido');


-- 5.2 Categorías de egreso
INSERT INTO categorias_egreso (nombre) VALUES
  ('nómina'),
  ('insumos'),
  ('cortesías/consumo interno'),
  ('servicios'),
  ('otros');


-- 5.3 Denominaciones de billete
INSERT INTO denominaciones_billete (valor) VALUES
  (2000),
  (5000),
  (10000),
  (20000),
  (50000),
  (100000);


-- 5.4 Productos con precios reales
INSERT INTO productos (nombre, precio, unidad_id)
SELECT p.nombre, p.precio, un.id
FROM (VALUES
  -- Empanadas
  ('Empanada',                      3700,  'Empanadas'),
  ('Combo 2 empanadas + limonada',  9500,  'Empanadas'),
  ('Box 5 empanadas',               18000, 'Empanadas'),
  ('Box 10 empanadas',              36000, 'Empanadas'),
  ('Mini empanada',                 1700,  'Empanadas'),
  ('Arepa huevo-carne',             5700,  'Empanadas'),
  ('Arepa de huevo',                4000,  'Empanadas'),
  -- Pizzería
  ('Pizza',                         9800,  'Pizzería'),
  ('Pizza especial',                11000, 'Pizzería'),
  -- Bebidas
  ('Limonada',                      2500,  'Bebidas')
) AS p(nombre, precio, unidad_nombre)
JOIN unidades_negocio un ON un.nombre = p.unidad_nombre;


-- 5.5 Regla de prorrateo inicial: proporcional a ventas para Bebidas y Compartido
INSERT INTO reglas_prorrateo (unidad_origen, regla_tipo, config_json, vigente_desde)
SELECT id, 'proporcional_ventas', '{}', CURRENT_DATE
FROM unidades_negocio
WHERE nombre IN ('Bebidas', 'Compartido');


-- ─────────────────────────────────────────────────────────────
-- 6. ÍNDICES (rendimiento en consultas frecuentes)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_cierres_fecha       ON cierres_diarios (fecha DESC);
CREATE INDEX idx_cierres_empleado    ON cierres_diarios (empleado_id);
CREATE INDEX idx_cierres_cuadrado    ON cierres_diarios (cuadrado) WHERE cuadrado = false;
CREATE INDEX idx_ventas_cierre       ON ventas_producto (cierre_id);
CREATE INDEX idx_egresos_cierre      ON egresos (cierre_id);
CREATE INDEX idx_digitales_cierre    ON ingresos_digitales (cierre_id);
CREATE INDEX idx_arqueo_cierre       ON arqueo_billetes (cierre_id);
CREATE INDEX idx_inventario_fecha    ON inventario_pizza (fecha DESC);


-- ─────────────────────────────────────────────────────────────
-- FIN DE MIGRACIÓN
-- Siguiente paso: Fase 1.4 — generar tipos TypeScript con
-- "supabase gen types typescript --project-id <ref>"
-- ─────────────────────────────────────────────────────────────
