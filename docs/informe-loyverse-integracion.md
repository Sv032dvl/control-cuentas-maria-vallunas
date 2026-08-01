# Propuesta de integración Loyverse + Control de Caja

**Para:** CEO de María Vallunas
**Fecha:** Agosto 2026

---

## Qué se hizo

Conectamos nuestro sistema de control de caja directamente con Loyverse, la caja registradora (TPV) que usa el negocio. Ya verificamos que la conexión funciona y pudimos leer datos reales de ventas.

**Ejemplo real del 31 de julio:**
- 134 ventas registradas
- Venta total del día: **$2,359,100 COP**
- Pagos en efectivo: $1,602,500
- Pagos con tarjeta: $756,600

Toda esta información la obtuvimos automáticamente, sin que nadie tuviera que escribir un solo número a mano.

---

## Qué puede hacer la integración

### Hoy (lo que ya es posible)

| Función | Beneficio |
|---------|-----------|
| **Traer las ventas del día automáticamente** | El empleado ya no tiene que anotar producto por producto al cerrar caja. El sistema lo hace solo. |
| **Separar efectivo y tarjeta** | Sabemos exactamente cuánto entró por cada medio de pago, directo de la caja. |
| **Ver los 28 productos del menú** | Pizzas, empanadas, bebidas, combos — todo sincronizado con lo que está en Loyverse. |
| **Datos de clientes registrados** | Nombre, teléfono, dirección, cuántas veces han comprado y cuánto han gastado. |

### Lo que se puede construir a futuro

| Función | Beneficio |
|---------|-----------|
| **Cierre de caja con un solo clic** | En vez de llenar 6 pasos manualmente, el sistema pre-llena las ventas y los pagos digitales desde Loyverse. El empleado solo cuenta los billetes y confirma. |
| **Alertas de diferencias en tiempo real** | Si lo que hay en caja no cuadra con lo que dice Loyverse, el sistema avisa inmediatamente. |
| **Reportes de ventas por producto** | Saber cuáles productos se venden más, en qué horarios, y cuáles generan más ingreso. |
| **Historial de clientes** | Identificar clientes frecuentes, monto promedio de compra, y oportunidades de fidelización. |

---

## Qué información tenemos disponible

- **Productos:** Los 28 productos del menú con precios (pizzas desde $9,500, empanadas a $3,500, combos hasta $39,900)
- **Categorías:** Empanadas, Pizza, Bebidas, Arepas, Adiciones, Domicilios
- **Ventas:** Cada recibo con detalle de productos, cantidades, precios y método de pago
- **Clientes:** Base de datos con nombre, teléfono y dirección (para domicilios)
- **Empleados:** Registro de quién realizó cada venta

---

## Qué NO puede hacer (limitaciones)

- **Historial limitado a 31 días** — Loyverse solo da acceso al último mes de ventas de forma gratuita. Para ver más atrás hay que contratar un complemento adicional en Loyverse ($9 USD/mes).
- **Inventario no activado** — Actualmente no se lleva control de stock en Loyverse (no hay seguimiento de ingredientes o cantidades). Esto se podría activar si se desea.
- **Turnos no configurados** — La función de turnos de empleados no está en uso.

---

## Cómo cambia el día a día

### Antes (sin integración)
1. Termina el día
2. El empleado abre el sistema de control de caja
3. Anota manualmente cada producto vendido, cantidad y precio
4. Anota los pagos con tarjeta/nequi/transferencia
5. Cuenta los billetes
6. Calcula si cuadra o no
7. **Riesgo:** errores humanos, olvidos, números que no cuadran sin explicación

### Después (con integración)
1. Termina el día
2. El empleado abre el sistema de control de caja
3. **Las ventas ya están cargadas automáticamente desde Loyverse**
4. **Los pagos digitales ya están separados**
5. Cuenta los billetes
6. El sistema calcula si cuadra
7. **Resultado:** cierre más rápido, más confiable, y con trazabilidad completa

---

## Próximo paso

Autorizar el desarrollo de la integración para que el cierre de caja se alimente automáticamente de los datos de Loyverse. No se necesita instalar nada nuevo ni cambiar la forma de trabajar con la caja registradora — todo funciona con la información que Loyverse ya está guardando.
