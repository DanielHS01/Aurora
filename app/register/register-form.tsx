"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiGrid,
  FiBriefcase,
  FiChevronDown,
  FiCheckCircle,
} from "react-icons/fi";

import { signUpAction } from "@/lib/actions/auth-actions";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurante" },
  { value: "barbershop", label: "Barbería" },
  { value: "optical", label: "Óptica" },
] as const;

type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-250, 250], [7, -7]);
  const rotateY = useTransform(mouseX, [-250, 250], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!businessType) {
      setError("Selecciona el tipo de negocio.");
      return;
    }

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
      formData.set("fullName", fullName);
      formData.set("email", email);
      formData.set("password", password);
      formData.set("businessName", businessName);
      formData.set("businessType", businessType);

      await signUpAction(formData);

      setRegistered(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <motion.div
        className="mx-auto w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="rounded-[2rem] border border-white/10 bg-black/55 p-8 text-center shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
            <FiCheckCircle size={21} />
          </div>

          <h2 className="text-2xl font-medium uppercase tracking-[-0.06em]">
            Revisa tu correo
          </h2>

          <p className="mt-3 text-sm text-white/50">
            Te enviamos un enlace de confirmación a{" "}
            <span className="text-white">{email}</span>. Tu workspace se
            creará en cuanto confirmes la cuenta.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-white hover:underline"
          >
            Ir a iniciar sesión <FiArrowRight />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mx-auto w-full max-w-sm"
      style={{ perspective: 1400 }}
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          mouseX.set(0);
          mouseY.set(0);
        }}
        className="group relative"
      >
        <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-r from-white/5 via-white/20 to-white/5 opacity-60 blur-sm" />

        <div className="relative rounded-[2rem] border border-white/10 bg-black/55 p-7 shadow-2xl backdrop-blur-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
              <FiGrid size={21} />
            </div>

            <h2 className="text-3xl font-medium uppercase tracking-[-0.06em]">
              Crear Workspace
            </h2>

            <p className="mt-2 text-sm text-white/45">
              Empieza a utilizar Aurora.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <label className="block" htmlFor="fullName">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Nombre
              </span>
              <div className="relative">
                <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none focus:border-white/30"
                />
              </div>
            </label>

            <label className="block" htmlFor="email">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Email
              </span>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none focus:border-white/30"
                />
              </div>
            </label>

            <label className="block" htmlFor="businessName">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Nombre del negocio
              </span>
              <div className="relative">
                <FiBriefcase className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  autoComplete="organization"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none focus:border-white/30"
                />
              </div>
            </label>

            <label className="block" htmlFor="businessType">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Tipo de negocio
              </span>
              <div className="relative">
                <FiGrid className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <select
                  id="businessType"
                  name="businessType"
                  required
                  value={businessType}
                  onChange={(e) =>
                    setBusinessType(e.target.value as BusinessType)
                  }
                  className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-10 text-sm text-white outline-none focus:border-white/30"
                >
                  <option value="" disabled className="bg-black text-white/40">
                    Selecciona una opción
                  </option>
                  {BUSINESS_TYPES.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                      className="bg-black text-white"
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35" />
              </div>
            </label>

            <label className="block" htmlFor="password">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Contraseña
              </span>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-12 text-sm text-white outline-none focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <label className="block" htmlFor="confirmPassword">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Confirmar contraseña
              </span>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-12 text-sm text-white outline-none focus:border-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-medium uppercase text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creando..." : "Crear Workspace"}
              <FiArrowRight className="transition group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/40">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-white hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}