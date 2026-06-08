
import {
    LayoutDashboard,
    ShoppingBasket,
    Package,
    Users,
    FileText,
    Settings,
    LogOut,
    ScanBarcode,
    Store,
    ShoppingBag,
    Receipt,
    Truck,
    LucideIcon
} from "lucide-react";

export type UserRole = 'admin' | 'worker' | 'inventory_manager' | 'delivery';

export interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    roles: UserRole[];
}

export const ROLE_PERMISSIONS: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ['admin'] },
    { name: "POS (Venta)", href: "/pos", icon: ScanBarcode, roles: ['admin', 'worker'] },
    { name: "Ventas", href: "/sales", icon: Receipt, roles: ['admin', 'worker'] },
    { name: "Clientes", href: "/customers", icon: Users, roles: ['admin', 'worker'] },
    { name: "Inventario", href: "/inventory", icon: Package, roles: ['admin', 'worker', 'inventory_manager'] },
    { name: "Compras", href: "/purchases", icon: ShoppingBasket, roles: ['admin', 'inventory_manager'] },
    { name: "Pedidos Web", href: "/web-orders", icon: ShoppingBag, roles: ['admin', 'delivery'] },
    { name: "Envíos (Delivery)", href: "/deliveries", icon: Truck, roles: ['admin', 'worker', 'delivery'] },
    { name: "Reportes", href: "/reports", icon: FileText, roles: ['admin'] },
    { name: "Tienda (Vista Cliente)", href: "/", icon: Store, roles: ['admin', 'worker'] },
    { name: "Configuración", href: "/settings", icon: Settings, roles: ['admin'] },
];
