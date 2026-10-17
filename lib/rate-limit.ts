// lib/rate-limit.ts
import { NextResponse } from "next/server";

type Hits = { count: number; resetAt: number };

// Un único almacén en memoria que sobrevive a las recargas de código en desarrollo
// (el mismo truco de globalThis que usamos con la base de datos en el Paso 5).
const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: Map<string, Hits>;
};
const store: Map<string, Hits> = (globalForRateLimit.rateLimitStore ??=
  new Map());

// Tope de entradas, para que nadie pueda llenar la memoria inventando claves.
const MAX_ENTRIES = 10_000;

// Devuelve el contador de una clave, o undefined si no existe o ya caducó.
function getActive(key: string): Hits | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;

  if (entry.resetAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }

  return entry;
}

function purgeExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export type RateLimitStatus =
  | { blocked: false }
  | { blocked: true; retryAfterSeconds: number };

// ¿Esta clave ya alcanzó el límite? (No cuenta nada, solo consulta.)
export function getRateLimitStatus(key: string, limit: number): RateLimitStatus {
  const entry = getActive(key);

  if (!entry || entry.count < limit) {
    return { blocked: false };
  }

  return {
    blocked: true,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((entry.resetAt - Date.now()) / 1000)
    ),
  };
}

// Apunta un intento. La ventana de tiempo empieza con el primer intento.
export function recordHit(key: string, windowMs: number): void {
  const entry = getActive(key);

  if (entry) {
    entry.count += 1;
    return;
  }

  // Antes de añadir una clave nueva, nos aseguramos de que quepa.
  if (store.size >= MAX_ENTRIES) {
    purgeExpired();

    if (store.size >= MAX_ENTRIES) {
      // Sigue lleno: borramos la entrada más antigua (un Map recuerda el orden).
      const oldest = store.keys().next().value;
      if (oldest !== undefined) store.delete(oldest);
    }
  }

  store.set(key, { count: 1, resetAt: Date.now() + windowMs });
}

// Borra los intentos de una clave (por ejemplo, tras un login correcto).
export function clearHits(key: string): void {
  store.delete(key);
}

// ---------- Respuesta 429 estándar ----------

function describeWait(seconds: number): string {
  if (seconds < 60) {
    return seconds === 1 ? "1 segundo" : `${seconds} segundos`;
  }
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}

export function tooManyRequestsResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: `Demasiados intentos. Inténtalo de nuevo en ${describeWait(retryAfterSeconds)}.`,
    },
    {
      status: 429,
      // Cabecera estándar: "vuelve a probar dentro de X segundos"
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}