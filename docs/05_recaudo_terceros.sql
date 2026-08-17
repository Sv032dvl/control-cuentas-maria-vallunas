-- =============================================================
-- MIGRACIÓN: recaudo para terceros (domicilios)
--
-- El domicilio lo cobra el negocio junto con el pedido —verificado
-- contra Loyverse: de 11 domicilios, 10 se pagaron con tarjeta y 1 en
-- efectivo, siempre dentro del mismo pago— pero esa plata es del
-- mensajero: se recauda hoy y se le liquida después.
--
-- Implicación clave: el dinero SÍ entra a la caja, así que el cuadre
-- lo sigue contando. Lo que cambia es el reporte de ventas: no es
-- ingreso del negocio.
--
-- (Si se descontara de las ventas sin más, el efectivo esperado bajaría
-- sin que baje el efectivo real y aparecería un sobrante fantasma.)
--
-- Aplicada: 2026-08-17
-- =============================================================

ALTER TABLE unidades_negocio
  ADD COLUMN es_recaudo_terceros boolean NOT NULL DEFAULT false;

UPDATE unidades_negocio SET es_recaudo_terceros = true WHERE nombre = 'Domicilios';

-- Domicilios estaba inactiva para sacarla del selector de Gastos. Ahora que
-- `acepta_gastos` cubre eso, se reactiva: su producto sí se vende y se importa
-- de Loyverse, y con la unidad inactiva el chip del paso de Ventas salía como "—"
-- (unidadById no resolvía el nombre porque loadCatalogos filtra por activo).
UPDATE unidades_negocio SET activo = true, acepta_gastos = false WHERE nombre = 'Domicilios';

-- Total recaudado para terceros en el día
ALTER TABLE cierres_diarios
  ADD COLUMN recaudo_terceros_total numeric NOT NULL DEFAULT 0;

-- Backfill desde las ventas existentes
WITH recaudo AS (
  SELECT vp.cierre_id, SUM(vp.total) AS total
    FROM ventas_producto vp
    JOIN productos p ON p.id = vp.producto_id
    JOIN unidades_negocio u ON u.id = p.unidad_id
   WHERE u.es_recaudo_terceros
   GROUP BY vp.cierre_id
)
UPDATE cierres_diarios cd
   SET recaudo_terceros_total = COALESCE(r.total, 0)
  FROM (SELECT id FROM cierres_diarios) AS base
  LEFT JOIN recaudo r ON r.cierre_id = base.id
 WHERE cd.id = base.id;
