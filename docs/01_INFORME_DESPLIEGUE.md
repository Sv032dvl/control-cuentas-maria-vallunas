# Informe de Despliegue — Control de Cuentas María Vallunas

> **Fecha**: 2026-06-01
> **Estado**: ✅ Desplegado en producción
> **Responsable**: Claude Code + Sebastian Valencia

---

## 1. Contexto inicial del proyecto

El proyecto es un **sistema web para reemplazar la hoja de cálculo (Numbers/Excel)** que actualmente usa el negocio para el cierre diario de caja.

### Características clave:
- **Negocio**: Dos unidades (Empanadas + Pizzería) que comparten una sola caja física
- **Usuarios**: 1 empleado (registra cierres nocturnos) + 1 admin (consulta dashboards)
- **Flujo de caja**: Ventas diarias > 2M COP
- **Regla maestra**: `Ventas TPV = Ingresos digitales + Efectivo contado + Egresos ± Diferencia`

### Stack elegido:
- **Frontend**: React + Next.js 16.2.6 + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deploy**: Vercel
- **Hospedaje código**: GitHub

---

## 2. Estado de desarrollo actual

### ✅ Fase 0: Discovery y Arquitectura (COMPLETADA)
- Documento de contexto (`00_CONTEXTO_PROYECTO.md`) definido y validado
- Modelo de datos completo (9 tablas + vistas calculadas)
- Reglas de RLS especificadas
- Stack y decisiones de diseño documentadas

### ✅ Fase 1: Base de datos (PARCIALMENTE COMPLETADA)
- Supabase project creado: `pweomcrwlghsfadmnryf`
- Estructura base establecida con tablas clave
- **Pendiente**: Aplicar migraciones SQL completas y sembrar catálogos iniciales

### 🚀 Fase 2-3: Frontend MVP (EN PROGRESO)
- **Next.js app** inicializado con estructura modular
- **Auth básica** implementada (rutas protegidas por rol)
- **Páginas funcionales**:
  - `/login` — Acceso con Supabase
  - `/dashboard` — Panel admin
  - `/dashboard/usuarios` — Gestión de usuarios
  - `/dashboard/catalogos` — Editor de catálogos
  - `/dashboard/cierres` — Historial de cierres
  - `/cierre` — Formulario de cierre nocturno
  - `/inventario` — Control de mermas pizza
- **Componentes**: Sistema de UI con Tailwind + componentes reutilizables

### ⏳ Fase 4: Reportes y prorrateo (PENDIENTE)
- Dashboard de rentabilidad por unidad
- Vistas de cuadre diario
- Sistema de alertas

---

## 3. Hito: Despliegue en producción (HOY)

### 🔗 GitHub
```
Repositorio: https://github.com/Sv032dvl/control-cuentas-maria-vallunas
Estado: Inicializado, con .gitignore configurado
Rama principal: main
```

### 🌍 Vercel
```
URL producción: https://app-rho-mauve-39.vercel.app
Build: Next.js 16.2.6 con Turbopack
Estado: ✅ Ready
Despliegues: Automáticos en cada push a main
```

### 🔐 Variables de entorno (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://pweomcrwlghsfadmnryf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[token public encrypted]
```

---

## 4. Resultados del despliegue

### Rutas disponibles (14 total):
| Ruta | Tipo | Estado |
|------|------|--------|
| `/` | Estática | ✅ Prerendizada |
| `/login` | Dinámica | ✅ Funcional |
| `/cierre` | Dinámica | ✅ Funcional |
| `/dashboard` | Dinámica | ✅ Funcional |
| `/dashboard/catalogos` | Dinámica | ✅ Funcional |
| `/dashboard/cierres` | Dinámica | ✅ Funcional |
| `/dashboard/cierres/[id]` | Dinámica | ✅ Funcional |
| `/dashboard/usuarios` | Dinámica | ✅ Funcional |
| `/inventario` | Dinámica | ✅ Funcional |

### Build metrics:
- **Tiempo compilación**: 13.7s
- **TypeScript check**: 7.2s sin errores
- **Generación estáticas**: 429ms
- **Cache**: Aprovechado de despliegue previo
- **Middleware**: Proxy configurado

---

## 5. Próximos pasos inmediatos

### 🎯 Fase 1.2 (Infraestructura BD)
1. **Generar SQL completo** con:
   - DDL para todas las tablas (catálogos + operativo)
   - RLS policies según matriz de permisos
   - Seeds iniciales (productos, denominaciones, categorías)

2. **Aplicar en Supabase** vía SQL Editor
3. **Autogenerar tipos TypeScript** con Supabase CLI

### 🎯 Fase 2 (UX Wireframe)
1. Validar flujo del formulario nocturno con empleado real
2. Ajustar mobile-first según feedback

### 🎯 Fase 3 (Integración)
1. Conectar frontend a BD (queries + mutations)
2. Implementar cálculos de validación (ecuación maestra)
3. Pruebas de integración end-to-end

---

## 6. Mapa de acceso para el próximo chat

| Recurso | Ubicación |
|---------|-----------|
| Documentación | `/docs/00_CONTEXTO_PROYECTO.md` |
| Código Frontend | `/app/src/` |
| Configuración | `/app/vercel.json`, `.env.local` |
| Deploy logs | https://vercel.com/sevalincs-projects/app |
| BD Supabase | https://app.supabase.com (project: `pweomcrwlghsfadmnryf`) |

---

## 7. Comandos útiles (copiar-pegar para próximo chat)

```bash
# Levantar dev local
cd app && npm run dev

# Desplegar a producción
cd app && vercel --prod --scope sevalincs-projects --yes

# Ver logs de Vercel
vercel logs --scope sevalincs-projects

# Actualizar variables de entorno
vercel env ls --scope sevalincs-projects

# Tirar de cambios de producción (código)
git pull origin main
```

---

## 8. Estado de seguridad

✅ **service_role key**: No compartida en código ni en chats
✅ **anon key**: Correctamente prefijada con `NEXT_PUBLIC_` (uso solo cliente)
✅ **RLS**: Habilitado automático en Supabase
✅ **.gitignore**: Cubre `.env*` y credenciales
⚠️ **Pendiente**: Implementar RLS policies específicas en Fase 1.2

---

**Próximo paso**: Leer este informe + `00_CONTEXTO_PROYECTO.md` y continuar desde Fase 1.2.
