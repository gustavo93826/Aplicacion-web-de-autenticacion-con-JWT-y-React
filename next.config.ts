// next.config.ts
import type { NextConfig } from "next";

type Header = { key: string; value: string };

const securityHeaders: Header[] = [
  // Que el navegador no "adivine" tipos de archivo
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Que nadie meta la web en un <iframe> (clickjacking).
  // X-Frame-Options es para navegadores antiguos; frame-ancestors es el moderno.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value:
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },

  // No filtrar nuestras direcciones internas a otras webs
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Esta app no usa cámara, micrófono ni ubicación
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// HSTS: "visítame siempre por HTTPS". Solo tiene sentido en producción.
if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  });
}

const nextConfig: NextConfig = {
  // Oculta la cabecera "X-Powered-By: Next.js"
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*", // todas las rutas
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;