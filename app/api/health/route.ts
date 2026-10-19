// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Esta ruta debe calcularse en cada visita (nunca guardarse ya hecha).
export const dynamic = "force-dynamic";

// GET /api/health  →  usado por el servicio de alojamiento para saber si estamos vivos
export async function GET() {
  try {
    // Una consulta mínima: comprueba que la base de datos responde.
    db.prepare("SELECT 1").get();
    return NextResponse.json({ status: "ok" });
  } catch {
    // Sin detalles técnicos: quien llama solo necesita saber que algo falla.
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}