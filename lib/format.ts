// lib/format.ts

// "Ana Pérez" → "AP"   |   "marta" → "M"
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return initials.toUpperCase() || "?";
}

// SQLite guarda la fecha como texto, en UTC y sin zona: "2026-10-14 15:30:00".
// La convertimos a algo legible: "14 de octubre de 2026".
export function formatDate(sqliteDate: string): string {
  const date = new Date(sqliteDate.replace(" ", "T") + "Z");

  // Si por algún motivo no se pudo interpretar, mostramos el texto original.
  if (Number.isNaN(date.getTime())) return sqliteDate;

  return new Intl.DateTimeFormat("es", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

// Etiqueta amigable para cada rol.
export function roleLabel(role: "user" | "admin"): string {
  return role === "admin" ? "Administrador" : "Usuario";
}


// Para buscar sin que importen mayúsculas ni acentos:
// "Pérez" → "perez"   |   "ÁNGEL" → "angel"
export function normalizeText(text: string): string {
  return text
    .normalize("NFD") // separa las letras de sus acentos: "é" → "e" + "´"
    .replace(/\p{Diacritic}/gu, "") // elimina los acentos sueltos
    .toLowerCase();
}