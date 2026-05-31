"use client";

import { Printer, Download, X, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

interface SaleInvoiceProps {
    sale: {
        id: number;
        items: any[];
        total_amount_usd: number;
        total_tax_usd?: number;
        delivery_amount_usd?: number;
        created_at: string;
        payments: any[];
        customer_name?: string;
        customer_cedula?: string;
        customer_phone?: string;
        customer_address?: string;
    };
    rates: any;
    onClose: () => void;
}

export function SaleInvoice({ sale, rates, onClose }: SaleInvoiceProps) {
    const effectiveRate = sale.payments?.find(p => p.currency === 'VES')?.exchange_rate || rates?.BCV || 0;

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- Header ---
        doc.setFontSize(22);
        doc.setTextColor(63, 81, 181); // Indigo color
        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "VIVERES APP";
        doc.text(businessName.toUpperCase(), 20, 25);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`RIF: ${process.env.NEXT_PUBLIC_BUSINESS_RIF || "J-12345678-9"}`, 20, 32);
        doc.text(`Teléfono: ${process.env.NEXT_PUBLIC_BUSINESS_PHONE || "0412-1234567"}`, 20, 37);
        doc.text(`Dirección: ${process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Venezuela"}`, 20, 42);
        doc.text(`Email: ${process.env.NEXT_PUBLIC_BUSINESS_EMAIL || ""}`, 20, 47);

        // Invoice Info
        doc.setTextColor(0);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("FACTURA DE VENTA", pageWidth - 20, 25, { align: "right" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`N°: #${sale.id.toString().padStart(6, '0')}`, pageWidth - 20, 32, { align: "right" });
        doc.text(`Fecha: ${new Date(sale.created_at).toLocaleDateString('es-VE')}`, pageWidth - 20, 37, { align: "right" });
        doc.text(`Hora: ${new Date(sale.created_at).toLocaleTimeString('es-VE')}`, pageWidth - 20, 42, { align: "right" });

        doc.setLineWidth(0.5);
        doc.setDrawColor(200);
        doc.line(20, 48, pageWidth - 20, 48);

        // --- Client Info ---
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("DATOS DEL CLIENTE", 25, 58);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Nombre: ${sale.customer_name || "Cliente General"}`, 25, 65);
        doc.text(`CI/RIF: ${sale.customer_cedula || "N/A"}`, 25, 71);
        doc.text(`Teléfono: ${sale.customer_phone || "N/A"}`, 25, 77);
        doc.text(`Dirección: ${sale.customer_address || "N/A"}`, 25, 83);

        // --- Items Table ---
        const tableData = sale.items.map(item => {
            const productCode = item.code || item.barcode;
            const desc = productCode
                ? `${item.name || `Producto #${item.product_id}`}\nCódigo: ${productCode}`
                : (item.name || `Producto #${item.product_id}`);
            return [
                desc,
                item.quantity.toString(),
                `$${item.unit_price_usd.toFixed(2)}`,
                `$${(item.quantity * item.unit_price_usd).toFixed(2)}`,
                `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(item.quantity * item.unit_price_usd * effectiveRate)}`
            ];
        });

        autoTable(doc, {
            startY: 95,
            head: [['Descripción', 'Cant.', 'P. Unit (USD)', 'Total (USD)', 'Total (Bs)']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] },
            margin: { left: 20, right: 20 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // --- Totals ---
        const subtotal = sale.total_amount_usd - (sale.total_tax_usd || 0) - (sale.delivery_amount_usd || 0);
        const rightCol = pageWidth - 25;

        doc.setFontSize(10);
        doc.text("Subtotal:", rightCol - 40, finalY);
        doc.text(`$${subtotal.toFixed(2)}`, rightCol, finalY, { align: "right" });

        let currentY = finalY + 6;

        if (sale.total_tax_usd && sale.total_tax_usd > 0) {
            doc.text("IVA (16%):", rightCol - 40, currentY);
            doc.text(`$${sale.total_tax_usd.toFixed(2)}`, rightCol, currentY, { align: "right" });
            currentY += 6;
        }

        if (sale.delivery_amount_usd && sale.delivery_amount_usd > 0) {
            doc.text("Delivery:", rightCol - 40, currentY);
            doc.text(`$${sale.delivery_amount_usd.toFixed(2)}`, rightCol, currentY, { align: "right" });
            currentY += 6;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.rect(rightCol - 45, currentY - 4, 45, 10);
        doc.text("TOTAL:", rightCol - 40, currentY + 3);
        doc.text(`$${sale.total_amount_usd.toFixed(2)}`, rightCol - 2, currentY + 3, { align: "right" });

        doc.setFontSize(10);
        doc.text(`Equivalente: Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(sale.total_amount_usd * effectiveRate)}`, rightCol, currentY + 12, { align: "right" });

        // --- Payments ---
        doc.setFont("helvetica", "bold");
        doc.text("MÉTODOS DE PAGO", 20, finalY);
        doc.setFont("helvetica", "normal");
        let payY = finalY + 6;
        sale.payments.forEach(p => {
            const amountStr = p.currency === 'VES' ?
                `Bs. ${new Intl.NumberFormat('es-VE').format(p.amount)}` :
                `$${p.amount.toFixed(2)}`;
            doc.text(`• ${p.method.replace('_', ' ')}: ${amountStr}`, 20, payY);
            payY += 5;
        });

        // --- Footer ---
        doc.setFontSize(8);
        doc.setTextColor(150);
        const footerText = "Esta es una representación administrativa de la venta. Gracias por su preferencia.";
        doc.text(footerText, pageWidth / 2, 280, { align: "center" });
        doc.setFontSize(7);
        doc.text("Powered by ViveresApp - La solución tecnológica para tu negocio", pageWidth / 2, 285, { align: "center" });

        doc.save(`Factura_${sale.id}.pdf`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <div className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden`}>
                {/* Header Modal */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Vista Previa: Factura Formal</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Documento Administrativo</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Download className="h-4 w-4" />
                            Descargar Carta (Carta)
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-xl bg-white border border-gray-200 p-2.5 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body - Formal Invoice Preview */}
                <div className="p-8 max-h-[70vh] overflow-y-auto bg-gray-100/30 custom-scrollbar">
                    <div className="bg-white p-12 shadow-sm border border-gray-200 mx-auto max-w-[21cm] min-h-[29.7cm] flex flex-col gap-10 text-gray-800 font-sans">
                        {/* Header Section */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-black text-indigo-600 mb-2 tracking-tighter uppercase">{process.env.NEXT_PUBLIC_BUSINESS_NAME || "VIVERES APP"}</h1>
                                <div className="text-sm text-gray-500 font-medium space-y-1">
                                    <p>RIF: {process.env.NEXT_PUBLIC_BUSINESS_RIF || "J-12345678-9"}</p>
                                    <p>{process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Venezuela"}</p>
                                    <p>{process.env.NEXT_PUBLIC_BUSINESS_PHONE || "0412-1234567"}</p>
                                    {process.env.NEXT_PUBLIC_BUSINESS_EMAIL && <p>{process.env.NEXT_PUBLIC_BUSINESS_EMAIL}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-2xl font-black text-gray-900 mb-4">FACTURA</h2>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">N° de Control: <span className="text-indigo-600">#{sale.id.toString().padStart(6, '0')}</span></p>
                                    <p className="text-sm">Fecha: {new Date(sale.created_at).toLocaleDateString('es-VE')}</p>
                                    <p className="text-sm">Hora: {new Date(sale.created_at).toLocaleTimeString('es-VE')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="grid grid-cols-2 gap-8 border-t border-b border-gray-100 py-8">
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">FACTURAR A:</h3>
                                <div className="space-y-2">
                                    <p className="text-lg font-bold text-gray-900">{sale.customer_name || "Cliente General"}</p>
                                    {sale.customer_cedula && <p className="text-sm font-medium">CI/RIF: {sale.customer_cedula}</p>}
                                    {sale.customer_phone && <p className="text-sm text-gray-600">{sale.customer_phone}</p>}
                                    {sale.customer_address && <p className="text-sm text-gray-500">{sale.customer_address}</p>}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">MÉTODOS DE PAGO:</h3>
                                <div className="space-y-2">
                                    {sale.payments?.map((p, idx) => (
                                        <div key={idx} className="flex justify-between text-sm font-medium">
                                            <span className="text-gray-600 uppercase">{p.method.replace('_', ' ')}</span>
                                            <span>
                                                {p.currency === 'VES' ?
                                                    `Bs. ${new Intl.NumberFormat('es-VE').format(p.amount)}` :
                                                    `$${p.amount.toFixed(2)}`
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1">
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-indigo-600">
                                    <tr>
                                        <th className="py-4 font-black uppercase text-xs tracking-widest text-indigo-600">Descripción</th>
                                        <th className="py-4 font-black uppercase text-xs tracking-widest text-indigo-600 text-center">Cant.</th>
                                        <th className="py-4 font-black uppercase text-xs tracking-widest text-indigo-600 text-right">Unitario</th>
                                        <th className="py-4 font-black uppercase text-xs tracking-widest text-indigo-600 text-right">Total (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sale.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-4 text-sm font-bold text-gray-900">
                                                <div className="flex flex-col items-start">
                                                    <span>{item.name || `Producto #${item.product_id}`}</span>
                                                    {(item.code || item.barcode) && (
                                                        <span className="text-[10px] text-gray-400 font-mono mt-1 bg-gray-50 dark:bg-gray-800 rounded px-1.5 py-0.5 border border-gray-100 dark:border-gray-800">
                                                            Código: {item.code || item.barcode}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                                            <td className="py-4 text-sm text-gray-600 text-right">${item.unit_price_usd.toFixed(2)}</td>
                                            <td className="py-4 text-sm font-bold text-gray-900 text-right">${(item.quantity * item.unit_price_usd).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Totals */}
                        <div className="flex justify-end pt-8">
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Subtotal:</span>
                                    <span className="font-bold">${(sale.total_amount_usd - (sale.total_tax_usd || 0) - (sale.delivery_amount_usd || 0)).toFixed(2)}</span>
                                </div>
                                {sale.total_tax_usd && sale.total_tax_usd > 0 ? (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">IVA (16%):</span>
                                        <span className="font-bold">${sale.total_tax_usd.toFixed(2)}</span>
                                    </div>
                                ) : null}
                                {sale.delivery_amount_usd && sale.delivery_amount_usd > 0 ? (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Delivery:</span>
                                        <span className="font-bold">${sale.delivery_amount_usd.toFixed(2)}</span>
                                    </div>
                                ) : null}
                                <div className="flex justify-between items-center bg-indigo-600 text-white p-4 rounded-xl shadow-lg ring-4 ring-indigo-100">
                                    <span className="font-black uppercase text-xs tracking-widest">TOTAL:</span>
                                    <span className="text-2xl font-black">${sale.total_amount_usd.toFixed(2)}</span>
                                </div>
                                <div className="text-right px-2 pt-2">
                                    <p className="text-xs font-bold text-gray-400">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(sale.total_amount_usd * effectiveRate)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-20 border-t border-gray-100 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Gracias por su preferencia</p>
                            <p className="text-[8px] text-gray-300 font-medium mt-2 uppercase tracking-widest">Powered by ViveresApp 2026</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
