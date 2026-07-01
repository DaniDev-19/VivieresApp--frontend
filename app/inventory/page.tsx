"use client";

import Link from "next/link";
import {
    Plus,
    Search,
    Trash2,
    Edit,
    Eye,
    Package,
    AlertTriangle,
    Tags,
    Filter,
    FileSpreadsheet,
    Activity,
    Sliders
} from "lucide-react";
import { getImageUrl } from "@/lib/utils";

import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ProductForm } from "@/components/inventory/ProductForm";
import { ProductDetailModal } from "@/components/inventory/ProductDetailModal";
import { CategoryManager } from "@/components/inventory/CategoryManager";
import { ImportProductsModal } from "@/app/inventory/components/ImportProductsModal";
import { CategoryFilterSelect } from "@/components/ui/CategoryFilterSelect";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Product, Category } from "@/types";
import { Provider } from "@/types";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export default function InventoryPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    // Adjust stock states
    const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
    const [productToAdjust, setProductToAdjust] = useState<Product | null>(null);
    const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
    const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [adjustmentDirection, setAdjustmentDirection] = useState<"in" | "out">("in");
    const limit = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
    const [detailProduct, setDetailProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

    const { data: categories } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data } = await api.get("/categories");
            return data;
        },
    });

    const { data: providers } = useQuery<Provider[]>({
        queryKey: ["providers"],
        queryFn: async () => {
            const { data } = await api.get("/providers/");
            return data;
        },
    });


    const debouncedSearch = useDebounce(search, 350);


    const { data: products, isLoading, isPlaceholderData } = useQuery<Product[]>({

        queryKey: ["products", page, debouncedSearch, selectedCategory, selectedProvider],
        queryFn: async () => {
            const params = {
                search: debouncedSearch.trim() || undefined,
                category_id: selectedCategory ?? undefined,
                provider_id: selectedProvider ?? undefined,
                skip: (page - 1) * limit,
                limit
            };
            const { data } = await api.get("/products", { params });
            return data;
        },
        placeholderData: (previousData) => previousData,
        staleTime: 1000 * 60 * 2,
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleCategoryFilter = (categoryId: number | null) => {
        setSelectedCategory(categoryId);
        setPage(1);
    };

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            toast.success("Producto eliminado correctamente");
        },
        onError: (error: any) => {
            console.error("Error deleting product:", error);
            toast.error("Error al eliminar el producto");
        }
    });

    const handleDeleteClick = (id: number) => {
        setProductToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (productToDelete) {
            deleteMutation.mutate(productToDelete);
        }
    };

    const handleCreate = () => {
        setSelectedProduct(undefined);
        setIsModalOpen(true);
    };

    const handleAdjustStockClick = (product: Product) => {
        setProductToAdjust(product);
        setAdjustmentQuantity(0);
        setAdjustmentNotes("");
        setAdjustmentDirection("in");
        setIsAdjustStockOpen(true);
    };

    const handleAdjustStockConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productToAdjust || adjustmentQuantity <= 0) {
            toast.error("Por favor ingresa una cantidad válida mayor a 0");
            return;
        }

        setIsAdjusting(true);
        try {
            const finalQty = adjustmentDirection === "in" ? adjustmentQuantity : -adjustmentQuantity;
            await api.post("/inventory/adjust", {
                product_id: productToAdjust.id,
                quantity_change: finalQty,
                notes: adjustmentNotes || undefined
            });
            toast.success("Ajuste de inventario realizado correctamente");
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsAdjustStockOpen(false);
        } catch (error: any) {
            console.error("Error adjusting stock:", error);
            toast.error(error.response?.data?.detail || "Error al ajustar el inventario");
        } finally {
            setIsAdjusting(false);
        }
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleViewDetail = (product: Product) => {
        setDetailProduct(product);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="h-6 w-6 text-indigo-600" />
                        Inventario
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gestiona tus productos y existencias
                    </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                    <Link
                        href="/inventory/movements"
                        title="Ver historial de movimientos y Kardex"
                        className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                        <Activity className="mr-2 h-4 w-4 text-indigo-600" />
                        Kardex / Movimientos
                    </Link>
                    <button
                        onClick={() => setIsCategoryManagerOpen(true)}
                        title="Gestionar categorías"
                        className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                        <Tags className="mr-2 h-4 w-4" />
                        Categorías
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        title="Importar masivamente desde Excel"
                        className="flex cursor-pointer items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Importar Excel
                    </button>
                    <button
                        onClick={handleCreate}
                        title="Crear nuevo producto"
                        className="flex cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/15 transition-all duration-200">
                    <Search className="h-4.5 w-4.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código de barras..."
                        value={search}
                        onChange={handleSearch}
                        className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-400 dark:text-white sm:text-base"
                    />
                </div>
                {providers && providers.length > 0 && (
                    <div className="w-full sm:w-44 md:w-48 shrink-0 py-2">
                        <Select
                            value={selectedProvider?.toString()}
                            onValueChange={(value) => {
                                setSelectedProvider(value === "all" ? null : Number(value));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="cursor-pointer w-full rounded-xl border border-gray-200 bg-white py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                                <Filter className="h-4.5 w-4.5 shrink-0 text-indigo-500 dark:text-indigo-400" />
                                <SelectValue placeholder="Todos los proveedores" />
                            </SelectTrigger>
                            <SelectContent align="end" position="popper">
                                <SelectItem value="all" className="cursor-pointer">Todos los proveedores</SelectItem>
                                {providers.map((provider) => (
                                    <SelectItem className="cursor-pointer" key={provider.id} value={provider.id.toString()}>
                                        {provider.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {categories && categories.length > 0 && (
                    <CategoryFilterSelect
                        categories={categories}
                        value={selectedCategory}
                        onChange={handleCategoryFilter}
                        compact
                        className="w-full sm:w-44 md:w-48 shrink-0"
                    />
                )}
            </div>


            {/* Table (Responsive Card Layout for Mobile could be better, but table for now) */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Producto</th>
                                <th className="px-6 py-4 font-semibold">Costo / Precio</th>
                                <th className="px-6 py-4 font-semibold">Existencia</th>
                                <th className="px-6 py-4 font-semibold">Estado</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center">Cargando inventario...</td></tr>
                            ) : products?.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay productos encontrados.</td></tr>
                            ) : (
                                products?.map((product) => (
                                    <tr
                                        key={product.id}
                                        title={product.name}
                                        className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                    {product.image_url ? (
                                                        <img src={getImageUrl(product.image_url)!} alt={product.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                            <Package className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="wrap-break-words max-w-50">{product.name}</span>
                                                    <span className="text-xs text-gray-400">{product.barcode}</span>
                                                    {providers?.find(p => p.id === product.provider_id)?.name && (
                                                        <span className="text-xs text-gray-400">{providers?.find(p => p.id === product.provider_id)?.name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    ${product.price_usd?.toFixed(2)}
                                                </span>
                                                <span className="text-xs text-gray-400">Costo: ${product.cost_price?.toFixed(2)}</span>
                                                <span className="text-xs text-orange-400">Oferta: ${product.offer_price_usd?.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={product.stock_quantity <= product.min_stock_level ? "text-red-600 font-bold" : ""}>
                                                    {product.stock_quantity}
                                                </span>
                                                {product.stock_quantity <= product.min_stock_level && (
                                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${product.is_public ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"}`}>
                                                {product.is_public ? "Público" : "Privado"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewDetail(product)}
                                                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-900/20"
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAdjustStockClick(product)}
                                                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-600 dark:text-gray-400 dark:hover:bg-amber-900/20"
                                                    title="Ajustar Stock (Kardex)"
                                                >
                                                    <Sliders className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-indigo-900/20"
                                                    title="Editar"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(product.id!)}
                                                    className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                page={page}
                hasNextPage={products?.length === limit}
                onPageChange={setPage}
                isLoading={isPlaceholderData}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedProduct ? "Editar Producto" : "Nuevo Producto"}
            >
                <ProductForm
                    product={selectedProduct}
                    onSuccess={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Producto?"
                description="¿Estás seguro de eliminar este producto? Esta acción quedará registrada en la bitácora y no se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />

            <ProductDetailModal
                product={detailProduct}
                onClose={() => setDetailProduct(null)}
            />

            <CategoryManager
                isOpen={isCategoryManagerOpen}
                onClose={() => setIsCategoryManagerOpen(false)}
            />

            <ImportProductsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />

            <Modal
                isOpen={isAdjustStockOpen}
                onClose={() => setIsAdjustStockOpen(false)}
                title="Ajustar Stock de Inventario"
            >
                {productToAdjust && (
                    <form onSubmit={handleAdjustStockConfirm} className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-800">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                {productToAdjust.image_url ? (
                                    <img src={getImageUrl(productToAdjust.image_url)!} alt={productToAdjust.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                                        <Package className="h-5 w-5" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{productToAdjust.name}</h4>
                                <p className="text-xs text-gray-500">Stock Actual: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{productToAdjust.stock_quantity} unidades</span></p>
                            </div>
                        </div>

                        {/* Dirección del Ajuste */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tipo de Ajuste</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentDirection("in")}
                                    className={`flex items-center justify-center py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${adjustmentDirection === "in" ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : "bg-white text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800"}`}
                                >
                                    🟢 Entrada (+)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentDirection("out")}
                                    className={`flex items-center justify-center py-2 px-4 rounded-xl border text-sm font-semibold transition-all ${adjustmentDirection === "out" ? "bg-red-50 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" : "bg-white text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800"}`}
                                >
                                    🔴 Salida (-)
                                </button>
                            </div>
                        </div>

                        {/* Cantidad */}
                        <div>
                            <label htmlFor="adjust-qty" className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Cantidad de Unidades</label>
                            <input
                                id="adjust-qty"
                                type="number"
                                min="1"
                                required
                                value={adjustmentQuantity || ""}
                                onChange={(e) => setAdjustmentQuantity(Math.max(1, Number(e.target.value)))}
                                placeholder="Ej. 10"
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                            />
                        </div>

                        {/* Motivo */}
                        <div>
                            <label htmlFor="adjust-notes" className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Motivo / Notas del Ajuste</label>
                            <textarea
                                id="adjust-notes"
                                rows={3}
                                required
                                value={adjustmentNotes}
                                onChange={(e) => setAdjustmentNotes(e.target.value)}
                                placeholder="Ej. Corrección por inventario físico anual, merma, entrada especial, etc..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 resize-none"
                            />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                type="button"
                                disabled={isAdjusting}
                                onClick={() => setIsAdjustStockOpen(false)}
                                className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isAdjusting}
                                className="py-2.5 px-5 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {isAdjusting ? "Ajustando..." : "Confirmar Ajuste"}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
