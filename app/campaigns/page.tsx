"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatWhatsAppLink } from "@/lib/utils";
import {
    Megaphone,
    Search,
    User,
    CreditCard,
    Phone,
    MessageSquare,
    Check,
    Send,
    HelpCircle,
    Info,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";

interface Customer {
    id: number;
    cedula: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
}

export default function CampaignsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    // Template state
    const [messageTemplate, setMessageTemplate] = useState(
        "¡Hola {nombre}! Te invitamos a conocer nuestras promociones especiales de esta semana en {negocio}. ¡No te las pierdas!"
    );

    // Track contacted customers in the current session
    const [contactedIds, setContactedIds] = useState<Set<number>>(new Set());

    // Fetch customers
    const { data: customers, isLoading, isPlaceholderData } = useQuery<Customer[]>({
        queryKey: ["customers-campaign", page, search],
        queryFn: async () => {
            const params = {
                search: search || undefined,
                skip: (page - 1) * limit,
                limit
            };
            const { data } = await api.get("/customers", { params });
            return data;
        },
        placeholderData: (previousData) => previousData,
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    // Insert variable at cursor position or append
    const insertVariable = (variable: string) => {
        setMessageTemplate(prev => prev + ` {${variable}}`);
    };

    // Process message template for a specific customer
    const getProcessedMessage = (customer: Customer) => {
        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App";
        const ubicationDescription = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Viveres App"
        return messageTemplate
            .replace(/{nombre}/gi, customer.name)
            .replace(/{cedula}/gi, customer.cedula)
            .replace(/{negocio}/gi, businessName)
            .replace(/{ubicacion}/gi, ubicationDescription);
    };

    // Send campaign message
    const handleSend = (customer: Customer) => {
        if (!customer.phone) {
            toast.error("El cliente no tiene un número de teléfono registrado.");
            return;
        }

        const message = getProcessedMessage(customer);
        const url = formatWhatsAppLink(customer.phone, message);

        // Open WhatsApp Link in a new tab
        window.open(url, "_blank");

        // Mark as contacted
        setContactedIds(prev => {
            const updated = new Set(prev);
            updated.add(customer.id);
            return updated;
        });

        toast.success(`Mensaje preparado para ${customer.name}`);
    };

    // Sample preview customer
    const sampleCustomer: Customer = {
        id: 0,
        name: "María Pérez",
        cedula: "V-12345678",
        phone: "04121234567"
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Megaphone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    Campañas de Marketing
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Crea y envía promociones personalizadas por WhatsApp a tus clientes
                </p>
            </div>

            {/* Top info notice for Images & Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 space-y-2">
                    <h4 className="font-semibold flex items-center gap-1.5 text-sm">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        ¿Cómo enviar enlaces y páginas web?
                    </h4>
                    <p className="text-xs leading-relaxed">
                        Puedes pegar enlaces directamente en tu mensaje (ej: <code>https://tutienda.com</code>). Al enviarse, WhatsApp detectará el enlace y generará de forma automática una vista previa con título e imagen de la página.
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300 space-y-2">
                    <h4 className="font-semibold flex items-center gap-1.5 text-sm">
                        <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        ¿Cómo enviar imágenes promocionales?
                    </h4>
                    <p className="text-xs leading-relaxed">
                        WhatsApp Web no permite precargar archivos de imagen directamente desde un enlace. Para adjuntar una imagen:
                    </p>
                    <ol className="list-decimal pl-4 text-xs space-y-1">
                        <li>Copia la imagen en tu PC (haciendo clic derecho y eligiendo <strong>Copiar</strong> o <code>Ctrl+C</code>).</li>
                        <li>Al abrirse la pestaña de WhatsApp de tu cliente, haz clic en el cuadro de chat y presiona <strong>Pegar</strong> (<code>Ctrl+V</code>) antes de presionar Enviar.</li>
                    </ol>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Editor & Preview */}
                <div className="lg:col-span-6 space-y-6">
                    {/* Message Editor Card */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Redactar Plantilla de Promoción
                        </h3>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                Mensaje
                            </label>
                            <textarea
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-y min-h-[120px]"
                                value={messageTemplate}
                                onChange={(e) => setMessageTemplate(e.target.value)}
                                placeholder="Escribe tu promoción aquí..."
                            />
                        </div>

                        {/* Variables Buttons */}
                        <div className="space-y-1.5">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Insertar variables personalizadas
                            </span>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => insertVariable("nombre")}
                                    className="cursor-pointer px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50 transition-colors"
                                >
                                    {"{nombre}"}
                                </button>
                                <button
                                    onClick={() => insertVariable("cedula")}
                                    className="cursor-pointer px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50 transition-colors"
                                >
                                    {"{cedula}"}
                                </button>
                                <button
                                    onClick={() => insertVariable("negocio")}
                                    className="cursor-pointer px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50 transition-colors"
                                >
                                    {"{negocio}"}
                                </button>
                                <button
                                    onClick={() => insertVariable("ubicacion")}
                                    className="cursor-pointer px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50 transition-colors"
                                >
                                    {"{ubicacion}"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Chat Box Mockup Preview */}
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                            Previsualización en tiempo real
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Así se verá el mensaje para tu cliente:
                        </p>

                        {/* WhatsApp-like layout */}
                        <div className="rounded-lg bg-[#efeae2] dark:bg-gray-950 p-4 border border-gray-200 dark:border-gray-800/80 min-h-[140px] flex flex-col justify-end relative overflow-hidden">
                            {/* Header simulation */}
                            <div className="absolute top-0 inset-x-0 bg-[#005c4b] dark:bg-emerald-950 px-3 py-2 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                                    M
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-white leading-tight">{sampleCustomer.name}</span>
                                    <span className="text-[9px] text-emerald-100/80 leading-none">en línea</span>
                                </div>
                            </div>

                            {/* Message Bubble */}
                            <div className="mt-8 self-start max-w-[85%] rounded-lg bg-white dark:bg-gray-850 p-2.5 shadow-xs border-r-4 border-emerald-500 dark:border-emerald-600 relative text-xs text-gray-850 dark:text-gray-900 leading-normal">
                                <p className="whitespace-pre-wrap">{getProcessedMessage(sampleCustomer)}</p>
                                <span className="block text-right text-[9px] text-gray-400 mt-1">10:45 AM ✔✔</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customer List */}
                <div className="lg:col-span-6 space-y-4">
                    {/* Header + Search */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                Seleccionar Destinatarios
                            </h3>
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-indigo-950/40 dark:text-indigo-300 font-medium">
                                Contactados en sesión: {contactedIds.size}
                            </span>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar cliente por nombre, cédula..."
                                value={search}
                                onChange={handleSearch}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Customers Table / Grid */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Cliente</th>
                                        <th className="px-4 py-3 font-semibold text-right">Enviar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                                    {isLoading ? (
                                        <tr><td colSpan={2} className="p-8 text-center text-xs">Cargando lista de clientes...</td></tr>
                                    ) : customers?.length === 0 ? (
                                        <tr><td colSpan={2} className="p-8 text-center text-xs text-gray-500">No se encontraron clientes.</td></tr>
                                    ) : (
                                        customers?.map((customer) => {
                                            const isContacted = contactedIds.has(customer.id);
                                            return (
                                                <tr
                                                    key={customer.id}
                                                    className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-850/50"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900 dark:text-white text-sm">{customer.name}</span>
                                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                                                                <span className="flex items-center gap-0.5"><CreditCard className="w-3 h-3" /> {customer.cedula}</span>
                                                                <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> {customer.phone}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => handleSend(customer)}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${isContacted
                                                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                                                                : "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                }`}
                                                        >
                                                            {isContacted ? (
                                                                <>
                                                                    <Check className="w-3.5 h-3.5" />
                                                                    Re-enviar
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="w-3 h-3" />
                                                                    Enviar Promo
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <Pagination
                        page={page}
                        hasNextPage={customers?.length === limit}
                        onPageChange={setPage}
                        isLoading={isPlaceholderData}
                    />
                </div>
            </div>
        </div>
    );
}
