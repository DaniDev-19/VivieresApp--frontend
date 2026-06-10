"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Shield,
    User as UserIcon,
    Loader2,
    Check,
    X,
    Power
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "worker", is_active: true });

    const [page, setPage] = useState(1);
    const limit = 10;

    // 1. Fetch Users
    const { data: users, isLoading, isPlaceholderData } = useQuery({
        queryKey: ["users", page, search],
        queryFn: async () => {
            const params = {
                skip: (page - 1) * limit,
                limit,
                search: search || undefined
            };
            const { data } = await api.get("/users/", { params });
            return data;
        },
        placeholderData: (previousData) => previousData,
    });

    // Reset page when search changes
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    // 2. Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => api.post("/users/", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("Usuario creado exitosamente");
            setShowModal(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error("Error al crear usuario", { description: err.response?.data?.detail });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: any) => api.put(`/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("Usuario actualizado exitosamente");
            setShowModal(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error("Error al actualizar usuario", { description: err.response?.data?.detail });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("Usuario eliminado permanentemente");
            setShowDeleteModal(false);
            setUserToDelete(null);
        },
        onError: (err: any) => {
            toast.error("Error al eliminar usuario", { description: err.response?.data?.detail });
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }: any) => api.put(`/users/${id}`, { is_active }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            const user = response.data;
            toast.success(user.is_active ? "Usuario activado" : "Usuario desactivado");
        },
        onError: (err: any) => {
            toast.error("Error al cambiar estado", { description: err.response?.data?.detail });
        }
    });

    const resetForm = () => {
        setFormData({ username: "", email: "", password: "", role: "worker", is_active: true });
        setEditingUser(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            const dataToUpdate: any = { ...formData };
            if (!dataToUpdate.password) delete dataToUpdate.password; // Don't send empty password
            updateMutation.mutate({ id: editingUser.id, data: dataToUpdate });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            password: "", // Password is never retrieved
            role: user.role,
            is_active: user.is_active
        });
        setShowModal(true);
    };

    const confirmDelete = (user: any) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    // Removed filteredUsers logic as it's now server-side

    return (
        <div className="space-y-6">
            {/* ... Header ... */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios y Permisos</h2>
                    <p className="text-gray-500 dark:text-gray-400">Gestiona el acceso al sistema.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(false); /* Fix: ensure modal state is correct */ setShowModal(true); }}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 shadow-md transition-all hover:shadow-indigo-500/20"
                >
                    <Plus className="h-5 w-5" />
                    Nuevo Usuario
                </button>
            </div>

            {/* Search and Filters */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar usuario por nombre o email..."
                    value={search}
                    onChange={handleSearch}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
            </div>

            {/* Users List */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Usuario</th>
                                <th className="px-6 py-4 font-medium">Rol</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : users?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                users?.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                                                    {user.username.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                : user.role === 'inventory_manager'
                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                    : user.role === 'delivery'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                                                {user.role === 'admin' ? 'Administrador' :
                                                    user.role === 'inventory_manager' ? 'Gerente Inv.' :
                                                        user.role === 'delivery' ? 'Repartidor' : 'Cajero'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {user.is_active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                {user.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="cursor-pointer p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>

                                                {/* Enable/Disable Button */}
                                                <button
                                                    onClick={() => toggleStatusMutation.mutate({ id: user.id, is_active: !user.is_active })}
                                                    className={`cursor-pointer p-2 rounded-lg transition-colors ${user.is_active
                                                        ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
                                                        : "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                                                        }`}
                                                    title={user.is_active ? "Desactivar" : "Activar"}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </button>

                                                {/* Hard Delete Button */}
                                                <button
                                                    onClick={() => confirmDelete(user)}
                                                    className="cursor-pointer p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                                    title="Eliminar permanentemente"
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
            <Pagination
                page={page}
                hasNextPage={users?.length === limit}
                onPageChange={setPage}
                isLoading={isPlaceholderData}
            />

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            {editingUser ? <Edit2 className="h-5 w-5 text-indigo-600" /> : <UserPlus className="h-5 w-5 text-indigo-600" />}
                            {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Usuario *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="ej. jdoe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="ej. john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                    Password {editingUser && <span className="text-xs text-gray-500 font-normal">(Dejar en blanco para mantener actual)</span>}
                                    {!editingUser && "*"}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Rol *</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="worker">Cajero (Worker)</option>
                                        <option value="admin">Administrador</option>
                                        <option value="inventory_manager">Gerente de Inventario</option>
                                        <option value="delivery">Repartidor</option>
                                    </select>
                                </div>

                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuario Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 rounded-xl bg-gray-100 py-2.5 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
                    <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 dark:bg-red-900/30 dark:text-red-400">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">¿Eliminar usuario?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Estás a punto de eliminar permanentemente a <strong>{userToDelete.username}</strong>. Esta acción no se puede deshacer.
                            </p>

                            <div className="flex gap-2 w-full">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 rounded-xl bg-gray-100 py-2.5 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => deleteMutation.mutate(userToDelete.id)}
                                    disabled={deleteMutation.isPending}
                                    className="flex-1 rounded-xl bg-red-600 py-2.5 font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function UserPlus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" x2="19" y1="8" y2="14" />
            <line x1="22" x2="16" y1="11" y2="11" />
        </svg>
    )
}
