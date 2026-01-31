import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming issues on inputs
  themeColor: "#FFFFFF",
};

export const metadata: Metadata = {
  title: "Vastra Mandir",
  description: "Wear the Essence of Tradition",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vastra Mandir",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
        <ServiceWorkerRegister />
        <Toaster position="top-center" richColors expand={true} />
      </body>
    </html>
  );
}
