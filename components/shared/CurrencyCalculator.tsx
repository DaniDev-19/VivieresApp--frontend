"use client";

import { useState } from "react";
import { Calculator, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function CurrencyCalculator() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [amount, setAmount] = useState<string>("1");
    const [currency, setCurrency] = useState<"USD" | "VES">("USD");
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    // Fetch Rates
    const { data: rates } = useQuery({
        queryKey: ["rates"],
        queryFn: async () => (await api.get("/rates/")).data
    });

    const bcvRate = rates?.find((r: { currency: string; rate: number }) => r.currency === "BCV")?.rate || 0;
    const usdtRate = rates?.find((r: { currency: string; rate: number }) => r.currency === "USDT")?.rate || 0;

    const calculate = () => {
        const val = parseFloat(amount) || 0;
        if (currency === "USD") {
            return {
                bs: (val * bcvRate).toFixed(2),
                usdt: val.toFixed(2)
            };
        } else {
            return {
                usd: (val / bcvRate).toFixed(2),
                usdt: (val / bcvRate).toFixed(2) // Approximate
            };
        }
    };

    const result = calculate();

    return (
        <>
            <motion.button
                drag
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(e, info) => {
                    setIsDragging(false);
                    setPosition({ x: info.offset.x, y: info.offset.y });
                }}
                onClick={() => !isDragging && setIsOpen(true)}
                className="fixed bottom-24 right-4 z-40 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors cursor-move"
                title="Calculadora de Divisas (Arrastra para mover)"
                style={{ x: position.x, y: position.y }}
            >
                <Calculator className="h-6 w-6" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-40 right-4 z-50 w-72 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white">Conversor</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-xs font-medium text-gray-500">Monto</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full rounded-lg bg-gray-50 p-2 text-lg font-bold outline-none ring-1 ring-gray-200 focus:ring-indigo-500 dark:bg-gray-800 dark:ring-gray-700"
                                    />
                                    <button
                                        onClick={() => setCurrency(c => c === "USD" ? "VES" : "USD")}
                                        className="flex w-16 items-center justify-center rounded-lg bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                    >
                                        {currency}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50 space-y-2">
                                {currency === "USD" ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Bolívares (BCV)</span>
                                            <span className="font-bold text-gray-900 dark:text-white">Bs. {result.bs}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Dólares (BCV)</span>
                                            <span className="font-bold text-gray-900 dark:text-white">$ {result.usd}</span>
                                        </div>
                                    </>
                                )}
                                <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Tasa BCV:</span>
                                        <span className="font-mono text-gray-600 dark:text-gray-300">Bs. {bcvRate}</span>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-gray-400">Tasa USDT:</span>
                                        <span className="font-mono text-gray-600 dark:text-gray-300">Bs. {usdtRate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
