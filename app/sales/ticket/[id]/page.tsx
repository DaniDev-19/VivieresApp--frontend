"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { SaleTicket } from "@/components/sales/SaleTicket";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function SaleTicketPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;
    const [rates, setRates] = useState<any>({ BCV: 0 });

    // Fetch Rates
    useQuery({
        queryKey: ["latest-rates-ticket", id],
        queryFn: async () => {
            const { data } = await api.get("/rates/");
            const ratesObj: any = {};
            data.forEach((r: any) => { ratesObj[r.currency] = r.rate; });
            setRates(ratesObj);
            return ratesObj;
        },
    });

    // Fetch Sale Data
    const { data: sale, isLoading, error } = useQuery({
        queryKey: ["sale-ticket", id],
        queryFn: async () => {
            const { data } = await api.get(`/sales/${id}`);
            return data;
        },
        enabled: !!id
    });

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="font-medium text-gray-500">Cargando factura digital...</p>
            </div>
        );
    }

    if (error || !sale) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-950 px-4 text-center">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">❌</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Factura no encontrada</h1>
                <p className="text-gray-500 max-w-xs">Lo sentimos, no pudimos encontrar la factura solicitada o no tienes permisos para verla.</p>
                <button
                    onClick={() => router.push('/sales')}
                    className="mt-2 text-indigo-600 font-bold hover:underline"
                >
                    Volver al Historial
                </button>
            </div>
        );
    }


    const enrichedSale = sale && sale.items ? {
        ...sale,
        items: sale.items.map((item: any) => ({
            ...item,
            code: item.code || item.barcode || ""
        }))
    } : sale;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-8">
            <SaleTicket
                sale={enrichedSale}
                rates={rates}
                onClose={() => window.close()}
            />
        </div>
    );
}
