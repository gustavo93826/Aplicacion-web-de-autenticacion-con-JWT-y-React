// components/admin/UsersTable.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiSearchLine,
} from "@remixicon/react";

import DeleteUserDialog from "@/components/admin/DeleteUserDialog";
import EditUserDialog from "@/components/admin/EditUserDialog";
import UserAvatar from "@/components/UserAvatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PublicUser } from "@/lib/db";
import { formatDate, normalizeText, roleLabel } from "@/lib/format";

type RoleFilter = "all" | "user" | "admin";

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "admin", label: "Administradores" },
  { value: "user", label: "Usuarios" },
];

type UsersTableProps = {
  users: PublicUser[];
  currentUserId: number;
};

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter();
  const [tableUsers, setTableUsers] = useState(users);

  // Búsqueda y filtro (Paso 17.3)
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  // NUEVO: qué usuario se está editando / eliminando (null = ninguno)
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<PublicUser | null>(null);

  // NUEVO: mensaje de éxito
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setTableUsers(users);
  }, [users]);

  // El mensaje se apaga solo a los 5 segundos.
  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(null), 5000);

    // Limpieza: si el mensaje cambia antes de tiempo, cancelamos el temporizador viejo.
    return () => clearTimeout(timer);
  }, [notice]);

  // Un usuario editado se refleja localmente, sin recargar ni perder los filtros.
  function handleDone(message: string, updatedUser?: PublicUser) {
    setEditingUser(null);
    setDeletingUser(null);
    setNotice(message);

    if (updatedUser) {
      setTableUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        )
      );
      return;
    }

    router.refresh();
  }

  // ---------- Todo lo de abajo se CALCULA, no se guarda ----------
  const adminCount = tableUsers.filter((user) => user.role === "admin").length;
  const counts: Record<RoleFilter, number> = {
    all: tableUsers.length,
    admin: adminCount,
    user: tableUsers.length - adminCount,
  };

  const normalizedQuery = normalizeText(query.trim());

  const filteredUsers = tableUsers.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    const matchesQuery =
      normalizedQuery === "" ||
      normalizeText(user.name).includes(normalizedQuery) ||
      normalizeText(user.email).includes(normalizedQuery);

    return matchesRole && matchesQuery;
  });

  function clearFilters() {
    setQuery("");
    setRoleFilter("all");
  }

  return (
    <div className="space-y-4">
      {/* ---------- Mensaje de éxito ---------- */}
      {notice && (
        <Alert role="status">
          <RiCheckboxCircleLine />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {/* ---------- Barra de herramientas ---------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o email..."
            aria-label="Buscar usuarios"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={roleFilter === filter.value ? "default" : "outline"}
              aria-pressed={roleFilter === filter.value}
              onClick={() => setRoleFilter(filter.value)}
            >
              {filter.label} ({counts[filter.value]})
            </Button>
          ))}
        </div>
      </div>

      {/* ---------- Tabla ---------- */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="hidden sm:table-cell">
                Miembro desde
              </TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  <p>No se encontraron usuarios con esos filtros.</p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={clearFilters}
                    className="mt-1"
                  >
                    Limpiar filtros
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.id === currentUserId;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium">
                            <span className="truncate">{user.name}</span>
                            {isSelf && <Badge variant="outline">Tú</Badge>}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                      >
                        {roleLabel(user.role)}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(user.created_at)}
                    </TableCell>

                    {/* NUEVO: botones de acción */}
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar a ${user.name}`}
                          onClick={() => setEditingUser(user)}
                        >
                          <RiEdit2Line />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={isSelf}
                          aria-label={
                            isSelf
                              ? "No puedes eliminar tu propia cuenta"
                              : `Eliminar a ${user.name}`
                          }
                          onClick={() => setDeletingUser(user)}
                        >
                          <RiDeleteBinLine />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ---------- Contador ---------- */}
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Mostrando {filteredUsers.length} de {tableUsers.length} usuarios
      </p>

      {/* ---------- Diálogos (siempre presentes; se abren según el estado) ---------- */}
      <EditUserDialog
        user={editingUser}
        currentUserId={currentUserId}
        onClose={() => setEditingUser(null)}
        onDone={handleDone}
      />
      <DeleteUserDialog
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onDone={handleDone}
      />
    </div>
  );
}