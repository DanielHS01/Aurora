"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

// Rutas que manejan su propio scroll (paneles internos, dashboards) —
// Lenis toma control del scroll global del documento y rompe cualquier
// overflow-y-auto interno, así que se desactiva explícitamente aquí.
const EXCLUDED_PREFIXES = ["/dashboard"];

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isExcluded = EXCLUDED_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );

  useEffect(() => {
    if (isExcluded) return;

    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isExcluded]);

  return <>{children}</>;
}