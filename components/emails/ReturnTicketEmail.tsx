import React from "react";

interface ReturnTicketEmailProps {
    returnData: {
        id: number;
        sale_id: number;
        credit_note_code?: string;
        refund_method: string;
        reason?: string;
        total_refund_usd: number;
        created_at: string;
        items: {
            product_id: number;
            product_name?: string;
            quantity: number;
            unit_price_usd: number;
            subtotal_usd: number;
        }[];
    };
    rates: any;
    businessName?: string;
    businessDescription?: string;
    businessRif?: string;
    businessPhone?: string;
}

export function ReturnTicketEmail({
    returnData,
    rates,
    businessName = "Víveres App",
    businessDescription = "Control de Ventas & Facturación",
    businessRif = "J-00000000-0",
    businessPhone = "0416-7659711"
}: ReturnTicketEmailProps) {
    const effectiveRate = rates?.BCV || 0;
    const formattedDate = new Date(returnData.created_at).toLocaleDateString("es-VE", {
        day: "2-digit", month: "2-digit", year: "numeric"
    });
    const formattedTime = new Date(returnData.created_at).toLocaleTimeString("es-VE", {
        hour: "2-digit", minute: "2-digit", hour12: true
    });
    const refundMethodLabel =
        returnData.refund_method === "cash" ? "Efectivo" :
        returnData.refund_method === "credit_note" ? "Nota de Crédito" : "Método Original";

    const styles = {
        wrapper: { backgroundColor: "#f4f5f7", padding: "30px 15px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#1f2937", lineHeight: "1.5" },
        container: { maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
        header: { backgroundColor: "#ef4444", padding: "35px 20px", textAlign: "center" as const, color: "#ffffff" },
        headerTitle: { margin: "0 0 5px 0", fontSize: "28px", fontWeight: "bold" },
        headerSub: { margin: "0", fontSize: "13px", opacity: "0.9" },
        badge: { display: "inline-block", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "4px 14px", fontSize: "13px", fontWeight: "700", marginTop: "10px", letterSpacing: "1px" },
        content: { padding: "30px 25px" },
        greeting: { fontSize: "18px", fontWeight: "700", margin: "0 0 8px 0", color: "#111827" },
        subGreeting: { fontSize: "13px", color: "#6b7280", margin: "0 0 25px 0" },
        divider: { border: "none", borderTop: "1px dashed #e5e7eb", margin: "20px 0" },
        infoBox: { backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px" },
        infoBoxLabel: { fontSize: "10px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
        infoBoxValue: { fontSize: "13px", fontWeight: "700", color: "#1f2937", marginTop: "2px" },
        metaTable: { width: "100%", marginBottom: "20px" },
        metaLabel: { fontSize: "10px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.5px", paddingBottom: "2px" },
        metaValue: { fontSize: "13px", fontWeight: "700", color: "#1f2937", paddingBottom: "12px" },
        productsTable: { width: "100%", borderCollapse: "collapse" as const, marginTop: "10px" },
        th: { fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" as const, textAlign: "left" as const, borderBottom: "1px solid #f3f4f6", padding: "8px 0", letterSpacing: "0.5px" },
        thRight: { fontSize: "11px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" as const, textAlign: "right" as const, borderBottom: "1px solid #f3f4f6", padding: "8px 0", letterSpacing: "0.5px" },
        td: { padding: "10px 0", borderBottom: "1px solid #f9fafb", fontSize: "13px", verticalAlign: "top" as const },
        tdRight: { padding: "10px 0", borderBottom: "1px solid #f9fafb", fontSize: "13px", textAlign: "right" as const, verticalAlign: "top" as const },
        totalRow: { borderTop: "2px solid #ef4444", paddingTop: "12px", marginTop: "12px" },
        totalLabel: { padding: "12px 0", textAlign: "left" as const, color: "#ef4444", fontWeight: "800", fontSize: "16px", textTransform: "uppercase" as const },
        totalValue: { padding: "12px 0", textAlign: "right" as const, color: "#ef4444", fontWeight: "800", fontSize: "20px" },
        footer: { marginTop: "25px", textAlign: "center" as const, fontSize: "11px", color: "#9ca3af" },
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.headerTitle}>{businessName.toUpperCase()}</h1>
                    <p style={styles.headerSub}>{businessDescription}</p>
                    <span style={styles.badge}>DEVOLUCIÓN</span>
                </div>
                <div style={styles.content}>
                    <h2 style={styles.greeting}>Confirmación de Devolución</h2>
                    <p style={styles.subGreeting}>
                        A continuación encontrará el detalle de la devolución procesada. Guarde este comprobante para su referencia.
                    </p>
                    <hr style={styles.divider} />

                    {/* Reference Info Box */}
                    <div style={styles.infoBox}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <div style={styles.infoBoxLabel}>Devolución #</div>
                                <div style={{ ...styles.infoBoxValue, color: "#ef4444" }}>
                                    DEV-{returnData.id.toString().padStart(6, "0")}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" as const }}>
                                <div style={styles.infoBoxLabel}>Venta Original</div>
                                <div style={styles.infoBoxValue}>#{returnData.sale_id.toString().padStart(6, "0")}</div>
                            </div>
                        </div>
                        {returnData.credit_note_code && (
                            <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #fecaca" }}>
                                <div style={styles.infoBoxLabel}>Nota de Crédito</div>
                                <div style={{ ...styles.infoBoxValue, color: "#2563eb" }}>{returnData.credit_note_code}</div>
                            </div>
                        )}
                    </div>

                    {/* Metadata */}
                    <table style={styles.metaTable}>
                        <tbody>
                            <tr>
                                <td style={{ width: "50%", verticalAlign: "top" }}>
                                    <div style={styles.metaLabel}>Fecha</div>
                                    <div style={styles.metaValue}>{formattedDate} {formattedTime}</div>
                                    <div style={styles.metaLabel}>Método de Reembolso</div>
                                    <div style={styles.metaValue}>{refundMethodLabel}</div>
                                </td>
                                <td style={{ width: "50%", verticalAlign: "top" }}>
                                    <div style={styles.metaLabel}>RIF</div>
                                    <div style={styles.metaValue}>{businessRif}</div>
                                    {returnData.reason && (
                                        <>
                                            <div style={styles.metaLabel}>Motivo</div>
                                            <div style={styles.metaValue}>{returnData.reason}</div>
                                        </>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Products */}
                    <table style={styles.productsTable}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Producto Devuelto</th>
                                <th style={{ ...styles.thRight, width: "60px", textAlign: "center" as const }}>Cant.</th>
                                <th style={{ ...styles.thRight, width: "100px" }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnData.items.map((item, idx) => {
                                const totalBs = item.subtotal_usd * effectiveRate;
                                return (
                                    <tr key={idx}>
                                        <td style={styles.td}>
                                            <p style={{ fontWeight: "500", color: "#111827", margin: 0 }}>
                                                {item.product_name || `Producto #${item.product_id}`}
                                            </p>
                                            <p style={{ fontSize: "10px", color: "#9ca3af", margin: "2px 0 0 0" }}>
                                                ${item.unit_price_usd.toFixed(2)} / unidad
                                            </p>
                                        </td>
                                        <td style={{ ...styles.tdRight, textAlign: "center" as const }}>{item.quantity}</td>
                                        <td style={{ ...styles.tdRight, fontWeight: "bold" }}>
                                            ${item.subtotal_usd.toFixed(2)}
                                            {effectiveRate > 0 && (
                                                <span style={{ display: "block", fontSize: "9px", color: "#6b7280", fontWeight: "normal", marginTop: "2px" }}>
                                                    Bs. {new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(totalBs)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Total Refund */}
                    <table style={{ width: "100%", marginTop: "10px" }}>
                        <tbody>
                            <tr style={styles.totalRow}>
                                <td style={styles.totalLabel}>Total Reembolso:</td>
                                <td style={styles.totalValue}>
                                    ${returnData.total_refund_usd.toFixed(2)}
                                    {effectiveRate > 0 && (
                                        <span style={{ display: "block", fontSize: "13px", color: "#6b7280", fontWeight: "600" }}>
                                            Bs. {new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(returnData.total_refund_usd * effectiveRate)}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={styles.footer}>
                        <p style={{ margin: "0 0 5px 0" }}>Este es un correo automático del sistema administrativo local on-premise.</p>
                        <p style={{ margin: 0 }}>{businessName} © {new Date().getFullYear()} - Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
