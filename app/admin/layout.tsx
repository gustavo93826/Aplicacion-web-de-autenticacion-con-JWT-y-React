// app/admin/layout.tsx
import AppHeader from "@/components/layout/AppHeader";
import { requireAdmin } from "@/lib/authz";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Comodidad: si no eres admin, ni se dibuja la cabecera.
  const user = await requireAdmin();

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="mx-auto max-w-5xl p-4 sm:p-8">{children}</main>
    </div>
  );
}