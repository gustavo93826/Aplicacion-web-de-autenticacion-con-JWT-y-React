// lib/validations/users.ts
import { z } from "zod";
import { registerSchema } from "@/lib/validations/auth";

// Para editar un usuario: cada campo es OPCIONAL, pero debe llegar al menos uno.
// Reutilizamos las reglas de nombre y email del registro (con .shape).
export const updateUserSchema = z
  .object({
    name: registerSchema.shape.name,
    email: registerSchema.shape.email,
    role: z.enum(["user", "admin"], { error: "El rol no es válido" }),
  })
  .partial() // convierte todos los campos en opcionales
  .refine((data) => Object.keys(data).length > 0, {
    error: "Debes enviar al menos un campo para actualizar",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;


// Esquema del FORMULARIO de edición: aquí los tres campos son obligatorios
// (el formulario siempre los muestra rellenos). Reutiliza las reglas del registro.
export const editUserFormSchema = z.object({
  name: registerSchema.shape.name,
  email: registerSchema.shape.email,
  role: z.enum(["user", "admin"], { error: "El rol no es válido" }),
});

export type EditUserFormInput = z.infer<typeof editUserFormSchema>;