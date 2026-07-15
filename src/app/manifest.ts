import type { MetadataRoute } from "next";

/**
 * Web App Manifest (PWA). Next.js lo sirve en /manifest.webmanifest.
 * Íconos: por ahora un SVG escalable; para producción conviene generar
 * PNG 192/512 y maskable con un favicon generator.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GastX — Gastos e Ingresos",
    short_name: "GastX",
    description:
      "Registrá tus gastos e ingresos, dividí gastos, controlá cuotas y mirá reportes.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f0e",
    theme_color: "#059669",
    lang: "es-CR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
