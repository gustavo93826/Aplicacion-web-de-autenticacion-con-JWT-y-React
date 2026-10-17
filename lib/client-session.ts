// lib/client-session.ts
// Funciones que se usan SOLO en componentes de cliente (usan window).
import { LOGIN_EXPIRED_PATH } from "@/lib/login-reasons";

// Cuando una API responde 401 con la página abierta: mandamos al login.
// location.assign hace una carga completa de la página: limpia cualquier
// estado viejo del navegador, que es justo lo que queremos aquí.
export function redirectToLoginExpired(): void {
  window.location.assign(LOGIN_EXPIRED_PATH);
}