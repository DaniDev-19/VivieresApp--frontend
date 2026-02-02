"use client";

import { Modal } from "@/components/ui/Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
    isLoading = false
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="flex flex-col items-center text-center p-4">
                <div className={`p-3 rounded-full mb-4 ${variant === "danger" ? "bg-red-100 text-red-600" :
                        variant === "warning" ? "bg-yellow-100 text-yellow-600" :
                            "bg-blue-100 text-blue-600"
                    }`}>
                    <AlertTriangle className="w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-500 text-sm mb-6">{description}</p>

                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${variant === "danger" ? "bg-red-600 hover:bg-red-700" :
                                "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                    >
                        {isLoading ? "Procesando..." : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
