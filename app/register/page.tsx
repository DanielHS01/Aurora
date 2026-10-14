import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import RegisterForm from "@/app/register/register-form";
import AuroraBackdrop from "@/components/aurora-backdrop";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50">
      <AuroraBackdrop />

      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/60 px-6 py-4 backdrop-blur">
        <Link
          href="/"
          className="text-2xl font-black uppercase tracking-[-0.08em]"
        >
          AURORA
        </Link>

        <Link
          href="/login"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-sm text-zinc-50 transition hover:bg-zinc-900/80"
        >
          Iniciar sesión
          <FiArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 pb-10 pt-28">
        <RegisterForm />
      </section>
    </main>
  );
}