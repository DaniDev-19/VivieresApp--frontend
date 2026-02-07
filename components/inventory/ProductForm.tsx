"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { Product } from "@/types";


interface ProductFormProps {
    product?: Partial<Product>;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Product>({
        barcode: "",
        name: "",
        description: "",
        cost_price: 0,
        profit_margin: 0.30,
        stock_quantity: 0,
        min_stock_level: 5,
        image_url: "",
        is_public: true,
        apply_iva_web: true,
        tax_rate: 0.16, // 16% por defecto
    });

    useEffect(() => {
        if (product) {
            setFormData({
                ...formData, // Mantener valores por defecto para campos faltantes
                ...product,
                cost_price: Number(product.cost_price || 0),
                profit_margin: Number(product.profit_margin || 0.30),
                stock_quantity: Number(product.stock_quantity || 0),
                min_stock_level: Number(product.min_stock_level || 0),
                tax_rate: Number(product.tax_rate || 0.16),
            } as Product);
        }
    }, [product]);

    const mutation = useMutation({
        mutationFn: async (data: Product) => {
            if (product?.id) {
                await api.put(`/products/${product.id}`, data);
            } else {
                await api.post("/products/", data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            onSuccess();
        },
    });

    const [isUploading, setIsUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        try {
            const res = await api.post("/uploads/image", formDataUpload, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setFormData(prev => ({ ...prev, image_url: res.data.url }));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir la imagen");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Código de Barras
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.barcode}
                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            placeholder="E.g. 750123456789"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nombre del Producto
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            placeholder="Harina PAN 1kg"
                        />
                    </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Costo (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={formData.cost_price || ""}
                                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-200 bg-white p-2.5 pl-7 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Margen
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.profit_margin || 0}
                                onChange={(e) => setFormData({ ...formData, profit_margin: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                            />
                            <span className="text-xs text-gray-500">{(formData.profit_margin * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                IVA
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={formData.tax_rate || 0}
                                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                            />
                            <span className="text-xs text-gray-500">{(formData.tax_rate * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Precio Final
                            </label>
                            <div className="w-full rounded-lg border border-gray-200 bg-gray-100 p-2.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                ${(Number(formData.cost_price || 0) * (1 + Number(formData.profit_margin || 0))).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Imagen del Producto
                    </label>
                    <div className="relative group aspect-square rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-indigo-500/50">
                        {formData.image_url ? (
                            <>
                                <img
                                    src={getImageUrl(formData.image_url)!}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, image_url: "" })}
                                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                {isUploading ? (
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
                                ) : (
                                    <>
                                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                            <Upload className="h-6 w-6" />
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            Haga clic para subir imagen
                                        </p>
                                        <p className="mt-1 text-[10px] text-gray-400">
                                            WebP, PNG o JPG (Max 2MB)
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Stock */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Existencia Actual
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.stock_quantity ?? 0}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Stock Mínimo
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.min_stock_level ?? 0}
                                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border p-4 dark:border-gray-700">
                        <input
                            type="checkbox"
                            id="is_public"
                            checked={formData.is_public}
                            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <label htmlFor="is_public" className="text-sm font-medium text-gray-900 dark:text-white">
                            Visible en Catálogo Público
                        </label>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border p-4 dark:border-gray-700">
                        <input
                            type="checkbox"
                            id="apply_iva_web"
                            checked={formData.apply_iva_web}
                            onChange={(e) => setFormData({ ...formData, apply_iva_web: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <label htmlFor="apply_iva_web" className="text-sm font-medium text-gray-900 dark:text-white">
                            Aplicar IVA en Pedidos Web
                        </label>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Descripción
                        </label>
                        <textarea
                            rows={4}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {product ? "Guardar Cambios" : "Crear Producto"}
                </button>
            </div>
        </form>
    );
}
