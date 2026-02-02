import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ViveresApp - Punto de Venta y Catálogo Online",
    template: "%s | ViveresApp"
  },
  description: "Gestiona tu inventario, ventas y pedidos web de forma profesional con ViveresApp. La solución ideal para tu bodega o negocio de víveres.",
  keywords: ["viveres", "punto de venta", "catálogo online", "inventario", "ventas", "venezuela", "bodega"],
  authors: [{ name: "ViveresApp Team" }],
  creator: "ViveresApp",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: "https://viveresapp.com",
    title: "ViveresApp - Tu Bodega en un Solo Lugar",
    description: "Realiza tus pedidos online y gestiona tu negocio con la mejor tecnología. Rápido, seguro y profesional.",
    siteName: "ViveresApp",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "ViveresApp - Dashboard y Catálogo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ViveresApp - Tu Bodega en un Solo Lugar",
    description: "La mejor plataforma para ventas de víveres y gestión de inventario.",
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
