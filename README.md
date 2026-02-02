# 💻 Viveres App - Interface de Administración y POS

Este es el frontend de alto rendimiento para **Viveres App**, una aplicación web moderna diseñada para la gestión de ventas en tiempo real, control de inventario y monitoreo financiero.

Desarrollado y Diseñado por: **DaniDev - Software Engineer**

---

## 🚀 Stack Tecnológico

La interfaz se ha construido utilizando las tecnologías más vanguardistas para garantizar una experiencia de usuario fluida y reactiva (SPA-like feel).

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & React Server Components)
- **Lenguaje:** TypeScript (Tipado fuerte para robustez)
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/) (Sistema de diseño moderno)
- **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) (Ligero y escalable)
- **Fetching de Datos:** [React Query (TanStack)](https://tanstack.com/query) (Caché y sincronización de servidor)
- **Animaciones:** Framer Motion (Micro-interacciones premium)
- **UI Components:** Radix UI (Accesibilidad y componentes headless)
- **Notificaciones:** Sonner (Toasts eficientes)

---

## 📂 Estructura de Carpetas

Basado en el estándar de **Feature-Oriented Folder Structure** mezclado con el App Router de Next.js.

```text
frontend/
├── app/                    # Páginas y Layouts (Next.js App Router)
│   ├── dashboard/          # Métricas y Resumen
│   ├── pos/                # Interfaz de Punto de Venta
│   ├── inventory/          # Gestión de Productos y Categorías
│   ├── sales/              # Historial de Ventas
│   └── ...
├── components/             # Componentes React Reutilizables
│   ├── ui/                 # Componentes de diseño base (Botones, Inputs, Modales)
│   ├── shared/             # Lógica compartida entre módulos
│   └── [feature]/          # Componentes específicos de una funcionalidad
├── store/                  # Gestión de estados (Zustand Stores)
├── hooks/                  # Hooks personalizados (Lógica extraída)
├── services/               # Llamadas a API (AxiosConfig, Endpoints)
├── lib/                    # Utilidades y funciones auxiliares
└── public/                 # Assets estáticos (Imágenes, SVGs)
```

---

## 🛡️ Seguridad y Buenas Prácticas

1. **Protección de Rutas:** Middleware de Next.js para validar la sesión antes de renderizar páginas protegidas.
2. **Contexto de Autenticación:** Manejo centralizado de tokens JWT con persistencia segura.
3. **Axios Interceptors:** Manejo automático de errores 401 (Unauthorized) para cerrar sesión si el token expira.
4. **Validación de Formularios:** Uso riguroso de `React Hook Form` + `Zod` para validar datos en el cliente antes de enviar al servidor.
5. **Optimización de Renderizado:** Uso de `React.memo` y `useCallback` en secciones críticas como el carrito del POS para evitar re-renders innecesarios.
6. **Diseño Adaptativo (PWA Ready):** Interfaz 100% responsiva y optimizada para uso en tablets o terminales POS.

---

## 🛠️ Instalación y Desarrollo

1. **Instalar Dependencias:**
   ```bash
   bun install  # O npm install
   ```

2. **Configurar el Entorno:**
   Crea un `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

3. **Ejecutar Desarrollo:**
   ```bash
   bun run dev  # O npm run dev
   ```

4. **Compilar para Producción:**
   ```bash
   bun run build
   ```

---

## 🎨 Principios de Diseño

- **Rich Aesthetics:** Colores vibrantes, gradientes sutiles y modo oscuro nativo.
- **Glassmorphism:** Uso de efectos de transparencia y desenfoque en modales y barras de navegación.
- **Micro-Animations:** Transiciones suaves que guían la atención del usuario sin ser intrusivas.

---

© 2026 - Proyecto **Viveres App** | Desarrollado con ❤️ por **DaniDev**
