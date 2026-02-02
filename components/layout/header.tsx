"use client";
import React from "react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Bell, Search, UserCircle, Menu, Sun, Moon } from "lucide-react";
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

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/80 px-4 sm:px-6 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/80">
            <div className="flex items-center gap-4">
                {/* Mobile Sidebar Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                    <Menu className="h-6 w-6" />
                </button>

                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[150px] sm:max-w-none">
                    {user?.username ? `Hola, ${user.username}` : 'ViveresApp'}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <input
                        type="search"
                        placeholder="Buscar..."
                        className="h-9 w-64 rounded-xl border border-gray-200 bg-gray-50 pl-9 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    />
                </div>

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
