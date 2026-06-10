"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "@/lib/api";
import { formatCurrency, formatWhatsAppLink } from "@/lib/utils";
import { Plus, CheckCircle, Clock, Trash2, FileText } from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { Modal } from "@/components/ui/Modal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Provider, PurchaseOrder } from "@/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

function OrderForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
    const [providerId, setProviderId] = useState<number | null>(null);
    const [notes, setNotes] = useState("");

    // Items state
    const [lines, setLines] = useState<any[]>([]);
    const [selectedProd, setSelectedProd] = useState("");
    const [manualName, setManualName] = useState("");
    const [qty, setQty] = useState(1);
    const [isManual, setIsManual] = useState(false);

    // Fetch data
    const { data: providers } = useQuery({ queryKey: ["providers"], queryFn: async () => (await api.get("/providers/")).data });
    const { data: products } = useQuery({ queryKey: ["products"], queryFn: async () => (await api.get("/products/")).data });

    const handleAddLine = () => {
        if (qty < 1) return;

        if (isManual) {
            if (!manualName.trim()) return;
            setLines([...lines, {
                product_id: null,
                product_name: manualName,
                requested_quantity: qty,
                cost_price: 0
            }]);
            setManualName("");
        } else {
            if (!selectedProd) return;
            const prod = (products as any[])?.find(p => p.id === Number(selectedProd));
            if (!prod) return;

            setLines([...lines, {
                product_id: prod.id,
                product_name: prod.name,
                requested_quantity: qty,
                cost_price: prod.cost_price || 0
            }]);
            setSelectedProd("");
        }
        setQty(1);
    };

    const removeLine = (idx: number) => {
        setLines(lines.filter((_, i) => i !== idx));
    };

    const mutation = useMutation({
        mutationFn: async () => {
            // items schema: product_id, product_name, requested_quantity, cost_price
            await api.post("/purchases/", {
                provider_id: providerId,
                notes: notes,
                items: lines
            });
        },
        onSuccess
    });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Proveedor *</label>
                    <select
                        className="w-full rounded-md border p-2 bg-white dark:bg-gray-800"
                        onChange={e => setProviderId(Number(e.target.value))}
                        value={providerId || ""}
                    >
                        <option value="">Seleccionar...</option>
                        {(providers as Provider[])?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                    className="w-full rounded-md border p-2 dark:bg-gray-800"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                />
            </div>

            {/* Items Section */}
            <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold">Agregar Productos</h4>
                    <label className="flex items-center gap-2 text-xs text-indigo-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isManual}
                            onChange={e => setIsManual(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        ¿Producto Nuevo / Manual?
                    </label>
                </div>

                <div className="flex gap-2 items-end mb-2">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500">Producto</label>
                        {isManual ? (
                            <input
                                type="text"
                                className="w-full rounded border p-1.5 text-sm"
                                placeholder="Nombre del producto nuevo..."
                                value={manualName}
                                onChange={e => setManualName(e.target.value)}
                            />
                        ) : (
                            <select
                                className="w-full rounded border p-1.5 text-sm"
                                value={selectedProd}
                                onChange={(e) => setSelectedProd(e.target.value)}
                            >
                                <option value="">Seleccionar del inventario...</option>
                                {(products as any[])?.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="w-20">
                        <label className="text-xs text-gray-500">Cant.</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full rounded border p-1.5 text-sm"
                            value={qty}
                            onChange={(e) => setQty(Number(e.target.value))}
                        />
                    </div>
                    <button
                        onClick={handleAddLine}
                        type="button"
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700"
                    >
                        Agregar
                    </button>
                </div>

                {/* Info Manual */}
                {isManual && (
                    <p className="text-[10px] text-orange-600 mb-2">
                        * Los productos manuales no sumarán stock automáticamente al recibir la orden hasta que sean creados en el Inventario.
                    </p>
                )}

                {/* List */}
                {lines.length > 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 overflow-hidden text-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs">
                                <tr>
                                    <th className="p-2">Producto</th>
                                    <th className="p-2 text-center">Cant.</th>
                                    <th className="p-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((item, idx) => (
                                    <tr key={idx} className="border-t border-gray-100">
                                        <td className="p-2">{item.product_name}</td>
                                        <td className="p-2 text-center">{item.requested_quantity}</td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => removeLine(idx)} className="text-red-500 text-xs hover:underline">Quitar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 text-center py-2">No has agregado productos a la orden.</p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t mt-4 border-gray-100">
                <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                <button
                    onClick={() => mutation.mutate()}
                    disabled={!providerId || lines.length === 0 || mutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {mutation.isPending ? "Creando..." : "Crear e Iniciar Orden"}
                </button>
            </div>
        </div>
    )
}


// --- Conversion Form ---
function ConversionForm({ item, onSuccess, onCancel }: { item: any, onSuccess: () => void, onCancel: () => void }) {
    const [formData, setFormData] = useState({
        barcode: "",
        name: item.product_name,
        cost_price: 0,
        profit_margin: 0.30,
        tax_rate: 0.16,
        stock_quantity: 0, // Initial stock is 0, the order reception will add the qty
        min_stock_level: 5
    });

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: async () => {
            // 1. Create Product
            const { data: newProd } = await api.post("/products/", formData);

            // 2. Link to Purchase Item (We need this endpoint!)
            // For now, I'll simulate or I need to add that endpoint in next step.
            // I will assume I will create PUT /purchases/items/{itemId}/link
            await api.put(`/purchases/items/${item.id}/link`, { product_id: newProd.id });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            onSuccess();
        }
    });

    return (
        <div className="space-y-3">
            <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg">
                Se creará el producto <strong>"{formData.name}"</strong>.
                Al recibir la orden, se sumarán <strong>{item.requested_quantity}</strong> unidades automáticamente.
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-700">Código de Barras</label>
                <input
                    className="w-full border rounded p-1.5 text-sm"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Escanear..."
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-700">Nombre</label>
                <input
                    className="w-full border rounded p-1.5 text-sm"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-bold text-gray-700">Costo ($)</label>
                    <input
                        type="number" step="0.01"
                        className="w-full border rounded p-1.5 text-sm"
                        value={formData.cost_price}
                        onChange={e => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700">Margen (0.30)</label>
                    <input
                        type="number" step="0.01"
                        className="w-full border rounded p-1.5 text-sm"
                        value={formData.profit_margin}
                        onChange={e => setFormData({ ...formData, profit_margin: Number(e.target.value) })}
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-700">IVA</label>
                <select
                    className="w-full border rounded p-1.5 text-sm"
                    value={formData.tax_rate}
                    onChange={e => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                >
                    <option value={0}>Exento (0%)</option>
                    <option value={0.16}>Aplica 16%</option>
                </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button onClick={onCancel} className="text-sm text-gray-500">Cancelar</button>
                <button
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending || !formData.barcode}
                    className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                    {createMutation.isPending ? "Creando..." : "Crear y Vincular"}
                </button>
            </div>
        </div >
    )
}


export function OrdersList() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 10;

    // Expansion & Conversion states
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [convertItem, setConvertItem] = useState<any | null>(null);

    const { data: orders, isLoading, isPlaceholderData } = useQuery({
        queryKey: ["purchases", page],
        queryFn: async () => {
            const params = {
                skip: (page - 1) * limit,
                limit
            };
            const { data } = await api.get("/purchases/", { params });
            return data;
        },
        placeholderData: (previousData) => previousData,
    });

    // Receive Mutation
    const receiveMutation = useMutation({
        mutationFn: async ({ id, receipt }: { id: number, receipt: any }) => {
            await api.put(`/purchases/${id}/receive`, receipt);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            toast.success("Orden recibida y stock actualizado");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Error al recibir la orden");
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/purchases/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            setExpandedOrder(null);
            toast.success("Orden eliminada correctamente");
            setConfirmAction({ isOpen: false, type: null, id: null });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Error al eliminar la orden");
            setConfirmAction({ isOpen: false, type: null, id: null });
        }
    });

    // Unified Confirmation State
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        type: 'delete' | null;
        id: number | null;
    }>({ isOpen: false, type: null, id: null });

    const [receiptOrder, setReceiptOrder] = useState<PurchaseOrder | null>(null);

    const handleDelete = (id: number) => {
        setConfirmAction({ isOpen: true, type: 'delete', id });
    }

    const handleReceive = (order: PurchaseOrder) => {
        setReceiptOrder(order);
    }

    const handleWhatsApp = async (order: PurchaseOrder) => {
        // 1. Generate Images (Barcode & QR)
        const canvas = document.createElement('canvas');

        // Barcode
        JsBarcode(canvas, `ORD-${order.id}`, { format: "CODE128", displayValue: false });
        const barcodeData = canvas.toDataURL("image/png");

        // QR Code
        const qrContent = `ORDEN #${order.id}\nPROVEEDOR: ${order.provider?.name}\nFECHA: ${format(new Date(order.created_at), "dd/MM/yyyy")}\nITEMS: ${order.items?.length || 0}`;
        const qrData = await QRCode.toDataURL(qrContent, { width: 100, margin: 1 });

        // 2. Setup PDF
        const doc = new jsPDF();
        const pageWidth = 210; // A4 width in mm

        // --- Header ---
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "VIVERES APP";
        doc.text(businessName.toUpperCase(), pageWidth / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text('"Calidad y servicio a tu puerta"', pageWidth / 2, 26, { align: "center" });
        doc.text("RIF: J-12345678-9", pageWidth / 2, 31, { align: "center" });

        // Separator
        doc.setLineWidth(0.5);
        doc.line(14, 35, pageWidth - 14, 35);

        // --- Order Info ---
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("ORDEN DE COMPRA", 14, 45);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Left Column (Order Data)
        doc.text(`N° Control:`, 14, 53);
        doc.setFont("helvetica", "bold");
        doc.text(`ORD-${order.id.toString().padStart(6, '0')}`, 35, 53);

        doc.setFont("helvetica", "normal");
        doc.text(`Fecha:`, 14, 59);
        doc.text(`${format(new Date(order.created_at), "dd/MM/yyyy h:mm a")}`, 35, 59);

        // Right Column (Provider Data)
        const rightColX = 110;
        doc.text("PROVEEDOR:", rightColX, 53);
        doc.setFont("helvetica", "bold");
        doc.text(`${order.provider?.name || "N/A"}`, rightColX, 58);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`ID: ${order.provider_id || "N/A"}`, rightColX, 63);
        if (order.provider?.contact_info) {
            doc.text(`Contacto: ${order.provider.contact_info}`, rightColX, 68, { maxWidth: 80 });
        }
        doc.setTextColor(0);

        // Barcode (Top Right)
        doc.addImage(barcodeData, 'PNG', 150, 40, 45, 15);

        // --- Items Table ---
        let y = 80;

        // Table Header
        doc.setFillColor(240, 240, 240);
        doc.rect(14, y, pageWidth - 28, 8, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("PRODUCTO", 18, y + 5);
        doc.text("CANTIDAD", 160, y + 5, { align: "center" });

        y += 12;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        order.items?.forEach((item, index) => {
            if (y > 270) { // New page
                doc.addPage();
                y = 20;
            }

            const name = item.product_name || "Producto Manual";
            doc.text(name, 18, y);
            doc.text(item.requested_quantity.toString(), 160, y, { align: "center" });

            // Zebra striping line
            doc.setDrawColor(230);
            doc.line(14, y + 3, pageWidth - 14, y + 3);

            y += 8;
        });

        // --- Footer / Validation ---
        y = Math.max(y + 10, 220); // Push footer to bottom segment

        doc.setLineWidth(0.5);
        doc.setDrawColor(0);
        doc.line(14, y, pageWidth - 14, y);
        y += 10;

        doc.setFontSize(8);
        doc.text(`Esta orden de compra es un documento digital generado por el sistema ${process.env.NEXT_PUBLIC_BUSINESS_NAME || 'ViveresApp'}.`, 14, y);
        y += 5;
        doc.text("Por favor verificar disponibilidad y precios antes de despachar.", 14, y);

        // QR Code
        doc.addImage(qrData, 'PNG', pageWidth - 45, y - 10, 30, 30);

        // Save
        doc.save(`Orden_${order.id}_${order.provider?.name?.replace(/\s+/g, '_') || 'Prov'}.pdf`);
        toast.success("PDF Profesional Descargado. Abriendo WhatsApp...");

        // 3. Open WhatsApp
        const phone = order.provider?.contact_info || "";
        const message = `Hola ${order.provider?.name || ""}, adjunto la orden de compra #${order.id}.`;
        window.open(formatWhatsAppLink(phone, message), '_blank');
    }

    const proceedWithAction = () => {
        if (!confirmAction.id) return;
        if (confirmAction.type === 'delete') {
            deleteMutation.mutate(confirmAction.id);
        }
    }

    const toggleExpand = (id: number) => {
        setExpandedOrder(expandedOrder === id ? null : id);
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Nueva Orden
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">ID #</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Proveedor</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-6 text-center">Cargando...</td></tr>
                        ) : (orders as PurchaseOrder[])?.map((order) => (
                            <React.Fragment key={order.id}>
                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer" onClick={() => toggleExpand(order.id)}>
                                    <td className="px-6 py-4 font-medium">ORD-{order.id.toString().padStart(4, '0')}</td>
                                    <td className="px-6 py-4">{format(new Date(order.created_at), "dd MMM yyyy", { locale: es })}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {order.provider?.name || `ID: ${order.provider_id}`}
                                        {order.provider?.contact_info && <div className="text-xs text-gray-500 font-normal">{order.provider.contact_info}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${order.status === 'completed'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {order.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                            {order.status === 'completed' ? 'Recibido' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {order.status !== 'completed' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleReceive(order); }}
                                                    className="cursor-pointer text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-100 border border-indigo-200"
                                                    title="Recibir Mercancía"
                                                >
                                                    Recibir Mercancía
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleWhatsApp(order); }}
                                                className="cursor-pointer p-1 text-green-600 hover:bg-green-50 rounded bg-white border border-transparent hover:border-green-100 transition-colors"
                                                title="Descargar PDF y Enviar por WhatsApp"
                                            >
                                                <FileText className="w-4 h-4" />
                                            </button>
                                            {order.status !== 'completed' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}
                                                    className="cursor-pointer p-1 text-red-500 hover:bg-red-50 rounded bg-white border border-transparent hover:border-red-100 transition-colors"
                                                    title="Eliminar orden"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {/* Expanded Details */}
                                {expandedOrder === order.id && (
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                                        <td colSpan={5} className="p-4 pl-12">
                                            <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Productos de la orden</div>
                                            <div className="space-y-2">
                                                {order.items?.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 rounded border border-gray-100 shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${item.product_id ? 'bg-green-500' : 'bg-orange-500'}`} />
                                                            <span className={!item.product_id ? 'font-medium text-orange-700' : ''}>
                                                                {item.product_name}
                                                            </span>
                                                            {!item.product_id && <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded">Manual</span>}
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-gray-500">Cant: {item.requested_quantity}</span>
                                                            {!item.product_id && order.status !== 'completed' && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setConvertItem(item); }}
                                                                    className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded hover:bg-orange-100"
                                                                >
                                                                    Convertir a Producto
                                                                </button>
                                                            )}
                                                        </div>


                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                page={page}
                hasNextPage={orders?.length === limit}
                onPageChange={setPage}
                isLoading={isPlaceholderData}
            />

            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Nueva Orden de Compra">
                <OrderForm onSuccess={() => setIsFormOpen(false)} onCancel={() => setIsFormOpen(false)} />
            </Modal>

            <Modal isOpen={!!convertItem} onClose={() => setConvertItem(null)} title="Convertir a Producto">
                {convertItem && <ConversionForm item={convertItem} onSuccess={() => setConvertItem(null)} onCancel={() => setConvertItem(null)} />}
            </Modal>

            <Modal isOpen={!!receiptOrder} onClose={() => setReceiptOrder(null)} title="Recibir Mercancía">
                {receiptOrder && (
                    <ReceiptForm
                        order={receiptOrder}
                        onSuccess={() => setReceiptOrder(null)}
                        onCancel={() => setReceiptOrder(null)}
                        mutation={receiveMutation}
                    />
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({ isOpen: false, type: null, id: null })}
                onConfirm={proceedWithAction}
                title="Eliminar Orden"
                description="¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    )
}

function ReceiptForm({ order, onSuccess, onCancel, mutation }: {
    order: PurchaseOrder,
    onSuccess: () => void,
    onCancel: () => void,
    mutation: any
}) {
    const [items, setItems] = useState(order.items?.map(item => ({
        id: item.id,
        product_name: item.product_name,
        requested_quantity: item.requested_quantity,
        received_quantity: item.requested_quantity,
        actual_cost: item.cost_price || 0,
    })) || []);

    const handleItemChange = (id: number, field: string, value: number) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSubmit = () => {
        mutation.mutate(
            { id: order.id, receipt: { items } },
            { onSuccess: () => onSuccess() }
        );
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">Orden #{order.id} - Proveedor: {order.provider?.name}</p>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                {items.map(item => (
                    <div key={item.id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-2">
                        <p className="font-medium text-sm dark:text-gray-200">{item.product_name}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Cant. Recibida</label>
                                <input
                                    type="number"
                                    className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                    value={item.received_quantity}
                                    onChange={(e) => handleItemChange(item.id, 'received_quantity', Number(e.target.value))}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Pedido original: {item.requested_quantity}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Costo Unitario ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                                    value={item.actual_cost}
                                    onChange={(e) => handleItemChange(item.id, 'actual_cost', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    Cancelar
                </button>
                <button
                    disabled={mutation.isPending}
                    onClick={handleSubmit}
                    className="flex  items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {mutation.isPending ? "Procesando..." : "Confirmar e Ingresar Stock"}
                </button>
            </div>
        </div>
    );
}
