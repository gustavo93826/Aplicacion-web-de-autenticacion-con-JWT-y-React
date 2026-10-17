// components/admin/DeleteUserDialog.tsx
"use client";

import { useState } from "react";
import { RiDeleteBinLine, RiLoader4Line } from "@remixicon/react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { PublicUser } from "@/lib/db";
import { redirectToLoginExpired } from "@/lib/client-session";

type DeleteUserDialogProps = {
  user: PublicUser | null; // null = diálogo cerrado
  onClose: () => void;
  onDone: (message: string) => void;
};

export default function DeleteUserDialog({
  user,
  onClose,
  onDone,
}: DeleteUserDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(open: boolean) {
    // Mientras se elimina, el diálogo no se puede cerrar (ni con Esc).
    if (isDeleting) return;

    if (!open) {
      setError(null);
      onClose();
    }
  }

  async function handleDelete() {
    if (!user) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);

      // ✅ Eliminado
      if (response.ok) {
        onDone(`La cuenta de ${user.name} se eliminó correctamente.`);
        return;
      }

      // Ya no existía (otro admin se adelantó): el resultado final es el mismo
      if (response.status === 404) {
        onDone("Ese usuario ya no existe. La lista se ha actualizado.");
        return;
      }

      if (response.status === 401) {
      redirectToLoginExpired();
      return;
      }

      // 403 (eres tú mismo), 409 (último administrador)...
      setError(data?.error ?? "No se pudo eliminar. Inténtalo de nuevo.");
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={user !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar esta cuenta?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar la cuenta de <strong>{user?.name}</strong> (
            {user?.email}). Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>

          {/* Botón normal (no AlertDialogAction): así NOSOTROS decidimos cuándo
              se cierra el diálogo, y no antes de que termine la petición. */}
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <RiLoader4Line className="animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <RiDeleteBinLine />
                Eliminar cuenta
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}