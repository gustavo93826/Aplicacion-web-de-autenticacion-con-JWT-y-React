// components/QuienSoy.tsx
"use client";

import { useEffect, useState } from "react";

// La forma de los datos que devuelve /api/auth/me
type Usuario = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
};

export default function QuienSoy() {
  // Dos pizarras: quién es el usuario y si todavía estamos esperando respuesta.
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Bandera por si el componente desaparece antes de que llegue la respuesta.
    let cancelado = false;

    async function cargarUsuario() {
      try {
        const respuesta = await fetch("/api/auth/me");

        if (respuesta.ok) {
          const datos = await respuesta.json();
          if (!cancelado) setUsuario(datos.user);
        } else {
          if (!cancelado) setUsuario(null);
        }
      } catch {
        // Error de red: tratamos como "sin usuario"
        if (!cancelado) setUsuario(null);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarUsuario();

    // Función de limpieza: React la ejecuta al retirar el componente.
    return () => {
      cancelado = true;
    };
  }, []); // [] = solo una vez, al aparecer

  // Los tres casos de la interfaz:
  if (cargando) {
    return <p className="mt-4">Comprobando sesión...</p>;
  }

  if (!usuario) {
    return <p className="mt-4">No has iniciado sesión.</p>;
  }

  return (
    <p className="mt-4">
      Conectado como <strong>{usuario.name}</strong> ({usuario.email}) · rol:{" "}
      {usuario.role}
    </p>
  );
}