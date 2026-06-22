"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatWhatsAppLink } from "@/lib/utils";
import {
    Megaphone,
    Search,
    CreditCard,
    Phone,
    MessageSquare,
    Check,
    Send,
    HelpCircle,
    Info,
    Mail,
    Layout,
    Link,
    Image,
    Globe,
    AlertTriangle,
    Loader2
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

    // Tabs state
    const [activeTab, setActiveTab] = useState<"whatsapp" | "email">("whatsapp");

    // WhatsApp Template state
    const [messageTemplate, setMessageTemplate] = useState(
        "¡Hola {nombre}! Te invitamos a conocer nuestras promociones especiales de esta semana en {negocio}. ¡No te las pierdas!"
    );

    // Email Campaign state
    const [emailSubject, setEmailSubject] = useState("¡Gran Oferta de la Semana en {negocio}!");
    const [emailTitle, setEmailTitle] = useState("¡Descuentos Exclusivos para Ti!");
    const [emailBody, setEmailBody] = useState(
        "Hola {nombre},\n\nEsta semana tenemos grandes descuentos en todos nuestros productos. ¡Ven a visitarnos o haz tu pedido en línea!\n\nAtentamente,\nEl equipo de {negocio}"
    );
    const [emailCtaText, setEmailCtaText] = useState("Ver Catálogo");
    const [emailCtaUrl, setEmailCtaUrl] = useState("https://viveresapp.com/catalogo");
    const [emailImageUrl, setEmailImageUrl] = useState("https://images.unsplash.com/photo-1542838132-92c53300491e?w=600");

    // Track contacted customers in the current session
    const [contactedIds, setContactedIds] = useState<Set<number>>(new Set());
    const [emailSentIds, setEmailSentIds] = useState<Set<number>>(new Set());
    const [isSendingAllEmails, setIsSendingAllEmails] = useState(false);

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

    // Insert variable at cursor position or append (WhatsApp)
    const insertVariable = (variable: string) => {
        setMessageTemplate(prev => prev + ` {${variable}}`);
    };

    // Insert variable at cursor position or append (Email)
    const insertEmailVariable = (variable: string) => {
        setEmailBody(prev => prev + ` {${variable}}`);
    };

    // Process message template for a specific customer (WhatsApp)
    const getProcessedMessage = (customer: Customer) => {
        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App";
        const ubicationDescription = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Viveres App";
        return messageTemplate
            .replace(/{nombre}/gi, customer.name)
            .replace(/{cedula}/gi, customer.cedula)
            .replace(/{negocio}/gi, businessName)
            .replace(/{ubicacion}/gi, ubicationDescription);
    };

    // Get processed Email HTML
    const getEmailHtml = (customerName: string) => {
        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App";
        const processedTitle = emailTitle.replace(/{negocio}/gi, businessName);
        const processedBody = emailBody
            .replace(/{nombre}/gi, customerName)
            .replace(/{negocio}/gi, businessName);

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${emailSubject.replace(/{negocio}/gi, businessName)}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #374151; margin: 0; padding: 20px; }
        .card { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); border: 1px solid #e5e7eb; }
        .header { background: linear-gradient(135deg, #4f46e5, #6366f1); color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
        .header p { margin: 8px 0 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 32px 24px; }
        .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px; }
        .text { font-size: 14px; line-height: 1.6; color: #4b5563; white-space: pre-wrap; margin-bottom: 20px; }
        .image { width: 100%; max-height: 250px; object-fit: cover; border-radius: 12px; margin-bottom: 24px; display: block; }
        .btn-container { text-align: center; margin: 28px 0 12px 0; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; transition: background-color 0.2s; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>${businessName.toUpperCase()}</h1>
            <p>Promociones & Novedades</p>
        </div>
        <div class="body">
            <div class="title">${processedTitle}</div>
            <div class="text">${processedBody}</div>
            ${emailImageUrl ? `<img class="image" src="${emailImageUrl}" alt="Promoción" />` : ""}
            ${emailCtaText && emailCtaUrl ? `
                <div class="btn-container">
                    <a href="${emailCtaUrl}" target="_blank" style="display:inline-block;background-color:#4f46e5;color:#ffffff !important;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;font-family:sans-serif;">${emailCtaText}</a>
                </div>
            ` : ""}
        </div>
        <div class="footer">
            Este es un correo publicitario enviado de forma automática a nuestros clientes registrados.<br>
            © ${new Date().getFullYear()} ${businessName} - Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
        `;
    };

    // Send campaign message (WhatsApp)
    const handleSend = (customer: Customer) => {
        if (!customer.phone) {
            toast.error("El cliente no tiene un número de teléfono registrado.");
            return;
        }

        const message = getProcessedMessage(customer);
        const url = formatWhatsAppLink(customer.phone, message);

        window.open(url, "_blank");

        setContactedIds(prev => {
            const updated = new Set(prev);
            updated.add(customer.id);
            return updated;
        });

        toast.success(`Mensaje de WhatsApp preparado para ${customer.name}`);
    };

    // Send campaign email
    const handleSendEmail = async (customer: Customer) => {
        if (!customer.email) {
            toast.error("El cliente no tiene un correo electrónico registrado.");
            return;
        }

        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App";
        const subject = emailSubject.replace(/{negocio}/gi, businessName);
        const html = getEmailHtml(customer.name);

        const toastId = toast.loading(`Enviando correo promocional a ${customer.name}...`);

        try {
            await api.post("/emails/send-custom", {
                email: customer.email,
                subject,
                html_content: html
            });

            setEmailSentIds(prev => {
                const updated = new Set(prev);
                updated.add(customer.id);
                return updated;
            });

            toast.success(`Correo enviado exitosamente a ${customer.name}`, { id: toastId });
        } catch (error: any) {
            console.error("Error sending promotional email:", error);
            const detail = error.response?.data?.detail || error.message || "Error desconocido";
            toast.error(`Error al enviar: ${detail}`, { id: toastId });
        }
    };

    // Send Email to All matching with valid email addresses
    const handleSendToAllEmails = async () => {
        if (!customers || customers.length === 0) {
            toast.error("No hay clientes listados para enviar.");
            return;
        }

        const validCustomers = customers.filter(c => !!c.email);
        if (validCustomers.length === 0) {
            toast.error("Ninguno de los clientes listados tiene correo electrónico.");
            return;
        }

        setIsSendingAllEmails(true);
        const toastId = toast.loading(`Enviando correos en lote a ${validCustomers.length} clientes...`);
        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App";
        const subject = emailSubject.replace(/{negocio}/gi, businessName);

        let successCount = 0;
        let failCount = 0;

        for (const customer of validCustomers) {
            try {
                const html = getEmailHtml(customer.name);
                await api.post("/emails/send-custom", {
                    email: customer.email,
                    subject,
                    html_content: html
                });
                successCount++;
                setEmailSentIds(prev => {
                    const updated = new Set(prev);
                    updated.add(customer.id);
                    return updated;
                });
            } catch (err) {
                console.error(`Failed to send email to ${customer.name}:`, err);
                failCount++;
            }
        }

        setIsSendingAllEmails(false);
        if (failCount === 0) {
            toast.success(`¡Envíos completados! Se enviaron ${successCount} correos con éxito.`, { id: toastId });
        } else {
            toast.warning(`Envíos completados: ${successCount} éxitos, ${failCount} fallidos.`, { id: toastId });
        }
    };

    // Sample preview customer
    const sampleCustomer: Customer = {
        id: 0,
        name: "María Pérez",
        cedula: "V-12345678",
        phone: "04121234567",
        email: "maria.perez@ejemplo.com"
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        Campañas de Marketing
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Gestiona promociones masivas o individuales y mantén al día a tus clientes
                    </p>
                </div>

                {/* Tabs switcher */}
                <div className="inline-flex rounded-lg bg-gray-150 p-1 dark:bg-gray-800 self-start">
                    <button
                        onClick={() => setActiveTab("whatsapp")}
                        className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${activeTab === "whatsapp"
                            ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            }`}
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                    </button>
                    <button
                        onClick={() => setActiveTab("email")}
                        className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer ${activeTab === "email"
                            ? "bg-white text-gray-900 shadow-xs dark:bg-gray-700 dark:text-white"
                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            }`}
                    >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                    </button>
                </div>
            </div>

            {activeTab === "whatsapp" ? (
                <>
                    {/* Info cards for WhatsApp */}
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
                        {/* WhatsApp Editor & Preview */}
                        <div className="lg:col-span-6 space-y-6">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Redactar Plantilla de Promoción
                                </h3>
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-450 dark:text-gray-400 uppercase tracking-wider">
                                        Mensaje
                                    </label>
                                    <textarea
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-y min-h-[120px]"
                                        value={messageTemplate}
                                        onChange={(e) => setMessageTemplate(e.target.value)}
                                        placeholder="Escribe tu promoción aquí..."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <span className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider">
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

                            {/* Live Mockup */}
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                                    Previsualización en tiempo real
                                </h3>
                                <div className="rounded-lg bg-[#efeae2] dark:bg-gray-950 p-4 border border-gray-200 dark:border-gray-800/80 min-h-[140px] flex flex-col justify-end relative overflow-hidden">
                                    <div className="absolute top-0 inset-x-0 bg-[#005c4b] dark:bg-emerald-950 px-3 py-2 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] text-white font-bold uppercase">
                                            M
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-white leading-tight">{sampleCustomer.name}</span>
                                            <span className="text-[9px] text-emerald-100/80 leading-none">en línea</span>
                                        </div>
                                    </div>
                                    <div className="mt-8 self-start max-w-[85%] rounded-lg bg-white dark:bg-gray-850 p-2.5 shadow-xs border-r-4 border-emerald-500 dark:border-emerald-600 relative text-xs text-gray-850 dark:text-gray-900 leading-normal">
                                        <p className="whitespace-pre-wrap">{getProcessedMessage(sampleCustomer)}</p>
                                        <span className="block text-right text-[9px] text-gray-400 mt-1">10:45 AM ✔✔</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer List Column */}
                        <div className="lg:col-span-6 space-y-4">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                        Seleccionar Destinatarios (WhatsApp)
                                    </h3>
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-indigo-950/40 dark:text-indigo-300 font-medium">
                                        Contactados: {contactedIds.size}
                                    </span>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, cédula..."
                                        value={search}
                                        onChange={handleSearch}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>

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
                                                        <tr key={customer.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
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
                            <Pagination
                                page={page}
                                hasNextPage={customers?.length === limit}
                                onPageChange={setPage}
                                isLoading={isPlaceholderData}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Email campaigns tab content */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Editor + Realtime HTML Preview */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <Layout className="w-5 h-5 text-indigo-500" />
                                    Plantilla de Correo Promocional
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className=" text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Globe className="w-3 h-3" /> Asunto
                                        </label>
                                        <input
                                            type="text"
                                            value={emailSubject}
                                            onChange={(e) => setEmailSubject(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder="Asunto del correo"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                            Título de la Promo
                                        </label>
                                        <input
                                            type="text"
                                            value={emailTitle}
                                            onChange={(e) => setEmailTitle(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder="Ej: ¡Ofertas Imperdibles!"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        Cuerpo del Correo
                                    </label>
                                    <textarea
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        rows={4}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-y"
                                        placeholder="Redacta el mensaje..."
                                    />
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <button
                                            onClick={() => insertEmailVariable("nombre")}
                                            className="cursor-pointer px-2 py-0.5 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50 transition-colors"
                                        >
                                            {"{nombre}"}
                                        </button>
                                        <button
                                            onClick={() => insertEmailVariable("negocio")}
                                            className="cursor-pointer px-2 py-0.5 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50 transition-colors"
                                        >
                                            {"{negocio}"}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider  items-center gap-1">
                                            <Image className="w-3 h-3" /> Imagen URL
                                        </label>
                                        <input
                                            type="text"
                                            value={emailImageUrl}
                                            onChange={(e) => setEmailImageUrl(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider items-center gap-1">
                                            <Link className="w-3 h-3" /> Texto Botón
                                        </label>
                                        <input
                                            type="text"
                                            value={emailCtaText}
                                            onChange={(e) => setEmailCtaText(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder="Ver Catálogo"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider items-center gap-1">
                                            <Link className="w-3 h-3" /> URL Botón
                                        </label>
                                        <input
                                            type="text"
                                            value={emailCtaUrl}
                                            onChange={(e) => setEmailCtaUrl(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Beautiful Sandbox Email Preview using iframe */}
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <Layout className="w-4 h-4 text-indigo-500" />
                                    Previsualización de Bandeja de Entrada
                                </h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-800">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs text-gray-500 dark:bg-gray-850 dark:border-gray-800 flex flex-col gap-0.5">
                                        <div><strong>De:</strong> {process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App"} &lt;promo@viveresapp.com&gt;</div>
                                        <div><strong>Para:</strong> {sampleCustomer.email}</div>
                                        <div><strong>Asunto:</strong> {emailSubject.replace(/{negocio}/gi, process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App")}</div>
                                    </div>
                                    <iframe
                                        srcDoc={getEmailHtml(sampleCustomer.name)}
                                        className="w-full h-[400px] bg-white"
                                        title="Email Realtime Preview"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recipients and batch send */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                                            Seleccionar Destinatarios (Email)
                                        </h3>
                                        <p className="text-[10px] text-gray-400">
                                            Enviados: {emailSentIds.size}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSendToAllEmails}
                                        disabled={isSendingAllEmails || !customers || customers.length === 0}
                                        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
                                    >
                                        {isSendingAllEmails ? (
                                            <>
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Enviando Lote...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="w-3.5 h-3.5" />
                                                Enviar a Todos
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, cédula..."
                                        value={search}
                                        onChange={handleSearch}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                        <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Cliente / Email</th>
                                                <th className="px-4 py-3 font-semibold text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                                            {isLoading ? (
                                                <tr><td colSpan={2} className="p-8 text-center text-xs">Cargando lista de clientes...</td></tr>
                                            ) : customers?.length === 0 ? (
                                                <tr><td colSpan={2} className="p-8 text-center text-xs text-gray-500">No se encontraron clientes.</td></tr>
                                            ) : (
                                                customers?.map((customer) => {
                                                    const isSent = emailSentIds.has(customer.id);
                                                    return (
                                                        <tr key={customer.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-850/50">
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-gray-900 dark:text-white text-sm">{customer.name}</span>
                                                                    {customer.email ? (
                                                                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                                                                            <Mail className="w-3 h-3" /> {customer.email}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-0.5">
                                                                            <AlertTriangle className="w-3 h-3 text-red-500" /> Sin correo registrado
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button
                                                                    onClick={() => handleSendEmail(customer)}
                                                                    disabled={!customer.email}
                                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isSent
                                                                        ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400"
                                                                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                                                                        }`}
                                                                >
                                                                    {isSent ? (
                                                                        <>
                                                                            <Check className="w-3.5 h-3.5" />
                                                                            Re-enviar
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Send className="w-3 h-3" />
                                                                            Enviar Mail
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
                            <Pagination
                                page={page}
                                hasNextPage={customers?.length === limit}
                                onPageChange={setPage}
                                isLoading={isPlaceholderData}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
