"use client";

import {
  FiInstagram,
  FiLinkedin,
  FiYoutube,
  FiArrowUpRight,
} from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="pointer-events-none absolute top-0 left-1/2 h-[300px] w-[700px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[140px]" />

      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-16 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Marca */}
          <div>
            <div className="pointer-events-none absolute bottom-[-120px] left-1/2 -translate-x-1/2 text-[18rem] font-medium uppercase tracking-[-0.08em] text-white/[0.02]">
              AURORA
            </div>
            <h2 className="text-7xl font-medium uppercase tracking-[-0.08em] md:text-8xl">
              AURORA
            </h2>

            <p className="mt-6 max-w-md text-lg leading-8 text-white/50">
              El sistema operativo para negocios modernos. Automatiza atención,
              reservas, pagos, facturación y operaciones desde una única
              plataforma.
            </p>

            <a
              href="#demo"
              className="group mt-8 inline-flex items-center gap-2 text-sm uppercase text-white/70 transition hover:text-white"
            >
              Solicitar demo
              <FiArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          </div>

          {/* Navegación */}
          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-white/35">
              Navegación
            </p>

            <div className="flex flex-col gap-4 text-lg">
              <a href="#producto" className="text-white/60 hover:text-white">
                Producto
              </a>

              <a href="#soluciones" className="text-white/60 hover:text-white">
                Soluciones
              </a>

              <a href="#sectores" className="text-white/60 hover:text-white">
                Sectores
              </a>

              <a href="#precios" className="text-white/60 hover:text-white">
                Precios
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-white/35">
              Social
            </p>

            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/60 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                <FiInstagram size={20} />
              </a>

              <a
                href="#"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/60 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                <FiLinkedin size={20} />
              </a>

              <a
                href="#"
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/60 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
              >
                <FiYoutube size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 text-sm text-white/35 md:flex-row">
          <p>© 2026 Aurora. Todos los derechos reservados.</p>

          <div className="flex gap-6">
            <a href="#" className="hover:text-white">
              Privacidad
            </a>

            <a href="#" className="hover:text-white">
              Términos
            </a>

            <a href="#" className="hover:text-white">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
