"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, Info, AlertTriangle, CheckCircle, XCircle, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    danger: XCircle,
};

const colorMap: Record<string, string> = {
    info: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    warning: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    success: "text-green-600 bg-green-100 dark:bg-green-900/30",
    danger: "text-red-600 bg-red-100 dark:bg-red-900/30",
};

export default function NotificationsPage() {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["notifications-full"],
        queryFn: async () => (await api.get("/notifications/?limit=100")).data,
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: number) => api.put(`/notifications/${id}`, { is_read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications-full"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => api.post("/notifications/mark-all-read"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications-full"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
            toast.success("Todas las notificaciones marcadas como leídas");
        },
    });

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        Historial de Notificaciones
                    </h2>
                    <p className="text-gray-500">Consulta todas las alertas y eventos del sistema.</p>
                </div>
                {notifications.some((n: any) => !n.is_read) && (
                    <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Check className="w-4 h-4" /> Marcar todas como leídas
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-20 text-center text-gray-500">Cargando historial...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 space-y-4">
                        <Bell className="w-16 h-16 mx-auto opacity-10" />
                        <p className="text-xl font-medium">No tienes notificaciones aún</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {notifications.map((notif: any) => {
                            const Icon = iconMap[notif.type] || Info;
                            return (
                                <div
                                    key={notif.id}
                                    className={`p-6 flex gap-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/20 ${!notif.is_read ? 'bg-indigo-50/20 dark:bg-indigo-900/5' : ''}`}
                                >
                                    <div className={`p-3 rounded-2xl shrink-0 h-fit ${colorMap[notif.type] || "text-gray-500 bg-gray-50"}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                            <h4 className={`text-lg ${!notif.is_read ? 'font-black' : 'font-bold'} text-gray-900 dark:text-white`}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Bell className="w-3 h-3" />
                                                {format(new Date(notif.created_at), "eeee, d 'de' MMMM HH:mm", { locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {notif.message}
                                        </p>
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => markReadMutation.mutate(notif.id)}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-tighter"
                                            >
                                                Marcar como leída
                                            </button>
                                        )}
                                    </div>
                                    {!notif.is_read && (
                                        <div className="h-3 w-3 rounded-full bg-indigo-500 shrink-0 mt-2 shadow-lg shadow-indigo-500/50" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
