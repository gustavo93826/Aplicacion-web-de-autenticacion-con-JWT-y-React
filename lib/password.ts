// lib/password.ts
import bcrypt from "bcryptjs";

// Coste del hash. 10 significa 2^10 = 1024 rondas.
// Si lo subes a 11 o 12, es más seguro pero tarda el doble o cuádruple.
const SALT_ROUNDS = 10;

// Convierte una contraseña en un hash seguro para guardar en la BD.
export async function hashPassword(password: string): Promise<string> {
  // bcrypt solo lee los primeros 72 bytes. Si hay más, avisamos en vez de truncar.
  if (bcrypt.truncates(password)) {
    throw new Error("La contraseña supera el máximo de 72 bytes");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Comprueba si una contraseña coincide con un hash guardado.
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (bcrypt.truncates(password)) {
    return false;
  }
  return bcrypt.compare(password, hash);
}