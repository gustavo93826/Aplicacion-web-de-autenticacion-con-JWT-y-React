// lib/authz.ts
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { PublicUser } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { LOGIN_EXPIRED_PATH } from "@/lib/login-reasons";

// ---------- Para PÁGINAS: redirige ----------
export async function requireAdmin(): Promise<PublicUser> {
  const user = await getCurrentUser();

  // 401: no sé quién eres → al login
  if (!user) {
    redirect("/login");
  }

  // 403: sé quién eres, pero no tienes permiso → pantalla de acceso denegado
  if (user.role !== "admin") {
    redirect("/access-denied");
  }
  //Si el usuario ya no existe o su sesión ha caducado, redirigimos al login con el mensaje de sesión caducada.
  if (!user) {
    redirect(LOGIN_EXPIRED_PATH);
  }

  return user;
}



// ---------- Para APIs: devuelve un JSON con el código de error ----------
// El resultado es "una cosa o la otra", distinguidas por la etiqueta "ok".
export type AdminApiCheck =
  | { ok: true; user: PublicUser }
  | { ok: false; response: NextResponse };

export async function requireAdminApi(): Promise<AdminApiCheck> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  if (user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No tienes permiso para realizar esta acción" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}