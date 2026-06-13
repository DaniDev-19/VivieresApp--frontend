"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, getImageUrl, formatWhatsAppLink } from "@/lib/utils";
import { CheckCircle, XCircle, Phone, Image as ImageIcon, ExternalLink, Clock, Truck, ChevronLeft, ChevronRight, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WebOrder, WebOrderItem } from "@/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

export default function WebOrdersPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const limit = 12;
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject' | 'delete' | null;
        order: WebOrder | null;
    }>({ isOpen: false, type: null, order: null });
    const [selectedOrder, setSelectedOrder] = useState<WebOrder | null>(null);

    // Fetch Orders
    const { data, isLoading } = useQuery({
        queryKey: ["web-orders", page],
        queryFn: async () => (await api.get(`/web-orders/?skip=${(page - 1) * limit}&limit=${limit}`)).data,
        refetchInterval: 30000, // Auto refresh every 30 seconds
    });

    const orders = data?.items || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Update Status Mutation
    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number, status: string }) => {
            const { data } = await api.put(`/web-orders/${id}/status?status=${status}`);
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["web-orders"] });
            const action = variables.status === 'approved' ? 'aprobado' : 'rechazado';
            toast.success(`Pedido ${action} correctamente`);

            // Handle WhatsApp redirect on approval
            if (variables.status === 'approved' && data.sale_id) {
                const phone = data.customer_data?.phone;
                const msg = `✅ ¡Tu pedido #${data.id} ha sido APROBADO! \n\nEstamos procesando el despacho.`;
                window.open(formatWhatsAppLink(phone || "", msg), '_blank');
            }

            setConfirmAction({ isOpen: false, type: null, order: null });
        },
        onError: (error: any) => {
            const detail = error.response?.data?.detail || "Error al actualizar el pedido";
            toast.error(detail);
            setConfirmAction({ isOpen: false, type: null, order: null });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/web-orders/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["web-orders"] });
            toast.success("Pedido eliminado correctamente");
            setConfirmAction({ isOpen: false, type: null, order: null });
        },
        onError: () => {
            toast.error("Error al eliminar pedido");
            setConfirmAction({ isOpen: false, type: null, order: null });
        }
    });

    const confirmStatusUpdate = () => {
        if (!confirmAction.order) return;
        if (confirmAction.type === 'delete') {
            deleteMutation.mutate(confirmAction.order.id);
        } else if (confirmAction.type) {
            statusMutation.mutate({ id: confirmAction.order.id, status: confirmAction.type === 'approve' ? 'approved' : 'rejected' });
        }
    };

    const handleWhatsApp = (order: WebOrder) => {
        const phone = order.customer_data.phone;
        const msg = `Hola ${order.customer_data.name}, hemos recibido tu pedido web #${order.id} por $${order.total_estimated_usd}. Estamos validando tu pago.`;
        window.open(formatWhatsAppLink(phone || "", msg), '_blank');
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        Pedidos Web
                        {total > 0 && (
                            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-full font-black border border-indigo-200/50">
                                {total} Total
                            </span>
                        )}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Gestiona los pedidos recibidos desde el catálogo público.</p>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>

                        <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300">
                            Página <span className="text-indigo-600 dark:text-indigo-400 mx-1">{page}</span> de <span className="mx-1">{totalPages}</span>
                        </div>

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? <p className="text-center col-span-full">Cargando pedidos...</p> : orders?.map((order: WebOrder) => (
                    <div key={order.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">#{order.id} - {order.customer_data.name}</h3>
                                <p className="text-xs text-gray-500">{format(new Date(order.created_at), "dd MMM yy HH:mm", { locale: es })}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                ${order.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                                    order.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}
                            `}>
                                {order.status === 'pending_review' ? 'Por Revisar' :
                                    order.status === 'approved' ? 'Aprobado' :
                                        order.status === 'rejected' ? 'Rechazado' : order.status}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    title="Ver Detalles"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setConfirmAction({ isOpen: true, type: 'delete', order })}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Eliminar Pedido"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-4 flex-1 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Cédula:</span>
                                <span className="font-mono">{order.customer_data.cedula}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Monto:</span>
                                <span className="font-bold text-indigo-600 text-lg">{formatCurrency(order.total_estimated_usd)}</span>
                            </div>

                            {/* Delivery Info */}
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-lg text-sm border border-indigo-100/50 dark:border-indigo-800/50">
                                <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                                    <Truck className="w-4 h-4" />
                                    {order.delivery_type || 'Retiro en Tienda'}
                                </div>
                                {order.delivery_cost && order.delivery_cost > 0 ? (
                                    <p className="text-xs text-indigo-500 mt-0.5">Costo de despacho: {formatCurrency(order.delivery_cost)}</p>
                                ) : (
                                    <p className="text-xs text-indigo-500 mt-0.5">Sin costo de envío</p>
                                )}
                            </div>

                            {/* Payment Info */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm space-y-1">
                                <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                                    <CreditCardIcon method={order.payment_method} />
                                    {order.payment_method}
                                </div>
                                {order.transaction_ref && <p className="text-xs text-gray-500">Ref: {order.transaction_ref}</p>}
                                {order.payment_proof_url && (
                                    <a href={getImageUrl(order.payment_proof_url) || "#"} target="_blank" className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                                        <ImageIcon className="w-3 h-3" /> Ver Capture de Pago <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>

                            {/* Items Details */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden mt-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 font-medium text-[10px] text-gray-500 uppercase tracking-widest">
                                    Productos ({order.items?.length})
                                </div>
                                <div className="max-h-32 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                                    {order.items?.map((i) => (
                                        <div key={i.id || i.product_id} className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                                                <span className="font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded flex-shrink-0">{i.quantity}x</span>
                                                <span className="text-gray-600 dark:text-gray-400 truncate">{i.product_name}</span>
                                            </div>
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">{formatCurrency(i.price_usd * i.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleWhatsApp(order)}
                                className="col-span-2 flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] py-2 rounded-lg font-medium hover:bg-[#25D366]/20 transition-colors"
                            >
                                <Phone className="w-4 h-4" /> Contactar WhatsApp
                            </button>

                            {order.status === 'pending_review' && (
                                <>
                                    <button
                                        onClick={() => setConfirmAction({ isOpen: true, type: 'reject', order })}
                                        className="flex items-center justify-center gap-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200"
                                    >
                                        <XCircle className="w-4 h-4" /> Rechazar
                                    </button>
                                    <button
                                        onClick={() => setConfirmAction({ isOpen: true, type: 'approve', order })}
                                        className="flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Aprobar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {orders?.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay pedidos pendientes.</p>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({ isOpen: false, type: null, order: null })}
                onConfirm={confirmStatusUpdate}
                title={confirmAction.type === 'approve' ? "¿Aprobar Pedido?" : confirmAction.type === 'delete' ? "¿Eliminar Pedido?" : "¿Rechazar Pedido?"}
                description={
                    confirmAction.type === 'approve'
                        ? "Esto descontará el stock de los productos y notificará al cliente."
                        : confirmAction.type === 'delete'
                            ? "Esta acción eliminará el pedido de la base de datos permanentemente. ¿Estás seguro?"
                            : "¿Estás seguro de rechazar este pedido? Esta acción no descontará inventario."
                }
                confirmText={confirmAction.type === 'approve' ? "Aprobar" : confirmAction.type === 'delete' ? "Eliminar" : "Rechazar"}
                variant={confirmAction.type === 'approve' ? "info" : "danger"}
                isLoading={statusMutation.isPending || deleteMutation.isPending}
            />

            {/* Order Detail Modal */}
            <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Detalle del Pedido #${selectedOrder?.id}`}>
                {selectedOrder && (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">Datos del Cliente</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p><span className="font-semibold">Nombre:</span> {selectedOrder.customer_data.name}</p>
                                <p><span className="font-semibold">Cédula:</span> {selectedOrder.customer_data.cedula}</p>
                                <p><span className="font-semibold">Teléfono:</span> {selectedOrder.customer_data.phone}</p>
                                {selectedOrder.customer_data.email && <p><span className="font-semibold">Correo:</span> {selectedOrder.customer_data.email}</p>}
                                {selectedOrder.customer_data.address && <p className="col-span-2"><span className="font-semibold">Dirección:</span> {selectedOrder.customer_data.address}</p>}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">Pago y Envío</h4>
                            <div className="space-y-2 text-sm">
                                <p><span className="font-semibold">Método de Pago:</span> {selectedOrder.payment_method} {selectedOrder.transaction_ref ? `(Ref: ${selectedOrder.transaction_ref})` : ''}</p>
                                <p><span className="font-semibold">Envío:</span> {selectedOrder.delivery_type || 'Retiro en Tienda'} {selectedOrder.delivery_cost ? `(+${formatCurrency(selectedOrder.delivery_cost)})` : ''}</p>
                                {selectedOrder.payment_proof_url && (
                                    <a href={getImageUrl(selectedOrder.payment_proof_url) || "#"} target="_blank" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                                        <ImageIcon className="w-4 h-4" /> Ver Comprobante de Pago
                                    </a>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Productos ({selectedOrder.items?.length})</h4>
                            <div className="space-y-2">
                                {selectedOrder.items?.map((i) => (
                                    <div key={i.id || i.product_id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-md">{i.quantity}x</span>
                                            <span className="font-medium">{i.product_name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(i.price_usd * i.quantity)}</span>
                                            <span className="text-xs text-gray-500">{formatCurrency(i.price_usd)} c/u</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 text-lg">
                            <span className="font-black uppercase">Total:</span>
                            <span className="font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedOrder.total_estimated_usd)}</span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function CreditCardIcon({ method }: { method: string }) {
    return <div className="w-2 h-2 rounded-full bg-indigo-500" />
}
