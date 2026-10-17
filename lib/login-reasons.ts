// lib/login-reasons.ts

// La LISTA BLANCA: los únicos motivos que reconocemos y sus mensajes.
// La URL solo lleva la clave ("expired"); el texto lo ponemos nosotros.
export const LOGIN_REASONS = {
  expired: {
    title: "Sesión caducada",
    message: "Tu sesión ha caducado o ya no es válida. Inicia sesión de nuevo.",
  },
  logout: {
    title: "Sesión cerrada",
    message: "Has cerrado sesión correctamente.",
  },
} as const;

export type LoginReason = keyof typeof LOGIN_REASONS;

export const LOGIN_EXPIRED_PATH = "/login?reason=expired";
export const LOGIN_LOGOUT_PATH = "/login?reason=logout";

// Convierte lo que venga en la URL en un motivo válido, o null.
export function parseLoginReason(
  value: string | string[] | undefined
): LoginReason | null {
  // Si no es un texto simple (falta, o viene repetido), lo ignoramos.
  if (typeof value !== "string") return null;

  // Object.hasOwn y NO el operador "in": ("toString" in LOGIN_REASONS) es true
  // porque los objetos heredan propiedades. Es una trampa clásica de JavaScript.
  return Object.hasOwn(LOGIN_REASONS, value) ? (value as LoginReason) : null;
}