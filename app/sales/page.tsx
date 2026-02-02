"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Receipt,
    Search,
    Calendar,
    DollarSign,
    Package,
    Eye
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import { SaleTicket } from "@/components/sales/SaleTicket";
import { Pagination } from "@/components/ui/pagination";

interface Sale {
    id: number;
    total_amount_usd: number;
    total_tax_usd?: number;
    has_delivery?: boolean;
    delivery_amount_usd?: number;
    status: string;
    created_at: string;
    items: any[];
    payments: any[];
    customer_name?: string;
    customer_phone?: string;
    customer_cedula?: string;
}

export default function SalesPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [rates, setRates] = useState<any>({ BCV: 0, USDT: 0, COP: 0 });

    // Fetch Rates on load (needed for ticket conversions)
    useQuery({
        queryKey: ["latest-rates-sales"],
        queryFn: async () => {
            const { data } = await api.get("/rates/");
            const ratesObj: any = {};
            data.forEach((r: any) => { ratesObj[r.currency] = r.rate; });
            setRates(ratesObj);
            return ratesObj;
        },
    });

    // Fetch Sales
    const { data: sales, isLoading, isPlaceholderData } = useQuery<Sale[]>({
        queryKey: ["sales", page, search],
        queryFn: async () => {
            const params = {
                search: search || undefined,
                skip: (page - 1) * limit,
                limit
            };
            const { data } = await api.get("/sales", { params });
            return data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        placeholderData: (previousData) => previousData,
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const totalSales = sales?.reduce((sum, sale) => sum + sale.total_amount_usd, 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Receipt className="h-6 w-6 text-indigo-600" />
                        Historial de Ventas
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Resumen y detalle de todas las transacciones
                    </p>
                </div>
                <div className="flex items-center gap-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white shadow-lg">
                    <DollarSign className="h-8 w-8" />
                    <div>
                        <p className="text-xs opacity-90">Total Vendido</p>
                        <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ID de venta..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>
            </div>

            {/* Sales Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ID</th>
                                <th className="px-6 py-4 font-semibold">Fecha</th>
                                <th className="px-6 py-4 font-semibold">Items</th>
                                <th className="px-6 py-4 font-semibold">Total</th>
                                <th className="px-6 py-4 font-semibold">Estado</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Cargando ventas...</td></tr>
                            ) : sales?.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay ventas registradas.</td></tr>
                            ) : (
                                sales?.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            #{sale.id.toString().padStart(6, '0')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {new Date(sale.created_at).toLocaleDateString('es-VE')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-gray-400" />
                                                {sale.items?.length || 0} productos
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">
                                            ${sale.total_amount_usd.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sale.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {sale.status === 'completed' ? 'Completada' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedSale(sale)}
                                                className="rounded-lg p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-indigo-900/20"
                                                title="Ver Ticket"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {/* Pagination */}
            <Pagination
                page={page}
                hasNextPage={sales?.length === limit}
                onPageChange={setPage}
                isLoading={isPlaceholderData}
            />

            {/* Sale Ticket Modal */}
            {selectedSale && (
                <SaleTicket
                    sale={selectedSale}
                    rates={rates}
                    onClose={() => setSelectedSale(null)}
                />
            )}
        </div>
    );
}
