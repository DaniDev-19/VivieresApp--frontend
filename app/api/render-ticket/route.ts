import { NextRequest, NextResponse } from "next/server";
import React from "react";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type = "sale", sale, returnData, exchangeData, rates } = body;

        const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Víveres App";
        const businessDescription = process.env.NEXT_PUBLIC_BUSINESS_DESCRIPTION || "Control de Ventas & Facturación";
        const businessRif = process.env.NEXT_PUBLIC_BUSINESS_RIF || "J-00000000-0";
        const businessPhone = process.env.NEXT_PUBLIC_BUSINESS_PHONE || "0416-7659711";

        // Dynamic import of react-dom/server to prevent Next.js from complaining
        const { renderToString } = await import("react-dom/server");

        let html = "";

        if (type === "return") {
            if (!returnData) {
                return NextResponse.json({ error: "Faltan los datos de la devolución" }, { status: 400 });
            }
            const { ReturnTicketEmail } = await import("@/components/emails/ReturnTicketEmail");
            html = renderToString(
                React.createElement(ReturnTicketEmail, {
                    returnData,
                    rates,
                    businessName,
                    businessDescription,
                    businessRif,
                    businessPhone
                })
            );
        } else if (type === "exchange") {
            if (!exchangeData) {
                return NextResponse.json({ error: "Faltan los datos del cambio" }, { status: 400 });
            }
            const { ExchangeTicketEmail } = await import("@/components/emails/ExchangeTicketEmail");
            html = renderToString(
                React.createElement(ExchangeTicketEmail, {
                    exchangeData,
                    rates,
                    businessName,
                    businessDescription,
                    businessRif,
                    businessPhone
                })
            );
        } else {
            // Default: sale ticket
            if (!sale) {
                return NextResponse.json({ error: "Faltan los datos de la venta" }, { status: 400 });
            }
            const { SaleTicketEmail } = await import("@/components/emails/SaleTicketEmail");
            html = renderToString(
                React.createElement(SaleTicketEmail, {
                    sale,
                    rates,
                    businessName,
                    businessDescription,
                    businessRif,
                    businessPhone
                })
            );
        }

        return NextResponse.json({ html });
    } catch (error: any) {
        console.error("Error rendering email ticket template:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
