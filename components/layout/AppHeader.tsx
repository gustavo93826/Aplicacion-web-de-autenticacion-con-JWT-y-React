// components/layout/AppHeader.tsx
import Link from "next/link";
import { RiAdminLine, RiShieldUserLine } from "@remixicon/react";

import LogoutButton from "@/components/auth/LogoutButton";
import { Badge } from "@/components/ui/badge";
import type { PublicUser } from "@/lib/db";
import { roleLabel } from "@/lib/format";

export default function AppHeader({ user }: { user: PublicUser }) {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <RiShieldUserLine className="size-5" />
            Mi portafolio
          </Link>

          {/* Este enlace SOLO se dibuja para administradores */}
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RiAdminLine className="size-4" />
              Administración
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 text-sm">
          {/* El nombre se oculta en móviles para que todo quepa */}
          <span className="hidden sm:inline">{user.name}</span>
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
            {roleLabel(user.role)}
          </Badge>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}