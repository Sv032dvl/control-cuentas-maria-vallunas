-- =============================================================
-- MIGRACIÓN: liquidación por propietario (generaliza la de Pizzería)
--
-- El negocio tiene dos dueños:
--   1 = Empanadas → empanadas, arepas y bebidas
--   2 = Pizzería  → pizza
--
-- Antes la liquidación estaba hardcodeada a la unidad Pizzería. Ahora cada
-- unidad lleva su `propietario` y el cálculo es genérico, así que mover o
-- agregar una unidad no requiere tocar código.
--
-- Detalle importante: Arepas y Bebidas no reciben gastos (acepta_gastos =
-- false), así que TODOS los costos del propietario 1 —nómina, insumos,
-- desechables— están en el bucket de Empanadas. Por eso su liquidación
-- suma las ventas de las tres unidades: contar solo las de empanadas
-- contra esos gastos lo subestimaría en ~$3.1M.
--
-- Aplicada: 2026-08-17
-- =============================================================

ALTER TABLE unidades_negocio
  ADD COLUMN propietario smallint CHECK (propietario IN (1, 2));

UPDATE unidades_negocio SET propietario = 1
  WHERE nombre IN ('Empanadas', 'Arepas', 'Bebidas');
UPDATE unidades_negocio SET propietario = 2
  WHERE nombre = 'Pizzería';
-- Adiciones y Compartido quedan sin dueño (están vacías);
-- Domicilios tampoco, porque es recaudo para terceros.

-- ─────────────────────────────────────────────────────────────
-- Liquidación del propietario 1, simétrica a la de Pizzería
-- ─────────────────────────────────────────────────────────────
ALTER TABLE cierres_diarios
  ADD COLUMN empanadas_ingresos numeric NOT NULL DEFAULT 0,
  ADD COLUMN empanadas_gastos numeric NOT NULL DEFAULT 0,
  ADD COLUMN empanadas_liquidacion numeric
    GENERATED ALWAYS AS (empanadas_ingresos - empanadas_gastos) STORED;

-- Backfill
WITH ventas_p1 AS (
  SELECT vp.cierre_id, SUM(vp.total) AS ingresos
    FROM ventas_producto vp
    JOIN productos p ON p.id = vp.producto_id
    JOIN unidades_negocio u ON u.id = p.unidad_id
   WHERE u.propietario = 1
   GROUP BY vp.cierre_id
),
gastos_p1 AS (
  SELECT e.cierre_id, SUM(e.monto) AS gastos
    FROM egresos e
    JOIN unidades_negocio u ON u.id = e.unidad_id
   WHERE u.propietario = 1
   GROUP BY e.cierre_id
)
UPDATE cierres_diarios cd
   SET empanadas_ingresos = COALESCE(v.ingresos, 0),
       empanadas_gastos   = COALESCE(g.gastos, 0)
  FROM (SELECT id FROM cierres_diarios) AS base
  LEFT JOIN ventas_p1 v ON v.cierre_id = base.id
  LEFT JOIN gastos_p1 g ON g.cierre_id = base.id
 WHERE cd.id = base.id;
