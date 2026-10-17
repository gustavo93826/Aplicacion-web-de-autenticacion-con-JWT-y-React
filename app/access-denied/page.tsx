// app/access-denied/page.tsx
import Link from "next/link";
import { RiLockLine } from "@remixicon/react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <RiLockLine className="size-6" />
          </div>
          <CardTitle>Acceso denegado</CardTitle>
          <CardDescription>
            Tu cuenta no tiene permiso para ver esta página.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard" className={buttonVariants()}>
            Volver al panel
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}