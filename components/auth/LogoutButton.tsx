// components/auth/LogoutButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiLoader4Line, RiLogoutBoxRLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import { LOGIN_LOGOUT_PATH } from "@/lib/login-reasons";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout failed");

      // replace: la pantalla privada desaparece del historial.
      router.replace(LOGIN_LOGOUT_PATH);
      // refresh: tira la copia guardada de páginas privadas.
      router.refresh();
      // No ponemos isLoading en false: el botón desaparece al cambiar de página.
    } catch {
      setError("No se pudo cerrar sesión. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isLoading}
        aria-label="Cerrar sesión"
      >
        {isLoading ? (
          <RiLoader4Line className="animate-spin" />
        ) : (
          <RiLogoutBoxRLine />
        )}
        {/* En pantallas pequeñas solo se ve el icono */}
        <span className="hidden sm:inline">
          {isLoading ? "Saliendo..." : "Cerrar sesión"}
        </span>
      </Button>

      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}