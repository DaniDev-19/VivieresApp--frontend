# 📚 ViveresApp Frontend - Documentación Técnica (Wiki)

Este documento detalla la arquitectura, el diseño y las decisiones técnicas tomadas en el desarrollo de la interfaz de ViveresApp.

## 🏗️ Arquitectura y Stack

### 1. Tecnologías Base
*   **Framework**: [Next.js 15](https://nextjs.org/) con App Router. Elegido por su soporte de Server Components, SEO optimizado y sistema de rutas moderno.
*   **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) para garantizar un código libre de errores de tipado y facilitar la escalabilidad.
*   **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) - La última versión para un diseño atómico, ultra-rápido y con soporte nativo de variables CSS.

### 2. Gestión de Estado
Dividimos el estado de la aplicación de manera lógica:
*   **Zustand**: Para estados globales ligeros y persistentes.
    *   `authStore`: Maneja el token JWT y la información del usuario (incluyendo el rol).
    *   `uiStore`: Controla el estado del sidebar y temas.
    *   `salesStore/cartStore`: Maneja el carrito de compras del POS y del catálogo público.
*   **TanStack Query (React Query)**: Para el estado asíncrono (peticiones a la API). Gestiona caché, re-intentos y estados de carga de forma automática.

## 🔒 Seguridad y Control de Acceso (RBAC)

### 1. Auth Guard
Implementamos un componente `AuthGuard` envolvente en `app/layout.tsx`. Este componente intercepta cada cambio de ruta:
*   Si el usuario no tiene token y la ruta no es pública (`/login`, `/catalog`), lo redirige al login.
*   Si el usuario está autenticado e intenta ir a `/login`, lo redirige al dashboard.

### 2. Roles Dinámicos en el Menú
El `Sidebar` no solo es estético, es funcionalmente dinámico:
*   Cada ítem del menú tiene configurado un array de `roles` permitidos.
*   El componente filtra los ítems según el rol del usuario actual (`admin` vs `worker`).
*   Esto evita que un cajero vea opciones sensibles como *Configuración*, *Reportes* o *Pedidos Web*.

## 📱 Diseño Responsivo "Premium"

El sistema está diseñado bajo el principio de **Mobile First**, pero optimizado para pantallas grandes de POS:
*   **Móvil (375px+)**: Sidebar tipo hamburguesa colapsable, grids de 2 columnas en catálogo.
*   **Tablet (768px+)**: Layouts fluidos, buscador optimizado.
*   **Desktop (1024px+)**: Sidebar fijo a la izquierda, POS con doble columna (Productos e Inventario).

## 🛠️ Guía de Desarrollo

### 🔧 Comandos Clave
```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Verificar calidad (Linting)
npm run lint
```

### 📁 Estructura del Código
*   `app/`: Definición de rutas y páginas.
*   `components/`:
    *   `layout/`: Sidebar, Header, Footer.
    *   `ui/`: Componentes base de Shadcn (Botones, Inputs, Modales).
    *   `shared/`: Utilidades globales como la calculadora de divisas.
    *   `auth/`: Protección de rutas.
*   `store/`: Lógica de Zustand.
*   `lib/`: Configuración del cliente API (Axios).

## 💡 Notas sobre Tailwind v4
En el archivo `globals.css` podrías ver avisos del editor (líneas rojas) en las reglas `@theme` o `@custom-variant`. Esto **no son errores**; es la nueva sintaxis de Tailwind v4 que el editor aún tarda en reconocer, pero es totalmente válida y funcional.

---

