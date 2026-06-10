"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { formatWhatsAppLink } from "@/lib/utils";
import { Plus, Trash2, Edit, Truck, Phone, MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Provider } from "@/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

// --- Provider Form (Internal Component for simplicity) ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProviderForm({ provider, onSuccess, onCancel }: { provider?: Provider, onSuccess: () => void, onCancel: () => void }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: provider?.name || "",
        rif: provider?.rif || "",
        contact_info: provider?.contact_info || "",
        is_delivery: provider?.is_delivery || false,
    });

    const mutation = useMutation({
        mutationFn: async (data: Partial<Provider>) => {
            if (provider?.id) {
                await api.put(`/providers/${provider.id}`, data);
            } else {
                await api.post("/providers/", data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["providers"] });
            toast.success(provider ? "Proveedor actualizado" : "Proveedor creado");
            onSuccess();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">Nombre / Razón Social</label>
                <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Distribuidora Polar C.A."
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">RIF / Documento</label>
                <input
                    value={formData.rif}
                    onChange={e => setFormData({ ...formData, rif: e.target.value })}
                    className="w-full rounded-md border p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="J-12345678-9"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Contacto (Teléfono/Email)</label>
                <textarea
                    value={formData.contact_info}
                    onChange={e => setFormData({ ...formData, contact_info: e.target.value })}
                    className="w-full rounded-md border p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Juan Perez - 0414-1234567"
                    rows={3}
                />
            </div>
            <div className="flex items-center gap-2 py-1">
                <input
                    type="checkbox"
                    id="is_delivery"
                    checked={formData.is_delivery}
                    onChange={e => setFormData({ ...formData, is_delivery: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 dark:bg-gray-800 dark:border-gray-700"
                />
                <label htmlFor="is_delivery" className="text-sm font-medium select-none cursor-pointer dark:text-gray-300">
                    ¿Es proveedor de delivery / envíos?
                </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    {provider ? "Guardar" : "Crear"}
                </button>
            </div>
        </form>
    )
}

// --- Main List Component ---
export function ProvidersList() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider | undefined>(undefined);

    const { data: providers, isLoading } = useQuery({
        queryKey: ["providers"],
        queryFn: async () => {
            const { data } = await api.get("/providers/");
            return data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => await api.delete(`/providers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["providers"] });
            toast.success("Proveedor eliminado");
            setConfirmId(null);
        }
    });

    const [confirmId, setConfirmId] = useState<number | null>(null);

    const handleEdit = (prov: Provider) => {
        setSelectedProvider(prov);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedProvider(undefined);
        setIsModalOpen(true);
    };

    const handleWhatsApp = (prov: Provider) => {
        const phone = prov.contact_info || "";
        if (!phone) {
            toast.error("No se encontró contacto registrado.");
            return;
        }
        window.open(formatWhatsAppLink(phone, `Hola, te contacto desde ${process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Viveres App'}.`), '_blank');
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                >
                    <Plus className="w-4 h-4 text-indigo-600" /> Nuevo Proveedor
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full text-center py-10 text-gray-400">Cargando proveedores...</div>
                ) : (providers as Provider[])?.map((prov) => (
                    <div key={prov.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm dark:bg-gray-900 dark:border-gray-800 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 rounded-lg dark:bg-indigo-900/20">
                                    <Truck className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{prov.name}</h3>
                                        {prov.is_delivery && (
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xxs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                Delivery
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{prov.rif}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleWhatsApp(prov)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Chat WhatsApp"><MessageCircle className="w-4 h-4" /></button>
                                <button onClick={() => handleEdit(prov)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => setConfirmId(prov.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 p-3 rounded-lg dark:bg-gray-800/50">
                            <p className="flex items-start gap-2">
                                <Phone className="w-4 h-4 mt-0.5 opacity-50" />
                                <span className="whitespace-pre-wrap">{prov.contact_info || "Sin contacto registrado"}</span>
                            </p>
                        </div>
                    </div>
                ))}

                {providers?.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500 italic">No hay proveedores registrados.</div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedProvider ? "Editar Proveedor" : "Nuevo Proveedor"}
            >
                <ProviderForm
                    provider={selectedProvider}
                    onSuccess={() => setIsModalOpen(false)}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmId}
                onClose={() => setConfirmId(null)}
                onConfirm={() => confirmId && deleteMutation.mutate(confirmId)}
                title="Eliminar Proveedor"
                description="¿Estás seguro de que deseas eliminar este proveedor?"
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
