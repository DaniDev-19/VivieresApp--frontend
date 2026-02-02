"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Users,
    Search,
    Plus,
    Edit,
    Trash2,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/pagination";

interface Customer {
    id: number;
    cedula: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
}

export default function CustomersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
    const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        cedula: "",
        name: "",
        phone: "",
        email: "",
        address: ""
    });

    const { data: customers, isLoading, isPlaceholderData } = useQuery<Customer[]>({
        queryKey: ["customers", page, search],
        queryFn: async () => {
            const params = {
                search: search || undefined,
                skip: (page - 1) * limit,
                limit
            };
            const { data } = await api.get("/customers", { params });
            return data;
        },
        placeholderData: (previousData) => previousData,
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            if (selectedCustomer) {
                return await api.put(`/customers/${selectedCustomer.id}`, data);
            }
            return await api.post("/customers", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            setIsModalOpen(false);
            resetForm();
            toast.success(selectedCustomer ? "Cliente actualizado" : "Cliente creado exitosamente");
        },
        onError: (err: any) => {
            toast.error(selectedCustomer ? "Error al actualizar" : "Error al crear cliente", {
                description: err.response?.data?.detail || "Error desconocido"
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => await api.delete(`/customers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
            toast.success("Cliente eliminado");
        },
        onError: (err: any) => {
            toast.error("Error al eliminar", {
                description: err.response?.data?.detail || "Error desconocido"
            });
        }
    });

    const handleDeleteClick = (id: number) => {
        setCustomerToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (customerToDelete) {
            deleteMutation.mutate(customerToDelete);
        }
    };

    const resetForm = () => {
        setFormData({ cedula: "", name: "", phone: "", email: "", address: "" });
        setSelectedCustomer(undefined);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleWhatsApp = (phone: string) => {
        if (!phone) return;

        // Eliminar caracteres no numéricos
        let cleanPhone = phone.replace(/\D/g, '');

        // Lógica simple para Venezuela: si empieza por 04xx o 02xx, reemplazar 0 por 58
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '58' + cleanPhone.substring(1);
        }

        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    const handleCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setFormData({
            cedula: customer.cedula,
            name: customer.name,
            phone: customer.phone,
            email: customer.email || "",
            address: customer.address || ""
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="h-6 w-6 text-indigo-600" />
                        Clientes
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gestiona tu base de clientes
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, cédula o teléfono..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Cliente</th>
                                <th className="px-6 py-4 font-semibold">Contacto</th>
                                <th className="px-6 py-4 font-semibold">Dirección</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-8 text-center">Cargando clientes...</td></tr>
                            ) : customers?.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay clientes registrados.</td></tr>
                            ) : (
                                customers?.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 dark:text-white">{customer.name}</span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" />
                                                    {customer.cedula}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1 text-xs">
                                                    <Phone className="h-3 w-3" />
                                                    {customer.phone}
                                                </span>
                                                {customer.email && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                                        <Mail className="h-3 w-3" />
                                                        {customer.email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.address ? (
                                                <span className="flex items-center gap-1 text-xs">
                                                    <MapPin className="h-3 w-3" />
                                                    {customer.address}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleWhatsApp(customer.phone)}
                                                    className="rounded-lg p-2 text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-500 dark:hover:bg-green-900/20"
                                                    title="Contactar por WhatsApp"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(customer)}
                                                    className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-500 dark:hover:bg-indigo-900/20"
                                                    title="Editar cliente"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(customer.id)}
                                                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20"
                                                    title="Eliminar cliente"
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

            {/* Pagination */}
            {/* Pagination */}
            <Pagination
                page={page}
                hasNextPage={customers?.length === limit}
                onPageChange={setPage}
                isLoading={isPlaceholderData}
            />

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={selectedCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Cédula *</label>
                        <input
                            type="text"
                            required
                            value={formData.cedula}
                            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Teléfono *</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Dirección</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={2}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => { setIsModalOpen(false); resetForm(); }}
                            className="flex-1 rounded-xl bg-gray-100 py-2 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-1 rounded-xl bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {createMutation.isPending ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Cliente?"
                description={`¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
