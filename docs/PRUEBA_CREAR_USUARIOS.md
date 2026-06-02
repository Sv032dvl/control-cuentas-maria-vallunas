# Guía de Prueba: Flujo Completo de Creación de Usuarios

## Resumen de Cambios
Se migró el componente `CrearUsuarioForm` de `useActionState` a `useTransition` para mayor robustez cuando se usa dentro de un Dialog de base-ui. El flujo ahora es:

1. El usuario abre el modal con el botón "Nuevo usuario"
2. Completa el formulario (nombre, email, contraseña, rol)
3. Click en "Crear usuario"
4. El formulario hace un submit manual que construye FormData e inyecta el rol
5. Se llama `crearUsuarioAction` con `startTransition`
6. Si éxito: toast de éxito, modal cierra, lista se refresca
7. Si error: toast de error, mensaje de error visible en modal

## Pasos para Verificar

### 1. Verificar que TypeScript compila
```bash
cd app
npx tsc --noEmit
```
✅ Debe pasar sin errores

### 2. Verificar que el build funciona
```bash
npm run build
```
✅ Debe completarse exitosamente

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abrirá en `http://localhost:3000`

### 4. Login como admin
- Email: `diegor64@gmail.com`
- Contraseña: `admin123`

### 5. Navegar a /dashboard/usuarios
- Click en "Nuevo usuario"
- Deberá abrir un modal

### 6. Crear usuario de prueba
- **Nombre completo**: Juan Pérez Prueba
- **Email**: juan.prueba+{timestamp}@example.com (ej: juan.prueba+123456@example.com)
- **Contraseña**: Test123456
- **Rol**: Empleado (o Admin)
- Click "Crear usuario"

### 7. Verificar éxito
Debes ver:
- ✅ Toast verde diciendo "✅ Usuario "Juan Pérez Prueba" creado con rol empleado"
- ✅ Modal se cierra automáticamente
- ✅ La lista de usuarios se refresca y aparece el nuevo usuario
- ✅ Usuario tiene rol y estado visible en la tabla

### 8. Verificar que el usuario creado puede iniciar sesión
- Cerrar sesión actual
- Ir a `/login`
- Intentar login con el email y contraseña creados
- Deberá redirigirse a `/cierre` (si es empleado) o `/dashboard` (si es admin)

### 9. Probar acciones del usuario (desde admin)
Vuelve a login como admin y entra a `/dashboard/usuarios`:

#### a) Cambiar contraseña
- Click en el menú de 3 puntos del usuario
- Click "Cambiar contraseña"
- Ingresa nueva contraseña
- Intenta login con nueva contraseña

#### b) Desactivar/Activar
- Click en el menú de 3 puntos del usuario
- Click "Desactivar"
- El usuario debe mostrar badge "Inactivo"
- RLS de Supabase debería prevenir que el usuario inactivo acceda
- Click nuevamente para reactivar

### 10. Commit verifyado
```bash
git log --oneline -1
```
Debe mostrar:
```
be93914 fix: Migrar CrearUsuarioForm a useTransition para robustez en base-ui Dialog
```

## Criterios de Éxito

1. ✅ TypeScript compila sin errores
2. ✅ Build de producción funciona
3. ✅ Admin puede crear usuario desde modal
4. ✅ Modal se cierra después de crear
5. ✅ Usuario aparece en la lista
6. ✅ Usuario creado puede hacer login inmediatamente
7. ✅ Admin puede cambiar contraseña del usuario
8. ✅ Admin puede desactivar/activar usuarios
9. ✅ Cambios están en git

## Notas Técnicas

- El archivo [src/features/usuarios/crear-usuario-form.tsx](../app/src/features/usuarios/crear-usuario-form.tsx) fue el único que cambió
- El Server Action [src/features/usuarios/actions.ts](../app/src/features/usuarios/actions.ts) se mantiene igual (y funciona correctamente)
- El cliente Admin de Supabase [src/lib/supabase/admin.ts](../app/src/lib/supabase/admin.ts) ya funciona con service_role key
- Se verificó que el endpoint Auth de Supabase funciona con curl + service_role key

## Troubleshooting

Si algo no funciona:

1. Verifica `.env.local` tiene las keys correctas:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://pweomcrwlghsfadmnryf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

2. Verifica que el servidor dev está corriendo en puerto 3000 o 3001

3. Abre DevTools (F12) y revisa:
   - Console para logs del navegador
   - Network para ver requests a Supabase
   - La acción `crearUsuarioAction` debe ser una llamada `POST` a `_server_actions`

4. Si el modal no cierra, revisa que el Dialog tenga `open/onOpenChange` correctamente

5. Si el usuario no aparece en la lista, verifica:
   - RLS de Supabase en tabla `profiles` permite SELECT para admin
   - El trigger `handle_new_user` crea el profile cuando se crea usuario en auth

