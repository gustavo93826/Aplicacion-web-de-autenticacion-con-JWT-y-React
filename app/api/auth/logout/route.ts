// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";

// POST /api/auth/logout
export async function POST() {
  await deleteSession();
  return NextResponse.json({ ok: true });
}