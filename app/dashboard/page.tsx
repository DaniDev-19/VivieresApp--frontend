"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    CreditCard,
    DollarSign,
    Package,
    ShoppingCart,
    TrendingUp,
    AlertTriangle,
    Users,
    RotateCcw,
    RefreshCw
} from "lucide-react";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { formatCurrency } from "@/lib/utils";

// Componente para Tarjetas de Estadística
function StatsCard({ title, value, icon: Icon, subtext, trend }: any) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
                </div>
                <div className={`rounded-full p-3 ${trend === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {subtext && (
                <p className={`mt-2 text-xs ${trend === 'danger' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {subtext}
                </p>
            )}
        </div>
    );
}

export default function DashboardPage() {
    // 1. Fetch Summary Stats
    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => (await api.get("/reports/dashboard/stats")).data,
        refetchInterval: 30000 // Refresh every 30s
    });

    // 2. Fetch Chart Data
    const { data: chartData, isLoading: isLoadingChart } = useQuery({
        queryKey: ["dashboard-chart"],
        queryFn: async () => (await api.get("/reports/dashboard/chart")).data
    });

    // 3. Fetch Rates (already in another component, but for summary here)
    const { data: rates } = useQuery({
        queryKey: ["rates"],
        queryFn: async () => (await api.get("/rates/")).data
    });

    const bcvRate = rates?.find((r: any) => r.currency === "BCV")?.rate || 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                <p className="text-gray-500 dark:text-gray-400">Resumen y métricas de tu negocio</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title="Ventas Hoy"
                    value={isLoadingStats ? "..." : formatCurrency(stats?.revenue_today || 0)}
                    icon={DollarSign}
                    subtext={`${stats?.sales_count_today || 0} transacciones`}
                />
                <StatsCard
                    title="Inventario Bajo"
                    value={isLoadingStats ? "..." : stats?.low_stock_count || 0}
                    icon={AlertTriangle}
                    subtext="Productos requieren atención"
                    trend={stats?.low_stock_count > 0 ? "danger" : "neutral"}
                />
                <StatsCard
                    title="Tasa BCV"
                    value={bcvRate > 0 ? `Bs. ${bcvRate}` : "Consultando..."}
                    icon={TrendingUp}
                    subtext="Actualizado hoy"
                />
                <StatsCard
                    title="Total Clientes"
                    value={isLoadingStats ? "..." : stats?.total_customers || 0}
                    icon={Users}
                    subtext="Registrados"
                />
                <StatsCard
                    title="Devoluciones"
                    value={isLoadingStats ? "..." : stats?.total_returns || 0}
                    icon={RotateCcw}
                    subtext="Total registradas"
                    trend={stats?.total_returns > 0 ? "danger" : "neutral"}
                />
                <StatsCard
                    title="Cambios"
                    value={isLoadingStats ? "..." : stats?.total_exchanges || 0}
                    icon={RefreshCw}
                    subtext="Total registrados"
                    trend={stats?.total_exchanges > 0 ? "danger" : "neutral"}
                />
            </div>

            {/* Main Content: Chart + Recent Sales */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* Chart Section */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:col-span-4 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Ventas (Últimos 7 Días)
                    </h3>
                    <div className="pl-0">
                        {isLoadingChart ? (
                            <div className="h-[350px] flex items-center justify-center animate-pulse bg-gray-50 rounded-lg">Cargando gráfica...</div>
                        ) : (
                            <SalesChart data={chartData} />
                        )}
                    </div>
                </div>

                {/* Recent Sales Section */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:col-span-3 dark:border-gray-800 dark:bg-gray-900 flex flex-col">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-600" /> Ventas Recientes
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[350px]">
                        {isLoadingStats ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-lg" />)}
                            </div>
                        ) : stats?.recent_sales?.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400">Sin ventas hoy</div>
                        ) : (
                            stats?.recent_sales?.map((sale: any) => (
                                <div key={sale.id} className="flex items-center justify-between rounded-lg border border-gray-50 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                            <DollarSign className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Venta #{sale.id}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(sale.created_at).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            +{formatCurrency(sale.total_amount_usd)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions (Optional, maybe for inventory shortcuts) */}
        </div>
    );
}
