import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google"; // Use Inter for clean premium look
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Vastra Mandir",
  description: "Wear the Essence of Tradition",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vastra Mandir Admin",
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
        </CartProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
