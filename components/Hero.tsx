"use client";

import { FiArrowUpRight } from "react-icons/fi";
import CosmicParallaxBg from "./CosmicParallaxBg";

const tags = ["Pedidos", "Reservas", "Pagos", "Facturación", "WhatsApp", "IA"];

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 pt-28 text-white">
      <CosmicParallaxBg
        head="Aurora"
        text=""
      />

      <div className="relative z-10 mt-[38vh] flex flex-col items-center text-center sm:mt-[42vh] lg:mt-[46vh]">
        <div className="flex max-w-3xl flex-wrap items-center justify-center gap-3">
          
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-xl"
            >
              {tag}
            </span>
          ))}
        </div>

        <a
          href="#demo"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-medium uppercase text-black transition hover:bg-zinc-200"
        >
          Solicitar demo
          <FiArrowUpRight />
        </a>
      </div>
    </section>
  );
}