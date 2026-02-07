import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "ViveresApp";
const businessDescription = process.env.NEXT_PUBLIC_BUSINESS_DESCRIPTION || "Gestión de inventario y ventas.";

// Determinar la URL base dinámicamente para Vercel o local
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: `${businessName} - Punto de Venta`,
    template: `%s | ${businessName}`
  },
  description: businessDescription,
  keywords: ["punto de venta", "catálogo online", "inventario", "ventas", "víveres", "variedades"],
  authors: [{ name: "DaniDev" }],
  creator: "ViveresApp",
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: baseUrl,
    title: `${businessName} - Catálogo y Pedidos Online`,
    description: businessDescription,
    siteName: businessName,
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: `${businessName} - Dashboard y Catálogo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${businessName} - Tu Tienda en un Solo Lugar`,
    description: businessDescription,
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
