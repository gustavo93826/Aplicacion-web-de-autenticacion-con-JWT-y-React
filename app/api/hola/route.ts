// app/api/hola/route.ts
import { NextResponse } from "next/server";

// ---------- GET /api/hola?nombre=Ana ----------
// Se ejecuta cuando alguien hace un pedido de tipo GET.
export async function GET(request: Request) {
  // Leer los datos que vienen en la URL (después del "?")
  const { searchParams } = new URL(request.url);
  const nombre = searchParams.get("nombre") ?? "desconocido";

  return NextResponse.json({
    mensaje: `Hola, ${nombre}`,
    hora: new Date().toISOString(),
  });
}

// ---------- POST /api/hola ----------
// Se ejecuta cuando alguien hace un pedido de tipo POST.
export async function POST(request: Request) {
  // Leer el cuerpo del pedido. Si no es JSON válido, devolvemos null.
  const body: { nombre?: unknown } | null = await request
    .json()
    .catch(() => null);

  // Validar: "nombre" debe existir y ser un texto no vacío
  if (!body || typeof body.nombre !== "string" || body.nombre.trim() === "") {
    return NextResponse.json(
      { error: "El campo 'nombre' es obligatorio" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    mensaje: `Hola, ${body.nombre.trim()}. Recibí tu POST.`,
  });
}