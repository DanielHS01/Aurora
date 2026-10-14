"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";

import { signInAction } from "@/lib/actions/auth-actions";

const labelClass = "mb-2 block text-sm font-medium text-zinc-300";
const inputClass =
  "h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-10 pr-4 text-sm text-zinc-50 shadow-sm placeholder:text-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-[3px] focus:ring-zinc-50/10";
const iconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500";
const eyeButtonClass =
  "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-zinc-400 transition hover:text-zinc-200";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);

      // Pasa por el servidor (signInAction) en vez de autenticar desde
      // el navegador — evita la condición de carrera de cookies que
      // causaba la expulsión inmediata, y centraliza la validación de
      // mantenimiento en un solo lugar seguro.
      await signInAction(formData);

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="w-full max-w-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
        <div className="space-y-1 p-6 pb-5">
          <h2 className="text-2xl font-semibold tracking-tight">Bienvenida</h2>
          <p className="text-sm text-zinc-400">
            Accede a tu dashboard Aurora y gestiona atención, reservas,
            pedidos, pagos y analítica en tiempo real.
          </p>
        </div>

        <div className="p-6 pt-0">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <div className="relative">
                <FiMail className={iconClass} />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Contraseña
              </label>
              <div className="relative">
                <FiLock className={iconClass} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className={eyeButtonClass}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-4 w-4" />
                  ) : (
                    <FiEye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end text-sm">
              <Link
                href="/reset-password"
                className="text-zinc-300 transition hover:text-zinc-100"
              >
                Recuperar acceso
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-50 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Entrando..." : "Acceder"}
              <FiArrowRight className="transition group-hover:translate-x-1" />
            </button>
          </form>
        </div>

        <div className="flex justify-center border-t border-zinc-800/80 p-5 text-sm text-zinc-400">
          ¿Aún no tienes cuenta?
          <Link href="/register" className="ml-1 text-zinc-200 hover:underline">
            Empieza gratis por 14 días
          </Link>
        </div>
      </div>
    </motion.div>
  );
}