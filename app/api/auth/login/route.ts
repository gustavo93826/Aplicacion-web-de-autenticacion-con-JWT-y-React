// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, type User } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  clearHits,
  getRateLimitStatus,
  recordHit,
  tooManyRequestsResponse,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations/auth";

// Mismo mensaje para "email inexistente" y "contraseña incorrecta".
const INVALID_CREDENTIALS = { error: "Email o contraseña incorrectos" };

// Política de intentos fallidos
const EMAIL_LIMIT = 5; // por cuenta
const IP_LIMIT = 20; // por origen
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

// Hash "de mentira" para gastar el mismo tiempo cuando el email no existe.
let dummyHash: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword("contrasena-ficticia-que-nadie-usa");
  return dummyHash;
}

export async function POST(request: Request) {
  // 1) Leer el cuerpo
  const body = await request.json().catch(() => null);

  if (body === null) {
    return NextResponse.json(
      { error: "El cuerpo de la petición debe ser JSON válido" },
      { status: 400 }
    );
  }

  // 2) Validar la forma de los datos
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Datos inválidos",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  // 3) ¿Está bloqueado este email o esta IP? Se mira ANTES de tocar la contraseña.
  const emailKey = `login:email:${email}`;
  const ipKey = `login:ip:${getClientIp(request)}`;

  const emailStatus = getRateLimitStatus(emailKey, EMAIL_LIMIT);
  const ipStatus = getRateLimitStatus(ipKey, IP_LIMIT);

  if (emailStatus.blocked || ipStatus.blocked) {
    const retryAfter = Math.max(
      emailStatus.blocked ? emailStatus.retryAfterSeconds : 0,
      ipStatus.blocked ? ipStatus.retryAfterSeconds : 0
    );
    return tooManyRequestsResponse(retryAfter);
  }

  // 4) Buscar al usuario por email (puede no existir)
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User | undefined;

  // 5) Comprobar la contraseña SIEMPRE, exista o no el usuario
  const hashToCheck = user ? user.password_hash : await getDummyHash();
  const passwordOk = await verifyPassword(password, hashToCheck);

  if (!user || !passwordOk) {
    // Cada fallo suma en los DOS contadores (también si el email no existe).
    recordHit(emailKey, WINDOW_MS);
    recordHit(ipKey, WINDOW_MS);
    return NextResponse.json(INVALID_CREDENTIALS, { status: 401 });
  }

  // 6) Login correcto: limpiamos el contador del email (NO el de la IP).
  clearHits(emailKey);

  // 7) Crear la sesión (JWT dentro de una cookie httpOnly)
  await createSession(user.id);

  // 8) Responder con datos públicos del usuario (NUNCA el hash)
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}