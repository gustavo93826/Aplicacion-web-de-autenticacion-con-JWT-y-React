// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations/auth";
import {
  getRateLimitStatus,
  recordHit,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

// Política: máximo 10 intentos de registro por IP y hora
const REGISTER_LIMIT = 10;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;



export async function POST(request: Request) {
  
  // 0) Límite por IP: cuenta TODOS los intentos, salgan bien o mal.
  const ipKey = `register:ip:${getClientIp(request)}`;
  const status = getRateLimitStatus(ipKey, REGISTER_LIMIT);
  if (status.blocked) {
    return tooManyRequestsResponse(status.retryAfterSeconds);
  }
  recordHit(ipKey, REGISTER_WINDOW_MS);

  // 1) Leer el cuerpo. Si no es JSON válido, obtenemos null.
  const body = await request.json().catch(() => null);

  if (body === null) {
    return NextResponse.json(
      { error: "El cuerpo de la petición debe ser JSON válido" },
      { status: 400 }
    );
  }

  // 2) Validar con Zod (el "control de seguridad")
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 }
    );
  }

  // A partir de aquí los datos ya están limpios y son de confianza.
  const { name, email, password } = parsed.data;

  // 3) Convertir la contraseña en un hash. NUNCA guardamos la original.
  const passwordHash = await hashPassword(password);

  // 4) Guardar en la base de datos
  try {
    const result = db
      .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(name, email, passwordHash);

    // 5) Responder SIN el hash. 201 = "creado".
    return NextResponse.json(
      {
        user: {
          id: Number(result.lastInsertRowid),
          name,
          email,
          role: "user",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // La restricción UNIQUE de la tabla rechazó un email repetido.
    const code = (error as { code?: string }).code;
    if (code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }

    // Cualquier otro error es inesperado: lo relanzamos y Next.js responde 500.
    throw error;
  }
}