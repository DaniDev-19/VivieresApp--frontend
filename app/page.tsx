"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Search, ShoppingCart, Star } from "lucide-react";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { usePublicStore } from "@/store/publicStore";
import { motion } from "framer-motion";
import { CheckoutModal } from "@/components/public/CheckoutModal";
import { ContactSection } from "@/components/public/ContactSection";
import { PublicFooter } from "@/components/public/PublicFooter";
import { InfiniteMarquee } from "@/components/shared/InfiniteMarquee";
import { Product, Rate } from "@/types";

export default function RootPage() {
    const [search, setSearch] = useState("");
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Store
    const cart = usePublicStore(state => state.cart);
    const addToCart = usePublicStore(state => state.addToCart);
    const totalItems = usePublicStore(state => state.totalItems());

    const limit = 15;

    // Fetch Products with Pagination
    const {
        data: infiniteData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["public-products", search],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get("/products/public", {
                params: {
                    skip: pageParam,
                    limit: limit,
                    search: search || undefined
                }
            });
            return res.data as Product[];
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === limit ? allPages.length * limit : undefined;
        }
    });

    const products = infiniteData?.pages.flat() || [];

    // Fetch Rates
    const { data: rates } = useQuery({
        queryKey: ["rates"],
        queryFn: async () => (await api.get("/rates/")).data
    });
    const bcvRate = (rates as Rate[])?.find(r => r.currency === "BCV")?.rate || 0;

    // Ya que usamos el filtrado del backend, no necesitamos filtrar de nuevo aquí
    // pero mantenemos la referencia para el resto del código
    const filteredProducts = products;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
            {/* Header / Hero */}
            <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo3.jpeg" alt={`${process.env.NEXT_PUBLIC_BUSINESS_NAME || "ViveresApp"} Logo`} className="w-12 h-12 object-contain rounded-full shadow-md border-2 border-indigo-100 dark:border-indigo-900" />
                        <span className="text-lg font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {process.env.NEXT_PUBLIC_BUSINESS_NAME || "ViveresApp"}
                        </span>
                    </div>

                    <div className="relative hidden md:block w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500"
                            placeholder="Buscar productos..."
                        />
                    </div>

                    <button
                        onClick={() => setIsCheckoutOpen(true)}
                        className="relative p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800 transition-colors"
                    >
                        <ShoppingCart className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                {totalItems}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Banner */}
            <div className="bg-indigo-900 text-white text-xs py-2 text-center">
                🛍️ ¡Hacemos delivery en zonas céntricas! • Tasa BCV: Bs. {bcvRate ?? 0}
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 h-64 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                            {filteredProducts?.map((product) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    key={product.id}
                                    className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                                        {product.image_url ? (
                                            <img src={getImageUrl(product.image_url)!} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <ShoppingCart className="w-12 h-12 text-gray-200" />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{product.name}</h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                    {formatCurrency(product.price_usd ?? 0)}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    Bs. {((product.price_usd ?? 0) * (bcvRate ?? 0)).toFixed(2)}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => addToCart(product)}
                                                className="bg-gray-900 text-white p-2 rounded-xl hover:bg-indigo-600 transition-colors dark:bg-white dark:text-black shadow-lg"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {hasNextPage && (
                            <div className="flex justify-center pt-4">
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isFetchingNextPage ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                            Cargando...
                                        </>
                                    ) : (
                                        "Cargar más productos"
                                    )}
                                </button>
                            </div>
                        )}

                        {!hasNextPage && filteredProducts && filteredProducts.length > 0 && (
                            <p className="text-center text-gray-400 text-sm">
                                Has llegado al final del catálogo
                            </p>
                        )}

                        {filteredProducts && filteredProducts.length === 0 && !isLoading && (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No se encontraron productos que coincidan con tu búsqueda.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-900 py-12 border-y border-gray-100 dark:border-gray-800">
                <div className="container mx-auto px-4 mb-6 text-center">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Métodos de Pago Aceptados</h3>
                </div>
                <InfiniteMarquee
                    speed={30}
                    items={[
                        <div key="binance" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
                            <div className="w-8 h-8 bg-[#FCD535] rounded-lg flex items-center justify-center text-black font-extrabold text-lg italic shadow-sm">
                                B
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">Binance Pay</span>
                        </div>,
                        <div key="cashea" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-extrabold text-lg italic shadow-sm">
                                C
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">Cashea</span>
                        </div>,
                        <div key="zinli" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
                            <div className="w-8 h-8 bg-[#6B31F7] rounded-lg flex items-center justify-center text-white font-extrabold text-lg italic shadow-sm">
                                Z
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">Zinli</span>
                        </div>,
                        <div key="bdv" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
                            <div className="w-8 h-8 bg-[#EB1C24] rounded-lg flex items-center justify-center text-white font-extrabold text-[10px] tracking-tighter shadow-sm">
                                BDV
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">Banco de Venezuela</span>
                        </div>,
                        <div key="pagomovil" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
                            <div className="w-8 h-8 bg-[#F68B1E] rounded-lg flex items-center justify-center text-black font-extrabold text-[15px] tracking-tighter italic shadow-sm">
                                PM
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">Pago Móvil</span>
                        </div>,
                        <div key="puntodeventa" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
                            <div className="w-8 h-8 bg-[#51a836] rounded-lg flex items-center justify-center text-black font-extrabold text-[13px] tracking-tighter italic shadow-sm">
                                PVT
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">Punto de Venta</span>
                        </div>,
                        <div key="biopago" className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
                            <div className="w-8 h-8 bg-[#f75959] rounded-lg flex items-center justify-center text-black font-extrabold text-[13px] tracking-tighter italic shadow-sm">
                                BP
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">Biopago</span>
                        </div>,
                    ]}
                />
            </div>

            <ContactSection />
            <PublicFooter />

            <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} bcvRate={bcvRate} />
        </div>
    );
}
