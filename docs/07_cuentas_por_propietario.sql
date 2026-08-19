-- =============================================================
-- MIGRACIÓN: control de efectivo vs digital por dueño
--
-- La liquidación diaria decía cuánto le corresponde a cada dueño,
-- pero no DÓNDE está esa plata: parte es efectivo en la caja y
-- parte quedó en cuentas Nequi.
--
-- La clave: el dueño no es una propiedad del pago sino de la
-- CUENTA, y eso no varía. Como el cajero ya elige la cuenta al
-- registrar el ingreso, el dueño se deduce solo.
--
--   Diego nequi, MariaE nequi → 1 (Empanadas)
--   David nequi, Nanis nequi  → 2 (Pizzería)
--
-- No hay datáfono: todos los pagos digitales entran a una de esas
-- cuatro cuentas.
--
-- Aplicada: 2026-08-19
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Dueño de cada cuenta digital
-- ─────────────────────────────────────────────────────────────
ALTER TABLE cuentas_digitales
  ADD COLUMN propietario smallint CHECK (propietario IN (1, 2));

UPDATE cuentas_digitales SET propietario = 1
  WHERE nombre IN ('Diego nequi', 'MariaE nequi');
UPDATE cuentas_digitales SET propietario = 2
  WHERE nombre IN ('David nequi', 'Nanis nequi');

-- ─────────────────────────────────────────────────────────────
-- 2. El datáfono deja de existir
--    `es_datafono` servía para pre-llenar una línea del paso 5 con
--    el total de tarjeta de Loyverse. Como ya no hay terminal, ese
--    pre-llenado sería un dato falso. La cuenta marcada tenía 0
--    movimientos, así que se elimina sin pérdida.
-- ─────────────────────────────────────────────────────────────
DELETE FROM cuentas_digitales WHERE es_datafono = true;
DROP INDEX IF EXISTS uq_cuenta_datafono;
ALTER TABLE cuentas_digitales DROP COLUMN es_datafono;

-- ─────────────────────────────────────────────────────────────
-- 3. Snapshot del digital por dueño, simétrico a las liquidaciones
--
--    SIN BACKFILL a propósito: el histórico se registró cuando las
--    cuentas se llamaban "Nequi" y "Transferencia" genéricas, así
--    que atribuirlo retroactivamente a un dueño sería inventarlo.
--    Arranca en 0 y se llena desde el próximo cierre.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE cierres_diarios
  ADD COLUMN empanadas_digital numeric NOT NULL DEFAULT 0,
  ADD COLUMN pizzeria_digital  numeric NOT NULL DEFAULT 0;
