// lib/validations/auth.ts
import { z } from "zod";

// Máximo de bytes que bcrypt puede leer de una contraseña.
const MAX_PASSWORD_BYTES = 72;

export const registerSchema = z.object({
  name: z
    .string({ error: "El nombre es obligatorio" })
    .trim()
    .min(2, { error: "El nombre debe tener al menos 2 caracteres" })
    .max(50, { error: "El nombre no puede superar los 50 caracteres" }),

  // Primero limpiamos (espacios y mayúsculas) y DESPUÉS validamos el formato.
  email: z
    .string({ error: "El email es obligatorio" })
    .trim()
    .toLowerCase()
    .max(254, { error: "El email es demasiado largo" })
    .pipe(z.email({ error: "El email no es válido" })),

  password: z
    .string({ error: "La contraseña es obligatoria" })
    .min(8, { error: "La contraseña debe tener al menos 8 caracteres" })
    .refine((value) => /\p{L}/u.test(value), {
      error: "La contraseña debe incluir al menos una letra",
    })
    .refine((value) => /\d/.test(value), {
      error: "La contraseña debe incluir al menos un número",
    })
    .refine(
      (value) => new TextEncoder().encode(value).length <= MAX_PASSWORD_BYTES,
      { error: "La contraseña es demasiado larga" }
    ),
});

// Un "tipo" de TypeScript generado automáticamente a partir del esquema.
export type RegisterInput = z.infer<typeof registerSchema>;

// Esquema de login. Es más permisivo que el de registro a propósito:
// aquí NO exigimos "8 caracteres, letra y número", solo que no venga vacío.
// Las reglas de calidad se aplican al CREAR la contraseña, no al usarla.
export const loginSchema = z.object({
  email: z
    .string({ error: "El email es obligatorio" })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "El email no es válido" })),

  password: z
    .string({ error: "La contraseña es obligatoria" })
    .min(1, { error: "La contraseña es obligatoria" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Esquema SOLO para el formulario de registro: reutiliza el del backend
// y añade el campo "repetir contraseña", que el servidor no necesita.
export const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z
      .string({ error: "Repite la contraseña" })
      .min(1, { error: "Repite la contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"], // el error aparecerá bajo ESTE campo
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;