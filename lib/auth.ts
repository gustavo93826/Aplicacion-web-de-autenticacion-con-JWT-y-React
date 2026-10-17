// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";

// Cuánto dura una sesión: 7 días, expresado en segundos.
// Exportado porque la cookie del Paso 10 usará el mismo valor.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// Nombre de la cookie donde viajará el JWT.
// Vive en este archivo (y no en session.ts) para que la capa de protección
// de rutas del Paso 15 pueda importarlo sin cargar nada extra.
export const SESSION_COOKIE_NAME = "session";

// Lee el secreto de las variables de entorno y lo convierte en bytes.
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET no está definido o es demasiado corto (mínimo 32 caracteres)"
    );
  }

  return new TextEncoder().encode(secret);
}

// CREAR una pulsera (token) para un usuario.
export async function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" }) // algoritmo de firma
    .setSubject(String(userId))           // claim "sub": de quién es
    .setIssuedAt()                        // claim "iat": cuándo se emitió
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`) // claim "exp": cuándo caduca
    .sign(getSecretKey());                // el sello, con nuestro secreto
}

// COMPROBAR una pulsera. Devuelve el id del usuario, o null si no es válida.
export async function verifySessionToken(
  token: string
): Promise<{ userId: number } | null> {
  // Fuera del try a propósito: si falta el secreto es un error NUESTRO
  // y queremos que se note, no que parezca "token inválido".
  const key = getSecretKey();

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"], // solo aceptamos el algoritmo que usamos nosotros
    });

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    return { userId };
  } catch {
    // Firma falsa, token caducado, formato roto... todo termina aquí.
    return null;
  }
}