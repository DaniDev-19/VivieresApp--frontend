"use client";

import { useState } from "react";
import {
    FileText,
    Download,
    Calendar,
    Package,
    Tag,
    Printer,
    Loader2,
    Search,
    Plus,
    Trash2
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

    // Inventory State
    const [inventoryFilter, setInventoryFilter] = useState("all");
    const [loadingInventory, setLoadingInventory] = useState(false);

    // Labels State
    const [productSearch, setProductSearch] = useState("");
    const [labelQueue, setLabelQueue] = useState<any[]>([]);
    const [loadingLabels, setLoadingLabels] = useState(false);

    // Fetch Products for Labels
    const { data: products, isLoading: isLoadingProducts } = useQuery({
        queryKey: ["products"],
        queryFn: async () => (await api.get("/products")).data,
        enabled: activeTab === "labels"
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

    const triggerDownload = (blob: Blob, filenamePrefix: string) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        const ext = blob.type.includes("pdf") ? "pdf" : "xlsx";
        link.setAttribute("download", `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.${ext}`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
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
            triggerDownload(response.data, `Reporte_Ventas_ViveresApp_${format}`);
            toast.success(`Reporte ${format.toUpperCase()} descargado correctamente`);
        } catch (error) {
            console.error(error);
            toast.error("Error al descargar el reporte");
        } finally {
            setLoadingSales(false);
        }
    };

    const downloadInventoryReport = async (format: "pdf" | "excel") => {
        try {
            setLoadingInventory(true);
            const params = {
                filter: inventoryFilter,
                format,
            };
            const response = await api.get("/reports/inventory/export", {
                params,
                responseType: "blob",
            });
            triggerDownload(response.data, `Reporte_Inventario_ViveresApp_${format}`);
            toast.success(`Reporte de Inventario descargado`);
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
            triggerDownload(response.data, "Etiquetas_ViveresApp");
            toast.success("Etiquetas generadas exitosamente");
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
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="col-span-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Exportar Reporte de Ventas</h3>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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
                    </div>
                )}

                {activeTab === "inventory" && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:w-2/3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reporte de Inventario</h3>

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
            </div>
        </div>
    );
}
