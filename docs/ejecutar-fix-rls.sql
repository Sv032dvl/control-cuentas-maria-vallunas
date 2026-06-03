-- ============================================================
-- EJECUTAR ESTE SQL EN SUPABASE SQL EDITOR
-- ============================================================
-- Copia todo este archivo y ejecútalo en Supabase → SQL Editor
-- ============================================================

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

-- ============================================================
-- Verificar que las políticas se crearon correctamente
-- ============================================================

SELECT
  policyname,
  cmd AS operacion,
  roles,
  qual AS condicion_when,
  with_check AS condicion_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;
