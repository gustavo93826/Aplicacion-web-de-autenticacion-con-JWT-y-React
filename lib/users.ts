// lib/users.ts
import { db, type PublicUser } from "@/lib/db";
import type { UpdateUserInput } from "@/lib/validations/users";

// Las columnas que SÍ se pueden mostrar (nunca password_hash).
// Es una constante nuestra, no un dato del usuario, así que es seguro ponerla en el SQL.
const PUBLIC_COLUMNS = "id, name, email, role, created_at";

// ---------- Consultas sencillas ----------

export function listUsers(): PublicUser[] {
  return db
    .prepare(`SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY id`)
    .all() as PublicUser[];
}

function findUser(id: number): PublicUser | undefined {
  return db
    .prepare(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`)
    .get(id) as PublicUser | undefined;
}

function countAdmins(): number {
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'")
    .get() as { total: number };
  return row.total;
}

// ---------- Editar usuario ----------

export type UpdateResult =
  | { ok: true; user: PublicUser }
  | { ok: false; reason: "NOT_FOUND" | "LAST_ADMIN" | "EMAIL_TAKEN" };

// Todo el bloque es una TRANSACCIÓN: comprobar y modificar sin que nada se interponga.
const updateUserTransaction = db.transaction(
  (id: number, changes: UpdateUserInput): UpdateResult => {
    const current = findUser(id);
    if (!current) return { ok: false, reason: "NOT_FOUND" };

    // Regla: no dejar el sistema sin administradores
    if (
      changes.role === "user" &&
      current.role === "admin" &&
      countAdmins() <= 1
    ) {
      return { ok: false, reason: "LAST_ADMIN" };
    }

    // Lo que no se envía se queda como estaba
    const name = changes.name ?? current.name;
    const email = changes.email ?? current.email;
    const role = changes.role ?? current.role;

    db.prepare("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?").run(
      name,
      email,
      role,
      id
    );

    return { ok: true, user: { ...current, name, email, role } };
  }
);

export function updateUser(id: number, changes: UpdateUserInput): UpdateResult {
  try {
    return updateUserTransaction(id, changes);
  } catch (error) {
    // La restricción UNIQUE de la tabla rechazó un email repetido
    // (la transacción ya se deshizo sola).
    const code = (error as { code?: string }).code;
    if (code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { ok: false, reason: "EMAIL_TAKEN" };
    }
    throw error;
  }
}

// ---------- Eliminar usuario ----------

export type DeleteResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "LAST_ADMIN" };

export const deleteUser = db.transaction((id: number): DeleteResult => {
  const current = findUser(id);
  if (!current) return { ok: false, reason: "NOT_FOUND" };

  // Regla: no eliminar al último administrador
  if (current.role === "admin" && countAdmins() <= 1) {
    return { ok: false, reason: "LAST_ADMIN" };
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  return { ok: true };
});