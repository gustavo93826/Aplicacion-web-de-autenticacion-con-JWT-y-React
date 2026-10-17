// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { LOGIN_EXPIRED_PATH } from "@/lib/login-reasons";
import { isTrustedRequest } from "@/lib/request";

// Rutas que exigen sesión (y todo lo que cuelgue de ellas).
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

// Métodos que solo LEEN datos: no necesitan el filtro de origen.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// ¿La ruta es exactamente el prefijo, o está dentro de él?
function matchesPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---------- APIs: filtro anti-CSRF ----------
  if (pathname.startsWith("/api/")) {
    if (!SAFE_METHODS.has(request.method) && !isTrustedRequest(request)) {
      return NextResponse.json(
        { error: "Origen de la petición no permitido" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // ---------- Páginas protegidas ----------
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    matchesPath(pathname, prefix)
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // ¿Trae pulsera, y el sello es auténtico y no ha caducado?
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    // Si traía una cookie (caducada o falsa) avisamos del motivo.
    // Si nunca tuvo sesión, va al login sin ningún aviso.
    const loginPath = token ? LOGIN_EXPIRED_PATH : "/login";
    const response = NextResponse.redirect(new URL(loginPath, request.url));

    // Si traía una cookie mala, la tiramos.
    if (token) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }

    return response;
  }

  // Pulsera válida: adelante. (La página hará su propia comprobación con la BD.)
  return NextResponse.next();
}

// El proxy ahora también vigila las APIs.
export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/admin/:path*"],
};