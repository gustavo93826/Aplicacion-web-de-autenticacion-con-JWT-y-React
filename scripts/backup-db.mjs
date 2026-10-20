// scripts/backup-db.mjs
// Crea una copia CONSISTENTE de la base de datos (incluso con la app en marcha).
//
// Uso:      node scripts/backup-db.mjs [ruta-de-salida]
// Ejemplo:  node scripts/backup-db.mjs
//           (crea backups/app-<fecha>.db)
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(process.cwd(), "data", "app.db");

// Nombre con fecha y hora, sin caracteres prohibidos en Windows (como los dos puntos)
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outPath = path.resolve(
  process.argv[2] ?? path.join("backups", `app-${stamp}.db`)
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });

// fileMustExist: si la base de datos no existe, falla en vez de crear una vacía
const db = new Database(dbPath, { fileMustExist: true });

try {
  // db.backup() usa el mecanismo propio de SQLite: copia consistente aunque
  // haya escrituras en curso y aunque parte de los datos esté en el archivo -wal.
  await db.backup(outPath);
  console.log(`✅ Copia de seguridad creada: ${outPath}`);
} finally {
  db.close();
}