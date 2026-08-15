-- =============================================================
-- MIGRACIÓN: Liquidación diaria de Pizzería + conteo de pizzas
--
-- El negocio es una sola caja con dos propietarios:
--   Propietario 1 → Empanadas, Arepas, Bebidas
--   Propietario 2 → Pizzería
--
-- Cada cierre calcula cuánto le corresponde al propietario 2
-- (ingresos − gastos) y cuántas pizzas se vendieron, separando
-- tradicionales de especiales.
--
-- Aplicada: 2026-08-15
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Clasificación tradicional/especial en el producto
--    NULL = no es una pizza (adiciones, otros productos)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE productos ADD COLUMN tipo_pizza text
  CHECK (tipo_pizza IN ('tradicional','especial'));

-- Seed desde los precios vigentes de la unidad Pizzería
UPDATE productos SET tipo_pizza = 'tradicional'
  WHERE unidad_id = '75340370-d308-44ff-9cce-74bcfc0358ed' AND precio = 9800;

UPDATE productos SET tipo_pizza = 'especial'
  WHERE unidad_id = '75340370-d308-44ff-9cce-74bcfc0358ed' AND precio IN (11000, 13500);

-- "Variedad de Tamaño o sabor" tiene precio libre ($0): se clasifica como
-- tradicional para preservar el conteo de porciones existente.
UPDATE productos SET tipo_pizza = 'tradicional'
  WHERE unidad_id = '75340370-d308-44ff-9cce-74bcfc0358ed' AND precio = 0;

-- ─────────────────────────────────────────────────────────────
-- 2. Reasignar adiciones de pizza a la unidad Pizzería
--    Adiciones (2 productos) y Compartido (1) eran todos de pizza
--    y tenían 0 ventas, así que no distorsiona el histórico.
--    Quedan con tipo_pizza NULL: suman ingresos pero no cuentan
--    como pizzas vendidas ni consumen porciones de inventario.
--
--    La unidad Compartido se conserva: v_rentabilidad_unidad la
--    usa por nombre para prorratear gastos comunes.
-- ─────────────────────────────────────────────────────────────
UPDATE productos SET unidad_id = '75340370-d308-44ff-9cce-74bcfc0358ed'
  WHERE unidad_id IN (
    '9abffc19-e2e5-4624-af0e-3c64cef76769',  -- Adiciones
    'ac1d7864-f531-493f-a661-3a7c9609e1b2'   -- Compartido
  );

-- ─────────────────────────────────────────────────────────────
-- 3. Snapshot de la liquidación en el cierre
--    Se persiste (en vez de calcularse en una vista) para que una
--    liquidación ya pagada no cambie si el admin reclasifica una
--    pizza después. Mismo patrón que porciones_vendidas_tpv.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE cierres_diarios
  ADD COLUMN pizzeria_ingresos numeric NOT NULL DEFAULT 0,
  ADD COLUMN pizzeria_gastos numeric NOT NULL DEFAULT 0,
  ADD COLUMN pizzeria_liquidacion numeric
    GENERATED ALWAYS AS (pizzeria_ingresos - pizzeria_gastos) STORED,
  ADD COLUMN pizzas_tradicionales integer NOT NULL DEFAULT 0,
  ADD COLUMN pizzas_especiales integer NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- 4. Backfill de los cierres existentes
-- ─────────────────────────────────────────────────────────────
WITH ventas_pz AS (
  SELECT vp.cierre_id,
         SUM(vp.total) AS ingresos,
         SUM(vp.cantidad * COALESCE(p.multiplicador,1))
           FILTER (WHERE p.tipo_pizza = 'tradicional') AS tradicionales,
         SUM(vp.cantidad * COALESCE(p.multiplicador,1))
           FILTER (WHERE p.tipo_pizza = 'especial') AS especiales
    FROM ventas_producto vp
    JOIN productos p ON p.id = vp.producto_id
   WHERE p.unidad_id = '75340370-d308-44ff-9cce-74bcfc0358ed'
   GROUP BY vp.cierre_id
),
gastos_pz AS (
  SELECT cierre_id, SUM(monto) AS gastos
    FROM egresos
   WHERE unidad_id = '75340370-d308-44ff-9cce-74bcfc0358ed'
   GROUP BY cierre_id
)
UPDATE cierres_diarios cd
   SET pizzeria_ingresos    = COALESCE(v.ingresos, 0),
       pizzeria_gastos      = COALESCE(g.gastos, 0),
       pizzas_tradicionales = COALESCE(v.tradicionales, 0),
       pizzas_especiales    = COALESCE(v.especiales, 0)
  FROM (SELECT id FROM cierres_diarios) AS base
  LEFT JOIN ventas_pz v ON v.cierre_id = base.id
  LEFT JOIN gastos_pz g ON g.cierre_id = base.id
 WHERE cd.id = base.id;
