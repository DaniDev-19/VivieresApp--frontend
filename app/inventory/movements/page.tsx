"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowUpCircle,
    ArrowDownCircle,
    PackageSearch,
    RefreshCw,
    Filter,
    TrendingUp,
    TrendingDown,
    Activity,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    ShoppingCart,
    Truck,
    RotateCcw,
    Repeat,
    Sliders,
    FileDown,
    Loader2,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Movement {
    id: string;
    type: "sale" | "purchase" | "return" | "exchange_in" | "exchange_out" | "adjustment";
    type_label: string;
    direction: "in" | "out";
    product_id: number;
    product_name: string;
    product_barcode: string | null;
    quantity: number;
    quantity_change: number;
    unit_price_usd: number;
    reference_id: number;
    reference_label: string;
    date: string;
    notes: string | null;
    stock_before: number;
    stock_after: number;
}

interface MovementsResponse {
    total: number;
    movements: Movement[];
}

interface SummaryResponse {
    total_entries: number;
    total_exits: number;
    net_change: number;
    total_movements: number;
    by_type: Record<string, number>;
}

// ── Configuración de tipos ────────────────────────────────────────────────────
const MOVEMENT_TYPES = [
    { value: "", label: "Todos los movimientos", icon: Activity },
    { value: "purchase", label: "Compras (Entrada)", icon: Truck },
    { value: "sale", label: "Ventas (Salida)", icon: ShoppingCart },
    { value: "return", label: "Devoluciones (Entrada)", icon: RotateCcw },
    { value: "exchange_in", label: "Cambios - Entrada", icon: Repeat },
    { value: "exchange_out", label: "Cambios - Salida", icon: Repeat },
    { value: "adjustment", label: "Ajustes Manuales", icon: Sliders },
];

const TYPE_STYLES: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
    sale:         { color: "text-red-600 dark:text-red-400",    bg: "bg-red-100 dark:bg-red-900/30",    icon: ShoppingCart },
    purchase:     { color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", icon: Truck },
    return:       { color: "text-blue-600 dark:text-blue-400",  bg: "bg-blue-100 dark:bg-blue-900/30",  icon: RotateCcw },
    exchange_in:  { color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", icon: Repeat },
    exchange_out: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", icon: Repeat },
    adjustment:   { color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/30", icon: Sliders },
};


const LIMIT = 50;

// ── Componente principal ──────────────────────────────────────────────────────
export default function InventoryMovementsPage() {
    const [productSearch, setProductSearch] = useState("");
    const [movementType, setMovementType] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);

    const [loadingPdf, setLoadingPdf] = useState(false);
    const [loadingExcel, setLoadingExcel] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string } | null>(null);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Cerrar dropdown al hacer click fuera del contenedor
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Búsqueda de producto por nombre para filtrar
    const { data: productsData } = useQuery({
        queryKey: ["products-search-inventory", productSearch],
        queryFn: async () => {
            if (!productSearch) return { items: [] };
            const { data } = await api.get("/products", {
                params: { search: productSearch, limit: 8 },
            });
            return data;
        },
        enabled: productSearch.length > 1,
    });

    const queryParams = {
        product_id: selectedProduct?.id ?? undefined,
        product_search: !selectedProduct && productSearch.length > 1 ? productSearch : undefined,
        movement_type: movementType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        skip: (page - 1) * LIMIT,
        limit: LIMIT,
    };

    const exportParams = {
        product_id: selectedProduct?.id ?? undefined,
        product_search: !selectedProduct && productSearch.length > 1 ? productSearch : undefined,
        movement_type: movementType || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
    };

    // ── Consulta de movimientos ───────────────────────────────────────────────
    const { data, isLoading, refetch, isRefetching } = useQuery<MovementsResponse>({
        queryKey: ["inventory-movements", queryParams],
        queryFn: async () => {
            const { data } = await api.get("/inventory/movements", { params: queryParams });
            return data;
        },
    });

    // ── Consulta de resumen ───────────────────────────────────────────────────
    const { data: summary } = useQuery<SummaryResponse>({
        queryKey: ["inventory-summary", {
            product_id: selectedProduct?.id,
            date_from: dateFrom,
            date_to: dateTo,
        }],
        queryFn: async () => {
            const { data } = await api.get("/inventory/movements/summary", {
                params: {
                    product_id: selectedProduct?.id ?? undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                },
            });
            return data;
        },
    });

    const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

    const clearFilters = useCallback(() => {
        setProductSearch("");
        setSelectedProduct(null);
        setMovementType("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
        setShowProductDropdown(false);
    }, []);

    const handleExport = async (format: "pdf" | "excel") => {
        let printWindow: Window | null = null;
        if (format === "pdf") {
            printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write("<p style='font-family: sans-serif; text-align: center; margin-top: 50px;'>Generando reporte PDF del Kardex... Por favor espere.</p>");
            }
        }

        try {
            if (format === "pdf") setLoadingPdf(true);
            else setLoadingExcel(true);

            const response = await api.get("/inventory/movements/export", {
                params: { format, ...exportParams },
                responseType: "blob",
            });

            const blob = new Blob([response.data], {
                type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const url = window.URL.createObjectURL(blob);

            if (format === "pdf") {
                if (printWindow) {
                    printWindow.location.href = url;
                } else {
                    const link = document.createElement("a");
                    link.href = url;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `Kardex_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            toast.success(`Reporte Kardex (${format.toUpperCase()}) generado con éxito`);
        } catch (error) {
            console.error(error);
            if (printWindow) {
                printWindow.close();
            }
            toast.error("Error al exportar los movimientos de inventario");
        } finally {
            if (format === "pdf") setLoadingPdf(false);
            else setLoadingExcel(false);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <PackageSearch className="h-7 w-7 text-indigo-600" />
                        Movimientos de Inventario
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Entradas y salidas de productos — compras, ventas, devoluciones y cambios
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => handleExport("pdf")}
                        disabled={loadingPdf}
                        className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-4 py-2 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors border border-red-200 dark:border-red-900/30 cursor-pointer"
                    >
                        {loadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                        Exportar PDF
                    </button>
                    <button
                        onClick={() => handleExport("excel")}
                        disabled={loadingExcel}
                        className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 px-4 py-2 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors border border-green-200 dark:border-green-900/30 cursor-pointer"
                    >
                        {loadingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                        Exportar Excel
                    </button>
                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
                        Actualizar
                    </button>
                </div>
            </div>


            {/* ── Tarjetas de resumen ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard
                    label="Total Entradas"
                    value={summary?.total_entries ?? 0}
                    unit="unidades"
                    icon={ArrowUpCircle}
                    color="green"
                />
                <SummaryCard
                    label="Total Salidas"
                    value={summary?.total_exits ?? 0}
                    unit="unidades"
                    icon={ArrowDownCircle}
                    color="red"
                />
                <SummaryCard
                    label="Variación Neta"
                    value={summary?.net_change ?? 0}
                    unit="unidades"
                    icon={summary?.net_change && summary.net_change >= 0 ? TrendingUp : TrendingDown}
                    color={(summary?.net_change ?? 0) >= 0 ? "blue" : "amber"}
                />
                <SummaryCard
                    label="Total Movimientos"
                    value={summary?.total_movements ?? 0}
                    unit="registros"
                    icon={Activity}
                    color="purple"
                />
            </div>

            {/* ── Filtros ─────────────────────────────────────────────────── */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Filter className="h-4 w-4" />
                    Filtros
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Búsqueda de producto */}
                    <div ref={searchContainerRef} className="relative lg:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Producto</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={selectedProduct ? selectedProduct.name : productSearch}
                                onChange={(e) => {
                                    setSelectedProduct(null);
                                    setProductSearch(e.target.value);
                                    setShowProductDropdown(true);
                                    setPage(1);
                                }}
                                onFocus={() => {
                                    if (productSearch.length > 1) setShowProductDropdown(true);
                                }}
                                placeholder="Buscar producto..."
                                className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            {selectedProduct ? (
                                <button
                                    onClick={() => { setSelectedProduct(null); setProductSearch(""); }}
                                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : productSearch && (
                                <button
                                    onClick={() => { setProductSearch(""); setShowProductDropdown(false); }}
                                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {showProductDropdown && !selectedProduct && (productsData?.items?.length ?? 0) > 0 && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                                {productsData!.items.map((p: any) => (
                                    <button
                                        key={p.id}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            setSelectedProduct({ id: p.id, name: p.name });
                                            setProductSearch("");
                                            setShowProductDropdown(false);
                                            setPage(1);
                                        }}
                                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                                    >
                                        <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                                        {p.barcode && <span className="text-xs text-gray-400 ml-2 font-mono">{p.barcode}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                        {showProductDropdown && !selectedProduct && productSearch.length > 1 && (productsData?.items?.length ?? 0) === 0 && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
                                <p className="px-3 py-2.5 text-sm text-gray-400">Sin resultados para "{productSearch}"</p>
                            </div>
                        )}
                    </div>

                    {/* Tipo de movimiento */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                        <Select
                            value={movementType || "all"}
                            onValueChange={(val) => {
                                setMovementType(val === "all" ? "" : val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full h-[38px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm">
                                <SelectValue placeholder="Todos los movimientos" />
                            </SelectTrigger>
                            <SelectContent>
                                {MOVEMENT_TYPES.map((t) => (
                                    <SelectItem key={t.value || "all"} value={t.value || "all"}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fecha desde */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Fecha hasta */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {(selectedProduct || productSearch || movementType || dateFrom || dateTo) && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* ── Tabla de movimientos ────────────────────────────────────── */}
            <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Producto</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Referencia</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Cantidad</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 hidden md:table-cell">Precio Unit.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : data?.movements?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <PackageSearch className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No hay movimientos con los filtros seleccionados</p>
                                        <p className="text-gray-400 text-xs mt-1">Cambia los filtros o el rango de fechas</p>
                                    </td>
                                </tr>
                            ) : (
                                data?.movements?.map((m) => {
                                    const style = TYPE_STYLES[m.type] ?? TYPE_STYLES.sale;
                                    const Icon = style.icon;
                                    const isIn = m.direction === "in";
                                    return (
                                        <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                            {/* Fecha */}
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                                {new Date(m.date).toLocaleString("es-VE", {
                                                    dateStyle: "short",
                                                    timeStyle: "short",
                                                })}
                                            </td>

                                            {/* Tipo */}
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.color}`}>
                                                    <Icon className="h-3 w-3" />
                                                    {m.type_label}
                                                </span>
                                            </td>

                                            {/* Producto */}
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900 dark:text-white text-sm leading-snug">
                                                    {m.product_name}
                                                </div>
                                                {m.product_barcode && (
                                                    <div className="text-xs text-gray-400">{m.product_barcode}</div>
                                                )}
                                                {m.notes && (
                                                    <div className="text-xs text-gray-500 italic mt-0.5 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded inline-block">
                                                        Nota: {m.notes}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Referencia */}
                                            <td className="px-4 py-3 text-center">
                                                <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                                    {m.reference_label}
                                                </span>
                                            </td>

                                            {/* Cantidad */}
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-black text-base ${isIn ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                                    {isIn ? "+" : ""}{m.quantity_change}
                                                </span>
                                                <div className="text-xs text-gray-400">
                                                    {m.stock_before} → {m.stock_after}
                                                </div>
                                            </td>

                                            {/* Precio */}
                                            <td className="px-4 py-3 text-right hidden md:table-cell text-xs text-gray-500">
                                                ${m.unit_price_usd.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Paginación ─────────────────────────────────────────── */}
                {data && data.total > LIMIT && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-xs text-gray-500">
                            Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, data.total)} de {data.total} movimientos
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────
interface SummaryCardProps {
    label: string;
    value: number;
    unit: string;
    icon: React.ElementType;
    color: "green" | "red" | "blue" | "purple" | "amber";
}

const COLOR_MAP = {
    green:  { bg: "bg-green-50 dark:bg-green-900/20",  icon: "text-green-600 dark:text-green-400",  val: "text-green-700 dark:text-green-300" },
    red:    { bg: "bg-red-50 dark:bg-red-900/20",      icon: "text-red-600 dark:text-red-400",      val: "text-red-700 dark:text-red-300" },
    blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",    icon: "text-blue-600 dark:text-blue-400",    val: "text-blue-700 dark:text-blue-300" },
    purple: { bg: "bg-purple-50 dark:bg-purple-900/20",icon: "text-purple-600 dark:text-purple-400",val: "text-purple-700 dark:text-purple-300" },
    amber:  { bg: "bg-amber-50 dark:bg-amber-900/20",  icon: "text-amber-600 dark:text-amber-400",  val: "text-amber-700 dark:text-amber-300" },
};

function SummaryCard({ label, value, unit, icon: Icon, color }: SummaryCardProps) {
    const c = COLOR_MAP[color];
    return (
        <div className={`rounded-2xl p-4 ${c.bg} border border-transparent`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${c.icon}`} />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</span>
            </div>
            <div className={`text-2xl font-black ${c.val}`}>
                {value >= 0 ? value.toLocaleString() : value.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{unit}</div>
        </div>
    );
}
