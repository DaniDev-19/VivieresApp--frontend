"use client";

import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Download, QrCode, Percent, Users, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {

    const downloadQrMutation = useMutation({
        mutationFn: async () => {
            const origin = typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000";
            const catalogUrl = `${origin}/`;

            const res = await api.get(`/reports/qr-pdf?url=${encodeURIComponent(catalogUrl)}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        }
    });

    const downloadPagoMovilMutation = useMutation({
        mutationFn: async () => {
            const res = await api.get(`/reports/payment-qr/pago-movil`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        }
    });

    const downloadDigitalPaymentsMutation = useMutation({
        mutationFn: async () => {
            const res = await api.get(`/reports/payment-qr/digital`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-indigo-600" />
                        Códigos QR de la Tienda y Pagos
                    </h3>

                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Catalog QR */}
                        <div className="flex flex-col justify-between p-5 bg-gray-55 rounded-2xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-base">Ficha QR de la Tienda</p>
                                <p className="text-sm mt-1 mb-4 text-gray-500">Genera un PDF listo para imprimir con el código QR de tu catálogo digital.</p>
                            </div>
                            <button
                                onClick={() => downloadQrMutation.mutate()}
                                disabled={downloadQrMutation.isPending}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {downloadQrMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                {downloadQrMutation.isPending ? "Generando..." : "Ver Catálogo QR"}
                            </button>
                        </div>

                        {/* Pago Móvil QR */}
                        <div className="flex flex-col justify-between p-5 bg-gray-55 rounded-2xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-base">Ficha QR de Pago Móvil</p>
                                <p className="text-sm mt-1 mb-4 text-gray-500">Genera un PDF con el código QR de tu cuenta para recibir pagos móviles.</p>
                            </div>
                            <button
                                onClick={() => downloadPagoMovilMutation.mutate()}
                                disabled={downloadPagoMovilMutation.isPending}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {downloadPagoMovilMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                {downloadPagoMovilMutation.isPending ? "Generando..." : "Ver Pago Móvil QR"}
                            </button>
                        </div>

                        {/* Digital Payments QR */}
                        <div className="flex flex-col justify-between p-5 bg-gray-55 rounded-2xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-base">Monedas Digitales</p>
                                <p className="text-sm mt-1 mb-4 text-gray-500">Genera un PDF listo para imprimir con los códigos QR de PayPal, Binance Pay, Zinli y Airtm.</p>
                            </div>
                            <button
                                onClick={() => downloadDigitalPaymentsMutation.mutate()}
                                disabled={downloadDigitalPaymentsMutation.isPending}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {downloadDigitalPaymentsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                {downloadDigitalPaymentsMutation.isPending ? "Generando..." : "Ver Pagos Digitales"}
                            </button>
                        </div>
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
                                <li>Cada producto tiene su propio tipo de impuesto</li>
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
                                💡 <strong>Tip:</strong> Si necesitas cambiar el IVA de un producto específico, ve a <strong>Inventario → Editar Producto</strong> y ajusta el campo correspondiente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Formulas Guide Section */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Percent className="h-5 w-5 text-indigo-600" />
                        Guía de Fórmulas Financieras
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">Utiliza estas fórmulas de referencia para realizar cálculos manuales rápidos y verificar tus márgenes de negocio.</p>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {/* Formula 1 */}
                        <div className="p-4 bg-gray-50 rounded-2xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">Conversión a Bolívares (VES)</p>
                            <div className="flex flex-wrap items-center gap-1.5 py-1">
                                <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold font-mono">Monto en USD</span>
                                <span className="text-gray-400 font-bold">×</span>
                                <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold font-mono">Tasa del Día</span>
                                <span className="text-gray-400 font-bold">=</span>
                                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold font-mono">Monto en VES</span>
                            </div>
                            <p className="text-xs text-gray-505 text-gray-500 leading-relaxed">
                                Convierte los montos en dólares a moneda nacional multiplicando el total por la tasa registrada (BCV o Paralelo/USDT).
                            </p>
                        </div>

                        {/* Formula 2 */}
                        <div className="p-4 bg-gray-50 rounded-2xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">Ganancia Neta por Venta</p>
                            <div className="flex flex-wrap items-center gap-1.5 py-1">
                                <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold font-mono">Precio de Venta</span>
                                <span className="text-gray-400 font-bold">−</span>
                                <span className="px-2 py-1 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold font-mono">Costo del Producto</span>
                                <span className="text-gray-400 font-bold">=</span>
                                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold font-mono">Ganancia USD</span>
                            </div>
                            <p className="text-xs text-gray-505 text-gray-500 leading-relaxed">
                                Representa el beneficio neto restando el costo de adquisición original del producto de su precio de venta al público.
                            </p>
                        </div>

                        {/* Formula 3 */}
                        <div className="p-4 bg-gray-50 rounded-2xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">Cálculo de Impuestos (IVA)</p>
                            <div className="flex flex-wrap items-center gap-1.5 py-1">
                                <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold font-mono">Subtotal</span>
                                <span className="text-gray-400 font-bold">×</span>
                                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold font-mono">(1 + % IVA)</span>
                                <span className="text-gray-400 font-bold">=</span>
                                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold font-mono">Precio Final</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Determina el precio de venta final sumando el porcentaje correspondiente al Impuesto al Valor Agregado configurado.
                            </p>
                        </div>

                        {/* Formula 4 */}
                        <div className="p-4 bg-gray-50 rounded-2xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-3">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">Margen de Utilidad Comercial</p>
                            <div className="flex flex-wrap items-center gap-1.5 py-1">
                                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold font-mono">Ganancia</span>
                                <span className="text-gray-400 font-bold">÷</span>
                                <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold font-mono">Precio Venta</span>
                                <span className="text-gray-400 font-bold">× 100</span>
                                <span className="text-gray-400 font-bold">=</span>
                                <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold font-mono">Margen %</span>
                            </div>
                            <p className="text-xs text-gray-505 text-gray-500 leading-relaxed">
                                Indica qué porcentaje del precio final de venta representa ganancia pura. Útil para medir rentabilidad comercial.
                            </p>
                        </div>
                    </div>
                </div>

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
