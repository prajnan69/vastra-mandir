import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import GlobalCheckout from "@/components/GlobalCheckout";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming issues on inputs
  themeColor: "#FFFFFF",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://vastra-mandir.vercel.app"),
  title: {
    default: "Vastra Mandir",
    template: "%s | Vastra Mandir"
  },
  description: "Wear the Essence of Tradition - Handpicked Luxury Collection",
  openGraph: {
    type: "website",
    siteName: "Vastra Mandir",
    title: "Vastra Mandir",
    description: "Discover a curated collection where traditional craftsmanship meets modern sophistication.",
    images: [
      {
        url: "/og-image.jpg", // We should ensure this image exists or use a high-res product as fallback
        width: 1200,
        height: 630,
        alt: "Vastra Mandir Luxury Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vastra Mandir",
    description: "The Essence of Tradition - Handpicked Luxury Collection",
    images: ["/og-image.jpg"],
  },
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
          <GlobalCheckout />
        </CartProvider>
        <ServiceWorkerRegister />
        <Toaster position="top-center" richColors expand={true} />
      </body>
    </html>
  );
}
