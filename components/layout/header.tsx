"use client";
import React from "react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Bell, UserCircle, Menu, Sun, Moon, PanelLeftClose, PanelLeft } from "lucide-react";
import { useTheme } from "next-themes";
import { NotificationDropdown } from "./NotificationDropdown";


function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Cambiar tema"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
    );
}

export function Header() {

    const user = useAuthStore((state) => state.user);
    const toggleSidebar = useUIStore((state) => state.toggleSidebar);
    const toggleSidebarCollapsed = useUIStore((state) => state.toggleSidebarCollapsed);
    const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);

    return (
        <header className="sticky top-0 z-30 flex h-14 w-full min-w-0 items-center justify-between border-b border-gray-200 bg-white/80 px-3 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/80 sm:px-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                    onClick={toggleSidebar}
                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                    title="Abrir menú"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <button
                    onClick={toggleSidebarCollapsed}
                    className="hidden cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:flex"
                    title={isSidebarCollapsed ? "Mostrar menú lateral" : "Ocultar menú lateral"}
                >
                    {isSidebarCollapsed ? (
                        <PanelLeft className="h-5 w-5" />
                    ) : (
                        <PanelLeftClose className="h-5 w-5" />
                    )}
                </button>

                <h1 className="truncate text-base font-semibold text-gray-800 dark:text-gray-100 sm:text-lg">
                    {user?.username ? `Hola, ${user.username}` : (process.env.NEXT_PUBLIC_BUSINESS_NAME || 'ViveresApp')}
                </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <NotificationDropdown />

                <ThemeToggle />

                <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-800 dark:bg-gray-900">
                    <UserCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <div className="hidden flex-col text-xs sm:flex">
                        <span className="font-semibold text-gray-900 dark:text-white">{user?.username || 'Usuario'}</span>
                        <span className="text-gray-500 dark:text-gray-400 capitalize">{user?.role || 'Invitado'}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
