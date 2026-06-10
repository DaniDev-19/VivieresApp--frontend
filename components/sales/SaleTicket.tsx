"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Printer, Download, X } from "lucide-react";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";

interface SaleTicketProps {
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
    };
    rates: any;
    onClose: () => void;
}

export function SaleTicket({ sale, rates, onClose }: SaleTicketProps) {
    const effectiveRate = sale.payments?.find(p => p.currency === 'VES')?.exchange_rate || rates?.BCV || 0;

    const handleDownloadPDF = () => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [80, 250] // Ancho 80mm, Alto variable estimado
        });

        const pageWidth = 80;
        let y = 8; // Margen superior inicial

        // --- Helpers ---
        // Centrar texto calculando ancho
        const centerText = (text: string, yPos: number, size = 10, bold = false) => {
            doc.setFont("courier", bold ? "bold" : "normal");
            doc.setFontSize(size);
            const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
            // Cálculo preciso del centro: (AnchoPagina - AnchoTexto) / 2
            const x = (pageWidth - textWidth) / 2;
            doc.text(text, x, yPos);
        };

        // Texto izquierdo con margen de 4mm
        const leftText = (text: string, yPos: number, size = 9, bold = false) => {
            doc.setFont("courier", bold ? "bold" : "normal");
            doc.setFontSize(size);
            doc.text(text, 4, yPos);
        };

        // Texto derecho con margen de 4mm
        const rightText = (text: string, yPos: number, size = 9, bold = false) => {
            doc.setFont("courier", bold ? "bold" : "normal");
            doc.setFontSize(size);
            const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
            doc.text(text, 76 - textWidth, yPos); // 80 - 4 = 76
        };

        // Fila justificada (Izq ... Der)
        const rowText = (left: string, right: string, yPos: number, size = 9, bold = false) => {
            doc.setFont("courier", bold ? "bold" : "normal");
            doc.setFontSize(size);

            // Izquierda
            doc.text(left, 4, yPos);

            // Derecha
            const textWidth = doc.getStringUnitWidth(right) * size / doc.internal.scaleFactor;
            doc.text(right, 76 - textWidth, yPos);
        };

        // Centrar imagen (QR/Barcode)
        const centerImage = (imgData: string, yPos: number, width: number, height: number) => {
            const x = (pageWidth - width) / 2;
            doc.addImage(imgData, 'PNG', x, yPos, width, height);
        };

        // --- CONTENIDO DEL PDF ---

        // 1. Header
        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "VIVERES APP";
        centerText(businessName.toUpperCase(), y, 14, true); y += 6;
        centerText(process.env.NEXT_PUBLIC_BUSINESS_DESCRIPTION || "\"Calidad y servicio a tu puerta\"", y, 8); y += 5;

        (doc as any).setLineDash([1, 1], 0);
        doc.line(4, y, 76, y); y += 4; // Separador

        centerText(`RIF: ${process.env.NEXT_PUBLIC_BUSINESS_RIF || "J-12345678-9"}`, y, 9, true); y += 4;
        centerText(`REF: ${process.env.NEXT_PUBLIC_BUSINESS_PHONE || "0412-1234567"}`, y, 9, true); y += 5;
        doc.line(4, y, 76, y); y += 5;

        // 2. Info Venta
        leftText(`FACTURA: #${sale.id.toString().padStart(6, '0')}`, y, 9, true); y += 5;
        leftText(`FECHA: ${new Date(sale.created_at).toLocaleDateString('es-VE')} ${new Date(sale.created_at).toLocaleTimeString('es-VE')}`, y, 8); y += 6;

        // Datos Cliente si existen
        if (sale.customer_name || sale.customer_cedula) {
            leftText("CLIENTE:", y, 8, true); y += 4;
            if (sale.customer_name) { leftText(sale.customer_name.substring(0, 35), y, 8); y += 4; }
            if (sale.customer_cedula) { leftText(`CI: ${sale.customer_cedula}`, y, 8); y += 4; }
            doc.line(4, y, 76, y); y += 5;
        }

        // 3. Tabla de Productos
        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.text("DESCRIPCION", 4, y);
        doc.text("CNT", 46, y); // Ajustado para mejor distribución
        doc.text("TOTAL", 64, y);
        y += 2;
        doc.line(4, y, 76, y); y += 4;

        sale.items.forEach((item) => {
            const itemTotal = item.quantity * item.unit_price_usd;
            const itemTotalBs = itemTotal * effectiveRate;

            doc.setFont("courier", "normal");
            doc.setFontSize(9);

            // Nombre producto (wrap a 38 caracteres para evitar desbordes)
            const splitName = doc.splitTextToSize(item.name || `Item #${item.product_id}`, 38);
            doc.text(splitName, 4, y);

            // Cantidad
            doc.text(item.quantity.toString(), 48, y);

            // Precio Total USD
            const priceStr = `$${itemTotal.toFixed(2)}`;
            const priceWidth = doc.getStringUnitWidth(priceStr) * 9 / doc.internal.scaleFactor;
            doc.text(priceStr, 76 - priceWidth, y);

            // Calcular altura para la siguiente línea
            let lineHeight = splitName.length * 3.5;
            if (lineHeight < 4) lineHeight = 4;

            // Código del producto (debajo del nombre)
            const productCode = item.code || item.barcode;
            if (productCode) {
                doc.setFontSize(7);
                doc.setFont("courier", "italic");
                doc.text(`Código: ${productCode}`, 4, y + lineHeight - 1);
                doc.setFont("courier", "normal");
                lineHeight += 3;
            }

            // Precio en Bs (debajo del precio USD)
            doc.setFontSize(7);
            const bsStr = `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(itemTotalBs)}`;
            const bsWidth = doc.getStringUnitWidth(bsStr) * 7 / doc.internal.scaleFactor;
            doc.text(bsStr, 76 - bsWidth, y + 3 + (productCode ? 3 : 0));

            y += lineHeight + 3;
        });

        y += 1;
        doc.line(4, y, 76, y); y += 5;

        // 4. Totales
        const subtotal = sale.total_amount_usd - (sale.total_tax_usd || 0) - (sale.delivery_amount_usd || 0);
        const subtotalBs = subtotal * effectiveRate;

        rowText("SUBTOTAL:", `$${subtotal.toFixed(2)}`, y, 9, true); y += 3;
        const subBsStr = `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(subtotalBs)}`;
        rightText(subBsStr, y, 7); y += 4;

        if (sale.total_tax_usd && sale.total_tax_usd > 0) {
            rowText("IVA:", `$${sale.total_tax_usd.toFixed(2)}`, y, 9, true); y += 3;
            const taxBsStr = `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(sale.total_tax_usd * effectiveRate)}`;
            rightText(taxBsStr, y, 7); y += 4;
        }

        if (sale.delivery_amount_usd && sale.delivery_amount_usd > 0) {
            rowText("DELIVERY:", `$${sale.delivery_amount_usd.toFixed(2)}`, y, 9, true); y += 3;
            const delBsStr = `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(sale.delivery_amount_usd * effectiveRate)}`;
            rightText(delBsStr, y, 7); y += 4;
        }

        y += 2;
        doc.setFontSize(12);
        rowText("TOTAL:", `$${sale.total_amount_usd.toFixed(2)}`, y, 11, true); y += 5;

        const totalBsStr = `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(sale.total_amount_usd * effectiveRate)}`;
        rightText(totalBsStr, y, 9, true); y += 6;

        // 5. Pagos
        y += 3;
        leftText("METODOS DE PAGO:", y, 8, true); y += 4;
        sale.payments.forEach(p => {
            const amountStr = p.currency === 'VES' ?
                `Bs. ${new Intl.NumberFormat('es-VE').format(p.amount)}` :
                `$${p.amount.toFixed(2)}`;
            rowText(p.method.replace('_', ' '), amountStr, y, 8); y += 4;
        });

        y += 2;

        // 7. Códigos (Captura robusta)
        try {
            // Barcode
            const barcodeCanvas = document.querySelector('#ticket-barcode canvas') as HTMLCanvasElement;
            if (barcodeCanvas) {
                const barcodeImg = barcodeCanvas.toDataURL('image/png');
                y += 2;
                centerImage(barcodeImg, y, 40, 15);
                y += 18;
            }

            // QR
            const qrCanvas = document.querySelector('#ticket-qr canvas') as HTMLCanvasElement;
            if (qrCanvas) {
                const qrImg = qrCanvas.toDataURL('image/png');
                y += 2;
                centerImage(qrImg, y, 30, 30);
                y += 32;
                centerText("Escanea para verificar", y, 7); y += 5;
            }
        } catch (e) {
            console.error("Error capturing canvas for PDF:", e);
        }

        // 8. Footer final
        y += 2;
        centerText("¡GRACIAS POR SU COMPRA!", y, 9, true); y += 5;
        centerText("No se aceptan devoluciones despues de 24h", y, 7); y += 5;
        doc.setFont("courier", "italic");
        centerText("Powered by ViveresApp", y, 6);

        // Guardar
        doc.save(`Ticket_Venta_${sale.id}.pdf`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">

                <div className="absolute -top-12 right-0 flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Descargar PDF
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-full bg-gray-800 p-2 text-white hover:bg-gray-700 shadow-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* VISTA PREVIA EN PANTALLA (HTML) */}
                <div className="ticket-body flex flex-col items-center text-center font-mono text-[11px] text-black leading-tight">
                    <div className="mb-2 w-full">
                        <h2 className="text-xl font-bold uppercase tracking-widest mb-1">{process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App"}</h2>
                        <p className="text-[10px] text-gray-500 italic mb-2">{process.env.NEXT_PUBLIC_BUSINESS_DESCRIPTION || "\"Calidad y servicio a tu puerta\""}</p>
                        <div className="border-y border-dashed border-gray-400 py-1 uppercase font-bold text-[9px]">
                            RIF: {process.env.NEXT_PUBLIC_BUSINESS_RIF || "J-12345678-9"} <br /> REF: {process.env.NEXT_PUBLIC_BUSINESS_PHONE || "0412-1234567"}
                        </div>
                    </div>

                    <div className="flex w-full justify-between items-center my-2 text-[10px]">
                        <span className="font-bold">FACTURA: #{sale.id.toString().padStart(6, '0')}</span>
                        <span>{new Date(sale.created_at).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>

                    {(sale.customer_name || sale.customer_cedula) && (
                        <div className="w-full border border-dashed border-gray-400 rounded p-1.5 mb-2 text-left bg-gray-50">
                            <div className="text-[9px] font-bold border-b border-gray-200 mb-1 pb-0.5">DATOS DEL CLIENTE</div>
                            {sale.customer_name && <div className="text-[10px] font-medium">{sale.customer_name}</div>}
                            <div className="flex gap-2 text-[9px] text-gray-600">
                                {sale.customer_cedula && <span>CI: {sale.customer_cedula}</span>}
                            </div>
                        </div>
                    )}

                    <div className="w-full border-b border-dashed border-gray-400 pb-1 mb-1">
                        <div className="flex w-full text-[9px] font-bold border-b border-gray-300 mb-1 pb-1">
                            <span className="w-[45%] text-left">DESCRIPCION</span>
                            <span className="w-[10%] text-center">CNT</span>
                            <span className="w-[45%] text-right">TOTAL</span>
                        </div>
                        {sale.items.map((item, idx) => {
                            const itemTotal = item.quantity * item.unit_price_usd;
                            const itemTotalBs = itemTotal * effectiveRate;
                            return (
                                <div key={idx} className="flex flex-col w-full py-0.5 text-[10px] border-b border-dotted border-gray-200 last:border-0">
                                    <div className="flex w-full justify-between">
                                        <span className="w-[45%] text-left wrap-break-word pr-1 font-medium">{item.name || `Item #${item.product_id}`}</span>
                                        <span className="w-[10%] text-center">{item.quantity}</span>
                                        <span className="w-[45%] text-right font-bold">${itemTotal.toFixed(2)}</span>
                                    </div>
                                    {(item.code || item.barcode) && (
                                        <div className="flex w-full justify-between">
                                            <span className="w-[45%] text-left text-[8px] italic text-gray-500">Código: {item.code || item.barcode}</span>
                                        </div>
                                    )}
                                    <div className="flex w-full justify-end">
                                        <span className="text-[8px] text-gray-500 italic">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(itemTotalBs)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full flex flex-col gap-0.5 mt-1 border-b border-dashed border-gray-400 pb-1">
                        <div className="flex justify-between text-[10px]">
                            <span className="font-bold text-gray-600">SUBTOTAL:</span>
                            <div className="text-right">
                                <span className="block font-bold">${(sale.total_amount_usd - (sale.total_tax_usd || 0) - (sale.delivery_amount_usd || 0)).toFixed(2)}</span>
                                <span className="block text-[8px] text-gray-500">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format((sale.total_amount_usd - (sale.total_tax_usd || 0) - (sale.delivery_amount_usd || 0)) * effectiveRate)}</span>
                            </div>
                        </div>

                        {(sale.total_tax_usd && sale.total_tax_usd > 0) ? (
                            <div className="flex justify-between text-[10px]">
                                <span className="font-bold text-gray-600">IVA:</span>
                                <div className="text-right">
                                    <span className="block font-bold">${(sale.total_tax_usd).toFixed(2)}</span>
                                    <span className="block text-[8px] text-gray-500">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format((sale.total_tax_usd) * effectiveRate)}</span>
                                </div>
                            </div>
                        ) : null}

                        {(sale.delivery_amount_usd && sale.delivery_amount_usd > 0) ? (
                            <div className="flex justify-between text-[10px]">
                                <span className="font-bold text-gray-600">DELIVERY:</span>
                                <div className="text-right">
                                    <span className="block font-bold">${sale.delivery_amount_usd.toFixed(2)}</span>
                                    <span className="block text-[8px] text-gray-500">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(sale.delivery_amount_usd * effectiveRate)}</span>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="w-full flex justify-between items-center mt-2 border-b border-dashed border-gray-400 pb-2">
                        <span className="text-[12px] font-black uppercase">TOTAL:</span>
                        <div className="text-right">
                            <span className="block text-[14px] font-black text-black">${sale.total_amount_usd.toFixed(2)}</span>
                            <span className="block text-[10px] font-bold text-gray-700">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(sale.total_amount_usd * effectiveRate)}</span>
                        </div>
                    </div>

                    {/* Rate ocultada por solicitud del usuario */}

                    <div className="w-full mt-1">
                        <div className="text-[9px] font-bold mb-1 text-left uppercase border-b border-gray-200">Métodos de Pago</div>
                        {sale.payments?.map((p, idx) => (
                            <div key={idx} className="flex justify-between text-[9px] mb-0.5">
                                <span className="uppercase text-gray-600">{p.method.replace('_', ' ')}</span>
                                <span className="font-medium">
                                    {p.currency === 'VES' ?
                                        `Bs. ${new Intl.NumberFormat('es-VE').format(p.amount)}` :
                                        `$${p.amount.toFixed(2)}`
                                    }
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="w-full mt-4 flex flex-col items-center gap-2 pt-2 border-t border-dashed border-gray-400">
                        {/* Barcode Canvas - Renderer Canvas IMPORTANTE para poder exportar a PDF */}
                        <div id="ticket-barcode" className="scale-90 origin-center">
                            <Barcode
                                value={sale.id.toString().padStart(10, '0')}
                                width={1.2}
                                height={30}
                                fontSize={10}
                                displayValue={false}
                                renderer="canvas"
                            />
                        </div>

                        {/* QR Canvas - QRCodeCanvas IMPORTANTE para exportar */}
                        <div id="ticket-qr" className="mt-1 flex flex-col items-center">
                            <QRCodeCanvas
                                value={JSON.stringify({
                                    id: sale.id,
                                    total: sale.total_amount_usd,
                                    date: sale.created_at
                                })}
                                size={60}
                                level="M"
                            />
                            <p className="text-[8px] text-gray-400 mt-1">Escanea para verificar</p>
                            <p className="text-[7px] text-gray-300 mt-2 font-bold uppercase tracking-widest">Powered by ViveresApp</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Ocultamos estilos de impresión nativos ya que usamos PDF directo */}
            <style jsx global>{`
                /* Ningún estilo print necesario ahora */
            `}</style>
        </div>
    );
}
