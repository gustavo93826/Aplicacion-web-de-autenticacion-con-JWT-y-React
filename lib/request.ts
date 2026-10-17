// lib/request.ts

// Devuelve la IP del cliente, o "unknown" si no se puede saber.
//
// ⚠️ IMPORTANTE: X-Forwarded-For lo escribe quien envía la petición, salvo que
// tu servidor esté detrás de un proxy de confianza que lo sobrescriba (Vercel,
// Cloudflare, Nginx bien configurado...). Sin eso, esta IP se puede falsear.
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// ¿La petición viene de NUESTRA propia web? (defensa extra contra CSRF)
export function isTrustedRequest(request: Request): boolean {
  // Sec-Fetch-Site: el navegador declara desde dónde sale la petición.
  // "none" significa que la inició la propia persona (por ejemplo, escribiendo la URL).
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return false;
  }

  // Origin: la web de origen. Debe coincidir con nuestro propio host.
  const origin = request.headers.get("origin");
  if (origin) {
    const host = (
      request.headers.get("x-forwarded-host") ?? request.headers.get("host")
    )
      ?.split(",")[0]
      ?.trim();

    try {
      return new URL(origin).host === host;
    } catch {
      return false; // un Origin que no se puede interpretar es sospechoso
    }
  }

  // Sin ninguna de las dos cabeceras: no es un navegador (curl, scripts...).
  // Esos clientes no llevan tus cookies, así que no son un riesgo de CSRF.
  return true;
}