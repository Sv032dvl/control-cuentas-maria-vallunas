-- ============================================================
-- CONSULTA DE USUARIOS — Control de Cuentas María Vallunas
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

SELECT
  u.id,
  u.email,
  u.email_confirmed_at IS NOT NULL          AS confirmado,
  u.created_at::date                        AS creado,
  u.last_sign_in_at::date                   AS ultimo_acceso,
  p.nombre,
  p.role,
  p.activo,
  (SELECT COUNT(*)
   FROM auth.identities i
   WHERE i.user_id = u.id)                  AS identidades
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.created_at DESC;


-- ── Diagnóstico completo (si algo falla) ─────────────────────
-- Descomenta para ver todos los campos de auth.users:
/*
SELECT
  u.id,
  u.email,
  u.email_confirmed_at,
  u.encrypted_password IS NOT NULL          AS tiene_password,
  u.email_change,
  u.email_change_token_new,
  u.confirmation_token,
  u.recovery_token,
  u.banned_until,
  u.deleted_at,
  p.role,
  p.activo
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
*/
