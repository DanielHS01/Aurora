"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "react-icons/fi";

import { createClient } from "@/lib/supabase/client";

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

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

    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/login?registered=true");
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
            <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Nombre
              </span>

              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Email
              </span>

              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white outline-none"
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
                  type={
                    showPassword ? "text" : "password"
                  }
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-12 text-sm text-white outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                Confirmar contraseña
              </span>

              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  required
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-12 text-sm text-white outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-medium uppercase text-black transition hover:bg-zinc-200 disabled:opacity-70"
            >
              {loading
                ? "Creando..."
                : "Crear Workspace"}

              <FiArrowRight className="transition group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/40">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/login"
              className="text-white hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}