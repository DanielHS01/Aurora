"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiGrid,
} from "react-icons/fi";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-250, 250], [7, -7]);
  const rotateY = useTransform(mouseX, [-250, 250], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 1400);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(255,255,255,0.10),transparent_32%),radial-gradient(circle_at_80%_55%,rgba(255,255,255,0.06),transparent_35%)]" />

      <div className="absolute right-[-12%] top-1/2 hidden h-[760px] w-[760px] -translate-y-1/2 rounded-full bg-white lg:block" />
      <div className="absolute right-[-9%] top-1/2 hidden h-[620px] w-[620px] -translate-y-1/2 rounded-full border border-black/10 bg-zinc-100 lg:block" />

      <Link
        href="/"
        className="fixed left-6 top-6 z-50 text-3xl font-medium uppercase tracking-[-0.08em]"
      >
        AURORA
      </Link>

      <section className="relative z-10 grid min-h-screen items-center gap-12 px-6 py-28 lg:grid-cols-2 lg:px-16">
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
            <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-r from-white/5 via-white/25 to-white/5 opacity-60 blur-sm" />

            <div className="absolute -inset-px overflow-hidden rounded-[2rem]">
              <motion.div
                className="absolute left-[-40%] top-0 h-px w-[40%] bg-gradient-to-r from-transparent via-white to-transparent"
                animate={{ left: ["-40%", "100%"] }}
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
                    Email
                  </span>

                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />

                    <input
                      type="email"
                      required
                      placeholder="tu@email.com"
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
                      placeholder="••••••••"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/25 focus:bg-white/[0.09]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between pt-1 text-xs text-white/45">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-white" />
                    Recordarme
                  </label>

                  <Link href="#" className="transition hover:text-white">
                    Recuperar acceso
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-medium uppercase text-black transition hover:bg-zinc-200 disabled:opacity-70"
                >
                  {loading ? "Entrando..." : "Acceder"}
                  <FiArrowRight className="transition group-hover:translate-x-1" />
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-white/40">
                ¿Aún no tienes acceso?{" "}
                <Link href="#demo" className="text-white hover:underline">
                  Solicitar demo
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}