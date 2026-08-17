-- =============================================================
-- MIGRACIÓN: separar "unidad activa" de "unidad que recibe gastos"
--
-- Problema: `activo` hacía dos trabajos a la vez. Se desactivaban
-- Arepas/Bebidas/Compartido para que NO aparecieran en el selector
-- del paso de Gastos —solo Empanadas y Pizzería reciben gastos—,
-- pero el efecto colateral era que también desaparecían del paso de
-- Ventas, pese a facturar ~20% del total.
--
-- Solución: una bandera por cada rol.
--   activo         → la unidad está en uso (Ventas, productos)
--   acepta_gastos  → aparece en el selector de Gastos
--
-- Aplicada: 2026-08-17
-- =============================================================

ALTER TABLE unidades_negocio
  ADD COLUMN acepta_gastos boolean NOT NULL DEFAULT false;

-- Solo las unidades que representan a un propietario reciben gastos
UPDATE unidades_negocio SET acepta_gastos = true
  WHERE nombre IN ('Empanadas', 'Pizzería');
