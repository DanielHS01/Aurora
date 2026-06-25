"use client";

import Link from "next/link";
import { useState } from "react";
import { FiMenu, FiX, FiArrowUpRight, FiGlobe } from "react-icons/fi";

const navLinks = [
  { label: "Producto", href: "#producto" },
  { label: "Soluciones", href: "#soluciones" },
  { label: "Sectores", href: "#sectores" },
  { label: "Precios", href: "#precios" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full px-4 pt-4 ">
      <nav className="relative mx-auto grid h-[68px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center bg-white/5 rounded-2xl backdrop-blur-xl px-6 shadow-sm border border-white/10">
        <Link
          href="/"
          className="text-2xl font-black uppercase leading-none tracking-[-0.08em] text-white"
        >
          AURORA
        </Link>

        <div className="hidden items-center justify-center gap-10 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white transition hover:text-violet-700"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center justify-end gap-5 lg:flex">
          <button
            type="button"
            aria-label="Cambiar idioma"
            className="text-white transition hover:text-violet-700"
          >
            <FiGlobe size={16} />
          </button>

          <Link
            href="/login"
            className="text-sm font-medium text-white transition hover:text-violet-700"
          >
            Acceder
          </Link>

          <Link
            href="#demo"
            className="group flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-black uppercase text-white transition hover:bg-violet-700"
          >
            Solicitar demo
            <FiArrowUpRight className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-black text-white lg:hidden"
          aria-label="Abrir menú"
        >
          {isOpen ? <FiX size={21} /> : <FiMenu size={21} />}
        </button>
      </nav>

      {isOpen && (
        <div className="mx-auto mt-3 max-w-7xl rounded-2xl bg-white p-5 shadow-xl lg:hidden">
          <div className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-black"
              >
                {link.label}
              </a>
            ))}

            <Link
              href="/login"
              className="rounded-full border border-black/10 px-5 py-3 text-center text-sm font-medium text-black"
            >
              Acceder
            </Link>

            <Link
              href="#demo"
              className="rounded-full bg-black px-5 py-3 text-center text-sm font-black uppercase text-white"
            >
              Solicitar demo
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}