"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CurrencyCalculator } from "@/components/shared/CurrencyCalculator";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";
import { useUIStore } from "@/store/uiStore";
import { clsx } from "clsx";

function AppShell({ children }: { children: React.ReactNode }) {
    const isSidebarCollapsed = useUIStore((s) => s.isSidebarCollapsed);

    return (
        <div className="flex min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300">
            <Sidebar />
            <div
                className={clsx(
                    "flex min-h-screen w-full min-w-0 flex-col transition-all duration-300",
                    isSidebarCollapsed ? "lg:ml-0" : "lg:ml-64"
                )}
            >
                <Header />
                <main className="min-w-0 flex-1 overflow-x-hidden p-3 font-sans sm:p-4 lg:p-5">
                    {children}
                </main>
            </div>
        </div>
    );
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const pathname = usePathname();

    const isPublic = pathname === "/" || pathname === "/login" || pathname === "/catalog" || pathname.startsWith("/legal/");

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <QueryClientProvider client={queryClient}>
                <AuthGuard>
                    {isPublic ? (
                        children
                    ) : (
                        <AppShell>{children}</AppShell>
                    )}
                </AuthGuard>
                <CurrencyCalculator />
                <Toaster position="top-right" richColors />
            </QueryClientProvider>
        </ThemeProvider>
    );
}
