import React from "react";

interface ExchangeTicketEmailProps {
    exchangeData: {
        id: number;
        sale_id: number;
        reason?: string;
        total_difference_usd: number;
        payment_method?: string;
        payment_amount_usd?: number;
        created_at: string;
        items_out: {
            product_id: number;
            product_name?: string;
            quantity: number;
            unit_price_usd: number;
            subtotal_usd: number;
        }[];
        items_in: {
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

export function ExchangeTicketEmail({
    exchangeData,
    rates,
    businessName = "Víveres App",
    businessDescription = "Control de Ventas & Facturación",
    businessRif = "J-00000000-0",
    businessPhone = "0416-7659711"
}: ExchangeTicketEmailProps) {
    const effectiveRate = rates?.BCV || 0;
    const formattedDate = new Date(exchangeData.created_at).toLocaleDateString("es-VE", {
        day: "2-digit", month: "2-digit", year: "numeric"
    });
    const formattedTime = new Date(exchangeData.created_at).toLocaleTimeString("es-VE", {
        hour: "2-digit", minute: "2-digit", hour12: true
    });
    const isPositive = exchangeData.total_difference_usd >= 0;
    const diffLabel = isPositive ? "DIFERENCIA A FAVOR:" : "DIFERENCIA A PAGAR:";
    const diffColor = isPositive ? "#16a34a" : "#ef4444";

    const styles = {
        wrapper: { backgroundColor: "#f4f5f7", padding: "30px 15px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#1f2937", lineHeight: "1.5" },
        container: { maxWidth: "600px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
        header: { backgroundColor: "#d97706", padding: "35px 20px", textAlign: "center" as const, color: "#ffffff" },
        headerTitle: { margin: "0 0 5px 0", fontSize: "28px", fontWeight: "bold" },
        headerSub: { margin: "0", fontSize: "13px", opacity: "0.9" },
        badge: { display: "inline-block", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "4px 14px", fontSize: "13px", fontWeight: "700", marginTop: "10px", letterSpacing: "1px" },
        content: { padding: "30px 25px" },
        greeting: { fontSize: "18px", fontWeight: "700", margin: "0 0 8px 0", color: "#111827" },
        subGreeting: { fontSize: "13px", color: "#6b7280", margin: "0 0 25px 0" },
        divider: { border: "none", borderTop: "1px dashed #e5e7eb", margin: "20px 0" },
        infoBox: { backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px" },
        infoBoxLabel: { fontSize: "10px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.5px" },
        infoBoxValue: { fontSize: "13px", fontWeight: "700", color: "#1f2937", marginTop: "2px" },
        sectionLabel: { fontSize: "11px", fontWeight: "800", letterSpacing: "1px", textTransform: "uppercase" as const, padding: "6px 10px", borderRadius: "6px", marginBottom: "8px", display: "inline-block" },
        productsTable: { width: "100%", borderCollapse: "collapse" as const, marginTop: "6px", marginBottom: "16px" },
        th: { fontSize: "10px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" as const, textAlign: "left" as const, borderBottom: "1px solid #f3f4f6", padding: "6px 0", letterSpacing: "0.5px" },
        thRight: { fontSize: "10px", fontWeight: "700", color: "#6b7280", textTransform: "uppercase" as const, textAlign: "right" as const, borderBottom: "1px solid #f3f4f6", padding: "6px 0", letterSpacing: "0.5px" },
        td: { padding: "8px 0", borderBottom: "1px solid #f9fafb", fontSize: "13px", verticalAlign: "top" as const },
        tdRight: { padding: "8px 0", borderBottom: "1px solid #f9fafb", fontSize: "13px", textAlign: "right" as const, verticalAlign: "top" as const },
        footer: { marginTop: "25px", textAlign: "center" as const, fontSize: "11px", color: "#9ca3af" },
    };

    const renderItemsTable = (items: typeof exchangeData.items_out, color: string) => (
        <table style={styles.productsTable}>
            <thead>
                <tr>
                    <th style={styles.th}>Producto</th>
                    <th style={{ ...styles.thRight, width: "50px", textAlign: "center" as const }}>Cant.</th>
                    <th style={{ ...styles.thRight, width: "90px" }}>Total</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, idx) => (
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
                        <td style={{ ...styles.tdRight, fontWeight: "bold", color }}>
                            ${item.subtotal_usd.toFixed(2)}
                            {effectiveRate > 0 && (
                                <span style={{ display: "block", fontSize: "9px", color: "#6b7280", fontWeight: "normal", marginTop: "2px" }}>
                                    Bs. {new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(item.subtotal_usd * effectiveRate)}
                                </span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.headerTitle}>{businessName.toUpperCase()}</h1>
                    <p style={styles.headerSub}>{businessDescription}</p>
                    <span style={styles.badge}>CAMBIO DE PRODUCTO</span>
                </div>
                <div style={styles.content}>
                    <h2 style={styles.greeting}>Confirmación de Cambio</h2>
                    <p style={styles.subGreeting}>A continuación encontrará el detalle del cambio procesado. Guarde este comprobante para su referencia.</p>
                    <hr style={styles.divider} />

                    {/* Reference Info Box */}
                    <div style={styles.infoBox}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <div style={styles.infoBoxLabel}>Cambio #</div>
                                <div style={{ ...styles.infoBoxValue, color: "#d97706" }}>
                                    CAM-{exchangeData.id.toString().padStart(6, "0")}
                                </div>
                            </div>
                            <div style={{ textAlign: "right" as const }}>
                                <div style={styles.infoBoxLabel}>Venta Original</div>
                                <div style={styles.infoBoxValue}>#{exchangeData.sale_id.toString().padStart(6, "0")}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #fde68a", display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <div style={styles.infoBoxLabel}>Fecha</div>
                                <div style={styles.infoBoxValue}>{formattedDate} {formattedTime}</div>
                            </div>
                            {exchangeData.reason && (
                                <div style={{ textAlign: "right" as const }}>
                                    <div style={styles.infoBoxLabel}>Motivo</div>
                                    <div style={styles.infoBoxValue}>{exchangeData.reason}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Out */}
                    <div style={{ marginBottom: "16px" }}>
                        <span style={{ ...styles.sectionLabel, backgroundColor: "#fef2f2", color: "#dc2626" }}>
                            ↩ Devueltos por el Cliente
                        </span>
                        {renderItemsTable(exchangeData.items_out, "#dc2626")}
                    </div>

                    {/* Items In */}
                    <div style={{ marginBottom: "16px" }}>
                        <span style={{ ...styles.sectionLabel, backgroundColor: "#f0fdf4", color: "#16a34a" }}>
                            ✓ Entregados al Cliente
                        </span>
                        {renderItemsTable(exchangeData.items_in, "#16a34a")}
                    </div>

                    {/* Difference */}
                    <table style={{ width: "100%", marginTop: "10px", borderTop: "2px solid #d97706" }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: "12px 0", color: diffColor, fontWeight: "800", fontSize: "16px", textTransform: "uppercase" as const }}>
                                    {diffLabel}
                                </td>
                                <td style={{ padding: "12px 0", textAlign: "right" as const, color: diffColor, fontWeight: "800", fontSize: "20px" }}>
                                    ${Math.abs(exchangeData.total_difference_usd).toFixed(2)}
                                    {effectiveRate > 0 && (
                                        <span style={{ display: "block", fontSize: "13px", color: "#6b7280", fontWeight: "600" }}>
                                            Bs. {new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(Math.abs(exchangeData.total_difference_usd) * effectiveRate)}
                                        </span>
                                    )}
                                </td>
                            </tr>
                            {exchangeData.payment_method && exchangeData.total_difference_usd > 0 && (
                                <tr>
                                    <td style={{ fontSize: "12px", color: "#6b7280", paddingBottom: "8px" }}>Pagado con:</td>
                                    <td style={{ fontSize: "12px", color: "#6b7280", textAlign: "right" as const, paddingBottom: "8px" }}>
                                        {exchangeData.payment_method.replace("_", " ").toUpperCase()}
                                    </td>
                                </tr>
                            )}
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
