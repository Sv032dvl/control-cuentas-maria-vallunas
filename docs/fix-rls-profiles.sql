-- ============================================================
-- FIX: Permitir que service_role acceda a tabla profiles
-- Control de Cuentas María Vallunas
-- ============================================================
-- PROBLEMA: El service_role (usado en admin client) no puede
-- hacer SELECT/INSERT/UPDATE en la tabla profiles debido a RLS.
--
-- SOLUCIÓN: service_role debe bypass RLS por defecto, pero
-- necesitamos asegurar que la tabla lo permita.
-- ============================================================

-- Verificar el estado actual de RLS en profiles
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Ver las políticas actuales
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ══════════════════════════════════════════════════════════════
-- OPCIÓN 1 (RECOMENDADA): Crear política que permita service_role
-- ══════════════════════════════════════════════════════════════

-- Política para SELECT (service_role puede ver todos los profiles)
DROP POLICY IF EXISTS "service_role puede ver profiles" ON profiles;
CREATE POLICY "service_role puede ver profiles"
  ON profiles FOR SELECT
  TO service_role
  USING (true);

-- Política para INSERT (service_role puede crear profiles)
DROP POLICY IF EXISTS "service_role puede crear profiles" ON profiles;
CREATE POLICY "service_role puede crear profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Política para UPDATE (service_role puede actualizar profiles)
DROP POLICY IF EXISTS "service_role puede actualizar profiles" ON profiles;
CREATE POLICY "service_role puede actualizar profiles"
  ON profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para DELETE (service_role puede eliminar profiles)
DROP POLICY IF EXISTS "service_role puede eliminar profiles" ON profiles;
CREATE POLICY "service_role puede eliminar profiles"
  ON profiles FOR DELETE
  TO service_role
  USING (true);

-- ══════════════════════════════════════════════════════════════
-- OPCIÓN 2 (ALTERNATIVA): Otorgar permisos directos
-- ══════════════════════════════════════════════════════════════
-- Solo usar si la Opción 1 no funciona

-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;

-- ══════════════════════════════════════════════════════════════
-- Verificar que las políticas se crearon correctamente
-- ══════════════════════════════════════════════════════════════

SELECT
  policyname,
  cmd AS operacion,
  roles,
  qual AS condicion_when,
  with_check AS condicion_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND 'service_role' = ANY(roles)
ORDER BY cmd;
