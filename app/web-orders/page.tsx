"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle, XCircle, Phone, Image as ImageIcon, ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WebOrder, WebOrderItem } from "@/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import { useState } from "react";

export default function WebOrdersPage() {
    const queryClient = useQueryClient();
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        type: 'approve' | 'reject' | null;
        order: WebOrder | null;
    }>({ isOpen: false, type: null, order: null });

    // Fetch Orders
    const { data: orders, isLoading } = useQuery({
        queryKey: ["web_orders"],
        queryFn: async () => (await api.get("/web_orders/?limit=50")).data,
        refetchInterval: 15000
    });

    // Update Status Mutation
    const statusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number, status: string }) => {
            await api.put(`/web_orders/${id}/status?status=${status}`);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["web_orders"] });
            const action = variables.status === 'approved' ? 'aprobado' : 'rechazado';
            toast.success(`Pedido ${action} correctamente`);
            setConfirmAction({ isOpen: false, type: null, order: null });
        },
        onError: (error: any) => {
            const detail = error.response?.data?.detail || "Error al actualizar el pedido";
            toast.error(detail);
            setConfirmAction({ isOpen: false, type: null, order: null });
        }
    });

    const handleWhatsApp = (order: WebOrder) => {
        const phone = order.customer_data.phone;
        const msg = `Hola ${order.customer_data.name}, hemos recibido tu pedido web #${order.id} por $${order.total_estimated_usd}. Estamos validando tu pago.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const confirmStatusUpdate = () => {
        if (!confirmAction.order || !confirmAction.type) return;
        const newStatus = confirmAction.type === 'approve' ? 'approved' : 'rejected';
        statusMutation.mutate({ id: confirmAction.order.id, status: newStatus });

        // Optionally open WhatsApp with approval message if approved
        if (newStatus === 'approved') {
            const phone = confirmAction.order.customer_data.phone;
            const msg = `✅ ¡Tu pedido #${confirmAction.order.id} ha sido APROBADO! Estamos procesando el despacho.`;
            setTimeout(() => window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank'), 1000);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Pedidos Web
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full dark:bg-gray-800">
                        {orders?.length || 0} Total
                    </span>
                </h2>
                <p className="text-gray-500">Gestiona los pedidos recibidos desde el catálogo público.</p>
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

                            {/* Payment Info */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm space-y-1">
                                <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                                    <CreditCardIcon method={order.payment_method} />
                                    {order.payment_method}
                                </div>
                                {order.transaction_ref && <p className="text-xs text-gray-500">Ref: {order.transaction_ref}</p>}
                                {order.payment_proof_url && (
                                    <a href={order.payment_proof_url} target="_blank" className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                                        <ImageIcon className="w-3 h-3" /> Ver Capture de Pago <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>

                            {/* Items Preview */}
                            <div className="text-xs text-gray-500">
                                {order.items?.length} items: {order.items?.map((i) => i.product_name).join(", ")}
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
                title={confirmAction.type === 'approve' ? "¿Aprobar Pedido?" : "¿Rechazar Pedido?"}
                description={
                    confirmAction.type === 'approve'
                        ? "Esto descontará el stock de los productos y notificará al cliente."
                        : "¿Estás seguro de rechazar este pedido? Esta acción no descontará inventario."
                }
                confirmText={confirmAction.type === 'approve' ? "Aprobar" : "Rechazar"}
                variant={confirmAction.type === 'approve' ? "info" : "danger"}
                isLoading={statusMutation.isPending}
            />
        </div>
    );
}

function CreditCardIcon({ method }: { method: string }) {
    // Simple icon mapping or just generic
    return <div className="w-2 h-2 rounded-full bg-indigo-500" />
}
