import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { LoadingIndicator } from "@/components/LoadingIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GastX — Gastos e Ingresos",
  description:
    "Registrá tus gastos e ingresos, dividí gastos entre personas, controlá cuotas y mirá reportes. Bonito, rápido y mobile-first.",
  applicationName: "GastX",
  appleWebApp: {
    capable: true,
    title: "GastX",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Guarda el evento de instalación aunque llegue antes de que React
            monte el botón "Descargar la app". */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__gastxInstallPrompt=e;});",
          }}
        />
        {children}
        {/* Suspense: useSearchParams no debe frenar el render estático de las páginas. */}
        <Suspense fallback={null}>
          <LoadingIndicator />
        </Suspense>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
