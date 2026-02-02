"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useSalesStore, ExchangeRates } from "@/store/salesStore";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import {
    Search,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Loader2,
    ScanBarcode,
    ImageIcon,
    UserPlus,
    User,
    Truck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { SaleTicket } from "@/components/sales/SaleTicket";

export default function POSPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        cart, addToCart, removeFromCart, updateQuantity, updateItemBasis, clearCart,
        totalUSD, totalTax, totalConverted, totalItems,
        rates, setRates, displayCurrency, setDisplayCurrency
    } = useSalesStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedSale, setCompletedSale] = useState<any>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [customerForm, setCustomerForm] = useState({ cedula: "", name: "", phone: "" });
    const [hasDelivery, setHasDelivery] = useState(false);
    const [deliveryAmount, setDeliveryAmount] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);


    const { data: customers } = useQuery({
        queryKey: ["customers"],
        queryFn: async () => {
            const { data } = await api.get("/customers");
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });


    const { data: latestRates, refetch: refreshRates, isRefetching: isRefreshingRates } = useQuery({
        queryKey: ["latest-rates"],
        queryFn: async () => {
            const { data } = await api.get("/rates/");

            const ratesObj: any = {};
            data.forEach((r: any) => { ratesObj[r.currency] = r.rate; });
            setRates(ratesObj);
            setLastUpdated(new Date());
            // Toast removed from here to avoid alerts on auto-refetch
            return ratesObj;
        },
        enabled: true,
        refetchOnWindowFocus: false // Disabling auto-refetch on window focus to prevent unexpected updates
    });

    // ... (code continues) ...

    <button
        onClick={() => {
            refreshRates().then(() => toast.success("Tasas actualizadas correctamente"));
        }}
        disabled={isRefreshingRates}
        className={`rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 transition-colors ${isRefreshingRates ? 'opacity-75 cursor-not-allowed' : ''}`}
        title="Actualizar tasas"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRefreshingRates ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isRefreshingRates ? (
                <>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </>
            ) : (
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            )}
        </svg>
    </button>


    useEffect(() => {
        inputRef.current?.focus();
    }, []);


    const { data: products, isLoading } = useQuery({
        queryKey: ["products", search],
        queryFn: async () => {

            if (search.length < 2) {
                const res = await api.get("/products/", {
                    params: { limit: 20 }
                });
                return res.data.filter((p: any) => p.stock_quantity > 0);
            }

            const isBarcode = /^\d+$/.test(search) && search.length > 5;
            const res = await api.get("/products/", {
                params: isBarcode ? { barcode: search } : { search }
            });
            return res.data.filter((p: any) => p.stock_quantity > 0);
        },
        staleTime: 1000 * 60 * 2,
        placeholderData: (previousData) => previousData,
    });


    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && products?.length === 1) {
            addToCart(products[0]);
            setSearch("");
        }
    };

    const salesMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.post("/sales/", data);
        },
        onSuccess: (response) => {
            clearCart();
            setCompletedSale(response.data);
            toast.success("¡Venta procesada con éxito!", {
                description: "La transacción ha sido registrada en el sistema.",
                duration: 4000,
            });
        },
        onError: (err: any) => {
            let errorMessage = "Error desconocido";


            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;


                if (Array.isArray(detail)) {
                    errorMessage = detail.map((e: any) => {
                        const field = e.loc?.join('.') || 'campo desconocido';
                        return `${field}: ${e.msg}`;
                    }).join(', ');
                } else if (typeof detail === 'string') {
                    errorMessage = detail;
                } else if (typeof detail === 'object') {
                    errorMessage = JSON.stringify(detail);
                }
            }

            toast.error("Error al procesar la venta", {
                description: errorMessage,
            });
        }
    });

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        const payload = {
            items: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                matched_price: item.price
            })),
            payments: [
                {
                    method: displayCurrency === 'USD' ? 'Efectivo_USD' :
                        displayCurrency === 'COP' ? 'Efectivo_COP' :
                            displayCurrency === 'BCV' ? 'Efectivo_BS' : 'Binance',
                    amount: totalConverted() + (hasDelivery ? deliveryAmount * (rates[displayCurrency as keyof ExchangeRates] || 1) : 0),
                    currency: displayCurrency === 'COP' ? 'COP' :
                        displayCurrency === 'USD' ? 'USD' : 'VES',
                    exchange_rate: displayCurrency === 'USD' ? 1.0 : (rates[displayCurrency as keyof ExchangeRates] || 1.0)
                }
            ],
            customer_id: selectedCustomer?.id || null,
            has_delivery: hasDelivery,
            delivery_amount_usd: hasDelivery ? deliveryAmount : 0
        };

        try {
            await salesMutation.mutateAsync(payload);
        } finally {
            setIsProcessing(false);
            setHasDelivery(false);
            setDeliveryAmount(0);
        }
    };

    return (
        <div className="flex h-[calc(100vh-(--spacing(20)))] gap-6 flex-col lg:flex-row">

            <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    <Search className="h-6 w-6 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escanear código o buscar producto..."
                        className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400 dark:text-white"
                        autoComplete="off"
                    />
                    {isLoading && <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 overflow-y-auto p-1">
                    {products?.filter((p: any) => p.stock_quantity > 0).map((product: any) => (
                        <button
                            key={product.id}
                            onClick={() => { addToCart(product); setSearch(""); inputRef.current?.focus(); }}
                            className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-indigo-500 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-indigo-500"
                        >
                            <div className="mb-2 h-24 w-full rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                {product.image_url ? (
                                    <img
                                        src={getImageUrl(product.image_url)!}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-gray-400 opacity-50" />
                                )}
                            </div>
                            <h3 className="line-clamp-2 font-medium text-gray-900 dark:text-white text-left">
                                {product.name}
                            </h3>
                            <div className="mt-auto pt-2 w-full flex justify-between items-center">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                    ${product.price_usd.toFixed(2)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Stock: {product.stock_quantity}
                                </span>
                            </div>
                        </button>
                    ))}
                    {search.length > 2 && products?.length === 0 && !isLoading && (
                        <div className="col-span-full py-10 text-center text-gray-500">
                            No se encontraron productos.
                        </div>
                    )}
                    {!search && (
                        <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center">
                            <Search className="h-12 w-12 mb-2 opacity-20" />
                            <p>Escanea un código de barras o escribe para buscar</p>
                        </div>
                    )}
                </div>
            </div>


            <div className="w-full lg:w-96 flex flex-col rounded-2xl bg-white shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 h-full">
                <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl gap-2">
                    <div className="flex flex-col">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-indigo-600" />
                            Carrito
                        </h2>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold dark:bg-indigo-900/30 dark:text-indigo-400 w-fit mt-1">
                            {totalItems()} Ítems
                        </span>
                    </div>

                    <div className="flex gap-2 items-center">
                        <select
                            value={displayCurrency}
                            onChange={(e) => setDisplayCurrency(e.target.value as any)}
                            className="w-32 rounded-lg border border-gray-200 bg-white p-1.5 text-xs font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="BCV">VES (BCV)</option>
                            <option value="USDT">VES (USDT)</option>
                            <option value="COP">COP</option>
                        </select>

                        {lastUpdated && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}

                        <button
                            onClick={async () => {
                                await refreshRates();
                                toast.success("Tasas actualizadas correctamente", {
                                    description: `Datos sincronizados a las ${new Date().toLocaleTimeString()}`
                                });
                            }}
                            disabled={isRefreshingRates}
                            className={`rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-700 transition-colors ${isRefreshingRates ? 'opacity-75 cursor-not-allowed' : ''}`}
                            title="Actualizar tasas"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRefreshingRates ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {isRefreshingRates ? (
                                    <>
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </>
                                ) : (
                                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>


                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Cliente (Opcional)</label>
                    <div className="flex gap-2">
                        <select
                            value={selectedCustomer?.id || ""}
                            onChange={(e) => {
                                const customer = customers?.find((c: any) => c.id === parseInt(e.target.value));
                                setSelectedCustomer(customer || null);
                            }}
                            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="">Sin cliente</option>
                            {customers?.map((customer: any) => (
                                <option key={customer.id} value={customer.id}>
                                    {customer.name} - {customer.cedula}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowCustomerModal(true)}
                            className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700"
                            title="Nuevo cliente"
                        >
                            <UserPlus className="h-4 w-4" />
                        </button>
                    </div>
                    {selectedCustomer && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            <span>{selectedCustomer.phone}</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <AnimatePresence>
                        {cart.map((item) => (
                            <motion.div
                                key={item.product_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/20"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm truncate text-gray-900 dark:text-white">{item.name}</h4>
                                        <select
                                            value={item.priceBasis}
                                            onChange={(e) => updateItemBasis(item.product_id, e.target.value as any)}
                                            className="text-[10px] font-semibold bg-gray-200/60 dark:bg-gray-700/60 border border-gray-300/50 dark:border-gray-600/50 rounded px-1.5 py-0.5 outline-none text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-300/60 dark:hover:bg-gray-600/60 transition-colors"
                                            title="Moneda base del precio"
                                        >
                                            <option value="USD">USD</option>
                                            <option value="BCV">BCV</option>
                                            <option value="USDT">USDT</option>
                                            <option value="COP">COP</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-[10px]">
                                        <span className="text-gray-500">
                                            $ {item.price.toFixed(2)} x {item.quantity}
                                        </span>
                                        {item.priceBasis && item.priceBasis !== 'USD' && (
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                {item.priceBasis} {(item.price * (rates[item.priceBasis as keyof ExchangeRates] || 1)).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        <Plus className="h-3 w-3" />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm min-w-[60px]">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.product_id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 opacity-50">
                            <ShoppingCart className="h-12 w-12" />
                            <p>Carrito vacío</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 rounded-b-2xl">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span>{formatCurrency(totalUSD())}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Impuestos (IVA)</span>
                            <span>{formatCurrency(totalTax())}</span>
                        </div>

                        {/* Delivery Section */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="hasDelivery"
                                    checked={hasDelivery}
                                    onChange={(e) => {
                                        setHasDelivery(e.target.checked);
                                        if (!e.target.checked) setDeliveryAmount(0);
                                    }}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="hasDelivery" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                    <Truck className="h-4 w-4 text-indigo-600" />
                                    Incluir Delivery
                                </label>
                            </div>
                            {hasDelivery && (
                                <div className="flex items-center gap-2 ml-6">
                                    <span className="text-xs text-gray-500">Costo:</span>
                                    <div className="relative flex-1">
                                        <span className="absolute left-2 top-1.5 text-gray-400 text-sm">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={deliveryAmount}
                                            onChange={(e) => setDeliveryAmount(parseFloat(e.target.value) || 0)}
                                            className="w-full rounded-lg border border-gray-200 bg-white p-1.5 pl-6 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-baseline text-xl font-bold text-indigo-600 dark:text-indigo-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-900 dark:text-white text-sm">Total USD</span>
                            <span>{formatCurrency(totalUSD() + totalTax() + (hasDelivery ? deliveryAmount : 0))}</span>
                        </div>
                        {displayCurrency !== 'USD' && (
                            <div className="flex justify-between items-baseline text-2xl font-black text-green-600 dark:text-green-400">
                                <span className="text-xs uppercase tracking-widest">{displayCurrency}</span>
                                <span>
                                    {displayCurrency === 'COP' ?
                                        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalConverted()) :
                                        new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(totalConverted())
                                    }
                                </span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || isProcessing}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 text-white font-bold shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none"
                    >
                        {isProcessing ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <CreditCard className="h-5 w-5" />
                        )}
                        {isProcessing ? "Procesando..." : "Cobrar"}
                    </button>
                </div>
            </div>

            {/* Sale Ticket Modal */}
            {completedSale && (
                <SaleTicket
                    sale={completedSale}
                    rates={rates}
                    onClose={() => setCompletedSale(null)}
                />
            )}

            {/* Quick Customer Registration Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowCustomerModal(false)}>
                    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-indigo-600" />
                            Registro Rápido de Cliente
                        </h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const { data } = await api.post("/customers", customerForm);
                                queryClient.invalidateQueries({ queryKey: ["customers"] });
                                setSelectedCustomer(data);
                                setShowCustomerModal(false);
                                setCustomerForm({ cedula: "", name: "", phone: "" });
                                toast.success("Cliente registrado exitosamente");
                            } catch (err: any) {
                                toast.error("Error al registrar cliente", {
                                    description: err.response?.data?.detail || "Error desconocido"
                                });
                            }
                        }} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Cédula *</label>
                                <input
                                    type="text"
                                    required
                                    value={customerForm.cedula}
                                    onChange={(e) => setCustomerForm({ ...customerForm, cedula: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    required
                                    value={customerForm.name}
                                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Teléfono *</label>
                                <input
                                    type="tel"
                                    required
                                    value={customerForm.phone}
                                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomerModal(false);
                                        setCustomerForm({ cedula: "", name: "", phone: "" });
                                    }}
                                    className="flex-1 rounded-xl bg-gray-100 py-2 font-medium hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700"
                                >
                                    Registrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
