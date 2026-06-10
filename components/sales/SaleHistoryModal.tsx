"use client";

import { useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { X, RotateCcw, RefreshCw, Calendar, Trash2 } from "lucide-react";
import { ReturnTicket } from "./ReturnTicket";
import { ExchangeTicket } from "./ExchangeTicket";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useState } from "react";
import type { Return, Exchange } from "@/types";
import { toast } from "sonner";

interface SaleHistoryModalProps {
    saleId: number;
    rates: any;
    onClose: () => void;
}

export function SaleHistoryModal({ saleId, rates, onClose }: SaleHistoryModalProps) {
    const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
    const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
    const [deleteReturnId, setDeleteReturnId] = useState<number | null>(null);
    const [deleteExchangeId, setDeleteExchangeId] = useState<number | null>(null);
    const queryClient = useQueryClient();

    const results = useQueries({
        queries: [
            {
                queryKey: ["returns", { sale_id: saleId }],
                queryFn: async () => {
                    const { data } = await api.get("/returns", { params: { sale_id: saleId } });
                    return data as Return[];
                },
            },
            {
                queryKey: ["exchanges", { sale_id: saleId }],
                queryFn: async () => {
                    const { data } = await api.get("/exchanges", { params: { sale_id: saleId } });
                    return data as Exchange[];
                },
            },
        ],
    });

    const [returnsData, exchangesData] = results;
    const returns = returnsData.data || [];
    const exchanges = exchangesData.data || [];
    const isLoading = returnsData.isLoading || exchangesData.isLoading;
    const hasAny = returns.length > 0 || exchanges.length > 0;

    const deleteReturnMutation = useMutation({
        mutationFn: async (returnId: number) => {
            await api.delete(`/sales/${saleId}/return/${returnId}`);
        },
        onSuccess: () => {
            toast.success("Devolución eliminada y cambios revertidos");
            setDeleteReturnId(null);
            queryClient.invalidateQueries({ queryKey: ["returns", { sale_id: saleId }] });
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["sales-stats"] });
        },
        onError: () => {
            toast.error("Error al eliminar la devolución");
            setDeleteReturnId(null);
        },
    });

    const deleteExchangeMutation = useMutation({
        mutationFn: async (exchangeId: number) => {
            await api.delete(`/sales/${saleId}/exchange/${exchangeId}`);
        },
        onSuccess: () => {
            toast.success("Cambio eliminado y cambios revertidos");
            setDeleteExchangeId(null);
            queryClient.invalidateQueries({ queryKey: ["exchanges", { sale_id: saleId }] });
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["sales-stats"] });
        },
        onError: () => {
            toast.error("Error al eliminar el cambio");
            setDeleteExchangeId(null);
        },
    });

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
                <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <RotateCcw className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Historial de Devoluciones y Cambios</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Venta #{saleId.toString().padStart(6, "0")}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-5">
                        {isLoading ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Cargando historial...</p>
                        ) : !hasAny ? (
                            <div className="text-center py-12">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                                    <RotateCcw className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Esta venta no tiene devoluciones ni cambios</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Usa los botones en la tabla para crear uno</p>
                            </div>
                        ) : (
                            <>
                                {returns.length > 0 && (
                                    <section>
                                        <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
                                            <RotateCcw className="w-4 h-4" />
                                            Devoluciones ({returns.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {returns.map((ret) => (
                                                <div
                                                    key={ret.id}
                                                    className="border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/15 rounded-xl p-4 hover:shadow-sm transition-shadow"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div
                                                            className="cursor-pointer flex-1"
                                                            onClick={() => setSelectedReturn(ret)}
                                                        >
                                                            <span className="font-bold text-sm text-red-700 dark:text-red-400">#DEV-{ret.id.toString().padStart(6, "0")}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                                <Calendar className="w-3 h-3 inline mr-1" />
                                                                {new Date(ret.created_at).toLocaleString("es-VE")}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-red-600 dark:text-red-400">${ret.total_refund_usd.toFixed(2)}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteReturnId(ret.id);
                                                                }}
                                                                disabled={deleteReturnMutation.isPending}
                                                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 transition-colors disabled:opacity-40"
                                                                title="Eliminar devolución"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        <span className="bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 border border-red-200 dark:border-red-900/40 text-gray-700 dark:text-gray-300">
                                                            {ret.refund_method === "cash" ? "Efectivo" : ret.refund_method === "credit_note" ? "Nota de Crédito" : "Método Original"}
                                                        </span>
                                                        {ret.credit_note_code && (
                                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full px-2 py-0.5">{ret.credit_note_code}</span>
                                                        )}
                                                        <span className="bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">{ret.items.length} items</span>
                                                    </div>
                                                    {ret.reason && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">"{ret.reason}"</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {exchanges.length > 0 && (
                                    <section>
                                        <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-3">
                                            <RefreshCw className="w-4 h-4" />
                                            Cambios ({exchanges.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {exchanges.map((exc) => (
                                                <div
                                                    key={exc.id}
                                                    className="border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/15 rounded-xl p-4 hover:shadow-sm transition-shadow"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div
                                                            className="cursor-pointer flex-1"
                                                            onClick={() => setSelectedExchange(exc)}
                                                        >
                                                            <span className="font-bold text-sm text-amber-700 dark:text-amber-400">#CAM-{exc.id.toString().padStart(6, "0")}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                                                <Calendar className="w-3 h-3 inline mr-1" />
                                                                {new Date(exc.created_at).toLocaleString("es-VE")}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold ${exc.total_difference_usd >= 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                                                                {exc.total_difference_usd >= 0 ? "+" : ""}${exc.total_difference_usd.toFixed(2)}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteExchangeId(exc.id);
                                                                }}
                                                                disabled={deleteExchangeMutation.isPending}
                                                                className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-600 transition-colors disabled:opacity-40"
                                                                title="Eliminar cambio"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        <span className="bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 border border-amber-200 dark:border-amber-900/40 text-gray-700 dark:text-gray-300">
                                                            {exc.items_out.length} OUT
                                                        </span>
                                                        <span className="bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 border border-amber-200 dark:border-amber-900/40 text-gray-700 dark:text-gray-300">
                                                            {exc.items_in.length} IN
                                                        </span>
                                                        {exc.payment_method && (
                                                            <span className="bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                                                                {exc.payment_method.replace("_", " ")}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {exc.reason && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">"{exc.reason}"</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-end p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirm Delete Return */}
            <ConfirmModal
                isOpen={deleteReturnId !== null}
                onClose={() => setDeleteReturnId(null)}
                onConfirm={() => {
                    if (deleteReturnId) deleteReturnMutation.mutate(deleteReturnId);
                }}
                title="¿Eliminar Devolución?"
                description="Se revertirán los cambios de stock, se restaurará el estado de la venta a 'Completada' y la acción quedará registrada en la bitácora. No se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteReturnMutation.isPending}
            />

            {/* Confirm Delete Exchange */}
            <ConfirmModal
                isOpen={deleteExchangeId !== null}
                onClose={() => setDeleteExchangeId(null)}
                onConfirm={() => {
                    if (deleteExchangeId) deleteExchangeMutation.mutate(deleteExchangeId);
                }}
                title="¿Eliminar Cambio?"
                description="Se revertirán los cambios de stock, se restaurará el estado de la venta a 'Completada' y la acción quedará registrada en la bitácora. No se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteExchangeMutation.isPending}
            />

            {selectedReturn && (
                <ReturnTicket
                    returnData={selectedReturn}
                    rates={rates}
                    onClose={() => setSelectedReturn(null)}
                />
            )}

            {selectedExchange && (
                <ExchangeTicket
                    exchangeData={selectedExchange}
                    rates={rates}
                    onClose={() => setSelectedExchange(null)}
                />
            )}
        </>
    );
}
