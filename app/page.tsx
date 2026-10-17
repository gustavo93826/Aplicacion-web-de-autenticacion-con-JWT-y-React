// app/page.tsx
import Link from "next/link";
import {
  RiDashboardLine,
  RiLoginBoxLine,
  RiUserAddLine,
} from "@remixicon/react";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  // La portada se adapta: distinta para visitantes y para usuarios conectados.
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold">Sistema de autenticación</h1>
      <p className="text-muted-foreground">
        Next.js · SQLite · JWT en cookies httpOnly · Shadcn UI
      </p>

      {user ? (
        <div className="space-y-4">
          <p>
            Sesión iniciada como <strong>{user.name}</strong>.
          </p>
          <Link href="/dashboard" className={buttonVariants()}>
            <RiDashboardLine />
            Ir al panel
          </Link>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link href="/login" className={buttonVariants()}>
            <RiLoginBoxLine />
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className={buttonVariants({ variant: "outline" })}
          >
            <RiUserAddLine />
            Crear cuenta
          </Link>
        </div>
      )}
    </main>
  );
}