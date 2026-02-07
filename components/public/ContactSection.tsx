"use client";

import React from "react";
import {
    MessageCircle,
    Instagram,
    Twitter,
    Mail,
    MapPin,
    Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { formatWhatsAppLink } from "@/lib/utils";

const socialLinks = [
    {
        name: "WhatsApp",
        icon: (props: React.SVGProps<SVGSVGElement>) => (
            <svg {...props} viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
        ),
        href: formatWhatsAppLink(process.env.NEXT_PUBLIC_BUSINESS_PHONE || "584120000000", "Hola, me gustaría obtener más información sobre sus productos."),
        color: "bg-[#25D366]",
        label: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+58 412-0000000",
    },
    // {
    //     name: "Instagram",
    //     icon: Instagram,
    //     href: "https://instagram.com/mitienda",
    //     color: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600",
    //     label: process.env.NEXT_PUBLIC_BUSINESS_IG || "@mitienda",
    // },
    // {
    //     name: "TikTok",
    //     icon: (props: React.SVGProps<SVGSVGElement>) => (
    //         <svg {...props} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    //             <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13 3.44-.3 6.88-.45 10.32-.06 1.58-.67 3.22-1.92 4.26-1.5 1.25-3.62 1.6-5.51 1.11-2-.48-3.75-1.96-4.51-3.86-.77-1.97-.47-4.32.78-6.13 1.22-1.78 3.42-2.73 5.56-2.48.01 1.45.01 2.91.02 4.36-.93-.25-1.98-.12-2.77.49-.6.46-.94 1.2-.95 1.95.01 1.25 1.17 2.29 2.41 2.1 1.29-.16 2.19-1.41 2.12-2.65-.02-4-.05-8-.07-12 .24-.01.48-.02.72-.03z" />
    //         </svg>
    //     ),
    //     href: "https://tiktok.com/@mitienda",
    //     color: "bg-black",
    //     label: "@mitienda_tiktok",
    // },
    // {
    //     name: "X (Twitter)",
    //     icon: (props: React.SVGProps<SVGSVGElement>) => (
    //         <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    //             <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
    //         </svg>
    //     ),
    //     href: "https://x.com/mitienda",
    //     color: "bg-black",
    //     label: "@mitienda_vzla",
    // },
    // {
    //     name: "Correo",
    //     icon: Mail,
    //     href: "mailto:contacto@viveresapp.com",
    //     color: "bg-indigo-600",
    //     label: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "ventas@mitienda.com",
    // },
];

export function ContactSection() {
    return (
        <section className="bg-white dark:bg-gray-900 py-16 md:py-24 border-t border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Contact Info */}
                    <div className="w-full lg:w-1/2 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
                                Contáctanos
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md">
                                Estamos aquí para atenderte. Escríbenos por cualquiera de nuestros canales oficiales.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {socialLinks.map((link) => (
                                <motion.a
                                    key={link.name}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-all group"
                                >
                                    <div className={`p-3 rounded-xl text-white ${link.color} shadow-sm group-hover:shadow-md transition-shadow`}>
                                        <link.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            {link.name}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            {link.label}
                                        </span>
                                    </div>
                                </motion.a>
                            ))}
                        </div>

                        <div className="space-y-4 p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Ubicación Física</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Ubicación de la tienda"}<br />
                                        Venezuela.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Horario de Atención</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Lunes a Sábado: 7:00 AM - 9:00 PM <br />
                                        Domingos: 8:00 AM - 8:00 PM
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Integration */}
                    <div className="w-full lg:w-1/2">
                        <div className="relative aspect-square md:aspect-video lg:aspect-auto lg:h-full min-h-[350px] md:min-h-[400px] lg:min-h-[500px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-800 ring-1 ring-gray-100 dark:ring-gray-800">
                            {/* Mapa de Google Maps - Responsivo */}
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d3922.0117771239097!2d-71.6229949!3d10.5782509!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTDCsDM0JzQxLjciTiA3McKwMzcnMjIuOCJX!5e0!3m2!1ses!2sve!4v1766962895880!5m2!1ses!2sve"
                                width="100%"
                                height="100%"
                                style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                title="Ubicación de la tienda"
                                className="w-full h-full"
                            ></iframe>
                            <div className="absolute top-4 left-4 z-10">
                                <span className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-indigo-600 shadow-xl border border-indigo-50">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    ¡Abierto ahora mismo!
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
