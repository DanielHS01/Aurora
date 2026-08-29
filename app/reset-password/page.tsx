"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMail, FiArrowRight, FiCheckCircle } from "react-icons/fi";

import { requestPasswordResetAction } from "@/lib/actions/auth-actions";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      await requestPasswordResetAction(formData);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-black/55 p-7 text-white shadow-2xl backdrop-blur-2xl">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
              <FiCheckCircle size={21} />
            </div>
            <h2 className="text-2xl font-medium uppercase tracking-[-0.06em]">Revisa tu correo</h2>
            <p className="mt-3 text-sm text-white/50">
              Si existe una cuenta con <span className="text-white">{email}</span>, te enviamos un
              enlace para restablecer tu contraseña.
            </p>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-white hover:underline">
              Volver a iniciar sesión <FiArrowRight />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-medium uppercase tracking-[-0.06em]">Recuperar acceso</h2>
              <p className="mt-2 text-sm text-white/45">
                Te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label className="block" htmlFor="email">
                <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">Email</span>
                <div className="relative">
                  <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none focus:border-white/25"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-medium uppercase text-black transition hover:bg-zinc-200 disabled:opacity-70"
              >
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-white/40">
              <Link href="/login" className="text-white hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}