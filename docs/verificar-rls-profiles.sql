-- ============================================================
-- VERIFICAR POLÍTICAS RLS DE TABLA PROFILES
-- Control de Cuentas María Vallunas
-- ============================================================
-- Ejecutar en: Supabase → SQL Editor
-- Este script verifica que las políticas estén correctamente configuradas
-- ============================================================

-- 1. Verificar que RLS está habilitado en la tabla profiles
SELECT
  schemaname,
  tablename,
  rowsecurity AS "RLS habilitado"
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- RESULTADO ESPERADO: RLS habilitado = true

-- ============================================================
-- 2. Ver TODAS las políticas de la tabla profiles
-- ============================================================
SELECT
  policyname AS "Nombre de Política",
  cmd AS "Operación",
  roles AS "Roles",
  CASE
    WHEN 'service_role' = ANY(roles) THEN '✓ service_role'
    WHEN 'public' = ANY(roles) THEN '✓ public'
    ELSE '- otro'
  END AS "Para quién",
  permissive AS "Permissive"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY
  CASE WHEN 'service_role' = ANY(roles) THEN 1 ELSE 2 END,
  cmd;

-- RESULTADO ESPERADO: Debe haber 6 políticas en total:
-- ┌────────────────────────────────────┬────────────┬──────────────────┬─────────────────┐
-- │ Nombre de Política                 │ Operación  │ Roles            │ Para quién      │
-- ├────────────────────────────────────┼────────────┼──────────────────┼─────────────────┤
-- │ service_role puede eliminar...     │ DELETE     │ {service_role}   │ ✓ service_role  │
-- │ service_role puede crear profiles  │ INSERT     │ {service_role}   │ ✓ service_role  │
-- │ service_role puede ver profiles    │ SELECT     │ {service_role}   │ ✓ service_role  │
-- │ service_role puede actualizar...   │ UPDATE     │ {service_role}   │ ✓ service_role  │
-- │ admin_gestiona_profiles            │ ALL        │ {public}         │ ✓ public        │
-- │ empleado_lee_propio                │ SELECT     │ {public}         │ ✓ public        │
-- └────────────────────────────────────┴────────────┴──────────────────┴─────────────────┘

-- ============================================================
-- 3. Verificar específicamente las 4 políticas de service_role
-- ============================================================
SELECT
  cmd AS "Operación",
  policyname AS "Política",
  CASE
    WHEN qual = 'true' OR qual IS NULL THEN '✓ Sin restricciones'
    ELSE '⚠ Tiene restricciones: ' || qual
  END AS "Condición USING",
  CASE
    WHEN with_check = 'true' OR with_check IS NULL THEN '✓ Sin restricciones'
    ELSE '⚠ Tiene restricciones: ' || with_check
  END AS "Condición WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND 'service_role' = ANY(roles)
ORDER BY
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- RESULTADO ESPERADO: 4 filas con las operaciones SELECT, INSERT, UPDATE, DELETE
-- Todas deben tener "Sin restricciones" (true)

-- ============================================================
-- 4. DIAGNÓSTICO: ¿Qué falta?
-- ============================================================
WITH expected AS (
  SELECT unnest(ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']) AS cmd
),
existing AS (
  SELECT DISTINCT cmd::text
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles'
    AND 'service_role' = ANY(roles)
)
SELECT
  e.cmd AS "Operación",
  CASE
    WHEN x.cmd IS NOT NULL THEN '✓ Existe'
    ELSE '✗ FALTA - Necesitas crear esta política'
  END AS "Estado"
FROM expected e
LEFT JOIN existing x ON e.cmd = x.cmd
ORDER BY
  CASE e.cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- RESULTADO ESPERADO: Las 4 operaciones deben mostrar "✓ Existe"
-- Si alguna muestra "✗ FALTA", ejecuta el script ejecutar-fix-rls.sql

-- ============================================================
-- 5. TEST DE PERMISOS (opcional - solo si quieres probar)
-- ============================================================
-- Este test intenta hacer SELECT como service_role
-- Si falla, las políticas no están bien configuradas

-- NOTA: Este SELECT debe funcionar sin errores
SELECT COUNT(*) AS "Total de profiles visibles para service_role"
FROM profiles;

-- Si ves error "permission denied", las políticas NO están funcionando
-- Si ves un número (0, 1, 2, etc.), las políticas SÍ están funcionando
