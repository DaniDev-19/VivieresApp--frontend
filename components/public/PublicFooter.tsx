"use client";

import React from "react";
import {
    Github,
    Linkedin,
    Instagram,
    Globe,
    ShoppingBag,
    Cpu,
    Heart,
    Coins
} from "lucide-react";
import Link from "next/link";
import { InfiniteMarquee } from "../shared/InfiniteMarquee";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PublicFooter() {
    const currentYear = new Date().getFullYear();

    const teamItems = [
        <span key="1" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">DaniDev</span>,
        <span key="2" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">BatyCode Software Services</span>,
        <span key="3" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">Web Development</span>,
        <span key="4" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">UI/UX Solutions</span>,
        <span key="5" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">Software a Medida</span>,
        <span key="6" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">E-commerce Experts</span>,
        <span key="7" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">Mobile First Design</span>,
        <span key="8" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">Innovación Digital</span>,
        <span key="9" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">Automatización</span>,
        <span key="10" className="text-gray-400 font-medium text-xs tracking-[0.2em] uppercase">Soporte 24/7</span>,
    ];

    return (
        <footer className="bg-gray-50 dark:bg-gray-950 pt-20 pb-10 border-t border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Viveres App Logo" className="w-16 h-16 object-contain rounded-full shadow-xl border-2 border-indigo-100 dark:border-indigo-900" />
                            <span className="text-xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Viveres App
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            ViveresApp es la solución tecnológica integral para bodegas y ventas de víveres.
                            Modernizando el comercio local con eficiencia y estilo.
                        </p>
                    </div>

                    {/* Developers - DaniDev */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                            Desarrollado por
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 group">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg border-2 border-indigo-100 dark:border-indigo-900 group-hover:scale-110 transition-transform duration-300">
                                    <img src="/danidev.png" alt="DaniDev Logo" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <span className="block text-sm font-bold text-gray-900 dark:text-white">DaniDev</span>
                                    <span className="text-[10px] text-gray-400 uppercase">Software Developer</span>
                                </div>
                            </div>
                            <div className="flex gap-4 pl-1">
                                <a href="https://github.com/JDPR19" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <Github className="w-4 h-4" />
                                </a>
                                <a href="https://linkedin.com/in/jesus-daniel-perdomo-b15578261" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600 transition-colors">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                                <a href="https://danidev.me" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-600 transition-colors">
                                    <Globe className="w-4 h-4" />
                                </a>
                                <a href="https://www.instagram.com/jdbaddev/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            </div>

                            {/* Support Button */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 gap-2">
                                        <Coins className="w-3 h-3" />
                                        Apóyame a seguir
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-red-500 fill-current" />
                                            Apoyar el trabajo de DaniDev
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Tu apoyo me ayuda a seguir creando software de calidad y mantener estos proyectos libres.
                                        </p>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Binance (Pay ID)</span>
                                                <code className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">123456789</code>
                                            </div>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                                                <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Zinli (Email)</span>
                                                <code className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">danidev@gmail.com</code>
                                            </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Partners - BatyCode */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                            Digital Design
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                                    <Heart className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-sm font-bold text-gray-900 dark:text-white">BatyCode</span>
                                    <span className="text-[10px] text-gray-400 uppercase">Diseño Digital y Software a Medida</span>
                                </div>
                            </div>
                            <div className="flex gap-4 pl-1">
                                <a href="https://www.instagram.com/byticode/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
                            Legal
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/legal/terms" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Términos y Condiciones</Link>
                            </li>
                            <li>
                                <Link href="/legal/privacy" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">Política de Privacidad</Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Team/Branding Marquee */}
                <div className="py-8 border-y border-gray-200/50 dark:border-gray-800/50 mb-10 opacity-60">
                    <InfiniteMarquee
                        items={teamItems}
                        speed={60}
                        direction="right"
                    />
                </div>

                {/* Bottom Bar Comp */}
                <div className="pt-10 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-gray-400 text-center md:text-left">
                        © {currentYear} ViveresApp. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-full border border-indigo-100/50 dark:border-indigo-900/20">
                        <span className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase">Hecho con</span>
                        <Heart className="w-3 h-3 text-red-500 fill-current animate-pulse" />
                        <span className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase">en Venezuela</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
