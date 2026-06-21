"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Truck,
    CheckCircle2,
    Clock,
    X,
    Loader2,
    FileText,
    MapPin,
    AlertCircle,
    User as UserIcon,
    DollarSign,
    Check,
    PlusCircle,
    MinusCircle,
    Eye
} from "lucide-react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

const renderItemsDetail = (itemsDetail: string) => {
    if (!itemsDetail) return <span className="text-gray-400">-</span>;
    try {
        if (itemsDetail.startsWith("[")) {
            const items = JSON.parse(itemsDetail);
            return (
                <div className="flex flex-col gap-1 max-w-55">
                    {items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs">
                            <span className="truncate flex-1 text-gray-750 dark:text-gray-250" title={item.name}>{item.name}</span>
                            <span className="font-semibold text-gray-950 dark:text-white shrink-0">x{item.quantity}</span>
                        </div>
                    ))}
                </div>
            );
        }
    } catch (e) {
        // Fallback
    }
    return <span className="text-xs block max-w-[150px] truncate" title={itemsDetail}>{itemsDetail}</span>;
};

export default function DeliveriesPage() {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore((state) => state.user);
    const userRole = currentUser?.role || "worker";
    const isAdminOrWorker = userRole === "admin" || userRole === "worker";

    // Filtering states
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailDelivery, setDetailDelivery] = useState<any>(null);

    // Selection states
    const [editingDelivery, setEditingDelivery] = useState<any>(null);
    const [deliveryToDelete, setDeliveryToDelete] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        description: "",
        address: "",
        items_detail: "",
        cost_usd: "" as any,
        status: "pending",
        delivery_user_id: "",
        provider_id: "",
        sale_id: ""
    });

    // Product Selector states
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const debouncedProductSearch = useDebounce(productSearch, 300);

    // Complete Delivery Cost prompt states
    const [completingDelivery, setCompletingDelivery] = useState<any>(null);
    const [completionCost, setCompletionCost] = useState("");

    // Missing states for product selector & report exports
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [exportingReport, setExportingReport] = useState(false);
    const [reportStartDate, setReportStartDate] = useState("");
    const [reportEndDate, setReportEndDate] = useState("");

    const handleOpenCompleteModal = (delivery: any) => {
        setCompletingDelivery(delivery);
        setCompletionCost("");
    };

    // 1. Fetch Deliveries
    const { data: deliveries = [], isLoading } = useQuery<any[]>({
        queryKey: ["deliveries", statusFilter],
        queryFn: async () => {
            const params: any = {};
            if (statusFilter) params.status_filter = statusFilter;
            const { data } = await api.get("/deliveries/", { params });
            return data;
        },
        placeholderData: keepPreviousData,
    });

    // 2. Fetch Users (to select a delivery driver)
    const { data: users = [] } = useQuery<any[]>({
        queryKey: ["users-all"],
        queryFn: async () => {
            const { data } = await api.get("/users/", { params: { limit: 100 } });
            return data;
        },
        enabled: isAdminOrWorker
    });

    // Filter users with delivery role
    const deliveryDrivers = users.filter((u: any) => u.role === "delivery" || u.role === "UserRole.DELIVERY");

    // Fetch delivery providers
    const { data: providers = [] } = useQuery<any[]>({
        queryKey: ["providers-delivery"],
        queryFn: async () => {
            const { data } = await api.get("/providers/", { params: { is_delivery: true } });
            return data;
        },
        enabled: isAdminOrWorker
    });

    // Fetch all products (for selector)
    const { data: allProducts = [] } = useQuery<any[]>({
        queryKey: ["products-all"],
        queryFn: async () => {
            const { data } = await api.get("/products/");
            return data;
        },
        enabled: isAdminOrWorker
    });

    // Fetch today's sales
    const { data: todaySales = [] } = useQuery<any[]>({
        queryKey: ["sales-today"],
        queryFn: async () => {
            const { data } = await api.get("/sales/", { params: { only_today: true, limit: 100 } });
            return data;
        },
        enabled: isAdminOrWorker
    });

    const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
        queryKey: ["products-search", debouncedProductSearch],
        queryFn: async () => {
            if (!debouncedProductSearch.trim()) return [];
            const { data } = await api.get("/products/", {
                params: { search: debouncedProductSearch, limit: 10 }
            });
            return data;
        },
        enabled: showProductDropdown,
        placeholderData: keepPreviousData, // Evita parpadeos usando la importación corregida
    });

    // 3. Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => api.post("/deliveries/", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] });
            toast.success("Envío programado exitosamente");
            setShowModal(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error("Error al registrar envío", { description: err.response?.data?.detail });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => api.put(`/deliveries/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] });
            toast.success("Envío actualizado correctamente");
            setShowModal(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error("Error al actualizar envío", { description: err.response?.data?.detail });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, cost_usd }: any) => {
            let url = `/deliveries/${id}/status?status_str=${status}`;
            if (cost_usd !== undefined && cost_usd !== null) {
                url += `&cost_usd=${cost_usd}`;
            }
            return api.patch(url);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] });
            toast.success("Estado del envío actualizado");
        },
        onError: (err: any) => {
            toast.error("Error al actualizar el estado", { description: err.response?.data?.detail });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/deliveries/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] });
            toast.success("Envío eliminado");
            setShowDeleteModal(false);
            setDeliveryToDelete(null);
        },
        onError: (err: any) => {
            toast.error("Error al eliminar envío", { description: err.response?.data?.detail });
        }
    });

    const resetForm = () => {
        setFormData({
            description: "",
            address: "",
            items_detail: "",
            cost_usd: "" as any,
            status: "pending",
            delivery_user_id: "",
            provider_id: "",
            sale_id: ""
        });
        setSelectedProducts([]);
        setEditingDelivery(null);
    };

    const handleSaleChange = (saleId: string) => {
        setFormData((prev) => ({ ...prev, sale_id: saleId }));
        handleLoadSaleProducts(saleId);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = {
            ...formData,
            cost_usd: formData.cost_usd !== "" ? Number(formData.cost_usd) : null,
            delivery_user_id: formData.delivery_user_id ? Number(formData.delivery_user_id) : null,
            provider_id: formData.provider_id ? Number(formData.provider_id) : null,
            sale_id: formData.sale_id ? Number(formData.sale_id) : null
        };

        if (editingDelivery) {
            updateMutation.mutate({ id: editingDelivery.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (delivery: any) => {
        setEditingDelivery(delivery);
        setFormData({
            description: delivery.description,
            address: delivery.address || "",
            items_detail: delivery.items_detail || "",
            cost_usd: delivery.cost_usd !== null && delivery.cost_usd !== undefined ? String(delivery.cost_usd) : "",
            status: delivery.status,
            delivery_user_id: delivery.delivery_user_id ? String(delivery.delivery_user_id) : "",
            provider_id: delivery.provider_id ? String(delivery.provider_id) : "",
            sale_id: delivery.sale_id ? String(delivery.sale_id) : ""
        });

        let parsed = [];
        if (delivery.items_detail && delivery.items_detail.startsWith("[")) {
            try {
                parsed = JSON.parse(delivery.items_detail);
            } catch (e) {
                // Ignore
            }
        }
        setSelectedProducts(parsed);
        setShowModal(true);
    };

    const handleLoadSaleProducts = async (saleIdParam?: string) => {
        const sId = saleIdParam !== undefined ? saleIdParam : formData.sale_id;
        if (!sId) {
            setSelectedProducts([]);
            return;
        }
        try {
            toast.loading("Buscando venta...", { id: "load-sale" });
            const { data: sale } = await api.get(`/sales/${sId}`);
            toast.dismiss("load-sale");
            if (sale && sale.items) {
                const mappedProducts = sale.items.map((item: any) => {
                    const prod = allProducts.find((p: any) => p.id === item.product_id);
                    return {
                        product_id: item.product_id,
                        name: item.name || prod?.name || "Producto",
                        quantity: item.quantity
                    };
                });
                setSelectedProducts(mappedProducts);
                toast.success(`Productos cargados desde la Venta #${sId}`);
            } else {
                toast.error("La venta no contiene productos.");
            }
        } catch (error) {
            toast.dismiss("load-sale");
            console.error(error);
            toast.error("No se pudo cargar la venta. Verifique el ID.");
        }
    };

    // Filter deliveries client-side by search query
    const filteredDeliveries = deliveries.filter((d: any) => {
        const matchesSearch =
            d.description.toLowerCase().includes(search.toLowerCase()) ||
            (d.address && d.address.toLowerCase().includes(search.toLowerCase())) ||
            (d.delivery_user && d.delivery_user.username.toLowerCase().includes(search.toLowerCase())) ||
            (d.provider && d.provider.name.toLowerCase().includes(search.toLowerCase()));
        return matchesSearch;
    });

    const downloadReport = async () => {
        try {
            setExportingReport(true);
            const params: any = {};
            if (reportStartDate) params.start_date = reportStartDate;
            if (reportEndDate) params.end_date = reportEndDate;

            const response = await api.get("/reports/deliveries", {
                params,
                responseType: "blob"
            });

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");

            toast.success("Reporte de envíos generado correctamente");
            setShowReportModal(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al generar el reporte de envíos");
        } finally {
            setExportingReport(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Control de Envíos y Delivery</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona los viajes, carreras y comisiones de los repartidores.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {isAdminOrWorker && (
                        <>
                            <button
                                onClick={() => setShowReportModal(true)}
                                title="Exportar"
                                className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                            >
                                <FileText className="h-4 w-4 text-indigo-500" />
                                Exportar Reporte
                            </button>
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                title="Añadir envio"
                                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Programar Envío
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            {isAdminOrWorker && (
                <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">Total Carreras</span>
                            <Truck className="h-5 w-5 text-indigo-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{deliveries.length}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">Entregas Completadas</span>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {deliveries.filter((d: any) => d.status === "completed").length}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">En Ruta / Pendientes</span>
                            <Clock className="h-5 w-5 text-yellow-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            {deliveries.filter((d: any) => d.status === "pending" || d.status === "in_transit").length}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center justify-between text-gray-500">
                            <span className="text-xs font-semibold uppercase tracking-wider">Gastos en Comisiones</span>
                            <DollarSign className="h-5 w-5 text-rose-500" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                            ${deliveries.reduce((sum: number, d: any) => sum + (d.cost_usd || 0), 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por descripción, dirección o repartidor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <label htmlFor="deliveries-status-filter" className="text-sm font-medium text-gray-500">Filtrar por estado:</label>
                    <select
                        id="deliveries-status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="" className="cursor-pointer">Todos</option>
                        <option value="pending" className="cursor-pointer">Pendientes</option>
                        <option value="in_transit" className="cursor-pointer">En Ruta</option>
                        <option value="completed" className="cursor-pointer">Completados</option>
                        <option value="cancelled" className="cursor-pointer">Cancelados</option>
                    </select>
                </div>
            </div>

            {/* Grid/Table List */}
            {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : filteredDeliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-12 px-4 text-center">
                    <Truck className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay entregas registradas</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                        No se encontraron registros de envíos o carreras.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <table className="w-full border-collapse text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold">Encomienda</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Destino</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Repartidor</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Costo ($)</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-center">Estado</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Fecha de status</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {filteredDeliveries.map((delivery: any) => {
                                const statusColors: any = {
                                    pending: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30",
                                    in_transit: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30",
                                    completed: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30",
                                    cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                };
                                const statusLabels: any = {
                                    pending: "Pendiente",
                                    in_transit: "En Ruta",
                                    completed: "Completado",
                                    cancelled: "Cancelado"
                                };

                                return (
                                    <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900 dark:text-white">{delivery.description}</div>
                                            {delivery.sale_id && (
                                                <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                                                    Venta Asociada: #{delivery.sale_id}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {delivery.address ? (
                                                <div className="flex items-start gap-1 max-w-[200px]">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                                                    <span className="text-xs text-gray-800 dark:text-gray-200 line-clamp-2">{delivery.address}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        {/* <td className="px-6 py-4">
                                            {renderItemsDetail(delivery.items_detail)}
                                        </td> */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {delivery.provider ? (
                                                    <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                                                        <Truck className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                        <span className="font-semibold">{delivery.provider.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">Sin Proveedor</span>
                                                )}
                                                {delivery.delivery_user ? (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <UserIcon className="h-3 w-3 text-emerald-500 shrink-0" />
                                                        <span>{delivery.delivery_user.username}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xxs italic">Sin Repartidor</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                            {delivery.cost_usd !== null && delivery.cost_usd !== undefined ? `$${delivery.cost_usd.toFixed(2)}` : <span className="text-gray-400 text-xs font-normal">Opcional</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColors[delivery.status]}`}>
                                                {statusLabels[delivery.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs space-y-1">
                                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                <span className="font-medium">Reg:</span>
                                                <span>{new Date(delivery.created_at).toLocaleString("es-VE")}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                                <span className="font-medium">Act:</span>
                                                <span>{new Date(delivery.updated_at).toLocaleString("es-VE")}</span>
                                            </div>
                                            {delivery.completed_at && (
                                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                                    <span>Fin:</span>
                                                    <span>{new Date(delivery.completed_at).toLocaleString("es-VE")}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Eye Icon for detail - available to everyone */}
                                                <button
                                                    onClick={() => { setDetailDelivery(delivery); setShowDetailModal(true); }}
                                                    title="Ver detalle completo"
                                                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg cursor-pointer transition-all"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                {/* Repartidor Status Action Buttons */}
                                                {!isAdminOrWorker && delivery.status !== "completed" && delivery.status !== "cancelled" && (
                                                    <button
                                                        onClick={() => {
                                                            const nextStatus = delivery.status === "pending" ? "in_transit" : "completed";
                                                            if (nextStatus === "completed") {
                                                                handleOpenCompleteModal(delivery);
                                                            } else {
                                                                updateStatusMutation.mutate({ id: delivery.id, status: nextStatus });
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 cursor-pointer"
                                                    >
                                                        {delivery.status === "pending" ? "Iniciar Ruta" : "Completar"}
                                                    </button>
                                                )}

                                                {/* Admin Actions */}
                                                {isAdminOrWorker && (
                                                    <>
                                                        {/* Optional driver status updater for Admins too */}
                                                        {delivery.status === "pending" && (
                                                            <div className="flex gap-1 mr-2 border-r border-gray-200 pr-2 dark:border-gray-800">
                                                                <button
                                                                    onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: "in_transit" })}
                                                                    title="Marcar En Ruta"
                                                                    className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded cursor-pointer"
                                                                >
                                                                    <Truck className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenCompleteModal(delivery)}
                                                                    title="Completar Entrega"
                                                                    className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded cursor-pointer"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {delivery.status === "in_transit" && (
                                                            <div className="flex gap-1 mr-2 border-r border-gray-200 pr-2 dark:border-gray-800">
                                                                <button
                                                                    onClick={() => handleOpenCompleteModal(delivery)}
                                                                    title="Completar Entrega"
                                                                    className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded cursor-pointer"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {delivery.status !== "completed" && (
                                                            <button
                                                                onClick={() => handleEdit(delivery)}
                                                                title="Editar envío"
                                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg cursor-pointer transition-all"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => { setDeliveryToDelete(delivery); setShowDeleteModal(true); }}
                                                            title="Eliminar envío"
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg cursor-pointer transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
                    <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingDelivery ? "Editar Envío" : "Programar Nuevo Envío"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                title="Cerrar modal"
                                aria-label="Cerrar modal"
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Descripción / Diligencia *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Ej. Entrega Pedido #1234, Diligencia Banco, etc."
                                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Dirección / Destino</label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Dirección completa del destino"
                                            rows={2}
                                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Costo de Carrera ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.cost_usd === 0 ? "" : formData.cost_usd}
                                                onChange={(e) => setFormData({ ...formData, cost_usd: e.target.value === "" ? "" : Number(e.target.value) })}
                                                placeholder="Ej. 5.00 (Opcional)"
                                                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="delivery-status" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Estado</label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(v) => setFormData({ ...formData, status: v })}
                                            >
                                                <SelectTrigger className="cursor-pointer w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white [&>span]:truncate [&>span]:block [&>span]:text-left">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent align="end" position="popper">
                                                    <SelectItem className="cursor-pointer" value="pending">Pendiente</SelectItem>
                                                    <SelectItem className="cursor-pointer" value="in_transit">En Ruta</SelectItem>
                                                    <SelectItem className="cursor-pointer" value="completed">Completado</SelectItem>
                                                    <SelectItem className="cursor-pointer" value="cancelled">Cancelado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="delivery-provider-id" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Delivery</label>
                                            <Select
                                                value={formData.provider_id || "none"}
                                                onValueChange={(v) => setFormData({ ...formData, provider_id: v === "none" ? "" : v })}
                                            >
                                                <SelectTrigger className="cursor-pointer w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white [&>span]:truncate [&>span]:block [&>span]:text-left">
                                                    <SelectValue placeholder="Seleccionar Proveedor..." />
                                                </SelectTrigger>
                                                <SelectContent align="end" position="popper">
                                                    <SelectItem className="cursor-pointer" value="none">Seleccionar Proveedor...</SelectItem>
                                                    {providers.map((prov: any) => (
                                                        <SelectItem key={prov.id} className="cursor-pointer" value={prov.id.toString()}>{prov.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label htmlFor="delivery-user-id" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Usuario (opcional)</label>
                                            <Select
                                                value={formData.delivery_user_id || "none"}
                                                onValueChange={(v) => setFormData({ ...formData, delivery_user_id: v === "none" ? "" : v })}
                                            >
                                                <SelectTrigger className="cursor-pointer w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white [&>span]:truncate [&>span]:block [&>span]:text-left">
                                                    <SelectValue placeholder="Seleccionar Repartidor..." />
                                                </SelectTrigger>
                                                <SelectContent align="end" position="popper">
                                                    <SelectItem className="cursor-pointer" value="none">Seleccionar Repartidor...</SelectItem>
                                                    {deliveryDrivers.map((driver: any) => (
                                                        <SelectItem key={driver.id} className="cursor-pointer" value={driver.id.toString()}>{driver.username}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="delivery-sale-id" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Venta Asociada</label>
                                        <Select
                                            value={formData.sale_id || "none"}
                                            onValueChange={(v) => handleSaleChange(v === "none" ? "" : v)}
                                        >
                                            <SelectTrigger className="cursor-pointer w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white [&>span]:truncate [&>span]:block [&>span]:text-left">
                                                <SelectValue placeholder="Seleccionar venta... (Opcional)" />
                                            </SelectTrigger>
                                            <SelectContent align="end" position="popper">
                                                <SelectItem className="cursor-pointer" value="none">Seleccionar venta... (Opcional)</SelectItem>
                                                {todaySales.map((sale: any) => (
                                                    <SelectItem key={sale.id} className="cursor-pointer" value={sale.id.toString()}>
                                                        Venta #{sale.id} - {sale.customer_name || "Sin cliente"} (${(sale.total_amount_usd || 0).toFixed(2)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Right Column: Products */}
                                <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 md:pl-6 pt-4 md:pt-0 flex flex-col">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Detalle de Productos</label>

                                    {/* Autocomplete Product Selector */}
                                    <div className="relative">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar producto en inventario..."
                                                value={productSearch}
                                                onChange={(e) => {
                                                    setProductSearch(e.target.value);
                                                    setShowProductDropdown(true);
                                                }}
                                                onFocus={() => setShowProductDropdown(true)}
                                                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            />
                                            {productSearch && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setProductSearch(""); setShowProductDropdown(false); }}
                                                    title="Limpiar búsqueda de productos"
                                                    aria-label="Limpiar búsqueda de productos"
                                                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        {showProductDropdown && productSearch && (
                                            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-950">
                                                {allProducts.filter((p: any) =>
                                                    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                                    p.barcode.toLowerCase().includes(productSearch.toLowerCase())
                                                ).slice(0, 10).map((prod: any) => (
                                                    <button
                                                        key={prod.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const existing = selectedProducts.find((p) => p.product_id === prod.id);
                                                            if (existing) {
                                                                setSelectedProducts(
                                                                    selectedProducts.map((p) =>
                                                                        p.product_id === prod.id ? { ...p, quantity: p.quantity + 1 } : p
                                                                    )
                                                                );
                                                            } else {
                                                                setSelectedProducts([
                                                                    ...selectedProducts,
                                                                    {
                                                                        product_id: prod.id,
                                                                        name: prod.name,
                                                                        quantity: 1
                                                                    }
                                                                ]);
                                                            }
                                                            setProductSearch("");
                                                            setShowProductDropdown(false);
                                                        }}
                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
                                                    >
                                                        <div className="flex-1 truncate">
                                                            <div className="font-medium text-gray-900 dark:text-white truncate">{prod.name}</div>
                                                            <div className="text-xxs text-gray-400">{prod.barcode}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                                {allProducts.filter((p: any) =>
                                                    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                                    p.barcode.toLowerCase().includes(productSearch.toLowerCase())
                                                ).length === 0 && (
                                                        <div className="px-3 py-2 text-xs text-gray-500">No se encontraron productos</div>
                                                    )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Products List */}
                                    <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800 p-2 space-y-2 bg-gray-50/50 dark:bg-gray-950/20">
                                        {selectedProducts.length === 0 ? (
                                            <div className="flex h-full flex-col items-center justify-center text-center p-4">
                                                <Truck className="h-8 w-8 text-gray-300 dark:text-gray-700 mb-1" />
                                                <p className="text-xs text-gray-400">Ningún producto seleccionado aún</p>
                                                <p className="text-[10px] text-gray-550 mt-0.5">Búscalos arriba o selecciona una venta asociada.</p>
                                            </div>
                                        ) : (
                                            selectedProducts.map((prod, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-white p-2 shadow-xs dark:border-gray-800 dark:bg-gray-900">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className="text-xs font-medium text-gray-900 dark:text-white truncate" title={prod.name}>
                                                            {prod.name}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (prod.quantity > 1) {
                                                                    setSelectedProducts(
                                                                        selectedProducts.map((p) =>
                                                                            p.product_id === prod.product_id ? { ...p, quantity: p.quantity - 1 } : p
                                                                        )
                                                                    );
                                                                } else {
                                                                    setSelectedProducts(selectedProducts.filter((p) => p.product_id !== prod.product_id));
                                                                }
                                                            }}
                                                            title="Disminuir cantidad"
                                                            aria-label="Disminuir cantidad"
                                                            className="cursor-pointer text-gray-450 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                        >
                                                            <MinusCircle className="h-4 w-4" />
                                                        </button>
                                                        <span className="w-6 text-center text-xs font-bold text-gray-950 dark:text-white">
                                                            {prod.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedProducts(
                                                                    selectedProducts.map((p) =>
                                                                        p.product_id === prod.product_id ? { ...p, quantity: p.quantity + 1 } : p
                                                                    )
                                                                );
                                                            }}
                                                            title="Aumentar cantidad"
                                                            aria-label="Aumentar cantidad"
                                                            className="cursor-pointer text-gray-455 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                        >
                                                            <PlusCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedProducts(selectedProducts.filter((p) => p.product_id !== prod.product_id))}
                                                            title="Eliminar producto"
                                                            aria-label="Eliminar producto"
                                                            className="cursor-pointer text-gray-400 hover:text-red-500 ml-1"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Guardar Envío
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertCircle className="h-6 w-6" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">¿Eliminar Envío?</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Esta acción es irreversible y el registro de la carrera &quot;{deliveryToDelete?.description}&quot; se borrará del sistema.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(deliveryToDelete.id)}
                                disabled={deleteMutation.isPending}
                                className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Delivery Cost Modal */}
            {completingDelivery && (() => {
                const preRegisteredCost = completingDelivery.cost_usd;
                const hasPreRegisteredCost = preRegisteredCost !== null && preRegisteredCost !== undefined && preRegisteredCost > 0;

                // Validate if button should be disabled
                const isSubmitDisabled = !hasPreRegisteredCost && (!completionCost || Number(completionCost) <= 0 || isNaN(Number(completionCost)));

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center gap-3 text-green-600 mb-4">
                                <CheckCircle2 className="h-6 w-6 shrink-0" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Completar Entrega</h3>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                                Confirmar la finalización del envío: <strong className="text-gray-700 dark:text-gray-200">&quot;{completingDelivery.description}&quot;</strong>.
                            </p>

                            {hasPreRegisteredCost ? (
                                <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-4 rounded-xl">
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Costo de Carrera Registrado</span>
                                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 block mt-0.5">
                                        ${preRegisteredCost.toFixed(2)}
                                    </span>
                                    <span className="text-xs text-emerald-500 dark:text-emerald-400 block mt-1.5 leading-normal">
                                        El costo ya fue establecido por el administrador. Se completará el envío utilizando este monto.
                                    </span>
                                </div>
                            ) : (
                                <div className="mb-6 space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Costo de la Carrera ($) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={completionCost}
                                        onChange={(e) => setCompletionCost(e.target.value)}
                                        placeholder="Ej. 5.00"
                                        className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    <p className="text-xxs text-gray-400 dark:text-gray-500">
                                        * Este campo es obligatorio para completar el envío.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setCompletingDelivery(null)}
                                    className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        updateStatusMutation.mutate({
                                            id: completingDelivery.id,
                                            status: "completed",
                                            cost_usd: hasPreRegisteredCost ? preRegisteredCost : Number(completionCost)
                                        });
                                        setCompletingDelivery(null);
                                    }}
                                    disabled={updateStatusMutation.isPending || isSubmitDisabled}
                                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-colors"
                                >
                                    {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Completar Entrega
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Exporter/Report Filter Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Exportar Reporte de Envíos</h3>
                            <button
                                type="button"
                                onClick={() => setShowReportModal(false)}
                                title="Cerrar reporte"
                                aria-label="Cerrar reporte"
                                className="cursor-pointer text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                            Descarga un informe detallado con todos los viajes programados, completados y los costos de comisiones a pagar a los deliveries. Puedes filtrar opcionalmente por un rango de fechas.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label htmlFor="report-start-date" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Fecha Inicio</label>
                                <input
                                    id="report-start-date"
                                    type="date"
                                    value={reportStartDate}
                                    onChange={(e) => setReportStartDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label htmlFor="report-end-date" className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Fecha Fin</label>
                                <input
                                    id="report-end-date"
                                    type="date"
                                    value={reportEndDate}
                                    onChange={(e) => setReportEndDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-55 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={downloadReport}
                                disabled={exportingReport}
                                className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {exportingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                Generar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {showDetailModal && detailDelivery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
                    <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-150 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Truck className="h-5 w-5 text-indigo-500" />
                                Detalle del Envío
                            </h3>
                            <button
                                type="button"
                                onClick={() => { setShowDetailModal(false); setDetailDelivery(null); }}
                                title="Cerrar detalle"
                                aria-label="Cerrar detalle"
                                className="cursor-pointer text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Upper Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Descripción / Encomienda</span>
                                    <span className="text-sm font-semibold text-gray-950 dark:text-white block mt-1">{detailDelivery.description}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Estado</span>
                                    <span className="inline-flex mt-1">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${detailDelivery.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30" :
                                            detailDelivery.status === "in_transit" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30" :
                                                detailDelivery.status === "completed" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30" :
                                                    "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30"
                                            }`}>
                                            {detailDelivery.status === "pending" ? "Pendiente" :
                                                detailDelivery.status === "in_transit" ? "En Ruta" :
                                                    detailDelivery.status === "completed" ? "Completado" : "Cancelado"}
                                        </span>
                                    </span>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Dirección de Entrega</span>
                                    <div className="flex items-start gap-1.5 mt-1 text-sm text-gray-800 dark:text-gray-200">
                                        <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                                        <span>{detailDelivery.address || "No especificada"}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Proveedor Asociado</span>
                                    <span className="text-sm text-gray-800 dark:text-gray-200 block mt-1 font-medium">
                                        {detailDelivery.provider ? detailDelivery.provider.name : "Sin Proveedor"}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Repartidor Asignado</span>
                                    <span className="text-sm text-gray-800 dark:text-gray-200 block mt-1 font-medium">
                                        {detailDelivery.delivery_user ? detailDelivery.delivery_user.username : "Sin Repartidor"}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Costo de Carrera</span>
                                    <span className="text-sm text-gray-800 dark:text-gray-200 block mt-1 font-bold">
                                        {detailDelivery.cost_usd !== null && detailDelivery.cost_usd !== undefined ? `$${detailDelivery.cost_usd.toFixed(2)}` : "Opcional / No registrado"}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Venta Asociada</span>
                                    <span className="text-sm text-indigo-600 dark:text-indigo-400 block mt-1 font-semibold">
                                        {detailDelivery.sale_id ? `Venta #${detailDelivery.sale_id}` : "Sin venta asociada / Venta Directa"}
                                    </span>
                                </div>
                            </div>

                            {/* Dates Box */}
                            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-2 text-xs border border-gray-150 dark:border-gray-800">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400 font-semibold uppercase">Fecha de Registro:</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{new Date(detailDelivery.created_at).toLocaleString("es-VE")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400 font-semibold uppercase">Última Actualización:</span>
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{new Date(detailDelivery.updated_at).toLocaleString("es-VE")}</span>
                                </div>
                                {detailDelivery.completed_at && (
                                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700/60 pt-2">
                                        <span className="text-green-650 dark:text-green-500 font-semibold uppercase">Fecha de Entrega:</span>
                                        <span className="text-green-700 dark:text-green-400 font-bold">{new Date(detailDelivery.completed_at).toLocaleString("es-VE")}</span>
                                    </div>
                                )}
                            </div>

                            {/* Products Section */}
                            <div>
                                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Productos a Entregar</span>
                                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                                            <tr>
                                                <th className="px-4 py-2">Producto</th>
                                                <th className="px-4 py-2 text-right">Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                            {(() => {
                                                const itemsDetail = detailDelivery.items_detail;
                                                if (!itemsDetail) return <tr><td className="px-4 py-2 text-gray-400 italic text-xs">Ningún producto seleccionado</td></tr>;
                                                try {
                                                    if (itemsDetail.startsWith("[")) {
                                                        const items = JSON.parse(itemsDetail);
                                                        if (items.length === 0) return <tr><td className="px-4 py-2 text-gray-400 italic text-xs">Ningún producto seleccionado</td></tr>;
                                                        return items.map((item: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-gray-55 dark:hover:bg-gray-800/30">
                                                                <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{item.name}</td>
                                                                <td className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">x{item.quantity}</td>
                                                            </tr>
                                                        ));
                                                    }
                                                    return <tr><td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{itemsDetail}</td></tr>;
                                                } catch {
                                                    return <tr><td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{itemsDetail}</td></tr>;
                                                }
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-150 dark:border-gray-850 mt-4">
                            <button
                                onClick={() => { setShowDetailModal(false); setDetailDelivery(null); }}
                                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer shadow-sm transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// RemoteProductSelect component: small helper inside this file to reuse Select
function RemoteProductSelect({ search, onAdd }: { search: string, onAdd: (p: any) => void }) {
    const { data: products = [], isFetching } = useQuery({
        queryKey: ["products-delivery", search],
        queryFn: async () => {
            const { data } = await api.get("/products", { params: { search: search || undefined, limit: 50 } });
            return data;
        },
        enabled: true,
        placeholderData: (previousData) => previousData,
    });

    return (
        <div className="mt-2">
            <Select value={"none"} onValueChange={(v) => {
                if (v === "none") return;
                const prod = (products as any[]).find(p => p.id.toString() === v);
                if (prod) onAdd(prod);
            }}>
                <SelectTrigger className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <SelectValue placeholder={isFetching ? "Buscando..." : "Seleccionar producto..."} />
                </SelectTrigger>
                <SelectContent align="end" position="popper">
                    <SelectItem value="none">Seleccionar producto...</SelectItem>
                    {products.length === 0 ? (
                        <SelectItem value="none">No se encontraron productos</SelectItem>
                    ) : (
                        products.map((prod: any) => (
                            <SelectItem key={prod.id} value={prod.id.toString()}>
                                <div className="flex flex-col">
                                    <span className="truncate font-medium">{prod.name}</span>
                                    <span className="text-xxs text-gray-400">{prod.barcode} — Stock: {prod.stock_quantity}</span>
                                </div>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}