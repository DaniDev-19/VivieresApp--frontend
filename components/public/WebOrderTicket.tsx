"use client";

import React from "react";
import { Download, X, Printer } from "lucide-react";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";

interface WebOrderTicketProps {
    order: {
        cart: any[];
        totalUSD: number;
        totalBs: number;
        totalTax: number;
        fee: number;
        method: string;
        clientName: string;
        clientCedula: string;
        refCode: string;
    };
    bcvRate: number;
    onClose: () => void;
}

export function WebOrderTicket({ order, bcvRate, onClose }: WebOrderTicketProps) {
    const handleDownloadPDF = () => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [80, 250] // Ancho 80mm
        });

        const pageWidth = 80;
        let y = 8; // Margen superior inicial

        const centerText = (text: string, yPos: number, size = 10, bold = false) => {
            doc.setFont("courier", bold ? "bold" : "normal");
            doc.setFontSize(size);
            const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
            const x = (pageWidth - textWidth) / 2;
            doc.text(text, x, yPos);
        };

        const leftText = (text: string, yPos: number, size = 9, bold = false) => {
            doc.setFont("courier", bold ? "bold" : "normal");
            doc.setFontSize(size);
            doc.text(text, 4, yPos);
        };

        const rightText = (text: string, yPos: number, size = 9, bold = false) => {
            doc.setFont("courier", bold ? "bold" : "normal");
            doc.setFontSize(size);
            const textWidth = doc.getStringUnitWidth(text) * size / doc.internal.scaleFactor;
            doc.text(text, 76 - textWidth, yPos); 
        };

        const rowText = (left: string, right: string, yPos: number, size = 9, bold = false) => {
            doc.setFont("courier", bold ? "bold" : "normal");
            doc.setFontSize(size);
            doc.text(left, 4, yPos);
            const textWidth = doc.getStringUnitWidth(right) * size / doc.internal.scaleFactor;
            doc.text(right, 76 - textWidth, yPos);
        };

        const centerImage = (imgData: string, yPos: number, width: number, height: number) => {
            const x = (pageWidth - width) / 2;
            doc.addImage(imgData, 'PNG', x, yPos, width, height);
        };

        // Header
        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "VIVERES APP";
        centerText(businessName.toUpperCase(), y, 14, true); y += 6;
        centerText("TICKET DE PEDIDO WEB", y, 9, true); y += 5;

        (doc as any).setLineDash([1, 1], 0);
        doc.line(4, y, 76, y); y += 4; 

        centerText(`RIF: ${process.env.NEXT_PUBLIC_BUSINESS_RIF || "J-12345678-9"}`, y, 9, true); y += 4;
        centerText(`Telf: ${process.env.NEXT_PUBLIC_BUSINESS_PHONE || "0412-1234567"}`, y, 9, true); y += 5;
        doc.line(4, y, 76, y); y += 5;

        // Info Pedido
        leftText(`FECHA: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE')}`, y, 8); y += 6;
        leftText("CLIENTE:", y, 8, true); y += 4;
        leftText(order.clientName.substring(0, 35), y, 8); y += 4; 
        if(order.clientCedula) { leftText(`CI/RIF: ${order.clientCedula}`, y, 8); y += 4; }
        doc.line(4, y, 76, y); y += 5;

        // Tabla
        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.text("DESCRIPCION", 4, y);
        doc.text("CNT", 46, y); 
        doc.text("TOTAL", 64, y);
        y += 2;
        doc.line(4, y, 76, y); y += 4;

        order.cart.forEach((item) => {
            const itemTotal = item.quantity * item.price;
            const itemTotalBs = itemTotal * bcvRate;

            doc.setFont("courier", "normal");
            doc.setFontSize(9);

            const splitName = doc.splitTextToSize(item.name, 38);
            doc.text(splitName, 4, y);
            doc.text(item.quantity.toString(), 48, y);
            
            const priceStr = `$${itemTotal.toFixed(2)}`;
            const priceWidth = doc.getStringUnitWidth(priceStr) * 9 / doc.internal.scaleFactor;
            doc.text(priceStr, 76 - priceWidth, y);

            let lineHeight = splitName.length * 3.5;
            if (lineHeight < 4) lineHeight = 4;

            doc.setFontSize(7);
            const bsStr = `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(itemTotalBs)}`;
            const bsWidth = doc.getStringUnitWidth(bsStr) * 7 / doc.internal.scaleFactor;
            doc.text(bsStr, 76 - bsWidth, y + 3);

            y += lineHeight + 3;
        });

        y += 1;
        doc.line(4, y, 76, y); y += 5;

        // Totales
        const subtotal = order.totalUSD - order.totalTax - order.fee;
        const subtotalBs = subtotal * bcvRate;

        rowText("SUBTOTAL:", `$${subtotal.toFixed(2)}`, y, 9, true); y += 3;
        rightText(`Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(subtotalBs)}`, y, 7); y += 4;

        if (order.totalTax > 0) {
            rowText("IVA:", `$${order.totalTax.toFixed(2)}`, y, 9, true); y += 3;
            rightText(`Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(order.totalTax * bcvRate)}`, y, 7); y += 4;
        }

        if (order.fee > 0) {
            rowText("DELIVERY:", `$${order.fee.toFixed(2)}`, y, 9, true); y += 3;
            rightText(`Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(order.fee * bcvRate)}`, y, 7); y += 4;
        }

        y += 2;
        doc.setFontSize(12);
        rowText("TOTAL:", `$${order.totalUSD.toFixed(2)}`, y, 11, true); y += 5;
        rightText(`Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(order.totalBs)}`, y, 9, true); y += 6;

        y += 3;
        leftText("METODO DE PAGO:", y, 8, true); y += 4;
        rowText(order.method, `REF: ${order.refCode}`, y, 8); y += 6;

        // Códigos
        try {
            const barcodeCanvas = document.querySelector('#web-ticket-barcode canvas') as HTMLCanvasElement;
            if (barcodeCanvas) {
                const barcodeImg = barcodeCanvas.toDataURL('image/png');
                y += 2;
                centerImage(barcodeImg, y, 40, 15);
                y += 18;
            }

            const qrCanvas = document.querySelector('#web-ticket-qr canvas') as HTMLCanvasElement;
            if (qrCanvas) {
                const qrImg = qrCanvas.toDataURL('image/png');
                y += 2;
                centerImage(qrImg, y, 30, 30);
                y += 32;
            }
        } catch (e) {
            console.error("Error capturing canvas:", e);
        }

        y += 2;
        centerText("¡TU PEDIDO ESTA SIENDO PROCESADO!", y, 8, true); y += 5;
        centerText("Muestra este ticket en tienda", y, 7); y += 5;
        doc.setFont("courier", "italic");
        centerText("Powered by ViveresApp", y, 6);

        doc.save(`Ticket_Pedido_${Date.now()}.pdf`);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">

                <div className="flex gap-2 justify-center mb-4 sticky top-0 bg-white py-2 z-10 border-b border-gray-100">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Descargar PDF
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                        title="Imprimir"
                    >
                        <Printer className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-red-50 p-3 text-red-500 hover:bg-red-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* VISTA PREVIA */}
                <div id="printable-ticket" className="ticket-body flex flex-col items-center text-center font-mono text-[11px] text-black leading-tight bg-white p-4">
                    <div className="mb-2 w-full">
                        <h2 className="text-xl font-bold uppercase tracking-widest mb-1">{process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App"}</h2>
                        <h3 className="text-sm font-bold uppercase mb-2">Ticket de Pedido Web</h3>
                        <div className="border-y border-dashed border-gray-400 py-1 uppercase font-bold text-[9px]">
                            RIF: {process.env.NEXT_PUBLIC_BUSINESS_RIF || "J-12345678-9"} <br /> Telf: {process.env.NEXT_PUBLIC_BUSINESS_PHONE || "0412-1234567"}
                        </div>
                    </div>

                    <div className="w-full border border-dashed border-gray-400 rounded p-1.5 mb-2 text-left bg-gray-50">
                        <div className="text-[9px] font-bold border-b border-gray-200 mb-1 pb-0.5">DATOS DEL CLIENTE</div>
                        <div className="text-[10px] font-medium">{order.clientName}</div>
                        <div className="text-[9px] text-gray-600">CI/RIF: {order.clientCedula}</div>
                    </div>

                    <div className="w-full border-b border-dashed border-gray-400 pb-1 mb-1">
                        <div className="flex w-full text-[9px] font-bold border-b border-gray-300 mb-1 pb-1">
                            <span className="w-[45%] text-left">DESCRIPCION</span>
                            <span className="w-[10%] text-center">CNT</span>
                            <span className="w-[45%] text-right">TOTAL</span>
                        </div>
                        {order.cart.map((item, idx) => {
                            const itemTotal = item.quantity * item.price;
                            return (
                                <div key={idx} className="flex flex-col w-full py-0.5 text-[10px] border-b border-dotted border-gray-200 last:border-0">
                                    <div className="flex w-full justify-between">
                                        <span className="w-[45%] text-left wrap-break-word pr-1 font-medium">{item.name}</span>
                                        <span className="w-[10%] text-center">{item.quantity}</span>
                                        <span className="w-[45%] text-right font-bold">${itemTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex w-full justify-end">
                                        <span className="text-[8px] text-gray-500 italic">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(itemTotal * bcvRate)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full flex justify-between items-center mt-2 border-b border-dashed border-gray-400 pb-2">
                        <span className="text-[12px] font-black uppercase">TOTAL:</span>
                        <div className="text-right">
                            <span className="block text-[14px] font-black">${order.totalUSD.toFixed(2)}</span>
                            <span className="block text-[10px] font-bold text-gray-700">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(order.totalBs)}</span>
                        </div>
                    </div>

                    <div className="w-full mt-1 border-b border-dashed border-gray-400 pb-2">
                        <div className="text-[9px] font-bold mb-1 text-left uppercase border-b border-gray-200">Método de Pago</div>
                        <div className="flex justify-between text-[9px]">
                            <span className="uppercase font-medium">{order.method}</span>
                            <span>REF: {order.refCode}</span>
                        </div>
                    </div>

                    <div className="w-full mt-4 flex flex-col items-center gap-2 pt-2">
                        <div id="web-ticket-barcode" className="scale-90 origin-center">
                            <Barcode
                                value={Date.now().toString().substring(5)} // Dummy value since we don't have order ID yet
                                width={1.2}
                                height={30}
                                fontSize={10}
                                displayValue={false}
                                renderer="canvas"
                            />
                        </div>
                        <div id="web-ticket-qr" className="mt-1 flex flex-col items-center">
                            <QRCodeCanvas
                                value={JSON.stringify({ client: order.clientName, ref: order.refCode })}
                                size={60}
                                level="M"
                            />
                            <p className="text-[8px] text-gray-400 mt-1">Tu pedido está en proceso</p>
                            <p className="text-[7px] text-gray-300 mt-2 font-bold uppercase tracking-widest">Powered by ViveresApp</p>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-ticket, #printable-ticket * { visibility: visible; }
                    #printable-ticket { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
}
