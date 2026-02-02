"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Plus,
    Search,
    MoreVertical,
    Trash2,
    Edit,
    Package,
    AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, getImageUrl } from "@/lib/utils";

import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ProductForm } from "@/components/inventory/ProductForm";
import { useUIStore } from "@/store/uiStore";
import { toast } from "sonner";
import { Product } from "@/types";
import { Pagination } from "@/components/ui/pagination";


export default function InventoryPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
    const [productToDelete, setProductToDelete] = useState<number | null>(null);

    // Fetch Products
    const { data: products, isLoading, isError, isPlaceholderData } = useQuery<Product[]>({
        queryKey: ["products", page, search],
        queryFn: async () => {
            const params = {
                search: search || undefined,
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
                <button
                    onClick={handleCreate}
                    className="flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Producto
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código de barras..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>
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
                                                    <span className="truncate max-w-[200px]">{product.name}</span>
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
                                                    onClick={() => handleEdit(product)}
                                                    className="rounded-lg p-2 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-indigo-900/20"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(product.id!)}
                                                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20"
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
        </div>
    );
}
