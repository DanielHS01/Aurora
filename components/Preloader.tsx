"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Preloader() {
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const counterRef = useRef<HTMLSpanElement | null>(null);
  const brandRef = useRef<HTMLHeadingElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const piecesRef = useRef<HTMLDivElement[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!loaderRef.current) return;

    const ctx = gsap.context(() => {
      const counter = { value: 0 };

      gsap.set(barRef.current, {
        scaleX: 0,
        transformOrigin: "left center",
      });

      gsap.set(piecesRef.current, {
        opacity: 1,
        scale: 1,
        rotate: 0,
        x: 0,
        y: 0,
      });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => setVisible(false),
      });

      tl.from(brandRef.current, {
        y: 28,
        opacity: 0,
        duration: 0.8,
      })
        .from(
          infoRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.55,
          },
          "-=0.35"
        )
        .to(barRef.current, {
          scaleX: 1,
          duration: 2.2,
          ease: "power2.inOut",
        })
        .to(
          counter,
          {
            value: 100,
            duration: 2.2,
            ease: "power2.inOut",
            onUpdate: () => {
              if (counterRef.current) {
                counterRef.current.textContent = `${Math.round(counter.value)}%`;
              }
            },
          },
          "<"
        )
        .to(
          [brandRef.current, infoRef.current],
          {
            opacity: 0,
            y: -20,
            duration: 0.35,
            ease: "power2.out",
          },
          "+=0.15"
        )
        .to(
          piecesRef.current,
          {
            opacity: 0,
            scale: 0.72,
            rotate: "random(-8, 8)",
            x: "random(-24, 24)",
            y: "random(-24, 24)",
            duration: 0.75,
            stagger: {
              amount: 1.1,
              from: "random",
            },
            ease: "power3.inOut",
          },
          "-=0.05"
        )
        .to(
          loaderRef.current,
          {
            opacity: 0,
            duration: 0.2,
            ease: "none",
          },
          "-=0.15"
        );
    }, loaderRef);

    return () => ctx.revert();
  }, []);

  const setPieceRef = (index: number, el: HTMLDivElement | null) => {
    if (el) piecesRef.current[index] = el;
  };

  if (!visible) return null;

  const cols = 12;
  const rows = 8;

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-[999999] overflow-hidden text-white"
    >
      <div className="absolute inset-0">
        {Array.from({ length: cols * rows }).map((_, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);

          return (
            <div
              key={index}
              ref={(el) => setPieceRef(index, el)}
              className="absolute bg-black"
              style={{
                left: `${(col / cols) * 100}%`,
                top: `${(row / rows) * 100}%`,
                width: `${100 / cols}%`,
                height: `${100 / rows}%`,
              }}
            >
              <div className="absolute inset-0 border border-white/10" />

            </div>
          );
        })}
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <h1
          ref={brandRef}
          className="text-6xl font-medium uppercase leading-[0.82] tracking-[-0.08em] sm:text-7xl md:text-9xl"
        >
          Aurora
        </h1>

        <div ref={infoRef} className="mt-10 w-full max-w-md">
          <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-white/45">
            <span>Inicializando sistema</span>
            <span ref={counterRef}>0%</span>
          </div>

          <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/10">
            <div ref={barRef} className="h-full w-full origin-left bg-white" />
          </div>

          <p className="mt-5 text-sm text-white/35">
            Conectando atención, pedidos, reservas, pagos e inteligencia
            artificial.
          </p>
        </div>
      </div>
    </div>
  );
}