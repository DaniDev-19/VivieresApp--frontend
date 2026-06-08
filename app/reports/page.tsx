"use client";

import { useState } from "react";
import {
    FileText,
    Download,
    Package,
    Tag,
    Printer,
    Loader2,
    Search,
    Plus,
    Trash2,
    Trophy,
    TrendingDown,
    ArrowUpRight
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("sales");

    // Sales State
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loadingSales, setLoadingSales] = useState(false);
    
    // Cash Close State
    const [cashCloseDate, setCashCloseDate] = useState(new Date().toISOString().split('T')[0]);
    const [loadingCashClose, setLoadingCashClose] = useState(false);

    // Inventory State
    const [inventoryFilter, setInventoryFilter] = useState("all");
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [loadingLowStockRep, setLoadingLowStockRep] = useState(false);
    const [inventoryReportType, setInventoryReportType] = useState("standard");

    // Labels State
    const [productSearch, setProductSearch] = useState("");
    const [labelQueue, setLabelQueue] = useState<any[]>([]);
    const [loadingLabels, setLoadingLabels] = useState(false);

    // Rankings State
    const [rankingsDateStart, setRankingsDateStart] = useState("");
    const [rankingsDateEnd, setRankingsDateEnd] = useState("");
    const [exportingRankings, setExportingRankings] = useState(false);

    const handleExportRankings = async () => {
        try {
            setExportingRankings(true);
            let url = `/reports/rankings/export`;
            const params = new URLSearchParams();
            if (rankingsDateStart) params.append("start_date", rankingsDateStart);
            if (rankingsDateEnd) params.append("end_date", rankingsDateEnd);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const res = await api.get(url, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(blobUrl, '_blank');
            toast.success("Reporte de Rankings abierto en nueva pestaña");
        } catch (error) {
            console.error(error);
            toast.error("Error al exportar reporte de rankings");
        } finally {
            setExportingRankings(false);
        }
    };

    // Analytics (Crecimiento) State
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [exportingMonthly, setExportingMonthly] = useState(false);

    const handleExportMonthly = async () => {
        try {
            setExportingMonthly(true);
            const res = await api.get(`/reports/growth/monthly/export`, {
                params: { year: selectedYear },
                responseType: 'blob'
            });
            const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(blobUrl, '_blank');
            toast.success(`Reporte mensual del año ${selectedYear} abierto en nueva pestaña`);
        } catch (error) {
            console.error(error);
            toast.error("Error al exportar reporte de crecimiento mensual");
        } finally {
            setExportingMonthly(false);
        }
    };

    // Fetch Products for Labels
    const { data: products, isLoading: isLoadingProducts } = useQuery({
        queryKey: ["products"],
        queryFn: async () => (await api.get("/products")).data,
        enabled: activeTab === "labels"
    });

    const { data: rankings, isLoading: isLoadingRankings } = useQuery({
        queryKey: ["rankings", rankingsDateStart, rankingsDateEnd],
        queryFn: async () => (await api.get("/reports/rankings", {
            params: {
                start_date: rankingsDateStart || undefined,
                end_date: rankingsDateEnd || undefined
            }
        })).data,
        enabled: activeTab === "rankings"
    });

    const { data: customerRanking, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ["customer-ranking"],
        queryFn: async () => (await api.get("/reports/customers/ranking")).data,
        enabled: activeTab === "rankings" || activeTab === "analytics"
    });

    const { data: annualGrowth, isLoading: isLoadingGrowth } = useQuery({
        queryKey: ["annual-growth"],
        queryFn: async () => (await api.get("/reports/growth/annual")).data,
        enabled: activeTab === "analytics"
    });

    const { data: monthlyGrowth, isLoading: isLoadingMonthly } = useQuery({
        queryKey: ["monthly-growth", selectedYear],
        queryFn: async () => (await api.get("/reports/growth/monthly", {
            params: { year: selectedYear }
        })).data,
        enabled: activeTab === "analytics"
    });

    const { data: providersPerformance, isLoading: isLoadingProviders } = useQuery({
        queryKey: ["providers-performance"],
        queryFn: async () => (await api.get("/reports/providers/performance")).data,
        enabled: activeTab === "rankings"
    });

    const filteredProducts = products?.filter((p: any) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    const addToLabelQueue = (product: any) => {
        setLabelQueue(prev => {
            const exists = prev.find(item => item.product_id === product.id);
            if (exists) {
                return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, {
                product_id: product.id,
                name: product.name,
                price: product.price_usd,
                quantity: 1
            }];
        });
        toast.success("Producto agregado a la cola");
    };

    const removeFromQueue = (index: number) => {
        setLabelQueue(prev => prev.filter((_, i) => i !== index));
    };

    const updateQueueQuantity = (index: number, quantity: number) => {
        if (quantity < 1) return;
        setLabelQueue(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
    };

    const triggerOpenOrDownload = (blob: Blob, filenamePrefix: string) => {
        const url = window.URL.createObjectURL(blob);
        if (blob.type.includes("pdf")) {
            window.open(url, "_blank");
        } else {
            const link = document.createElement("a");
            link.href = url;
            const ext = "xlsx";
            link.setAttribute("download", `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.${ext}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        }
    };

    const downloadSalesReport = async (format: "pdf" | "excel") => {
        try {
            setLoadingSales(true);
            const params: any = {
                format,
            };
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await api.get("/reports/sales/export", {
                params,
                responseType: "blob",
            });
            triggerOpenOrDownload(response.data, `Reporte_Ventas_${format}`);
            toast.success(format === "pdf" ? "Reporte abierto en nueva pestaña" : "Reporte Excel descargado correctamente");
        } catch (error) {
            console.error(error);
            toast.error("Error al descargar el reporte");
        } finally {
            setLoadingSales(false);
        }
    };

    const downloadCashCloseReport = async () => {
        try {
            setLoadingCashClose(true);
            const response = await api.get("/reports/cash-close", {
                params: { date_str: cashCloseDate },
                responseType: "blob",
            });
            triggerOpenOrDownload(response.data, `Cierre_Caja_${cashCloseDate}`);
            toast.success("Cierre de caja abierto en nueva pestaña");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el cierre de caja");
        } finally {
            setLoadingCashClose(false);
        }
    };

    const downloadLowStockRepReport = async () => {
        try {
            setLoadingLowStockRep(true);
            const response = await api.get("/reports/low-stock/export", {
                responseType: "blob",
            });
            triggerOpenOrDownload(response.data, "Alerta_Bajo_Stock_Reposicion");
            toast.success("Reporte de reposición abierto en nueva pestaña");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar reporte de reposición");
        } finally {
            setLoadingLowStockRep(false);
        }
    };

    const downloadInventoryReport = async (format: "pdf" | "excel") => {
        try {
            setLoadingInventory(true);
            const params = {
                filter: inventoryFilter,
                format,
                type: inventoryReportType,
            };
            const response = await api.get("/reports/inventory/export", {
                params,
                responseType: "blob",
            });
            triggerOpenOrDownload(response.data, `Reporte_Inventario_${format}`);
            toast.success(format === "pdf" ? "Reporte de Inventario abierto en nueva pestaña" : "Reporte de Inventario descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error al descargar reporte");
        } finally {
            setLoadingInventory(false);
        }
    };

    const generateLabels = async () => {
        try {
            setLoadingLabels(true);
            const payload = labelQueue.map(item => ({
                product_id: Number(item.product_id),
                name: String(item.name).substring(0, 50), // Limit length just in case
                price: Number(item.price) || 0,
                quantity: Number(item.quantity) || 1
            }));

            const response = await api.post("/reports/labels/generate", payload, {
                responseType: "blob"
            });
            triggerOpenOrDownload(response.data, "Etiquetas_Productos");
            toast.success("Etiquetas abiertas en nueva pestaña");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar etiquetas");
        } finally {
            setLoadingLabels(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h2>
                <p className="text-gray-500 dark:text-gray-400">Exporta datos y genera etiquetas para tu negocio.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-800">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {[
                        { id: "sales", name: "Ventas", icon: FileText },
                        { id: "inventory", name: "Inventario", icon: Package },
                        { id: "labels", name: "Etiquetas", icon: Tag },
                        { id: "rankings", name: "Rankings", icon: Trophy },
                        { id: "analytics", name: "Crecimiento", icon: ArrowUpRight },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors
                                ${activeTab === tab.id
                                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                }
                            `}
                        >
                            <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.id ? "text-indigo-500" : "text-gray-400 group-hover:text-gray-500"}`} />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === "sales" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Exportar Ventas Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Exportar Reporte de Ventas</h3>

                            <div className="grid gap-4 sm:grid-cols-2 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => downloadSalesReport("pdf")}
                                    disabled={loadingSales}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                                >
                                    {loadingSales ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Descargar PDF
                                </button>
                                <button
                                    onClick={() => downloadSalesReport("excel")}
                                    disabled={loadingSales}
                                    className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
                                >
                                    {loadingSales ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                    Descargar Excel
                                </button>
                            </div>
                        </div>

                        {/* Cierre de Caja Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Arqueo y Cierre de Caja Diario</h3>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del Cierre</label>
                                <input
                                    type="date"
                                    value={cashCloseDate}
                                    onChange={(e) => setCashCloseDate(e.target.value)}
                                    className="w-full md:w-1/2 rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Genera un arqueo de caja con el total de operaciones y desglose por método de pago para auditar el cuadre de fondos.
                                </p>
                            </div>

                            <button
                                onClick={downloadCashCloseReport}
                                disabled={loadingCashClose}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 disabled:opacity-50 transition-colors"
                            >
                                {loadingCashClose ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                Generar Cierre de Caja (PDF)
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "inventory" && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Reporte de Inventario Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Exportar Catálogo de Inventario</h3>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtrar por</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="invFilter"
                                            checked={inventoryFilter === 'all'}
                                            onChange={() => setInventoryFilter('all')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm">Todo el Inventario</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="invFilter"
                                            checked={inventoryFilter === 'low_stock'}
                                            onChange={() => setInventoryFilter('low_stock')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm">Solo Bajo Stock</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Columnas del Reporte</label>
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="invReportType"
                                            checked={inventoryReportType === 'standard'}
                                            onChange={() => setInventoryReportType('standard')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm">General (Todo el detalle)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="invReportType"
                                            checked={inventoryReportType === 'code_name'}
                                            onChange={() => setInventoryReportType('code_name')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm">Solo Código y Nombre</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="invReportType"
                                            checked={inventoryReportType === 'prices'}
                                            onChange={() => setInventoryReportType('prices')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm">Precios (Oferta y Final)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => downloadInventoryReport("pdf")}
                                    disabled={loadingInventory}
                                    className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                                >
                                    {loadingInventory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Descargar PDF
                                </button>
                                <button
                                    onClick={() => downloadInventoryReport("excel")}
                                    disabled={loadingInventory}
                                    className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
                                >
                                    {loadingInventory ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                    Descargar Excel
                                </button>
                            </div>
                        </div>

                        {/* Alerta de Stock Crítico y Reposición Card */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Alerta de Stock Crítico y Reposición</h3>

                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                Genera un reporte optimizado para compras de reabastecimiento. Muestra los productos agotados o bajo el mínimo, calcula la inversión total estimada necesaria en dólares e identifica los proveedores sugeridos basándose en el historial de compras.
                            </p>

                            <button
                                onClick={downloadLowStockRepReport}
                                disabled={loadingLowStockRep}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {loadingLowStockRep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                Generar Reporte de Reposición (PDF)
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "labels" && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Product Selector */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col h-[600px]">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">1. Seleccionar Productos</h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {isLoadingProducts ? (
                                    <div className="text-center py-8 text-gray-500">Cargando productos...</div>
                                ) : filteredProducts?.map((prod: any) => (
                                    <div key={prod.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                                        <div>
                                            <p className="font-medium text-sm text-gray-900 dark:text-white">{prod.name}</p>
                                            <p className="text-xs text-gray-500">${prod.price_usd}</p>
                                        </div>
                                        <button
                                            onClick={() => addToLabelQueue(prod)}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Print Queue */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col h-[600px]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">2. Cola de Impresión</h3>
                                <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full dark:bg-gray-800">
                                    {labelQueue.reduce((acc, item) => acc + item.quantity, 0)} etiquetas
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                {labelQueue.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                        <Tag className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="text-sm">Agrega productos para imprimir</p>
                                    </div>
                                ) : (
                                    labelQueue.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm dark:bg-gray-800">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQueueQuantity(idx, parseInt(e.target.value) || 1)}
                                                    className="w-16 rounded border border-gray-200 p-1 text-center text-sm dark:border-gray-700 dark:bg-gray-900"
                                                />
                                                <button
                                                    onClick={() => removeFromQueue(idx)}
                                                    className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={generateLabels}
                                    disabled={labelQueue.length === 0 || loadingLabels}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    {loadingLabels ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                                    Generar PDF de Etiquetas
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "rankings" && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Periodo Desde</label>
                                <input
                                    type="date"
                                    value={rankingsDateStart}
                                    onChange={(e) => setRankingsDateStart(e.target.value)}
                                    className="w-full rounded-xl border border-gray-100 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white transition-all"
                                />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Periodo Hasta</label>
                                <input
                                    type="date"
                                    value={rankingsDateEnd}
                                    onChange={(e) => setRankingsDateEnd(e.target.value)}
                                    className="w-full rounded-xl border border-gray-100 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white transition-all"
                                />
                            </div>
                            <button
                                onClick={() => { setRankingsDateStart(""); setRankingsDateEnd(""); }}
                                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                            <button
                                onClick={handleExportRankings}
                                disabled={exportingRankings}
                                className="ml-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                {exportingRankings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                Exportar PDF
                            </button>
                        </div>

                        {isLoadingRankings ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
                                <p className="text-gray-500 font-medium">Calculando rankings en tiempo real...</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 lg:grid-cols-3">
                                {/* Sales Leaders */}
                                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                                            <Trophy className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Líderes de Ventas</h3>
                                            <p className="text-xs text-gray-500 font-medium tracking-tight">Ventas concretadas por usuario</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {rankings?.top_users?.length > 0 ? rankings.top_users.map((user: any, idx: number) => (
                                            <div key={user.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                                                <div className={`
                                                    h-10 w-10 rounded-xl flex items-center justify-center font-black text-lg
                                                    ${idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                        idx === 1 ? "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300" :
                                                            idx === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                                "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500"}
                                                `}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white capitalize truncate">{user.username}</p>
                                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{user.transactions} Ventas</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-sm text-gray-900 dark:text-white">${user.total_amount.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-center text-sm text-gray-400 py-10">Sin datos de ventas en este periodo</p>
                                        )}
                                    </div>
                                </div>

                                {/* Top Products */}
                                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                            <ArrowUpRight className="h-5 w-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Top Productos</h3>
                                            <p className="text-xs text-gray-500 font-medium tracking-tight">Más vendidos por unidades</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6 flex-1">
                                        {rankings?.top_products?.length > 0 ? rankings.top_products.map((prod: any, idx: number) => (
                                            <div key={prod.id} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[70%]">{prod.name}</p>
                                                    <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{prod.value} uds.</p>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${Math.min(100, (prod.value / rankings.top_products[0].value) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-center text-sm text-gray-400 py-10">Sin registros de productos</p>
                                        )}
                                    </div>
                                </div>

                                {/* Low Rotation */}
                                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 flex flex-col">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                                            <TrendingDown className="h-5 w-5 text-rose-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white">Baja Rotación</h3>
                                            <p className="text-xs text-gray-500 font-medium tracking-tight">Productos con menos ventas</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {rankings?.low_products?.length > 0 ? rankings.low_products.map((prod: any) => (
                                            <div key={prod.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate max-w-[70%]">{prod.name}</p>
                                                <span className="px-2 py-1 bg-white dark:bg-gray-800 text-[10px] font-black text-rose-600 dark:text-rose-400 rounded-lg shadow-sm">
                                                    {prod.value} vtas.
                                                </span>
                                            </div>
                                        )) : (
                                            <p className="text-center text-sm text-gray-400 py-10">Sin productos analizados</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Best Clients Section */}
                        <div className="grid gap-6 lg:grid-cols-2 mt-6">
                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Mejores Clientes</h3>
                                <div className="space-y-4">
                                    {customerRanking?.slice(0, 5).map((c: any, idx: number) => (
                                        <div key={c.id} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</p>
                                                    <p className="text-xs text-gray-500">{c.orders} pedidos</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-indigo-600 dark:text-indigo-400">${c.amount.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Mejores Proveedores</h3>
                                <div className="space-y-4">
                                    {providersPerformance?.slice(0, 5).map((p: any) => (
                                        <div key={p.id} className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</p>
                                                <span className={`px-2 py-1 rounded text-[10px] font-black ${p.reliability > 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {p.reliability.toFixed(1)}% fiabilidad
                                                </span>
                                            </div>
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span>Total: {p.total_orders}</span>
                                                <span>Logrados: {p.completed_orders}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "analytics" && (
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Crecimiento Anual</h3>
                            <p className="text-sm text-gray-500 mb-8">Selecciona un año para ver el desglose detallado de ventas y ganancias mes a mes en la tabla inferior.</p>
                            
                            <div className="grid gap-8 md:grid-cols-2">
                                {annualGrowth?.map((yearData: any) => {
                                    const isSelected = selectedYear === yearData.year;
                                    return (
                                        <div
                                            key={yearData.year}
                                            onClick={() => setSelectedYear(yearData.year)}
                                            className={`p-6 rounded-3xl cursor-pointer transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg border-2 ${
                                                isSelected
                                                    ? "bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-500 shadow-md ring-2 ring-indigo-500/10"
                                                    : "bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                                            }`}
                                        >
                                            <div className="flex justify-between items-center mb-6 border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                                                <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{yearData.year}</h4>
                                                {isSelected && (
                                                    <span className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase rounded-full tracking-wider shadow-sm">
                                                        Seleccionado
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-6">
                                                {/* Sección Ventas (Ingresos) */}
                                                <div>
                                                    <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Ventas Totales</h5>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <p className="text-sm font-medium text-gray-500">Monto USD</p>
                                                            <p className="text-xl font-black text-gray-900 dark:text-white">${yearData.total_usd.toFixed(2)}</p>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <p className="text-sm font-medium text-gray-500">Monto VES (BCV)</p>
                                                            <p className="text-sm font-bold text-indigo-500">Bs. {yearData.total_bs_bcv.toFixed(2)}</p>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <p className="text-sm font-medium text-gray-500">Monto VES (USDT)</p>
                                                            <p className="text-sm font-bold text-amber-500">Bs. {yearData.total_bs_usdt.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sección Ganancias */}
                                                <div className="border-t border-indigo-100 dark:border-indigo-900/40 pt-4">
                                                    <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Ganancia Estimada</h5>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <p className="text-sm font-medium text-gray-500">Ganancia USD</p>
                                                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">${yearData.profit_usd.toFixed(2)}</p>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <p className="text-sm font-medium text-gray-500">Ganancia VES (BCV)</p>
                                                            <p className="text-sm font-bold text-indigo-500">Bs. {yearData.profit_bs_bcv.toFixed(2)}</p>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <p className="text-sm font-medium text-gray-500">Ganancia VES (USDT)</p>
                                                            <p className="text-sm font-bold text-amber-500">Bs. {yearData.profit_bs_usdt.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Monthly Growth Section */}
                        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                    Ganancia y Ventas Mensuales ({selectedYear})
                                </h3>
                                <button
                                    onClick={handleExportMonthly}
                                    disabled={exportingMonthly}
                                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    {exportingMonthly ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                    Exportar PDF Mensual
                                </button>
                            </div>
                            
                            {isLoadingMonthly ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
                                    <p className="text-sm text-gray-500 font-medium">Cargando reporte mensual...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                                                <th className="p-4">Mes</th>
                                                <th className="p-4 text-right">Ventas (USD)</th>
                                                <th className="p-4 text-right">Ganancia (USD)</th>
                                                <th className="p-4 text-right">Ventas BCV (VES)</th>
                                                <th className="p-4 text-right">Ganancia BCV (VES)</th>
                                                <th className="p-4 text-right">Ventas USDT (VES)</th>
                                                <th className="p-4 text-right">Ganancia USDT (VES)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {monthlyGrowth?.map((monthData: any) => (
                                                <tr key={monthData.month_num} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                                    <td className="p-4 font-bold text-gray-900 dark:text-white">{monthData.month_name}</td>
                                                    <td className="p-4 text-right font-black text-indigo-600 dark:text-indigo-400">${monthData.total_usd.toFixed(2)}</td>
                                                    <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">${monthData.profit_usd.toFixed(2)}</td>
                                                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">Bs. {monthData.total_bs_bcv.toFixed(2)}</td>
                                                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">Bs. {monthData.profit_bs_bcv.toFixed(2)}</td>
                                                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">Bs. {monthData.total_bs_usdt.toFixed(2)}</td>
                                                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">Bs. {monthData.profit_bs_usdt.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
