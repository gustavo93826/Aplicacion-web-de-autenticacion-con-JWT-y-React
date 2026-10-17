// app/login/page.tsx
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { parseLoginReason } from "@/lib/login-reasons";
import { getCurrentUser } from "@/lib/session";

type LoginPageProps = {
  // En las páginas, searchParams (lo que va tras el "?") llega dentro de una promesa.
  searchParams: Promise<{ reason?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Si ya hay una sesión válida (comprobada contra la BD), no mostramos el login.
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  // Pasamos por la lista blanca: solo llega un motivo conocido, o null.
  const { reason } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm reason={parseLoginReason(reason)} />
    </main>
  );
}