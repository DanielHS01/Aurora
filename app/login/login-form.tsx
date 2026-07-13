"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useMotionValue, useTransform } from "framer-motion";

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiGrid,
} from "react-icons/fi";

import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirectTo") ?? "/test-business";

  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-250, 250], [7, -7]);
  const rotateY = useTransform(mouseX, [-250, 250], [-7, 7]);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();

    mouseX.set(
      e.clientX - rect.left - rect.width / 2
    );

    mouseY.set(
      e.clientY - rect.top - rect.height / 2
    );
  };

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    setError("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setLoading(false);

      setError(error.message);

      return;
    }

    router.replace(redirectTo);

    router.refresh();
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
      {/* Glow exterior */}
      <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-r from-white/5 via-white/20 to-white/5 opacity-60 blur-sm" />

      {/* Línea animada superior */}
      <div className="absolute -inset-px overflow-hidden rounded-[2rem]">
        <motion.div
          className="absolute left-[-40%] top-0 h-px w-[40%] bg-gradient-to-r from-transparent via-white to-transparent"
          animate={{
            left: ["-40%", "110%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 1,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative rounded-[2rem] border border-white/10 bg-black/55 p-7 shadow-2xl backdrop-blur-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white text-black">
            <FiGrid size={21} />
          </div>

          <h2 className="text-3xl font-medium uppercase tracking-[-0.06em]">
            Bienvenida
          </h2>

          <p className="mt-2 text-sm text-white/45">
            Accede a tu dashboard Aurora.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
              Email
            </span>

            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />

              <input
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/25 focus:bg-white/[0.09]"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
              Contraseña
            </span>

            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />

              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/25 focus:bg-white/[0.09]"
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between pt-1 text-xs text-white/45">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-white"
              />
              Recordarme
            </label>

            <Link
              href="/reset-password"
              className="transition hover:text-white"
            >
              Recuperar acceso
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-medium uppercase text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Acceder"}

            <FiArrowRight className="transition group-hover:translate-x-1" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">
          ¿Aún no tienes acceso?{" "}
          <Link
            href="/#demo"
            className="text-white hover:underline"
          >
            Solicitar demo
          </Link>
        </p>
      </div>
    </motion.div>
  </motion.div>
);
}