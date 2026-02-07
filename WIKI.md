# 📖 Wiki Técnica - Frontend: Viveres App

Esta Wiki detalla la arquitectura de cliente y los flujos de frontend de **Viveres App**.

Ingeniero de Frontend: **DaniDev**

---

## 🧠 Gestión de Estado con Zustand

Para evitar la complejidad innecesaria de Redux, utilizamos **Zustand**. Tenemos tiendas (stores) separadas por preocupación:

- **`useAuthStore`**: Maneja el token JWT, los datos del usuario logueado y el estado de sesión.
- **`useCartStore`**: Gestiona el carrito del Punto de Venta (POS), permitiendo sumar, restar y calcular subtotales en tiempo real.
- **`useConfigStore`**: Configuración de moneda predeterminada y preferencias de UI (modo oscuro/claro).

---

## 🛒 Lógica del Punto de Venta (POS)

El módulo de POS es el más complejo del frontend. Sigue este flujo técnico:

1. **Escaneo/Búsqueda**: El sistema escucha eventos de teclado (para escáneres) o entradas de texto para buscar productos (aun en prueba).
2. **Cálculo Reactivo**: Cada cambio en el carrito dispara una actualización de:
   - Subtotal USD
   - IVA (calculado por producto)
   - Total Final
3. **Múltiples Pagos**: El usuario puede añadir varios métodos de pago para una sola venta. El frontend valida que el monto pagado cubra el total de la venta antes de permitir finalizar.

---

## 🔁 Sincronización de Datos (React Query)

Utilizamos `@tanstack/react-query` para gestionar la comunicación con la API:

- **Caching**: Los listados de productos y categorías se cachean para cargas instantáneas.
- **Optimistic Updates**: Cuando se añade un producto, la UI se actualiza mientras la petición viaja al servidor para mayor sensación de velocidad.
- **Prefetching**: Las páginas de reportes precargan datos mientras el usuario navega por el dashboard.

---

## 🎨 Sistema de Diseño y UI

- **Tailwind CSS 4**: Utilizamos variables CSS nativas para el sistema de colores, permitiendo cambiar el tema de la aplicación fácilmente.
- **Componentes Atómicos**:
  - `components/ui`: Los bloques básicos (Button, Input, Badge) basados en Radix UI.
  - `components/shared`: Componentes más complejos como Tablas con paginación o Selectores de moneda.
- **Responsividad**: La app utiliza un sistema de `Grid` y `Flexbox` que se adapta a:
  - Pantallas de Escritorio (Administración)
  - Tablets (Punto de Venta Móvil)

---

## 🛠️ Catálogo Público y Pedidos Web (E-commerce)

ViveresApp cuenta con una tienda pública de alto rendimiento:
1. **Catálogo en Vivo**: Visualización dinámica de productos con precios actualizados según tasa.
2. **Checkout WhatsApp**: Generación automática de pedidos formateados para recepción instantánea vía móvil.
3. **Gestión de Estatus**: El administrador puede rastrear y actualizar el progreso de cada pedido web desde el módulo dedicado.

---

## 🛡️ Manejo de Tokens y Seguridad

El frontend nunca guarda el token en texto plano sin protección. Se utiliza un mecanismo de interceptores que añade el `Authorization: Bearer <token>` a cada petición saliente y redirige al `/login` si detecta que la sesión ha expirado o el token es inválido.

---

© 2026 - **Viveres App Wiki** | **DaniDev software Engineer**
