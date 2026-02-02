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
                        <div className="flex min-h-screen items-start bg-background text-foreground transition-colors duration-300">
                            <Sidebar />
                            <div className="flex w-full flex-col lg:ml-64 transition-all duration-300 min-h-screen">
                                <Header />
                                <main className="flex-1 p-4 sm:p-6 overflow-auto font-sans">
                                    {children}
                                </main>
                            </div>
                        </div>
                    )}
                </AuthGuard>
                <CurrencyCalculator />
                <Toaster position="top-right" richColors />
            </QueryClientProvider>
        </ThemeProvider>
    );
}
