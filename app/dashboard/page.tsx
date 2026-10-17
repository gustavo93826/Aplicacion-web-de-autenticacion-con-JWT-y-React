// app/dashboard/page.tsx
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, getInitials, roleLabel } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { LOGIN_EXPIRED_PATH } from "@/lib/login-reasons";

export default async function DashboardPage() {
  // La comprobación REAL: la página no se fía de nadie.
  // (Gracias a cache(), esta llamada NO repite la consulta que hizo el layout.)
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!user) {
    redirect(LOGIN_EXPIRED_PATH);
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hola, {firstName} 👋</h1>
        <p className="text-muted-foreground">Este es tu panel privado.</p>
      </div>

      <Card className="max-w-xl">
        <CardContent className="space-y-6">
          {/* Avatar con iniciales */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {getInitials(user.name)}
            </div>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Datos de la cuenta */}
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-8 gap-y-3 text-sm">
            <dt className="text-muted-foreground">ID de usuario</dt>
            <dd>{user.id}</dd>

            <dt className="text-muted-foreground">Rol</dt>
            <dd>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {roleLabel(user.role)}
              </Badge>
            </dd>

            <dt className="text-muted-foreground">Miembro desde</dt>
            <dd>{formatDate(user.created_at)}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}