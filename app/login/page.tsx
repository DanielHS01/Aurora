import Link from "next/link";
import LoginForm from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(255,255,255,0.10),transparent_32%),radial-gradient(circle_at_80%_55%,rgba(255,255,255,0.06),transparent_35%)]" />

      {/* Esferas */}
      <div className="absolute right-[-12%] top-1/2 hidden h-[760px] w-[760px] -translate-y-1/2 rounded-full bg-white lg:block" />

      <div className="absolute right-[-9%] top-1/2 hidden h-[620px] w-[620px] -translate-y-1/2 rounded-full border border-black/10 bg-zinc-100 lg:block" />

      {/* Logo */}
      <Link
        href="/"
        className="fixed left-6 top-6 z-50 text-3xl font-medium uppercase tracking-[-0.08em]"
      >
        AURORA
      </Link>

      <section className="relative z-10 grid min-h-screen items-center gap-12 px-6 py-28 lg:grid-cols-2 lg:px-16">
        {/* Lado izquierdo */}
        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
          <span className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/50 backdrop-blur-xl">
            Acceso Aurora
          </span>

          <h1 className="text-6xl font-medium uppercase leading-[0.82] tracking-[-0.08em] md:text-8xl">
            Entra al centro operativo.
          </h1>

          <p className="mx-auto mt-8 max-w-md text-lg leading-8 text-white/50 lg:mx-0">
            De la landing al dashboard. Accede para gestionar atención,
            reservas, pedidos, pagos y analítica en tiempo real.
          </p>
        </div>

        {/* Formulario */}
        <LoginForm />
      </section>
    </main>
  );
}