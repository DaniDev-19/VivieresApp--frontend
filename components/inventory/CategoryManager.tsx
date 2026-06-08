"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Loader2, Plus, Trash2, Tags } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Category } from "@/types";
import { toast } from "sonner";

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: categories, isLoading } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data } = await api.get("/categories");
            return data;
        },
        enabled: isOpen,
    });

    const createMutation = useMutation({
        mutationFn: async (payload: { name: string; description?: string }) => {
            await api.post("/categories", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            setName("");
            setDescription("");
            toast.success("Categoría creada");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Error al crear categoría");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setDeleteId(null);
            toast.success("Categoría eliminada");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Error al eliminar categoría");
            setDeleteId(null);
        },
    });

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Categorías">
                <div className="space-y-6">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!name.trim()) return;
                            createMutation.mutate({
                                name: name.trim(),
                                description: description.trim() || undefined,
                            });
                        }}
                        className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <Tags className="h-4 w-4 text-indigo-600" />
                            Nueva categoría
                        </div>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nombre (ej. Lácteos, Snacks...)"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descripción opcional"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            Agregar
                        </button>
                    </form>

                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Categorías registradas
                        </p>
                        {isLoading ? (
                            <p className="text-sm text-gray-500">Cargando...</p>
                        ) : categories?.length === 0 ? (
                            <p className="text-sm text-gray-500">No hay categorías aún.</p>
                        ) : (
                            <div className="max-h-60 space-y-2 overflow-y-auto">
                                {categories?.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/50"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {cat.name}
                                            </p>
                                            {cat.description && (
                                                <p className="text-xs text-gray-500">{cat.description}</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteId(cat.id)}
                                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="¿Eliminar categoría?"
                description="Solo se puede eliminar si ningún producto la está usando."
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </>
    );
}
