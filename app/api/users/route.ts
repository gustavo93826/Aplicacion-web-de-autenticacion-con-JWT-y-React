// app/api/users/route.ts
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/authz";
import { listUsers } from "@/lib/users";

// GET /api/users
export async function GET() {
  // 1) ¿Eres admin? Lo PRIMERO de todo.
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  // 2) Devolver la lista (sin password_hash)
  return NextResponse.json({ users: listUsers() });
}