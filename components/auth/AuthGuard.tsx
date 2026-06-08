"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

import { ROLE_PERMISSIONS } from "@/config/roles";

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, isHydrated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicRoute = pathname === "/" || pathname === "/login" || pathname === "/catalog" || pathname.startsWith("/legal/");
    const isGuestOnlyRoute = pathname === "/login";

    useEffect(() => {
        if (!isHydrated) return;

        if (!isAuthenticated && !isPublicRoute) {
            router.push("/login");
        } else if (isAuthenticated) {
            const role = useAuthStore.getState().user?.role || 'worker';
            
            if (isGuestOnlyRoute) {
                if (role === 'admin') router.push("/dashboard");
                else if (role === 'worker') router.push("/pos");
                else if (role === 'inventory_manager') router.push("/inventory");
                else if (role === 'delivery') router.push("/web-orders");
                else router.push("/");
            } else {
                // Check special routes
                if (pathname === "/users" && role !== "admin") {
                    if (role === 'worker') router.push("/pos");
                    else if (role === 'inventory_manager') router.push("/inventory");
                    else if (role === 'delivery') router.push("/web-orders");
                    else router.push("/");
                    return;
                }

                // Check standard routes
                const matchingNavItem = ROLE_PERMISSIONS.find(item => item.href === pathname);
                if (matchingNavItem && !matchingNavItem.roles.includes(role as any)) {
                    if (role === 'admin') router.push("/dashboard");
                    else if (role === 'worker') router.push("/pos");
                    else if (role === 'inventory_manager') router.push("/inventory");
                    else if (role === 'delivery') router.push("/web-orders");
                    else router.push("/");
                }
            }
        }
    }, [isHydrated, isAuthenticated, isPublicRoute, isGuestOnlyRoute, pathname, router]);

    // Pantalla de carga mientras se hidrata el store
    if (!isHydrated) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
                    <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400 font-sans">
                        Sincronizando seguridad...
                    </p>
                </div>
            </div>
        );
    }

    // Si es una ruta privada y no está autenticado, bloqueamos renderizado (se encargará el useEffect)
    if (!isAuthenticated && !isPublicRoute) {
        return null;
    }

    // Si es una ruta de invitado y ya está autenticado, bloqueamos (se irá al dashboard)
    if (isAuthenticated && isGuestOnlyRoute) {
        return null;
    }

    return <>{children}</>;
}
