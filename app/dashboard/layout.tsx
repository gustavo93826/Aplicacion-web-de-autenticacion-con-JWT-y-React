// app/dashboard/layout.tsx
import { redirect } from "next/navigation";

import AppHeader from "@/components/layout/AppHeader";
import { getCurrentUser } from "@/lib/session";
import { LOGIN_EXPIRED_PATH } from "@/lib/login-reasons";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (!user) {
    redirect(LOGIN_EXPIRED_PATH);
  }

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="mx-auto max-w-5xl p-4 sm:p-8">{children}</main>
    </div>
  );
}