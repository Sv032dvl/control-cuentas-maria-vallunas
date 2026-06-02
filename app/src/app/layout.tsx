import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "María Vallunas — Control de Caja",
    template: "%s · María Vallunas",
  },
  description:
    "Control de cierre diario, ventas y rentabilidad por unidad de negocio.",
  applicationName: "María Vallunas",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "María Vallunas",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7ed" },
    { media: "(prefers-color-scheme: dark)", color: "#1a0f08" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CO"
      className={cn("h-full antialiased", geist.variable)}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-background text-foreground flex flex-col font-sans"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
