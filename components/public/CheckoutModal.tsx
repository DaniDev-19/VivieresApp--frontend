"use client";

import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { usePublicStore } from "@/store/publicStore";
import { formatCurrency } from "@/lib/utils";
import { Trash2, UploadCloud, CheckCircle, Package, MapPin, CreditCard, ChevronRight, ChevronLeft } from "lucide-react";
import api from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function CheckoutModal({ isOpen, onClose, bcvRate }: { isOpen: boolean, onClose: () => void, bcvRate: number }) {
    const { cart, removeFromCart, updateQuantity, totalUSD, clearCart } = usePublicStore();
    const [step, setStep] = useState(1); // 1: Cart, 2: Client Info, 3: Payment/Upload, 4: Success

    // Form Data
    const [clientData, setClientData] = useState({ name: "", cedula: "", phone: "", address: "" });
    const [selectedMethod, setSelectedMethod] = useState("");
    const [refCode, setRefCode] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const total = totalUSD();
    const totalBs = total * bcvRate;

    // Mutation
    const submitOrder = useMutation({
        mutationFn: async () => {
            let proofUrl = "";
            if (file) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await api.post("/uploads/", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                proofUrl = res.data.url;
            }

            const payload = {
                customer: {
                    name: clientData.name,
                    cedula: clientData.cedula,
                    phone: clientData.phone,
                    address: clientData.address
                },
                items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
                payment_method: selectedMethod,
                transaction_ref: refCode,
                payment_proof_url: proofUrl
            };

            await api.post("/web_orders/", payload);
        },
        onSuccess: () => {
            clearCart();
            setStep(4);
            toast.success("Pedido enviado con éxito");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Error al enviar pedido. Intenta de nuevo.");
            console.error(err);
        }
    });

    const handleNext = () => {
        if (step === 2) {
            if (!clientData.name || !clientData.cedula || !clientData.phone) {
                toast.error("Por favor completa los datos obligatorios.");
                return;
            }
        }
        setStep(s => s + 1);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Pedido">
            <div className="space-y-6">
                {/* Step 1: Cart Review */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-1 text-center sm:text-left">
                            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-indigo-500" /> Tu Carrito
                            </h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Revisa tus productos</p>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                                    <Package className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">Tu carrito está vacío.</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl group transition-all hover:border-indigo-200 dark:hover:border-indigo-900/50">
                                        <div className="flex gap-4 items-center">
                                            <div className="relative">
                                                {item.image_url ? (
                                                    <img src={item.image_url} className="w-14 h-14 rounded-xl object-cover shadow-sm" alt={item.name} />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-indigo-200" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base text-gray-900 dark:text-white">{item.name}</p>
                                                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(item.price)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
                                                <button
                                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
                                                >-</button>
                                                <span className="w-8 text-center text-sm font-bold dark:text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
                                                >+</button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 px-2 py-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-2xl flex justify-between items-center border border-indigo-100/50 dark:border-indigo-900/30">
                                    <div>
                                        <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Total a pagar</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Bs. {totalBs.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(total)}</span>
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all"
                                >
                                    Continuar Checkout <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Client Info */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-indigo-500" /> Datos de Entrega
                            </h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">¿A dónde enviamos?</p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Cédula o RIF</label>
                                    <input
                                        value={clientData.cedula}
                                        onChange={e => setClientData({ ...clientData, cedula: e.target.value })}
                                        placeholder="V-12345678"
                                        className="w-full p-4 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">WhatsApp</label>
                                    <input
                                        value={clientData.phone}
                                        onChange={e => setClientData({ ...clientData, phone: e.target.value })}
                                        placeholder="0414..."
                                        className="w-full p-4 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Nombre Completo</label>
                                <input
                                    value={clientData.name}
                                    onChange={e => setClientData({ ...clientData, name: e.target.value })}
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full p-4 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Dirección Exacta</label>
                                <textarea
                                    value={clientData.address}
                                    onChange={e => setClientData({ ...clientData, address: e.target.value })}
                                    placeholder="Indica calle, número de casa/apto y puntos de referencia"
                                    className="w-full p-4 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
                                <ChevronLeft className="w-5 h-5" /> Volver
                            </button>
                            <button onClick={handleNext} className="flex-[2] bg-indigo-600 text-white rounded-2xl font-bold py-4 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                Siguiente <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-500" /> Método de Pago
                            </h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">¿Cómo deseas pagar?</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {['Pago Móvil', 'Zelle', 'Binance', 'Zinli'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setSelectedMethod(m)}
                                    className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${selectedMethod === m ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'border-gray-100 dark:border-gray-800 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-900/50'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        {selectedMethod && (
                            <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-xl shadow-indigo-500/10 space-y-2 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-widest mb-2">Datos de cuenta:</p>
                                    <p className="text-sm font-bold">0414-1234567 • Banco Venezuela</p>
                                    <p className="text-sm">Rif: J-12345678-9</p>
                                </div>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Referencia Bancaria</label>
                                <input
                                    value={refCode}
                                    onChange={e => setRefCode(e.target.value)}
                                    placeholder="Ej: 8472"
                                    className="w-full p-4 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all dark:text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Adjuntar Comprobante (Opcional)</label>
                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all">
                                    {file ? (
                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                                            <CheckCircle className="w-5 h-5" /> {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-8 h-8 mb-2 text-indigo-400 opacity-50" />
                                            <span className="text-xs font-bold dark:text-gray-500">Haz click para subir imagen</span>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                Volver
                            </button>
                            <button
                                onClick={() => submitOrder.mutate()}
                                disabled={submitOrder.isPending || !selectedMethod}
                                className="flex-[2] bg-green-600 text-white rounded-2xl font-bold py-4 shadow-lg shadow-green-500/20 hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {submitOrder.isPending ? "Confirmando..." : "Confirmar Pedido"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <div className="text-center py-10 space-y-6">
                        <div className="relative inline-block">
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-400/20 rounded-full blur-3xl" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">¡Gracias por tu compra!</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto text-sm">
                                Tu pedido ha sido enviado con éxito y está siendo procesado.
                                <br />
                                Total a pagar: <strong className="text-indigo-600">{formatCurrency(total)}</strong>
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">¿Qué sigue?</p>
                            <a
                                href={`https://wa.me/584140000000?text=${encodeURIComponent(`Hola, acabo de realizar el pedido web a nombre de ${clientData.name}. Mi total es ${totalBs.toFixed(2)} Bs.`)}`}
                                target="_blank"
                                className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#128C7E] shadow-xl shadow-green-500/20 active:scale-95 transition-all w-full"
                            >
                                Notificar por WhatsApp
                            </a>
                        </div>

                        <button onClick={onClose} className="text-sm font-bold text-gray-400 hover:text-indigo-500 transition-colors">Volver a la tienda</button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
