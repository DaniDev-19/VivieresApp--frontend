"use client";

import { useState } from "react";
import { Package, Truck, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProvidersList } from "@/components/purchases/ProvidersList";
import { OrdersList } from "@/components/purchases/OrdersList";

type Tab = "orders" | "providers";

export default function PurchasesPage() {
    const [activeTab, setActiveTab] = useState<Tab>("orders");

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="h-6 w-6 text-indigo-600" />
                        Compras y Proveedores
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Gestiona tus pedidos de reposición
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-4 rounded-xl bg-blue-900/5 p-1 dark:bg-gray-800/50 w-fit">
                <button
                    onClick={() => setActiveTab("orders")}
                    className={`
                        relative rounded-lg px-3 py-1.5 text-sm font-medium outline-2 outline-sky-400 transition focus-visible:outline-2
                        ${activeTab === "orders" ?
                            "text-indigo-700 dark:text-indigo-300" :
                            "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }
                    `}
                >
                    {activeTab === "orders" && (
                        <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 bg-white shadow-sm dark:bg-gray-700 rounded-lg"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Pedidos
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("providers")}
                    className={`
                        relative rounded-lg px-3 py-1.5 text-sm font-medium outline-2 outline-sky-400 transition focus-visible:outline-2
                        ${activeTab === "providers" ?
                            "text-indigo-700 dark:text-indigo-300" :
                            "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }
                    `}
                >
                    {activeTab === "providers" && (
                        <motion.div
                            layoutId="active-pill"
                            className="absolute inset-0 bg-white shadow-sm dark:bg-gray-700 rounded-lg"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Proveedores
                    </span>
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {activeTab === "orders" ? (
                        <motion.div
                            key="orders"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <OrdersList />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="providers"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ProvidersList />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
