import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "ViveresApp";

export const metadata: Metadata = {
  title: {
    default: `${businessName} - Punto de Venta`,
    template: `%s | ${businessName}`
  },
  description: process.env.NEXT_PUBLIC_BUSINESS_DESCRIPTION || "Gestión de inventario y ventas.",
  keywords: ["punto de venta", "catálogo online", "inventario", "ventas"],
  authors: [{ name: "DaniDev" }],
  creator: "ViveresApp",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: "https://viveresapp.com",
    title: `${businessName} - Catálogo y Pedidos Online`,
    description: process.env.NEXT_PUBLIC_BUSINESS_DESCRIPTION || "Realiza tus pedidos online y gestiona tu negocio con la mejor tecnología.",
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
    description: process.env.NEXT_PUBLIC_BUSINESS_DESCRIPTION || "La mejor plataforma para ventas y gestión de inventario.",
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
