"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    LogOut
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { AnimatePresence } from "framer-motion";
import { ROLE_PERMISSIONS } from "@/config/roles";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const logout = useAuthStore((state) => state.logout);
    const { isSidebarOpen, closeSidebar } = useUIStore();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const user = useAuthStore((state) => state.user);

    // Default to 'worker' if role is missing/undefined during transition
    const userRole = (user?.role || 'worker') as any; // Cast as any to avoid strict type issues with string from store vs enum

    const SidebarContent = () => (
        <div className="flex h-full flex-col px-3 py-4">
            <div className="mb-8 flex flex-col items-center justify-center pt-4 px-2 text-center">
                <img src="/logo.png" alt={`${process.env.NEXT_PUBLIC_BUSINESS_NAME || "ViveresApp"} Logo`} className="w-24 h-24 object-contain rounded-full shadow-lg border-2 border-indigo-50 dark:border-indigo-900/50 mb-3" />
                <div className="text-x font-black leading-tight bg-linear-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent uppercase tracking-tight">
                    {/* {"Viveres App"} */}
                    {/* {process.env.NEXT_PUBLIC_BUSINESS_NAME || "ViveresApp"} */}
                </div>
            </div>

            <ul className="space-y-1 font-medium flex-1">
                {ROLE_PERMISSIONS.filter(item => item.roles.includes(userRole)).map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <li key={item.name}>
                            <Link
                                href={item.href}
                                onClick={() => closeSidebar()}
                                className={clsx(
                                    "group flex items-center rounded-xl p-3 text-gray-900 transition-all hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800",
                                    isActive && "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                )}
                            >
                                <item.icon className={clsx("h-5 w-5 shrink-0 transition duration-75", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white")} />
                                <span className="ml-3">{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute left-0 h-8 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400"
                                    />
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="mt-auto border-t border-gray-200 pt-4 dark:border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center rounded-xl p-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="ml-3">Cerrar Sesión</span>
                </button>
            </div>
        </div >
    );

    return (
        <>
            <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white/80 backdrop-blur-xl transition-transform dark:border-gray-800 dark:bg-gray-950/80">
                <SidebarContent />
            </aside>

            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={closeSidebar}
                            className="fixed inset-0 z-40 bg-black lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-950 shadow-2xl lg:hidden"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
