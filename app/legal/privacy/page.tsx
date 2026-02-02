"use client";

import React from "react";
import { ShoppingBag, Lock, ShieldCheck, EyeOff } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="bg-purple-600 rounded-2xl p-3 shadow-lg shadow-purple-500/30">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Política de Privacidad
                        </h1>
                    </div>

                    <div className="space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Recolección de Información</h2>
                            <p>
                                Recopilamos información necesaria para procesar sus pedidos y mejorar su experiencia, incluyendo
                                su nombre, contacto y preferencias de compra.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Uso de Datos</h2>
                            <p>
                                Sus datos se utilizan exclusivamente para:
                            </p>
                            <ul className="list-disc pl-6 mt-2 space-y-2">
                                <li>Gestionar sus órdenes de compra.</li>
                                <li>Comunicarle actualizaciones sobre su pedido.</li>
                                <li>Mejorar nuestros servicios y ofertas.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Seguridad</h2>
                            <p>
                                Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal
                                contra acceso no autorizado, alteración o divulgación.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Cookies</h2>
                            <p>
                                Utilizamos cookies técnicas para mantener su sesión activa y recordar los artículos en su carrito de compras.
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-10 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-2 transition-colors">
                            <ShoppingBag className="w-5 h-5" />
                            Volver a la Tienda
                        </Link>
                        <p className="text-sm text-gray-400">
                            Última actualización: Diciembre 2025
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
