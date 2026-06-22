import React from "react";

interface SaleTicketEmailProps {
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
    businessName?: string;
    businessDescription?: string;
    businessRif?: string;
    businessPhone?: string;
}

export function SaleTicketEmail({
    sale,
    rates,
    businessName = "Víveres App",
    businessDescription = "Control de Ventas & Facturación",
    businessRif = "J-00000000-0",
    businessPhone = "0416-7659711"
}: SaleTicketEmailProps) {
    const effectiveRate = sale.payments?.find(p => p.currency === 'VES')?.exchange_rate || rates?.BCV || 0;
    const formattedDate = new Date(sale.created_at).toLocaleDateString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const formattedTime = new Date(sale.created_at).toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const subtotal = sale.total_amount_usd - (sale.total_tax_usd || 0) - (sale.delivery_amount_usd || 0);

    // Style constants for email client compatibility
    const styles = {
        wrapper: {
            backgroundColor: "#f4f5f7",
            padding: "30px 15px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: "#1f2937",
            lineHeight: "1.5"
        },
        container: {
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
        },
        header: {
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            padding: "35px 20px",
            textAlign: "center" as const,
            color: "#ffffff"
        },
        headerTitle: {
            margin: "0 0 5px 0",
            fontSize: "28px",
            fontWeight: "bold",
            letterSpacing: "0.5px"
        },
        headerSub: {
            margin: "0",
            fontSize: "13px",
            opacity: "0.9",
            fontWeight: "500"
        },
        content: {
            padding: "30px 25px"
        },
        greeting: {
            fontSize: "18px",
            fontWeight: "700",
            margin: "0 0 8px 0",
            color: "#111827"
        },
        subGreeting: {
            fontSize: "13px",
            color: "#6b7280",
            margin: "0 0 25px 0"
        },
        divider: {
            border: "none",
            borderTop: "1px dashed #e5e7eb",
            margin: "20px 0"
        },
        metaTable: {
            width: "100%",
            marginBottom: "20px"
        },
        metaLabel: {
            fontSize: "10px",
            fontWeight: "700",
            color: "#9ca3af",
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px",
            paddingBottom: "2px"
        },
        metaValue: {
            fontSize: "13px",
            fontWeight: "700",
            color: "#1f2937",
            paddingBottom: "12px"
        },
        productsTable: {
            width: "100%",
            borderCollapse: "collapse" as const,
            marginTop: "10px"
        },
        th: {
            fontSize: "11px",
            fontWeight: "700",
            color: "#6b7280",
            textTransform: "uppercase" as const,
            textAlign: "left" as const,
            borderBottom: "1px solid #f3f4f6",
            padding: "8px 0",
            letterSpacing: "0.5px"
        },
        thRight: {
            fontSize: "11px",
            fontWeight: "700",
            color: "#6b7280",
            textTransform: "uppercase" as const,
            textAlign: "right" as const,
            borderBottom: "1px solid #f3f4f6",
            padding: "8px 0",
            letterSpacing: "0.5px"
        },
        td: {
            padding: "12px 0",
            borderBottom: "1px solid #f9fafb",
            fontSize: "13px",
            verticalAlign: "top" as const
        },
        tdRight: {
            padding: "12px 0",
            borderBottom: "1px solid #f9fafb",
            fontSize: "13px",
            textAlign: "right" as const,
            verticalAlign: "top" as const
        },
        prodName: {
            fontWeight: "500",
            color: "#111827",
            margin: "0"
        },
        prodCode: {
            fontSize: "10px",
            color: "#9ca3af",
            margin: "2px 0 0 0"
        },
        summaryTable: {
            width: "100%",
            marginTop: "20px",
            borderTop: "1px solid #f3f4f6",
            paddingTop: "15px"
        },
        summaryRow: {
            fontSize: "13px"
        },
        summaryLabel: {
            color: "#6b7280",
            padding: "4px 0",
            textAlign: "left" as const
        },
        summaryValue: {
            fontWeight: "600",
            color: "#111827",
            padding: "4px 0",
            textAlign: "right" as const
        },
        totalRow: {
            fontSize: "18px",
            fontWeight: "800",
            borderTop: "1px solid #f3f4f6",
            marginTop: "12px",
            paddingTop: "12px"
        },
        totalLabel: {
            padding: "10px 0",
            textAlign: "left" as const,
            color: "#111827",
            textTransform: "uppercase" as const,
            letterSpacing: "0.5px"
        },
        totalValue: {
            padding: "10px 0",
            textAlign: "right" as const,
            color: "#12B77A"
        },
        footer: {
            marginTop: "25px",
            textAlign: "center" as const,
            fontSize: "11px",
            color: "#9ca3af"
        },
        footerText: {
            margin: "0 0 5px 0"
        },
        badge: { display: "inline-block", backgroundColor: "#97D485", borderRadius: "20px", padding: "4px 14px", fontSize: "13px", fontWeight: "700", marginTop: "10px", letterSpacing: "1px" },
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.container}>
                {/* Header green banner */}
                <div style={styles.header}>
                    <h1 style={styles.headerTitle}>{businessName.toUpperCase()}</h1>
                    <p style={styles.headerSub}>{businessDescription}</p>
                    <span style={styles.badge}>Completada</span>
                    {/* <p style={styles.headerSub}>{businessRif}</p> */}
                    {/* <p style={styles.headerSub}>{businessPhone}</p> */}
                </div>

                <div style={styles.content}>
                    {/* Salutation */}
                    <h2 style={styles.greeting}>¡Gracias por su compra!</h2>
                    <p style={styles.subGreeting}>A continuación, se detalla el recibo digital de su transacción.</p>

                    <hr style={styles.divider} />

                    {/* Metadata */}
                    <table style={styles.metaTable}>
                        <tbody>
                            <tr>
                                <td style={{ width: "50%", verticalAlign: "top" }}>
                                    <div style={styles.metaLabel}>TRANSACCIÓN</div>
                                    <div style={styles.metaValue}>#{sale.id.toString().padStart(6, '0')}</div>

                                    <div style={styles.metaLabel}>CLIENTE</div>
                                    <div style={styles.metaValue}>{sale.customer_name || "Cliente Rápido"}</div>
                                </td>
                                <td style={{ width: "50%", verticalAlign: "top" }}>
                                    <div style={styles.metaLabel}>FECHA</div>
                                    <div style={styles.metaValue}>{formattedDate} {formattedTime}</div>

                                    <div style={styles.metaLabel}>CÉDULA</div>
                                    <div style={styles.metaValue}>{sale.customer_cedula || "-"}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Products list */}
                    <table style={styles.productsTable}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Producto</th>
                                <th style={{ ...styles.thRight, width: "60px", textAlign: "center" }}>Cant.</th>
                                <th style={{ ...styles.thRight, width: "90px" }}>Precio</th>
                                <th style={{ ...styles.thRight, width: "100px" }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item, idx) => {
                                const itemTotal = item.quantity * item.unit_price_usd;
                                const itemTotalBs = itemTotal * effectiveRate;
                                return (
                                    <tr key={idx}>
                                        <td style={styles.td}>
                                            <p style={styles.prodName}>{item.name || `Producto #${item.product_id}`}</p>
                                            {item.code && <p style={styles.prodCode}>Código: {item.code}</p>}
                                        </td>
                                        <td style={{ ...styles.tdRight, textAlign: "center" }}>{item.quantity}</td>
                                        <td style={styles.tdRight}>${item.unit_price_usd.toFixed(2)}</td>
                                        <td style={{ ...styles.tdRight, fontWeight: "bold" }}>
                                            ${itemTotal.toFixed(2)}
                                            {effectiveRate > 0 && (
                                                <span style={{ display: "block", fontSize: "9px", color: "#6b7280", fontWeight: "normal", marginTop: "2px" }}>
                                                    Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(itemTotalBs)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Summaries */}
                    <table style={styles.summaryTable}>
                        <tbody>
                            <tr style={styles.summaryRow}>
                                <td style={styles.summaryLabel}>Subtotal USD:</td>
                                <td style={styles.summaryValue}>${subtotal.toFixed(2)}</td>
                            </tr>

                            {sale.total_tax_usd && sale.total_tax_usd > 0 ? (
                                <tr style={styles.summaryRow}>
                                    <td style={styles.summaryLabel}>IVA USD:</td>
                                    <td style={styles.summaryValue}>${sale.total_tax_usd.toFixed(2)}</td>
                                </tr>
                            ) : null}

                            {sale.delivery_amount_usd && sale.delivery_amount_usd > 0 ? (
                                <tr style={styles.summaryRow}>
                                    <td style={styles.summaryLabel}>Delivery USD:</td>
                                    <td style={styles.summaryValue}>${sale.delivery_amount_usd.toFixed(2)}</td>
                                </tr>
                            ) : null}

                            {effectiveRate > 0 && (
                                <tr style={styles.summaryRow}>
                                    <td style={styles.summaryLabel}>Tasa de Cambio (BCV):</td>
                                    <td style={styles.summaryValue}>Bs. {effectiveRate.toFixed(2)}</td>
                                </tr>
                            )}

                            {/* Total USD */}
                            <tr style={{ ...styles.summaryRow, borderTop: "1px solid #f3f4f6" }}>
                                <td style={{ ...styles.summaryLabel, fontWeight: "bold", paddingTop: "8px" }}>Total USD:</td>
                                <td style={{ ...styles.summaryValue, fontWeight: "bold", paddingTop: "8px" }}>${sale.total_amount_usd.toFixed(2)}</td>
                            </tr>

                            {/* Total VES (Green highlight) */}
                            {effectiveRate > 0 && (
                                <tr style={styles.totalRow}>
                                    <td style={{ ...styles.totalLabel, paddingTop: "12px" }}>TOTAL BS:</td>
                                    <td style={{ ...styles.totalValue, paddingTop: "12px", fontSize: "20px", fontWeight: "800" }}>
                                        Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(sale.total_amount_usd * effectiveRate)}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Footer */}
                    <div style={styles.footer}>
                        <p style={styles.footerText}>Este es un correo automático del sistema administrativo Viveres App.</p>
                        <p style={styles.footerText}>{businessName} © {new Date().getFullYear()} - Todos los derechos reservados.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
