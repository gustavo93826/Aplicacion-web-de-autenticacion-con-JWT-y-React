// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  RiErrorWarningLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLoader4Line,
  RiLoginBoxLine,
  RiInformationLine
} from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { LOGIN_REASONS, type LoginReason } from "@/lib/login-reasons";

// A dónde llevamos a la persona tras iniciar sesión.

const REDIRECT_AFTER_LOGIN = "/dashboard";

type LoginFormProps = {
  // Por qué llegamos al login. Lo decide la página, ya validado.
  reason: LoginReason | null;
};

export default function LoginForm({ reason }: LoginFormProps) {
  const router = useRouter();

  // Pizarras propias del componente
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // El "secretario" del formulario, esta vez con el esquema de LOGIN
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  // Se ejecuta SOLO si el formulario pasó la validación de Zod
  async function onSubmit(values: LoginInput) {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json().catch(() => null);

      // ✅ 200: sesión iniciada (la cookie ya está en el navegador)
      if (response.ok) {
        setIsRedirecting(true);
        router.push(REDIRECT_AFTER_LOGIN);
        router.refresh();
        return;
      }

      // ⚠️ 401: credenciales incorrectas → aviso general (no se asocia a un campo)
      if (response.status === 401) {
        setServerError(data?.error ?? "Email o contraseña incorrectos");
        form.resetField("password"); // vaciar la contraseña
        form.setFocus("password"); // y poner el cursor ahí
        return;
      }

      // ⛔ 429: demasiados intentos → aviso general con el tiempo de espera
      if (response.status === 429) {
        setServerError(
          data?.error ?? "Demasiados intentos. Inténtalo de nuevo más tarde."
        );
        return;
      }

      // ⚠️ 400: el servidor rechazó el formato → errores bajo cada campo
      if (response.status === 400 && data?.fieldErrors) {
        const campos = ["email", "password"] as const;
        for (const campo of campos) {
          const mensajes: string[] | undefined = data.fieldErrors[campo];
          if (mensajes?.length) {
            form.setError(campo, { message: mensajes[0] });
          }
        }
        return;
      }

      // ❌ Cualquier otro caso: mensaje amable, sin detalles técnicos
      setServerError("Ocurrió un error inesperado. Inténtalo de nuevo.");
    } catch {
      // fetch falló por completo (sin red, servidor apagado...)
      setServerError("No se pudo conectar con el servidor. Revisa tu conexión.");
    }
  }

  const isBusy = form.formState.isSubmitting || isRedirecting;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Introduce tu email y tu contraseña para entrar.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {/* ---------- Motivo de llegada (sesión caducada / cerrada) ---------- */}
            {reason && !serverError && (
              <Alert>
                <RiInformationLine />
                <AlertTitle>{LOGIN_REASONS[reason].title}</AlertTitle>
                <AlertDescription>{LOGIN_REASONS[reason].message}</AlertDescription>
                </Alert>
            )}
            {/* ---------- Aviso general de error ---------- */}
            {serverError && (
              <Alert variant="destructive">
                <RiErrorWarningLine />
                <AlertTitle>No se pudo iniciar sesión</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* ---------- Email ---------- */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="login-email"
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

            {/* ---------- Contraseña (con botón de ver/ocultar) ---------- */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-password">Contraseña</FieldLabel>

                  <div className="relative">
                    <Input
                      {...field}
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="pr-10"
                      aria-invalid={fieldState.invalid}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <RiEyeOffLine className="size-4" />
                      ) : (
                        <RiEyeLine className="size-4" />
                      )}
                    </button>
                  </div>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* ---------- Botón ---------- */}
            <Button type="submit" disabled={isBusy}>
              {isBusy ? (
                <>
                  <RiLoader4Line className="animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <RiLoginBoxLine />
                  Iniciar sesión
                </>
              )}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-4 text-center text-sm">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="underline underline-offset-4">
            Regístrate
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}