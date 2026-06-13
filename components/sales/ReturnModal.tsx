"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface ReturnModalProps {
    sale: {
        id: number;
        items: Array<{
            product_id: number;
            name?: string;
            quantity: number;
            unit_price_usd: number;
        }>;
    };
    onClose: () => void;
    onSuccess: (data: any) => void;
}

export function ReturnModal({ sale, onClose, onSuccess }: ReturnModalProps) {
    const [items, setItems] = useState(
        sale.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.name || `Producto #${item.product_id}`,
            maxQuantity: item.quantity,
            quantity: 0,
            unit_price_usd: item.unit_price_usd,
        }))
    );
    const [refundMethod, setRefundMethod] = useState<"cash" | "credit_note" | "original">("credit_note");
    const [reason, setReason] = useState("");

    const selectedItems = items.filter((i) => i.quantity > 0);
    const totalRefund = selectedItems.reduce((sum, i) => sum + i.quantity * i.unit_price_usd, 0);
    const isValid = selectedItems.length > 0;

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(`/sales/${sale.id}/return`, {
                items: selectedItems.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                })),
                refund_method: refundMethod,
                reason: reason || undefined,
            });
            return data;
        },
        onSuccess: (data) => {
            toast.success("Devolución creada exitosamente");
            onSuccess(data);
            onClose();
        },
        onError: (error: any) => {
            const detail = error?.response?.data?.detail || "Error al crear la devolución";
            toast.error(detail);
        },
    });

    const handleQuantityChange = (productId: number, value: number) => {
        setItems((prev) =>
            prev.map((item) =>
                item.product_id === productId
                    ? { ...item, quantity: Math.max(0, Math.min(value, item.maxQuantity)) }
                    : item
            )
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                            <RotateCcw className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Devolución</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Venta #{sale.id.toString().padStart(6, "0")}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Selecciona productos a devolver</label>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.product_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">${item.unit_price_usd.toFixed(2)} c/u · Stock vendido: {item.maxQuantity}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                                            disabled={item.quantity === 0}
                                            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={0}
                                            max={item.maxQuantity}
                                            value={item.quantity}
                                            onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 0)}
                                            className="w-14 text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white p-1.5 text-sm font-bold outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        />
                                        <button
                                            onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                                            disabled={item.quantity >= item.maxQuantity}
                                            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Método de reembolso</label>
                        <Select
                            value={refundMethod}
                            onValueChange={(value) => setRefundMethod(value as "cash" | "credit_note" | "original")}
                        >
                            <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none dark:bg-gray-800 dark:text-white focus:border-red-500 focus:ring-red-500/15">
                                <SelectValue placeholder="Seleccionar método" />
                            </SelectTrigger>
                            <SelectContent align="end" position="popper">
                                <SelectItem value="credit_note">Nota de Crédito</SelectItem>
                                <SelectItem value="cash">Efectivo</SelectItem>
                                <SelectItem value="original">Método Original</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Motivo (opcional)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white p-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none placeholder:text-gray-400"
                            placeholder="Ej: Producto defectuoso, cambio de opinión..."
                        />
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Total a reembolsar:</span>
                            <span className="text-xl font-black text-red-600 dark:text-red-400">${totalRefund.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={!isValid || mutation.isPending}
                        className="px-5 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {mutation.isPending ? (
                            "Procesando..."
                        ) : (
                            <>
                                <RotateCcw className="w-4 h-4" />
                                Crear Devolución
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
