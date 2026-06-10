"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2, Upload, X } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { Product, Category } from "@/types";
import { toast } from "sonner";


interface ProductFormProps {
    product?: Partial<Product>;
    onSuccess: () => void;
    onCancel: () => void;
}

const EMPTY_PRODUCT: Product = {
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
    tax_rate: 0.16,
    category_id: null,
    offer_price_usd: null,
};

function toApiPayload(data: Product) {
    return {
        barcode: data.barcode,
        name: data.name,
        description: data.description || null,
        cost_price: Number(data.cost_price),
        profit_margin: Number(data.profit_margin),
        tax_rate: Number(data.tax_rate),
        stock_quantity: Number(data.stock_quantity),
        min_stock_level: Number(data.min_stock_level),
        category_id: data.category_id ?? null,
        offer_price_usd:
            data.offer_price_usd != null && data.offer_price_usd > 0
                ? Number(data.offer_price_usd)
                : null,
        image_url: data.image_url || null,
        is_public: data.is_public,
        apply_iva_web: data.apply_iva_web,
    };
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
    const queryClient = useQueryClient();

    const { data: categories } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data } = await api.get("/categories");
            return data;
        },
    });

    const [formData, setFormData] = useState<Product>(EMPTY_PRODUCT);

    useEffect(() => {
        if (!product?.id) {
            setFormData(EMPTY_PRODUCT);
            return;
        }
        setFormData({
            barcode: product.barcode ?? "",
            name: product.name ?? "",
            description: product.description ?? "",
            cost_price: Number(product.cost_price ?? 0),
            profit_margin:
                product.profit_margin != null ? Number(product.profit_margin) : 0.30,
            tax_rate: product.tax_rate != null ? Number(product.tax_rate) : 0.16,
            stock_quantity: Number(product.stock_quantity ?? 0),
            min_stock_level: Number(product.min_stock_level ?? 5),
            category_id: product.category_id ?? product.category?.id ?? null,
            offer_price_usd: product.offer_price_usd ?? null,
            image_url: product.image_url ?? "",
            is_public: product.is_public ?? true,
            apply_iva_web: product.apply_iva_web ?? true,
        });
    }, [product?.id]);

    const mutation = useMutation({
        mutationFn: async (data: Product) => {
            const payload = toApiPayload(data);
            if (product?.id) {
                await api.put(`/products/${product.id}`, payload);
            } else {
                await api.post("/products/", payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success(product?.id ? "Producto actualizado correctamente" : "Producto creado correctamente");
            onSuccess();
        },
        onError: (err: any) => {
            toast.error("Error al guardar producto", {
                description: err.response?.data?.detail || "Revisa los datos e intenta de nuevo",
            });
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
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Categoría
                        </label>
                        <select
                            value={formData.category_id ?? ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    category_id: e.target.value ? parseInt(e.target.value) : null,
                                })
                            }
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                        >
                            <option value="">Sin categoría</option>
                            {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
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
                                    onChange={(e) => {
                                        const raw = parseFloat(e.target.value);
                                        const parsed = isNaN(raw) ? 0 : raw;
                                        const normalized = parsed > 0 && parsed < 1 ? 1 : Math.max(0, parsed);
                                        setFormData({ ...formData, cost_price: normalized });
                                    }}
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
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Precio de Oferta (USD)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                    min="0"
                                    value={formData.offer_price_usd ?? ""}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        const parsed = raw ? parseFloat(raw) : null;
                                        const normalized = parsed == null ? null : (parsed > 0 && parsed < 1 ? 1 : Math.max(0, parsed));
                                        setFormData({
                                            ...formData,
                                            offer_price_usd: normalized,
                                        });
                                    }}
                                className="w-full rounded-lg border border-orange-200 bg-orange-50/50 p-2.5 pl-7 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-orange-800 dark:bg-orange-900/10 dark:text-white"
                                placeholder="Opcional — precio fijo sin margen"
                            />
                        </div>
                        <p className="mt-1 text-[10px] text-gray-500">
                            Precio directo de rebaja. No aplica el 30% de margen.
                        </p>
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
                                onChange={(e) => setFormData({
                                    ...formData,
                                    stock_quantity: Math.max(0, parseInt(e.target.value) || 0),
                                })}
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
                                onChange={(e) => setFormData({
                                    ...formData,
                                    min_stock_level: Math.max(0, parseInt(e.target.value) || 0),
                                })}
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
