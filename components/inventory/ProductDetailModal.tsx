"use client";

import { Package, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Product } from "@/types";
import { getImageUrl } from "@/lib/utils";

interface ProductDetailModalProps {
    product: Product | null;
    onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
            <span className="text-sm text-gray-900 dark:text-white text-left sm:text-right">{value}</span>
        </div>
    );
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    if (!product) return null;

    const lowStock = product.stock_quantity <= product.min_stock_level;
    const priceWithTax =
        Number(product.cost_price || 0) *
        (1 + Number(product.profit_margin || 0)) *
        (1 + Number(product.tax_rate || 0));

    return (
        <Modal isOpen={!!product} onClose={onClose} title="Detalle del Producto">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="mx-auto sm:mx-0 h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {product.image_url ? (
                            <img
                                src={getImageUrl(product.image_url)!}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <Package className="h-12 w-12" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-1">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{product.barcode}</p>
                        {product.id && (
                            <p className="text-xs text-gray-400">ID interno: #{product.id}</p>
                        )}
                        {product.category?.name && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                {product.category.name}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2 pt-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    product.is_public
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                            >
                                {product.is_public ? "Visible en catálogo" : "Solo uso interno"}
                            </span>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                    product.apply_iva_web
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                            >
                                {product.apply_iva_web ? "IVA en pedidos web" : "Sin IVA en web"}
                            </span>
                            {lowStock && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                    <AlertTriangle className="h-3 w-3" />
                                    Stock bajo
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {product.description && (
                    <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                            Descripción
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {product.description}
                        </p>
                    </div>
                )}

                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                        Precios
                    </p>
                    <DetailRow label="Costo (USD)" value={`$${Number(product.cost_price || 0).toFixed(2)}`} />
                    <DetailRow
                        label="Margen de ganancia"
                        value={`${(Number(product.profit_margin || 0) * 100).toFixed(0)}%`}
                    />
                    <DetailRow label="IVA" value={`${(Number(product.tax_rate || 0) * 100).toFixed(0)}%`} />
                    <DetailRow
                        label="Precio de venta (USD)"
                        value={
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                ${Number(product.price_usd ?? priceWithTax).toFixed(2)}
                            </span>
                        }
                    />
                    {product.offer_price_usd != null && product.offer_price_usd > 0 && (
                        <DetailRow
                            label="Precio de oferta (USD)"
                            value={
                                <span className="font-semibold text-orange-600 dark:text-orange-400">
                                    ${Number(product.offer_price_usd).toFixed(2)}
                                </span>
                            }
                        />
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                        Inventario
                    </p>
                    <DetailRow
                        label="Existencia actual"
                        value={
                            <span className={lowStock ? "font-bold text-red-600" : ""}>
                                {product.stock_quantity} unidades
                            </span>
                        }
                    />
                    <DetailRow label="Stock mínimo" value={`${product.min_stock_level} unidades`} />
                </div>
            </div>
        </Modal>
    );
}
