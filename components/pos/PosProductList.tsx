"use client";

import { useState } from "react";
import { Eye, ImageIcon, Package, Plus, Tag } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { Product } from "@/types";

interface PosProductListProps {
    products: Product[];
    isLoading?: boolean;
    onAdd: (product: Product, priceType: "normal" | "offer") => void;
    onViewDetail: (product: Product) => void;
}

export function PosProductList({
    products,
    isLoading,
    onAdd,
    onViewDetail,
}: PosProductListProps) {
    const [imageProduct, setImageProduct] = useState<Product | null>(null);

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                Cargando productos...
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <>
            <table className="w-full min-w-0 table-fixed text-left text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50 text-[10px] uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400 sm:text-xs">
                    <tr>
                        <th className="w-[40%] px-2 py-2 font-semibold sm:px-3 sm:py-2.5 sm:w-[38%]">
                            Producto
                        </th>
                        <th className="hidden w-[18%] px-2 py-2 font-semibold xl:table-cell xl:px-3">
                            Categoría
                        </th>
                        <th className="w-[22%] px-2 py-2 font-semibold sm:w-[20%] sm:px-3">
                            Precio
                        </th>
                        <th className="w-[10%] px-1 py-2 text-center font-semibold sm:px-2">
                            Stock
                        </th>
                        <th className="w-[28%] px-1 py-2 text-right font-semibold sm:w-[22%] sm:px-2">
                            <span className="sr-only">Acciones</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {products.map((product) => {
                        const hasOffer =
                            product.offer_price_usd != null && product.offer_price_usd > 0;

                        return (
                            <tr
                                key={product.id}
                                title={product.name}
                                onClick={() => onAdd(product, "normal")}
                                className="cursor-pointer transition-colors hover:bg-indigo-50/60 dark:hover:bg-indigo-900/10"
                            >
                                <td className="px-2 py-2 sm:px-3 sm:py-2.5">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 sm:flex">
                                            <Package className="h-3.5 w-3.5 text-gray-400" />
                                        </div>
                                        <div className="min-w-0 overflow-hidden">
                                            <p className="wrap-break-words text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
                                                {product.name}
                                            </p>
                                            <p className="truncate text-[14px] text-gray-400 font-mono">
                                                {product.barcode}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden truncate px-2 py-2 text-xs text-gray-500 xl:table-cell xl:px-3 dark:text-gray-400">
                                    {product.category?.name || "—"}
                                </td>
                                <td className="px-2 py-2 sm:px-3 sm:py-2.5">
                                    <div className="min-w-0">
                                        <span className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 sm:text-sm">
                                            ${Number(product.price_usd).toFixed(2)}
                                        </span>
                                        {hasOffer && (
                                            <span className="block truncate text-[14px] font-semibold text-orange-600 dark:text-orange-400">
                                                ${Number(product.offer_price_usd).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-1 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300 sm:px-2">
                                    {product.stock_quantity}
                                </td>
                                <td className="px-1 py-2 sm:px-2">
                                    <div
                                        className="flex items-center justify-end gap-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {product.image_url && (
                                            <button
                                                type="button"
                                                onClick={() => setImageProduct(product)}
                                                className="cursor-pointer rounded-md bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 transition-all"
                                                title="Ver imagen"
                                            >
                                                <ImageIcon className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onViewDetail(product)}
                                            className="cursor-pointer rounded-md bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 transition-all"
                                            title="Ver detalle"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </button>
                                        {hasOffer && (
                                            <button
                                                type="button"
                                                onClick={() => onAdd(product, "offer")}
                                                className="cursor-pointer rounded-md bg-orange-600 p-1.5 text-white hover:bg-orange-700 transition-all"
                                                title="Agregar en oferta"
                                            >
                                                <Tag className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onAdd(product, "normal")}
                                            className="cursor-pointer rounded-md bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 transition-all"
                                            title="Agregar al carrito"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {imageProduct?.image_url && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onClick={() => setImageProduct(null)}
                >
                    <div
                        className="relative max-h-[85vh] max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={getImageUrl(imageProduct.image_url)!}
                            alt={imageProduct.name}
                            className="max-h-[80vh] w-full object-contain"
                        />
                        <p className="truncate px-4 py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                            {imageProduct.name}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
