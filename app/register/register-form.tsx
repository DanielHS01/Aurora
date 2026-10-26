"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

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
  { value: "restaurant", label: "Restaurante", enabled: true },
  { value: "barber shop", label: "Barbería (próximamente)", enabled: false },
  { value: "optical", label: "Óptica (próximamente)", enabled: false },
] as const;

type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

const labelClass = "mb-2 block text-sm font-medium text-zinc-300";
const inputClass =
  "h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-10 pr-4 text-sm text-zinc-50 shadow-sm placeholder:text-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-[3px] focus:ring-zinc-50/10";
const iconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500";
const eyeButtonClass =
  "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-zinc-400 transition hover:text-zinc-200";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("restaurant");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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

    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y la Política de Privacidad para continuar.");
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

      const result = await signUpAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setRegistered(true);
    } catch {
      setError("No se pudo completar el registro. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-8 text-center shadow-sm backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 text-zinc-900">
            <FiCheckCircle size={21} />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            Revisa tu correo
          </h2>

          <p className="mt-3 text-sm text-zinc-400">
            Te enviamos un enlace de confirmación a{" "}
            <span className="text-zinc-50">{email}</span>. Tu workspace se
            creará en cuanto confirmes la cuenta.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-zinc-200 hover:underline"
          >
            Ir a iniciar sesión <FiArrowRight />
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-3xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
        <div className="space-y-1 p-6 pb-5 sm:px-8 sm:pt-8">
          <h2 className="text-2xl font-semibold tracking-tight">
            Crear Workspace
          </h2>
          <p className="text-sm text-zinc-400">
            Tu empresa, tu dashboard y todas las herramientas de Aurora en un
            solo lugar.
          </p>
        </div>

        <div className="p-6 pt-0 sm:px-8">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-2"
            noValidate
          >
            {/* Nombre */}
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Nombre
              </label>
              <div className="relative">
                <FiUser className={iconClass} />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre completo"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <div className="relative">
                <FiMail className={iconClass} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@empresa.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Nombre del negocio */}
            <div>
              <label htmlFor="businessName" className={labelClass}>
                Nombre del negocio
              </label>
              <div className="relative">
                <FiBriefcase className={iconClass} />
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  autoComplete="organization"
                  placeholder="Mi negocio"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Tipo de negocio */}
            <div>
              <label htmlFor="businessType" className={labelClass}>
                Tipo de negocio
              </label>
              <div className="relative">
                <FiGrid className={iconClass} />
                <select
                  id="businessType"
                  name="businessType"
                  required
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  {BUSINESS_TYPES.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                      disabled={!type.enabled}
                      className="bg-zinc-950 text-zinc-50 disabled:text-zinc-600"
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirmar contraseña
              </label>
              <div className="relative">
                <FiLock className={iconClass} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className={eyeButtonClass}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-4 w-4" />
                  ) : (
                    <FiEye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Términos (ancho completo) */}
            <label className="flex items-start gap-2.5 md:col-span-2">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-zinc-50"
              />
              <span className="text-xs leading-relaxed text-zinc-400">
                Acepto los{" "}
                <Link
                  href="/legal/terminos"
                  target="_blank"
                  className="text-zinc-200 underline hover:text-zinc-50"
                >
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link
                  href="/legal/privacidad"
                  target="_blank"
                  className="text-zinc-200 underline hover:text-zinc-50"
                >
                  Política de Privacidad
                </Link>{" "}
                de Aurora.
              </span>
            </label>

            {/* Botón (ancho completo) */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-50 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
            >
              {loading ? "Creando..." : "Crear Workspace"}
              <FiArrowRight className="transition group-hover:translate-x-1" />
            </button>
          </form>
        </div>

        <div className="flex justify-center border-t border-zinc-800/80 p-5 text-sm text-zinc-400">
          ¿Ya tienes una cuenta?
          <Link href="/login" className="ml-1 text-zinc-200 hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </motion.div>
  );
}