"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Plus,
    Search,
    Trash2,
    Edit,
    Eye,
    Package,
    AlertTriangle,
    Tags,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, getImageUrl } from "@/lib/utils";

import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ProductForm } from "@/components/inventory/ProductForm";
import { ProductDetailModal } from "@/components/inventory/ProductDetailModal";
import { CategoryManager } from "@/components/inventory/CategoryManager";
import { CategoryFilterSelect } from "@/components/ui/CategoryFilterSelect";
import { useUIStore } from "@/store/uiStore";
import { toast } from "sonner";
import { Product, Category } from "@/types";
import { Pagination } from "@/components/ui/pagination";


export default function InventoryPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
    const [detailProduct, setDetailProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

    const { data: categories } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data } = await api.get("/categories");
            return data;
        },
    });

    // Fetch Products
    const { data: products, isLoading, isPlaceholderData } = useQuery<Product[]>({
        queryKey: ["products", page, search, selectedCategory],
        queryFn: async () => {
            const params = {
                search: search || undefined,
                category_id: selectedCategory ?? undefined,
                skip: (page - 1) * limit,
                limit
            };
            const { data } = await api.get("/products", { params });
            return data;
        },
        placeholderData: (previousData) => previousData,
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
            // toast.success("Producto eliminado correctamente");
        },
        onError: (error: any) => {
            console.error("Error deleting product:", error);
            // toast.error("Error al eliminar el producto");
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
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCategoryManagerOpen(true)}
                        title="Gestionar categorías"
                        className="flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                        <Tags className="mr-2 h-4 w-4" />
                        Categorías
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
                {categories && categories.length > 0 && (
                    <CategoryFilterSelect
                        categories={categories}
                        value={selectedCategory}
                        onChange={handleCategoryFilter}
                        className="w-full sm:w-72 shrink-0"
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
                                                    <span className="wrap-break-words max-w-[200px]">{product.name}</span>
                                                    <span className="text-xs text-gray-400">{product.barcode}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    ${product.price_usd?.toFixed(2)}
                                                </span>
                                                <span className="text-xs text-gray-400">Costo: ${product.cost_price?.toFixed(2)}</span>
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
        </div>
    );
}
