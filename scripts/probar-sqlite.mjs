// scripts/probar-sqlite.mjs
import Database from "better-sqlite3";

// ":memory:" crea una base de datos temporal en la memoria RAM.
// Es como una libreta que se tira a la basura al cerrar el programa.
const db = new Database(":memory:");

// 1) CREAR UN CAJÓN (tabla) con tres apartados (columnas)
db.exec(`
  CREATE TABLE mascotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    especie TEXT NOT NULL
  )
`);

// 2) AÑADIR FICHAS (INSERT)
const insertar = db.prepare(
  "INSERT INTO mascotas (nombre, especie) VALUES (?, ?)"
);
insertar.run("Luna", "gato");
insertar.run("Rocky", "perro");
insertar.run("Michi", "gato");

// 3) LEER TODAS LAS FICHAS (SELECT)
const todas = db.prepare("SELECT * FROM mascotas").all();
console.log("--- Todas las mascotas ---");
console.table(todas);

// 4) BUSCAR CON UN FILTRO (WHERE)
const gatos = db
  .prepare("SELECT nombre FROM mascotas WHERE especie = ?")
  .all("gato");
console.log("--- Solo los gatos ---");
console.log(gatos);

db.close();