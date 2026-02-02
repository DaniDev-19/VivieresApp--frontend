"use client";

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Download, QrCode, Percent, Users } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {

    const downloadQrMutation = useMutation({
        mutationFn: async () => {
            // In production, use window.location.origin instead of hardcoded localhost if needed
            const origin = typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000";
            const catalogUrl = `${origin}/`;

            const res = await api.get(`/reports/qr-pdf?url=${encodeURIComponent(catalogUrl)}&name=ViveresApp&phone=04141234567`, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Ficha_QR_Tienda.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h2>
                <p className="text-gray-500">Ajustes generales del sistema.</p>
            </div>

            <div className="grid gap-6">
                {/* Tools Section */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-indigo-600" />
                        Herramientas de Marketing
                    </h3>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">Ficha QR de la Tienda</p>
                            <p className="text-sm text-gray-500">Descarga un PDF listo para imprimir con el código QR de tu catálogo.</p>
                        </div>
                        <button
                            onClick={() => downloadQrMutation.mutate()}
                            disabled={downloadQrMutation.isPending}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            {downloadQrMutation.isPending ? "Generando..." : "Descargar PDF"}
                        </button>
                    </div>
                </div>

                {/* Tax Configuration */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Percent className="h-5 w-5 text-indigo-600" />
                        Configuración de Impuestos (IVA)
                    </h3>

                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-xl dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                            <p className="text-sm text-blue-900 dark:text-blue-300 mb-2">
                                <strong>¿Cómo funciona el IVA en el sistema?</strong>
                            </p>
                            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                                <li>Cada producto tiene su propio <strong>tax_rate</strong> (tasa de impuesto)</li>
                                <li>Por defecto, todos los productos nuevos tienen <strong>16% de IVA</strong></li>
                                <li>Puedes editar el IVA de cada producto individualmente en el módulo de Inventario</li>
                                <li>El IVA se calcula automáticamente al momento de la venta</li>
                                <li>El total de la venta incluye: Subtotal + IVA</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">IVA Predeterminado</p>
                                    <p className="text-sm text-gray-500">Se aplica a productos nuevos</p>
                                </div>
                                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                    16%
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                💡 <strong>Tip:</strong> Si necesitas cambiar el IVA de un producto específico, ve a <strong>Inventario → Editar Producto</strong> y ajusta el campo "Tax Rate".
                            </p>
                        </div>
                    </div>
                </div>

                {/* Future settings placeholders */}
                {/* Users Management Link */}
                <Link href="/users" className="block">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 group cursor-pointer">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
                            <Users className="h-5 w-5 text-indigo-600" />
                            Usuarios y Permisos
                        </h3>
                        <p className="text-sm text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                            Gestión de roles de cajeros y administradores.
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
