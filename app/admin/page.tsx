// app/admin/page.tsx
import { RiGroupLine } from "@remixicon/react";

import UsersTable from "@/components/admin/UsersTable";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/authz";
import { listUsers } from "@/lib/users";

export default async function AdminPage() {
  // La comprobación REAL, siempre lo primero. Nos devuelve al admin que está mirando.
  const admin = await requireAdmin();

  // Lectura directa de la base de datos (esto es un componente de servidor).
  const users = listUsers();
  const adminCount = users.filter((user) => user.role === "admin").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <RiGroupLine className="size-6" />
          Administración
        </h1>
        <p className="text-muted-foreground">
          Gestiona las cuentas de la aplicación.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Usuarios registrados</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="text-3xl">{adminCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <UsersTable users={users} currentUserId={admin.id} />
    </div>
  );
}