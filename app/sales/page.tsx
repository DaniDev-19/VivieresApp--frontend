"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Receipt,
    Search,
    Calendar,
    CalendarDays,
    DollarSign,
    Package,
    Eye,
    FileText,
    Trash2,
    RotateCcw,
    RefreshCw,
    History,
    X
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import { SaleTicket } from "@/components/sales/SaleTicket";
import { SaleInvoice } from "@/components/sales/SaleInvoice";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ReturnModal } from "@/components/sales/ReturnModal";
import { ExchangeModal } from "@/components/sales/ExchangeModal";
import { ReturnTicket } from "@/components/sales/ReturnTicket";
import { ExchangeTicket } from "@/components/sales/ExchangeTicket";
import { SaleHistoryModal } from "@/components/sales/SaleHistoryModal";
import type { Return, Exchange } from "@/types";
import { toast } from "sonner";

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

const statusConfig: Record<string, { label: string; className: string }> = {
    completed: { label: "Completada", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    returned: { label: "Devuelta", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    partially_returned: { label: "Dev. Parcial", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
    exchanged: { label: "Cambiada", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
    pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

export default function SalesPage() {
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState<number | null>(null);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
    const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);
    const [exchangeModalSale, setExchangeModalSale] = useState<Sale | null>(null);
    const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
    const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
    const [historySaleId, setHistorySaleId] = useState<number | null>(null);
    const [rates, setRates] = useState<any>({ BCV: 0, USDT: 0, COP: 0 });
    const queryClient = useQueryClient();


    useQuery({
        queryKey: ["latest-rates-sales"],
        queryFn: async () => {
            const { data } = await api.get("/rates/");
            const ratesObj: any = { BCV: 0, USDT: 0, COP: 0 };
            data.reverse().forEach((r: any) => { ratesObj[r.currency] = r.rate; });
            setRates(ratesObj);
            return ratesObj;
        },
    });

    // Fetch Sales
    const { data: sales, isLoading, isPlaceholderData } = useQuery<Sale[]>({
        queryKey: ["sales", page, search, dateFilter],
        queryFn: async () => {
            const params: any = {
                search: search || undefined,
                date_filter: dateFilter || undefined,
                skip: (page - 1) * limit,
                limit
            };
            const { data } = await api.get("/sales", { params });
            return data;
        },
        staleTime: 1000 * 60 * 2,
        placeholderData: (previousData) => previousData,
    });


    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/sales/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["sales-stats"] });
            setIsDeleteModalOpen(false);
            setSaleToDelete(null);
            toast.success("Venta eliminada y stock restaurado");
        },
        onError: (error: any) => {
            console.error("Error deleting sale:", error);
            toast.error("Error al eliminar la venta");
        }
    });

    const handleDeleteClick = (id: number) => {
        setSaleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (saleToDelete) {
            deleteMutation.mutate(saleToDelete);
        }
    };

    const { data: stats } = useQuery({
        queryKey: ["sales-stats"],
        queryFn: async () => {
            const { data } = await api.get("/sales/stats");
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const canReturnOrExchange = (sale: Sale) => sale.status === "completed";

    const statCards = [
        { label: "Hoy", value: stats?.today || 0, iconBg: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-600 dark:text-emerald-400", borderColor: "border-emerald-200 dark:border-emerald-800/50" },
        { label: "Semana", value: stats?.week || 0, iconBg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400", borderColor: "border-blue-200 dark:border-blue-800/50" },
        { label: "Mes", value: stats?.month || 0, iconBg: "bg-violet-100 dark:bg-violet-900/30", iconColor: "text-violet-600 dark:text-violet-400", borderColor: "border-violet-200 dark:border-violet-800/50" },
        { label: "Año", value: stats?.year || 0, iconBg: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400", borderColor: "border-amber-200 dark:border-amber-800/50" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Receipt className="h-6 w-6 text-indigo-600" />
                    Historial de Ventas
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Resumen y detalle de todas las transacciones
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, idx) => (
                    <div key={idx} className={`flex items-center gap-4 rounded-xl border ${stat.borderColor} bg-white dark:bg-gray-900 px-5 py-4 shadow-sm transition-all hover:shadow-md`}>
                        <div className={`rounded-lg ${stat.iconBg} p-2.5`}>
                            <DollarSign className={`h-5 w-5 ${stat.iconColor}`} />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stat.value)}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
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
                <div className="relative w-full sm:w-auto">
                    <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                        className="w-full sm:w-52 rounded-lg border border-gray-200 bg-gray-50 p-2.5 pl-10 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white scheme-dark"
                    />
                    {dateFilter && (
                        <button
                            onClick={() => { setDateFilter(""); setPage(1); }}
                            className="absolute right-2.5 top-2.5 p-0.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                            title="Limpiar filtro de fecha"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
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
                                sales?.map((sale) => {
                                    const st = statusConfig[sale.status] || statusConfig.pending;
                                    const canAct = canReturnOrExchange(sale);
                                    return (
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
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    {canAct ? (
                                                        <>
                                                            {/* Completed sale: Ticket + Factura + Historial | Devolver + Cambiar + Eliminar */}
                                                            <button
                                                                onClick={() => setSelectedSale(sale)}
                                                                className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-indigo-900/20"
                                                                title="Ver Ticket"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedInvoice(sale)}
                                                                className="cursor-pointer rounded-lg p-2 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                                                                title="Factura Formal"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setHistorySaleId(sale.id)}
                                                                className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                                                                title="Historial"
                                                            >
                                                                <History className="h-4 w-4" />
                                                            </button>
                                                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 self-center mx-0.5" />
                                                            <button
                                                                onClick={() => setReturnModalSale(sale)}
                                                                className="cursor-pointer rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                                                                title="Devolución"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setExchangeModalSale(sale)}
                                                                className="cursor-pointer rounded-lg p-2 text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                                                title="Cambio"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(sale.id)}
                                                                className="cursor-pointer rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                                                                title="Eliminar Venta"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Returned/Exchanged sale: Ver Devolución/Cambio only */}
                                                            <button
                                                                onClick={() => setHistorySaleId(sale.id)}
                                                                className={`cursor-pointer rounded-lg p-2 hover:bg-opacity-20 ${
                                                                    sale.status === "returned" || sale.status === "partially_returned"
                                                                        ? "text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                                                        : "text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                                                }`}
                                                                title={sale.status === "returned" || sale.status === "partially_returned" ? "Ver Devolución" : "Ver Cambio"}
                                                            >
                                                                {sale.status === "returned" || sale.status === "partially_returned" ? (
                                                                    <RotateCcw className="h-4 w-4" />
                                                                ) : (
                                                                    <RefreshCw className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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

            {/* Sale Invoice Modal (Formal/Carta) */}
            {selectedInvoice && (
                <SaleInvoice
                    sale={selectedInvoice}
                    rates={rates}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}

            {/* Return Modal */}
            {returnModalSale && (
                <ReturnModal
                    sale={returnModalSale}
                    onClose={() => setReturnModalSale(null)}
                    onSuccess={(data) => {
                        queryClient.invalidateQueries({ queryKey: ["sales"] });
                        queryClient.invalidateQueries({ queryKey: ["sales-stats"] });
                        setSelectedReturn(data);
                        setReturnModalSale(null);
                    }}
                />
            )}

            {/* Exchange Modal */}
            {exchangeModalSale && (
                <ExchangeModal
                    sale={exchangeModalSale}
                    onClose={() => setExchangeModalSale(null)}
                    onSuccess={(data) => {
                        queryClient.invalidateQueries({ queryKey: ["sales"] });
                        queryClient.invalidateQueries({ queryKey: ["sales-stats"] });
                        setSelectedExchange(data);
                        setExchangeModalSale(null);
                    }}
                />
            )}

            {/* Return Ticket Modal */}
            {selectedReturn && (
                <ReturnTicket
                    returnData={selectedReturn}
                    rates={rates}
                    onClose={() => setSelectedReturn(null)}
                />
            )}

            {/* Exchange Ticket Modal */}
            {selectedExchange && (
                <ExchangeTicket
                    exchangeData={selectedExchange}
                    rates={rates}
                    onClose={() => setSelectedExchange(null)}
                />
            )}

            {/* Sale History Modal */}
            {historySaleId && (
                <SaleHistoryModal
                    saleId={historySaleId}
                    rates={rates}
                    onClose={() => setHistorySaleId(null)}
                />
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Venta?"
                description="¿Estás seguro de eliminar esta venta? Se restaurará el stock de los productos y la acción quedará registrada en la bitácora. No se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
