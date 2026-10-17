// components/admin/EditUserDialog.tsx
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { RiLoader4Line, RiSaveLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { PublicUser } from "@/lib/db";
import {
  editUserFormSchema,
  type EditUserFormInput,
} from "@/lib/validations/users";
import { redirectToLoginExpired } from "@/lib/client-session";

// Estilo del <select> nativo, a juego con los campos de Shadcn.
const SELECT_CLASSES =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

type EditUserDialogProps = {
  user: PublicUser | null; // null = diálogo cerrado
  currentUserId: number;
  onClose: () => void;
  onDone: (message: string) => void;
};

export default function EditUserDialog({
  user,
  currentUserId,
  onClose,
  onDone,
}: EditUserDialogProps) {
  return (
    <Dialog
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            Modifica los datos de la cuenta. Los cambios se aplican al guardar.
          </DialogDescription>
        </DialogHeader>

        {/* key={user.id}: si cambia el usuario, el formulario se crea de cero */}
        {user && (
          <EditUserForm
            key={user.id}
            user={user}
            isSelf={user.id === currentUserId}
            onClose={onClose}
            onDone={onDone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// El formulario vive en un componente aparte para que arranque limpio
// cada vez que se abre el diálogo.
// ---------------------------------------------------------------------------

type EditUserFormProps = {
  user: PublicUser;
  isSelf: boolean;
  onClose: () => void;
  onDone: (message: string) => void;
};

function EditUserForm({ user, isSelf, onClose, onDone }: EditUserFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<EditUserFormInput>({
    resolver: zodResolver(editUserFormSchema),
    mode: "onTouched",
    defaultValues: { name: user.name, email: user.email, role: user.role },
  });

  async function onSubmit(values: EditUserFormInput) {
    setServerError(null);

    // Enviamos SOLO lo que cambió.
    const changes: Partial<EditUserFormInput> = {};
    if (values.name !== user.name) changes.name = values.name;
    if (values.email !== user.email) changes.email = values.email;
    if (!isSelf && values.role !== user.role) changes.role = values.role;

    // Si no cambió nada, no molestamos al servidor.
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      const data = await response.json().catch(() => null);

      // ✅ 200: guardado
      if (response.ok) {
        onDone(`Los cambios de ${data.user.name} se guardaron correctamente.`);
        return;
      }

      // El usuario desapareció mientras tanto (otro admin lo eliminó)
      if (response.status === 404) {
        onDone("Ese usuario ya no existe. La lista se ha actualizado.");
        return;
      }

      // Sin sesión
      if (response.status === 401) {
        redirectToLoginExpired();
        return;
      }

      // Email repetido → error bajo el campo email
      if (response.status === 409 && data?.code === "EMAIL_TAKEN") {
        form.setError("email", { message: data.error });
        return;
      }

      // Datos rechazados por el servidor → errores bajo cada campo
      if (response.status === 400 && data?.fieldErrors) {
        const campos = ["name", "email", "role"] as const;
        for (const campo of campos) {
          const mensajes: string[] | undefined = data.fieldErrors[campo];
          if (mensajes?.length) {
            form.setError(campo, { message: mensajes[0] });
          }
        }
        return;
      }

      // Cualquier otro caso (403, otros 409...): mostramos el mensaje de la API
      setServerError(data?.error ?? "No se pudo guardar. Inténtalo de nuevo.");
    } catch {
      setServerError("No se pudo conectar con el servidor. Revisa tu conexión.");
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {/* ---------- Nombre ---------- */}
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-name">Nombre</FieldLabel>
              <Input
                {...field}
                id="edit-name"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* ---------- Email ---------- */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-email">Email</FieldLabel>
              <Input
                {...field}
                id="edit-email"
                type="email"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* ---------- Rol ---------- */}
        <Controller
          name="role"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="edit-role">Rol</FieldLabel>
              <select
                {...field}
                id="edit-role"
                disabled={isSelf}
                aria-invalid={fieldState.invalid}
                className={SELECT_CLASSES}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              {isSelf && (
                <FieldDescription>No puedes cambiar tu propio rol.</FieldDescription>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* ---------- Error general ---------- */}
        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}
      </FieldGroup>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <RiLoader4Line className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <RiSaveLine />
              Guardar cambios
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}