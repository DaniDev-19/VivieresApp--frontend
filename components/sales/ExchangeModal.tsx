"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { X, RefreshCw, Search, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ExchangeModalProps {
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

export function ExchangeModal({ sale, onClose, onSuccess }: ExchangeModalProps) {
    const [itemsOut, setItemsOut] = useState(
        sale.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.name || `Producto #${item.product_id}`,
            maxQuantity: item.quantity,
            quantity: 0,
            unit_price_usd: item.unit_price_usd,
        }))
    );

    const [itemsIn, setItemsIn] = useState<Array<{
        product_id: number;
        product_name: string;
        quantity: number;
        unit_price_usd: number;
        maxQuantity: number;
    }>>([]);

    const [paymentMethod, setPaymentMethod] = useState("");
    const [reason, setReason] = useState("");
    const [productSearch, setProductSearch] = useState("");

    const { data: products = [] } = useQuery({
        queryKey: ["products-for-exchange"],
        queryFn: async () => {
            const { data } = await api.get("/products", { params: { limit: 500 } });
            return data.filter((p: any) => p.stock_quantity > 0);
        },
    });

    const filteredProducts = products.filter((p: any) => {
        const q = productSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q);
    });

    const selectedOut = itemsOut.filter((i) => i.quantity > 0);
    const totalOut = selectedOut.reduce((sum, i) => sum + i.quantity * i.unit_price_usd, 0);
    const totalIn = itemsIn.reduce((sum, i) => sum + i.quantity * i.unit_price_usd, 0);
    const difference = totalIn - totalOut;
    const isValid = selectedOut.length > 0 && itemsIn.length > 0;

    const mutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(`/sales/${sale.id}/exchange`, {
                items_out: selectedOut.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                })),
                items_in: itemsIn.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                })),
                payment_method: difference > 0 ? (paymentMethod || undefined) : undefined,
                reason: reason || undefined,
            });
            return data;
        },
        onSuccess: (data) => {
            toast.success("Cambio creado exitosamente");
            onSuccess(data);
            onClose();
        },
        onError: (error: any) => {
            const detail = error?.response?.data?.detail || "Error al crear el cambio";
            toast.error(detail);
        },
    });

    const handleOutQty = (productId: number, value: number) => {
        setItemsOut((prev) =>
            prev.map((item) =>
                item.product_id === productId
                    ? { ...item, quantity: Math.max(0, Math.min(value, item.maxQuantity)) }
                    : item
            )
        );
    };

    const addProductIn = (product: any) => {
        const exists = itemsIn.find((i) => i.product_id === product.id);
        if (exists) return;
        setItemsIn((prev) => [
            ...prev,
            {
                product_id: product.id,
                product_name: product.name,
                quantity: 1,
                unit_price_usd: product.price_usd || 0,
                maxQuantity: product.stock_quantity,
            },
        ]);
    };

    const handleInQty = (productId: number, value: number) => {
        setItemsIn((prev) =>
            prev.map((item) =>
                item.product_id === productId
                    ? { ...item, quantity: Math.max(0, Math.min(value, item.maxQuantity)) }
                    : item
            )
        );
    };

    const removeProductIn = (productId: number) => {
        setItemsIn((prev) => prev.filter((i) => i.product_id !== productId));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Cambio</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Venta #{sale.id.toString().padStart(6, "0")}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-5">
                    {/* ITEMS OUT */}
                    <div>
                        <label className="flex text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Productos a devolver (Out)
                        </label>
                        <div className="space-y-2">
                            {itemsOut.map((item) => (
                                <div key={item.product_id} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/15 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">${item.unit_price_usd.toFixed(2)} c/u</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleOutQty(item.product_id, item.quantity - 1)}
                                            disabled={item.quantity === 0}
                                            className="w-7 h-7 rounded-lg bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-300 font-bold hover:bg-red-300 dark:hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={0}
                                            max={item.maxQuantity}
                                            value={item.quantity}
                                            onChange={(e) => handleOutQty(item.product_id, parseInt(e.target.value) || 0)}
                                            className="w-12 text-center rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-gray-800 dark:text-white p-1 text-sm font-bold outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                        />
                                        <button
                                            onClick={() => handleOutQty(item.product_id, item.quantity + 1)}
                                            disabled={item.quantity >= item.maxQuantity}
                                            className="w-7 h-7 rounded-lg bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-300 font-bold hover:bg-red-300 dark:hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {selectedOut.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Subtotal OUT: <span className="font-bold">$ {totalOut.toFixed(2)}</span></p>
                        )}
                    </div>

                    {/* ITEMS IN */}
                    <div>
                        <label className="flex text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Productos a recibir (In)
                        </label>

                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre o código..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white p-2.5 pl-10 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-gray-400"
                            />
                        </div>

                        {productSearch && (
                            <div className="mb-3 border border-gray-200 dark:border-gray-700 rounded-xl max-h-40 overflow-y-auto bg-white dark:bg-gray-800 shadow-sm">
                                {filteredProducts.length === 0 ? (
                                    <p className="p-3 text-sm text-gray-500 dark:text-gray-400">Sin resultados</p>
                                ) : (
                                    filteredProducts.slice(0, 10).map((p: any) => {
                                        const alreadyAdded = itemsIn.some((i) => i.product_id === p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => addProductIn(p)}
                                                disabled={alreadyAdded}
                                                className="w-full flex items-center justify-between p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <div className="text-left">
                                                    <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Stock: {p.stock_quantity} · ${p.price_usd?.toFixed(2)}</p>
                                                </div>
                                                {alreadyAdded ? (
                                                    <span className="text-xs text-gray-400">Agregado</span>
                                                ) : (
                                                    <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {itemsIn.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Busca y selecciona productos para agregar al cambio</p>
                        ) : (
                            <div className="space-y-2">
                                {itemsIn.map((item) => (
                                    <div key={item.product_id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/15 rounded-xl border border-green-100 dark:border-green-900/30">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">${item.unit_price_usd.toFixed(2)} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleInQty(item.product_id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                className="w-7 h-7 rounded-lg bg-green-200 dark:bg-green-800/50 text-green-700 dark:text-green-300 font-bold hover:bg-green-300 dark:hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min={1}
                                                max={item.maxQuantity}
                                                value={item.quantity}
                                                onChange={(e) => handleInQty(item.product_id, parseInt(e.target.value) || 1)}
                                                className="w-12 text-center rounded-lg border border-green-300 dark:border-green-800 bg-white dark:bg-gray-800 dark:text-white p-1 text-sm font-bold outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                            />
                                            <button
                                                onClick={() => handleInQty(item.product_id, item.quantity + 1)}
                                                disabled={item.quantity >= item.maxQuantity}
                                                className="w-7 h-7 rounded-lg bg-green-200 dark:bg-green-800/50 text-green-700 dark:text-green-300 font-bold hover:bg-green-300 dark:hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeProductIn(item.product_id)}
                                                className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {itemsIn.length > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Subtotal IN: <span className="font-bold">${totalIn.toFixed(2)}</span></p>
                        )}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Motivo (opcional)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white p-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none placeholder:text-gray-400"
                            placeholder="Ej: Producto defectuoso, talla incorrecta..."
                        />
                    </div>

                    {/* Payment method for difference */}
                    {difference > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Método de pago (diferencia)</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white p-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            >
                                <option value="">Seleccionar método</option>
                                <option value="cash">Efectivo</option>
                                <option value="transfer">Transferencia</option>
                                <option value="point">Punto de Venta</option>
                                <option value="zelle">Zelle</option>
                                <option value="pago_movil">Pago Móvil</option>
                                <option value="paypal">PayPal</option>
                            </select>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-amber-50 dark:bg-amber-900/15 rounded-xl p-4 space-y-1 border border-amber-100 dark:border-amber-900/30">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total OUT (devuelto):</span>
                            <span className="font-bold text-red-600 dark:text-red-400">${totalOut.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Total IN (recibido):</span>
                            <span className="font-bold text-green-600 dark:text-green-400">${totalIn.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-amber-200 dark:border-amber-800/50 pt-1 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                {difference >= 0 ? "Cliente debe pagar:" : "A favor del cliente:"}
                            </span>
                            <span className={`text-lg font-black ${difference >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                ${Math.abs(difference).toFixed(2)}
                            </span>
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
                        disabled={!isValid || mutation.isPending || difference > 0 && !paymentMethod}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {mutation.isPending ? (
                            "Procesando..."
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Realizar Cambio
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
