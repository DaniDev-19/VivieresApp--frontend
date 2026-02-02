"use client";

import React from "react";
import { ShoppingBag, ShieldCheck, FileText, Lock } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="bg-indigo-600 rounded-2xl p-3 shadow-lg shadow-indigo-500/30">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            Términos y Condiciones
                        </h1>
                    </div>

                    <div className="space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Aceptación de los Términos</h2>
                            <p>
                                Al acceder y utilizar MiTienda Online (ViveresApp), usted acepta estar sujeto a estos términos y condiciones.
                                Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Uso del Servicio</h2>
                            <p>
                                ViveresApp proporciona una plataforma para la gestión de ventas y visualización de productos.
                                El usuario se compromete a proporcionar información veraz y mantener la seguridad de su cuenta.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. Precios y Pagos</h2>
                            <p>
                                Los precios se muestran en USD y pueden visualizarse en moneda local según la tasa del día (BCV/USDT).
                                MiTienda Online se reserva el derecho de modificar los precios en cualquier momento sin previo aviso.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Propiedad Intelectual</h2>
                            <p>
                                Todo el contenido presente en esta aplicación, incluyendo logos, diseños, textos y software, es propiedad de
                                ViveresApp o sus licenciantes (DaniDev & BatyCode) y está protegido por leyes de propiedad intelectual.
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
