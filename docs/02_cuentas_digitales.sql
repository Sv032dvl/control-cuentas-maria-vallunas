-- =============================================================
-- MIGRACIÓN: Cuentas digitales administrables
-- Reemplaza el enum hardcoded (nequi/transferencia/datafono)
-- por una tabla catálogo gestionada por el admin.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. NUEVA TABLA CATÁLOGO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE cuentas_digitales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  activo      boolean NOT NULL DEFAULT true,
  es_datafono boolean NOT NULL DEFAULT false,
  orden       smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Solo una cuenta puede ser la de datáfono (para mapeo Loyverse)
CREATE UNIQUE INDEX uq_cuenta_datafono
  ON cuentas_digitales (es_datafono) WHERE es_datafono = true;

-- ─────────────────────────────────────────────────────────────
-- 2. RLS + POLICIES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE cuentas_digitales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "todos leen cuentas_digitales"
  ON cuentas_digitales FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin inserta cuentas_digitales"
  ON cuentas_digitales FOR INSERT TO authenticated
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "admin modifica cuentas_digitales"
  ON cuentas_digitales FOR UPDATE TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "admin elimina cuentas_digitales"
  ON cuentas_digitales FOR DELETE TO authenticated
  USING (get_my_role() = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON cuentas_digitales TO service_role;

-- ─────────────────────────────────────────────────────────────
-- 3. SEED: crear cuentas iniciales a partir de los métodos actuales
-- ─────────────────────────────────────────────────────────────
INSERT INTO cuentas_digitales (nombre, es_datafono, orden) VALUES
  ('Nequi', false, 1),
  ('Transferencia', false, 2),
  ('Datafono', true, 3);

-- ─────────────────────────────────────────────────────────────
-- 4. MIGRAR ingresos_digitales: metodo → cuenta_digital_id
-- ─────────────────────────────────────────────────────────────

-- Agregar nueva columna FK (nullable temporalmente)
ALTER TABLE ingresos_digitales
  ADD COLUMN cuenta_digital_id uuid REFERENCES cuentas_digitales(id);

-- Migrar datos existentes
UPDATE ingresos_digitales SET cuenta_digital_id = (
  SELECT id FROM cuentas_digitales
  WHERE nombre = CASE
    WHEN metodo = 'nequi' THEN 'Nequi'
    WHEN metodo = 'transferencia' THEN 'Transferencia'
    WHEN metodo = 'datafono' THEN 'Datafono'
  END
);

-- Hacer NOT NULL tras migración
ALTER TABLE ingresos_digitales
  ALTER COLUMN cuenta_digital_id SET NOT NULL;

-- Eliminar columna vieja
ALTER TABLE ingresos_digitales DROP COLUMN metodo;
