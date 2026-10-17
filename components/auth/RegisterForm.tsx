// components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  RiCheckboxCircleLine,
  RiLoader4Line,
  RiUserAddLine,
} from "@remixicon/react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  registerFormSchema,
  type RegisterFormInput,
} from "@/lib/validations/auth";

export default function RegisterForm() {
  // Pizarras propias del componente
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredName, setRegisteredName] = useState<string | null>(null);

  // El "secretario" del formulario
  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema), // usa las reglas de Zod
    mode: "onTouched", // valida al salir de cada campo y luego mientras se escribe
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Se ejecuta SOLO si el formulario pasó la validación de Zod
  async function onSubmit(values: RegisterFormInput) {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Enviamos solo lo que el servidor necesita (sin confirmPassword)
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json().catch(() => null);

      // ✅ 201: cuenta creada
      if (response.ok) {
        setRegisteredName(data.user.name);
        form.reset();
        return;
      }

      // ⚠️ 409: el email ya existe → error bajo el campo email
      if (response.status === 409) {
        form.setError("email", {
          message: data?.error ?? "Ya existe una cuenta con ese email",
        });
        return;
      }

      // ⚠️ 400: el servidor rechazó datos → errores bajo cada campo
      if (response.status === 400 && data?.fieldErrors) {
        const campos = ["name", "email", "password"] as const;
        for (const campo of campos) {
          const mensajes: string[] | undefined = data.fieldErrors[campo];
          if (mensajes?.length) {
            form.setError(campo, { message: mensajes[0] });
          }
        }
        return;
      }

      // ❌ Cualquier otro caso: mensaje general
      setServerError(
        data?.error ?? "Ocurrió un error inesperado. Inténtalo de nuevo."
      );
    } catch {
      // fetch falla por completo (sin red, servidor apagado...)
      setServerError("No se pudo conectar con el servidor. Revisa tu conexión.");
    }
  }

  // Pantalla de éxito (los hooks ya se llamaron arriba, así que este return es seguro)
  if (registeredName) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RiCheckboxCircleLine className="size-6 text-green-600" />
            ¡Cuenta creada!
          </CardTitle>
          <CardDescription>
            Te damos la bienvenida, {registeredName}. Ya puedes iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={cn(buttonVariants(), "w-full")}>
            Ir a iniciar sesión
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>
          Completa tus datos para registrarte.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* noValidate: desactiva los avisos del navegador; validamos con Zod */}
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {/* ---------- Nombre ---------- */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-name">Nombre</FieldLabel>
                  <Input
                    {...field}
                    id="register-name"
                    autoComplete="name"
                    placeholder="Ana Pérez"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* ---------- Email ---------- */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder="ana@correo.com"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* ---------- Contraseña ---------- */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-password">
                    Contraseña
                  </FieldLabel>
                  <Input
                    {...field}
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* ---------- Repetir contraseña ---------- */}
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="register-confirm">
                    Repetir contraseña
                  </FieldLabel>
                  <Input
                    {...field}
                    id="register-confirm"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* ---------- Error general del servidor ---------- */}
            {serverError && (
              <p role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            )}

            {/* ---------- Botón ---------- */}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <RiLoader4Line className="animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <RiUserAddLine />
                  Crear cuenta
                </>
              )}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-4 text-center text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}