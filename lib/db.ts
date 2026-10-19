// lib/db.ts
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// 1) ¿DÓNDE VIVE EL ARCHIVO?
// En producción, el servidor puede indicar otra ubicación (un disco persistente)
// con la variable DATABASE_PATH. Si no existe, usamos ./data/app.db
const configuredPath = process.env.DATABASE_PATH?.trim();
const dbPath = configuredPath
  ? path.resolve(configuredPath)
  : path.join(process.cwd(), "data", "app.db");

// Creamos la carpeta que contiene el archivo, si no existe.
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// 2) ABRIR LA PUERTA Y PREPARAR EL ARCHIVADOR
function createConnection() {
  const db = new Database(dbPath);

  // Ajustes de funcionamiento (los explico abajo)
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Crear el cajón "users" SOLO si todavía no existe
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT COLLATE NOCASE NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin')),
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
}

// 3) UNA SOLA PUERTA: reutilizar la conexión entre recargas
type Db = ReturnType<typeof createConnection>;
const globalForDb = globalThis as unknown as { db?: Db };

export const db = globalForDb.db ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

// 4) Un "molde" que describe cómo es una ficha de usuario
export type User = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "user" | "admin";
  created_at: string;
};

// Un usuario SIN el hash de la contraseña: es lo único que debe salir del servidor.
export type PublicUser = Omit<User, "password_hash">;