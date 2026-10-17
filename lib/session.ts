// lib/session.ts
import { cache } from "react";
import { cookies } from "next/headers";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { db, type PublicUser } from "@/lib/db";

// Opciones comunes de la cookie (las mismas al crearla y al borrarla).
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Crea el JWT y lo entrega al navegador en una cookie.
export async function createSession(userId: number): Promise<void> {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

// Borra la cookie (la usaremos en el logout del Paso 11).
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions,
    maxAge: 0, // caduca de inmediato
  });
}

// Devuelve el usuario conectado, o null si no hay sesión válida.
// Envuelta en cache(): dentro de UNA misma petición, la consulta se hace una sola vez
// aunque la llamen el layout y la página a la vez.
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  // 1) ¿Trae pulsera?
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  // 2) ¿El sello es auténtico y no ha caducado?
  const session = await verifySessionToken(token);
  if (!session) return null;

  // 3) ¿Ese usuario sigue existiendo? Pedimos solo las columnas necesarias,
  //    jamás password_hash.
  const user = db
    .prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?")
    .get(session.userId) as PublicUser | undefined;

  return user ?? null;
});