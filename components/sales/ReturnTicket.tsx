"use client";

import React from "react";
import { Download, X } from "lucide-react";
import Barcode from "react-barcode";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import type { Return } from "@/types";

interface ReturnTicketProps {
    returnData: Return;
    rates: any;
    onClose: () => void;
}

export function ReturnTicket({ returnData, rates, onClose }: ReturnTicketProps) {
    const effectiveRate = rates?.BCV || 0;

    const handleDownloadPDF = () => {
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [80, 250]
        });

        const pageWidth = 80;
        let y = 8;

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

        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "VIVERES APP";
        centerText(businessName.toUpperCase(), y, 14, true); y += 6;
        centerText("DEVOLUCIÓN", y, 12, true); y += 6;
        centerText(process.env.NEXT_PUBLIC_BUSINESS_DESCRIPTION || "\"Calidad y servicio a tu puerta\"", y, 8); y += 5;

        (doc as any).setLineDash([1, 1], 0);
        doc.line(4, y, 76, y); y += 4;

        centerText(`RIF: ${process.env.NEXT_PUBLIC_BUSINESS_RIF || "J-12345678-9"}`, y, 9, true); y += 4;
        centerText(`REF: ${process.env.NEXT_PUBLIC_BUSINESS_PHONE || "0412-1234567"}`, y, 9, true); y += 5;
        doc.line(4, y, 76, y); y += 5;

        leftText(`DEVOLUCIÓN: #${returnData.id.toString().padStart(6, '0')}`, y, 9, true); y += 5;
        leftText(`VENTA ORIGINAL: #${returnData.sale_id.toString().padStart(6, '0')}`, y, 8, true); y += 4;
        leftText(`FECHA: ${new Date(returnData.created_at).toLocaleString('es-VE')}`, y, 8); y += 6;

        if (returnData.credit_note_code) {
            leftText(`NOTA DE CRÉDITO: ${returnData.credit_note_code}`, y, 8, true); y += 5;
        }
        leftText(`MÉTODO: ${returnData.refund_method === 'cash' ? 'EFECTIVO' : returnData.refund_method === 'credit_note' ? 'NOTA DE CRÉDITO' : 'MÉTODO ORIGINAL'}`, y, 8); y += 5;

        if (returnData.reason) {
            leftText(`MOTIVO: ${returnData.reason}`, y, 8); y += 5;
        }

        doc.line(4, y, 76, y); y += 5;

        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.text("PRODUCTO", 4, y);
        doc.text("CNT", 46, y);
        doc.text("SUBTOTAL", 62, y);
        y += 2;
        doc.line(4, y, 76, y); y += 4;

        returnData.items.forEach((item) => {
            doc.setFont("courier", "normal");
            doc.setFontSize(9);

            const splitName = doc.splitTextToSize(item.product_name || `Item #${item.product_id}`, 38);
            doc.text(splitName, 4, y);
            doc.text(item.quantity.toString(), 48, y);

            const priceStr = `$${item.subtotal_usd.toFixed(2)}`;
            const priceWidth = doc.getStringUnitWidth(priceStr) * 9 / doc.internal.scaleFactor;
            doc.text(priceStr, 76 - priceWidth, y);

            let lineHeight = splitName.length * 3.5;
            if (lineHeight < 4) lineHeight = 4;

            const bsStr = `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(item.subtotal_usd * effectiveRate)}`;
            const bsWidth = doc.getStringUnitWidth(bsStr) * 7 / doc.internal.scaleFactor;
            doc.setFontSize(7);
            doc.text(bsStr, 76 - bsWidth, y + 3);

            y += lineHeight + 3;
        });

        y += 1;
        doc.line(4, y, 76, y); y += 5;

        doc.setFontSize(12);
        rowText("TOTAL REEMBOLSO:", `$${returnData.total_refund_usd.toFixed(2)}`, y, 11, true); y += 5;

        const totalBsStr = `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(returnData.total_refund_usd * effectiveRate)}`;
        rightText(totalBsStr, y, 9, true); y += 6;

        y += 2;

        try {
            const barcodeCanvas = document.querySelector('#return-ticket-barcode canvas') as HTMLCanvasElement;
            if (barcodeCanvas) {
                const barcodeImg = barcodeCanvas.toDataURL('image/png');
                y += 2;
                centerImage(barcodeImg, y, 40, 15);
                y += 18;
            }

            const qrCanvas = document.querySelector('#return-ticket-qr canvas') as HTMLCanvasElement;
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

        y += 2;
        centerText("¡GRACIAS POR SU PREFERENCIA!", y, 9, true); y += 5;
        doc.setFont("courier", "italic");
        centerText("Powered by ViveresApp", y, 6);

        doc.save(`Devolucion_${returnData.id}.pdf`);
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

                <div className="ticket-body flex flex-col items-center text-center font-mono text-[11px] text-black leading-tight">
                    <div className="mb-2 w-full">
                        <h2 className="text-xl font-bold uppercase tracking-widest mb-1">{process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App"}</h2>
                        <h3 className="text-lg font-bold uppercase text-red-600 mb-1">DEVOLUCIÓN</h3>
                        <p className="text-[10px] text-gray-500 italic mb-2">{process.env.NEXT_PUBLIC_BUSINESS_DESCRIPTION || "\"Calidad y servicio a tu puerta\""}</p>
                        <div className="border-y border-dashed border-gray-400 py-1 uppercase font-bold text-[9px]">
                            RIF: {process.env.NEXT_PUBLIC_BUSINESS_RIF || "J-12345678-9"} <br /> REF: {process.env.NEXT_PUBLIC_BUSINESS_PHONE || "0412-1234567"}
                        </div>
                    </div>

                    <div className="flex w-full justify-between items-center my-2 text-[10px]">
                        <span className="font-bold text-red-600">#DEV-{returnData.id.toString().padStart(6, '0')}</span>
                        <span>{new Date(returnData.created_at).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>

                    <div className="w-full bg-red-50 border border-red-200 rounded p-1.5 mb-2 text-left">
                        <div className="text-[9px] font-bold">VENTA ORIGINAL: #{returnData.sale_id.toString().padStart(6, '0')}</div>
                    </div>

                    {returnData.credit_note_code && (
                        <div className="w-full bg-blue-50 border border-blue-200 rounded p-1.5 mb-2 text-left">
                            <div className="text-[9px] font-bold text-blue-700">NOTA DE CRÉDITO: {returnData.credit_note_code}</div>
                        </div>
                    )}

                    <div className="w-full text-[9px] mb-1 text-left">
                        <span className="font-bold">MÉTODO: </span>
                        <span>{returnData.refund_method === 'cash' ? 'EFECTIVO' : returnData.refund_method === 'credit_note' ? 'NOTA DE CRÉDITO' : 'MÉTODO ORIGINAL'}</span>
                    </div>

                    {returnData.reason && (
                        <div className="w-full text-[9px] mb-1 text-left">
                            <span className="font-bold">MOTIVO: </span>
                            <span>{returnData.reason}</span>
                        </div>
                    )}

                    <div className="w-full border-b border-dashed border-gray-400 pb-1 mb-1">
                        <div className="flex w-full text-[9px] font-bold border-b border-gray-300 mb-1 pb-1">
                            <span className="w-[45%] text-left">PRODUCTO</span>
                            <span className="w-[10%] text-center">CNT</span>
                            <span className="w-[45%] text-right">SUBTOTAL</span>
                        </div>
                        {returnData.items.map((item, idx) => {
                            const itemTotal = item.subtotal_usd;
                            return (
                                <div key={idx} className="flex flex-col w-full py-0.5 text-[10px] border-b border-dotted border-gray-200 last:border-0">
                                    <div className="flex w-full justify-between">
                                        <span className="w-[45%] text-left wrap-break-word pr-1 font-medium">{item.product_name || `Item #${item.product_id}`}</span>
                                        <span className="w-[10%] text-center">{item.quantity}</span>
                                        <span className="w-[45%] text-right font-bold">${itemTotal.toFixed(2)}</span>
                                    </div>
                                    {item.barcode && (
                                        <div className="flex w-full justify-between">
                                            <span className="w-[45%] text-left text-[8px] italic text-gray-500">Código: {item.barcode}</span>
                                        </div>
                                    )}
                                    <div className="flex w-full justify-end">
                                        <span className="text-[8px] text-gray-500 italic">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(itemTotal * effectiveRate)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="w-full flex justify-between items-center mt-2 border-t-2 border-red-400 pt-2">
                        <span className="text-[12px] font-black text-red-600 uppercase">TOTAL REEMBOLSO:</span>
                        <div className="text-right">
                            <span className="block text-[14px] font-black text-red-600">${returnData.total_refund_usd.toFixed(2)}</span>
                            <span className="block text-[10px] font-bold text-gray-700">Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(returnData.total_refund_usd * effectiveRate)}</span>
                        </div>
                    </div>

                    <div className="w-full mt-4 flex flex-col items-center gap-2 pt-2 border-t border-dashed border-gray-400">
                        <div id="return-ticket-barcode" className="scale-90 origin-center">
                            <Barcode
                                value={`DEV-${returnData.id.toString().padStart(10, '0')}`}
                                width={1.2}
                                height={30}
                                fontSize={10}
                                displayValue={false}
                                renderer="canvas"
                            />
                        </div>
                        <div id="return-ticket-qr" className="mt-1 flex flex-col items-center">
                            <QRCodeCanvas
                                value={JSON.stringify({
                                    id: returnData.id,
                                    type: 'return',
                                    sale_id: returnData.sale_id,
                                    total: returnData.total_refund_usd,
                                    date: returnData.created_at
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
        </div>
    );
}
