// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/authz";
import { deleteUser, updateUser } from "@/lib/users";
import { updateUserSchema } from "@/lib/validations/users";

// En las rutas dinámicas, "params" llega dentro de una promesa.
type RouteContext = { params: Promise<{ id: string }> };

// Convierte el texto de la URL en un id válido, o devuelve null.
function parseId(raw: string): number | null {
  // Solo dígitos: descarta "abc", "-3", "1.5", "0x10", "1e3"...
  if (!/^\d+$/.test(raw)) return null;

  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Cómo traducir cada resultado "esperado" de la capa de datos a HTTP.
const UPDATE_ERRORS = {
  NOT_FOUND: { status: 404, error: "Usuario no encontrado" },
  EMAIL_TAKEN: { status: 409, error: "Ya existe una cuenta con ese email" },
  LAST_ADMIN: {
    status: 409,
    error: "No puedes quitar el rol al último administrador",
  },
} as const;

const DELETE_ERRORS = {
  NOT_FOUND: { status: 404, error: "Usuario no encontrado" },
  LAST_ADMIN: {
    status: 409,
    error: "No puedes eliminar al último administrador",
  },
} as const;

// ---------- PATCH /api/users/3 ----------
export async function PATCH(request: Request, { params }: RouteContext) {
  // 1) ¿Eres admin?
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  // 2) ¿El id de la URL es válido?
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de usuario no válido" }, { status: 400 });
  }

  // 3) Leer el cuerpo
  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json(
      { error: "El cuerpo de la petición debe ser JSON válido" },
      { status: 400 }
    );
  }

  // 4) Validar con Zod
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = z.flattenError(parsed.error);
    return NextResponse.json(
      { error: "Datos inválidos", fieldErrors, formErrors },
      { status: 400 }
    );
  }

  // 5) Regla: no puedes cambiar TU PROPIO rol
  const newRole = parsed.data.role;
  if (id === auth.user.id && newRole !== undefined && newRole !== auth.user.role) {
    return NextResponse.json(
      { error: "No puedes cambiar tu propio rol" },
      { status: 403 }
    );
  }

  // 6) Aplicar el cambio (la capa de datos hace el resto de comprobaciones)
  const result = updateUser(id, parsed.data);
  if (!result.ok) {
    const { status, error } = UPDATE_ERRORS[result.reason];
    return NextResponse.json({ error, code: result.reason }, { status });
  }

  return NextResponse.json({ user: result.user });
}

// ---------- DELETE /api/users/3 ----------
export async function DELETE(_request: Request, { params }: RouteContext) {
  // 1) ¿Eres admin?
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  // 2) ¿El id es válido?
  const id = parseId((await params).id);
  if (id === null) {
    return NextResponse.json({ error: "ID de usuario no válido" }, { status: 400 });
  }

  // 3) Regla: no puedes eliminar TU PROPIA cuenta
  if (id === auth.user.id) {
    return NextResponse.json(
      { error: "No puedes eliminar tu propia cuenta" },
      { status: 403 }
    );
  }

  // 4) Eliminar
  const result = deleteUser(id);
  if (!result.ok) {
    const { status, error } = DELETE_ERRORS[result.reason];
    return NextResponse.json({ error, code: result.reason }, { status });
  }

  return NextResponse.json({ ok: true });
}