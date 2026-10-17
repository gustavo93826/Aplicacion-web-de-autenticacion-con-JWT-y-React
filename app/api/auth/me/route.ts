// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { deleteSession, getCurrentUser } from "@/lib/session";

// GET /api/auth/me
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    // Si había una cookie pero era mala (falsificada, caducada o de un usuario
    // que ya no existe), la limpiamos para no seguir mandándola en cada visita.
    await deleteSession();

    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json({ user });
}