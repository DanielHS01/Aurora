"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const H_LINES = ["top-[18%]", "top-[50%]", "top-[82%]"];
const V_LINES = ["left-[22%]", "left-[50%]", "left-[78%]"];

export default function AuroraBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [];
    let raf = 0;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const make = (): P => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.35 + 0.15,
    });

    const init = () => {
      ps = [];
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < count; i++) ps.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 40;
          p.v = Math.random() * 0.25 + 0.05;
          p.o = Math.random() * 0.35 + 0.15;
        }
        ctx.fillStyle = `rgba(250,250,250,${p.o})`;
        ctx.fillRect(p.x, p.y, 0.7, 2.2);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    setSize();
    init();
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Viñeta */}
      <div className="absolute inset-0 [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />

      {/* Líneas animadas */}
      <div className="absolute inset-0 opacity-70">
        {H_LINES.map((pos, i) => (
          <motion.div
            key={pos}
            className={`absolute inset-x-0 h-px origin-center bg-zinc-800 ${pos}`}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.7 }}
            transition={{ duration: 0.8, delay: 0.12 + i * 0.1, ease: [0.22, 0.61, 0.36, 1] }}
          />
        ))}
        {V_LINES.map((pos, i) => (
          <motion.div
            key={pos}
            className={`absolute inset-y-0 w-px origin-top bg-zinc-800 ${pos}`}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 0.7 }}
            transition={{ duration: 0.9, delay: 0.42 + i * 0.12, ease: [0.22, 0.61, 0.36, 1] }}
          />
        ))}
      </div>

      {/* Partículas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-50 mix-blend-screen"
      />
    </div>
  );
}