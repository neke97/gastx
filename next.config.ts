import type { NextConfig } from "next";

// Versión de este build: cambia en cada deploy de Vercel (commit) y la app
// instalada la compara con /api/version para actualizarse sola.
const APP_VERSION =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? `dev-${Date.now()}`;

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },
  async headers() {
    return [
      {
        // El service worker no debe cachearse: siempre la última versión.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
