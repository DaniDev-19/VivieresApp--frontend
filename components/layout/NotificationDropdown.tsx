"use client";

import React from "react";
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

const iconMap: Record<string, any> = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    danger: XCircle,
};

const colorMap: Record<string, string> = {
    info: "text-blue-500 bg-blue-50",
    warning: "text-orange-500 bg-orange-50",
    success: "text-green-500 bg-green-50",
    danger: "text-red-500 bg-red-50",
};

export function NotificationDropdown() {
    const queryClient = useQueryClient();

    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications"],
        queryFn: async () => (await api.get("/notifications/")).data,
        refetchInterval: 10000,
    });

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ["notifications-unread-count"],
        queryFn: async () => (await api.get("/notifications/unread-count")).data,
        refetchInterval: 10000,
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: number) => api.put(`/notifications/${id}`, { is_read: true }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => api.post("/notifications/mark-all-read"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        },
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-all">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-950 animate-pulse">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-gray-100 dark:border-gray-800">
                <DropdownMenuLabel className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/50">
                    <span className="font-bold">Notificaciones</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => markAllReadMutation.mutate()}
                        >
                            Marcar todas como leídas
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Bell className="h-12 w-12 mb-2 opacity-20" />
                            <p className="text-sm">Sin notificaciones</p>
                        </div>
                    ) : (
                        notifications.map((notif: any) => {
                            const Icon = iconMap[notif.type] || Info;
                            return (
                                <DropdownMenuItem
                                    key={notif.id}
                                    className={`flex p-4 gap-3 cursor-pointer transition-colors ${!notif.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                                    onSelect={() => !notif.is_read && markReadMutation.mutate(notif.id)}
                                >
                                    <div className={`p-2 rounded-lg shrink-0 ${colorMap[notif.type] || "text-gray-500 bg-gray-50"}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm ${!notif.is_read ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-gray-100`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {notif.message}
                                        </p>
                                    </div>
                                    {!notif.is_read && (
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <div className="p-2 bg-gray-50/50 dark:bg-gray-900/50">
                    <Link href="/notifications" className="w-full">
                        <Button variant="ghost" className="w-full text-xs text-gray-500 hover:text-gray-700">
                            Ver todas las notificaciones
                        </Button>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
