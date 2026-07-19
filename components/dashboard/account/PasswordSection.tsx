"use client";

import { useState } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";

import { updatePasswordAction } from "@/lib/actions/auth-actions";

export default function PasswordSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("password", password);
      formData.set("confirmPassword", confirmPassword);

      await updatePasswordAction(formData);

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="mb-1 text-sm font-medium uppercase tracking-wide text-black/50">
        Cambiar contraseña
      </h2>
      <p className="mb-6 text-sm text-black/40">
        Usa una contraseña de al menos 8 caracteres.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Contraseña actualizada correctamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block" htmlFor="password">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Nueva contraseña
          </span>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-11 pr-12 text-sm outline-none focus:border-black/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </label>

        <label className="block" htmlFor="confirmPassword">
          <span className="mb-2 block text-xs uppercase tracking-wide text-black/40">
            Confirmar nueva contraseña
          </span>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-black/10 bg-black/[0.02] pl-11 pr-12 text-sm outline-none focus:border-black/30"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-60"
        >
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>
    </section>
  );
}