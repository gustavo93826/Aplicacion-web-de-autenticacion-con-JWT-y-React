// scripts/set-role.mjs
// Herramienta de administración: se ejecuta desde la TERMINAL, nunca desde la web.
//
// Uso:      node scripts/set-role.mjs <email> <user|admin>
// Ejemplo:  node scripts/set-role.mjs ana@correo.com admin
import Database from "better-sqlite3";
import path from "node:path";

// process.argv es la lista de lo que escribiste en la terminal:
// [ruta de node, ruta del script, email, rol]. Con slice(2) nos quedamos con lo tuyo.
const [email, role] = process.argv.slice(2);
const VALID_ROLES = ["user", "admin"];

if (!email || !VALID_ROLES.includes(role)) {
  console.error("Uso: node scripts/set-role.mjs <email> <user|admin>");
  process.exit(1); // un número distinto de 0 significa "terminó con error"
}

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(process.cwd(), "data", "app.db");

// fileMustExist: si el archivo no existe, falla en vez de crear una BD vacía.
const db = new Database(dbPath, { fileMustExist: true });

const result = db
  .prepare("UPDATE users SET role = ? WHERE email = ?")
  .run(role, email.trim());

// result.changes es cuántas filas se modificaron. Si es 0, no existía ese email.
if (result.changes === 0) {
  console.error(`❌ No existe ningún usuario con el email "${email}".`);
  db.close();
  process.exit(1);
}

console.log(`✅ ${email} ahora tiene el rol "${role}".`);
db.close();