"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FiArrowUpRight, FiCheck, FiStar } from "react-icons/fi";

gsap.registerPlugin(ScrollTrigger);

const pricingTiers = [
  {
    name: "Start",
    price: "$150.000",
    period: "/mes",
    description: "Para negocios que quieren empezar a centralizar su operación.",
    cta: "Solicitar demo",
    featured: false,
    features: [
      "Dashboard del negocio",
      "Gestión de pedidos",
      "Reservas básicas",
      "Clientes registrados",
      "Soporte inicial",
    ],
  },
  {
    name: "Core",
    price: "$400.000",
    period: "/mes",
    description: "Para negocios que quieren automatizar atención, pagos y procesos.",
    cta: "Empezar con Aurora",
    featured: true,
    features: [
      "Todo en Start",
      "WhatsApp IA",
      "Llamadas IA",
      "Pagos integrados",
      "Facturación digital",
      "Analítica en tiempo real",
    ],
  },
  {
    name: "Scale",
    price: "A medida",
    period: "",
    description: "Para grupos, franquicias o negocios con necesidades avanzadas.",
    cta: "Contactar",
    featured: false,
    features: [
      "Todo en Core",
      "Multi-sucursal",
      "Roles de equipo",
      "Personalización avanzada",
      "Integraciones externas",
      "Soporte prioritario",
    ],
  },
];

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const leftTextRef = useRef<HTMLSpanElement | null>(null);
  const rightTextRef = useRef<HTMLSpanElement | null>(null);
  const pricingRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const borderGlowRefs = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([subtitleRef.current, leftTextRef.current, rightTextRef.current], {
        opacity: 0,
        y: 60,
      });

      gsap.set(pricingRef.current, {
        opacity: 0,
        y: 80,
        scale: 0.96,
      });

      gsap.set(headerRef.current, {
        opacity: 0,
        y: 40,
      });

      gsap.set(cardRefs.current, {
        opacity: 0,
        y: 70,
        scale: 0.96,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2200",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power2.out",
      })
        .to(
          [leftTextRef.current, rightTextRef.current],
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
          },
          "-=0.15"
        )
        .to(
          leftTextRef.current,
          {
            xPercent: -120,
            opacity: 0,
            duration: 0.9,
            ease: "power3.inOut",
          },
          "+=0.15"
        )
        .to(
          rightTextRef.current,
          {
            xPercent: 120,
            opacity: 0,
            duration: 0.9,
            ease: "power3.inOut",
          },
          "<"
        )
        .to(
          subtitleRef.current,
          {
            opacity: 0,
            y: -30,
            duration: 0.4,
            ease: "power2.out",
          },
          "<"
        )
        .to(
          pricingRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.45"
        )
        .to(
          headerRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power3.out",
          },
          "-=0.45"
        )
        .to(
          cardRefs.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.35"
        )
        .to(
          introRef.current,
          {
            opacity: 0,
            duration: 0.2,
            ease: "none",
          },
          "-=0.6"
        );

      borderGlowRefs.current.forEach((line, index) => {
        const isVertical = index === 1 || index === 3;

        gsap.set(line, {
          opacity: 0,
          xPercent: isVertical ? 0 : -120,
          yPercent: isVertical ? -120 : 0,
        });

        gsap.to(line, {
          opacity: 1,
          xPercent: isVertical ? 0 : 520,
          yPercent: isVertical ? 520 : 0,
          duration: 5,
          delay: index * 1.15,
          ease: "none",
          repeat: -1,
          repeatDelay: 0.4,
        });
      });

      setTimeout(() => ScrollTrigger.refresh(), 300);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const setCardRef = (index: number, el: HTMLDivElement | null) => {
    if (el) cardRefs.current[index] = el;
  };

  const setBorderGlowRef = (index: number, el: HTMLDivElement | null) => {
    if (el) borderGlowRefs.current[index] = el;
  };

  return (
    <section
      ref={sectionRef}
      id="precios"
      className="relative min-h-screen overflow-hidden bg-black px-4 py-20 text-white md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_35%)]" />

      <div
  ref={introRef}
  className="pointer-events-none absolute left-0 top-0 z-40 flex h-screen w-full items-center justify-center px-6 text-center"
>
        <div>
          <p
            ref={subtitleRef}
            className="mb-8 text-xs font-medium uppercase tracking-[0.35em] text-white/35 md:text-sm"
          >
            Aurora Pricing
          </p>

          <h2 className="flex flex-col items-center text-5xl font-medium uppercase leading-[0.82] tracking-[-0.08em]  sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
            <span ref={leftTextRef}>Elige cómo</span>
            <span ref={rightTextRef}>empieza Aurora</span>
          </h2>
        </div>
      </div>

      <div
        ref={pricingRef}
        className="relative z-20 mx-auto flex min-h-[calc(100vh-10rem)] max-w-6xl flex-col justify-center overflow-hidden border-x border-white/10 pt-14 md:pt-16"
      >
        <div
          ref={(el) => setBorderGlowRef(0, el)}
          className="pointer-events-none absolute left-0 top-0 z-30 h-px w-40 bg-gradient-to-r from-transparent via-white to-transparent"
        />
        <div
          ref={(el) => setBorderGlowRef(1, el)}
          className="pointer-events-none absolute right-0 top-0 z-30 h-40 w-px bg-gradient-to-b from-transparent via-white to-transparent"
        />
        <div
          ref={(el) => setBorderGlowRef(2, el)}
          className="pointer-events-none absolute bottom-0 right-0 z-30 h-px w-40 bg-gradient-to-r from-transparent via-white to-transparent"
        />
        <div
          ref={(el) => setBorderGlowRef(3, el)}
          className="pointer-events-none absolute bottom-0 left-0 z-30 h-40 w-px bg-gradient-to-b from-transparent via-white to-transparent"
        />

        <div
          ref={headerRef}
          className="grid gap-8 px-6 pb-10 md:grid-cols-12 md:px-10 md:pb-12"
        >
          <div className="md:col-span-8">
            <span className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-white/60">
              Planes Aurora
            </span>

            <h2 className="max-w-4xl text-4xl font-medium uppercase leading-[0.9] tracking-[-0.07em] sm:text-5xl md:text-7xl">
              Precios simples para operar mejor.
            </h2>
          </div>

          <div className="flex items-end md:col-span-4">
            <p className="max-w-sm text-base leading-7 text-white/50 md:text-lg">
              Elige el punto de partida. Aurora puede crecer contigo según el
              tamaño y necesidades del negocio.
            </p>
          </div>
        </div>

        <div className="grid border-t border-white/10 md:grid-cols-3">
          {pricingTiers.map((tier, index) => (
            <div
              key={tier.name}
              ref={(el) => setCardRef(index, el)}
              className={`relative flex min-h-[520px] flex-col overflow-hidden border-b border-white/10 p-7 md:min-h-[600px] md:border-b-0 md:border-r last:md:border-r-0 ${
                tier.featured ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              {tier.featured && (
                <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-medium uppercase text-white">
                  <FiStar />
                  Recomendado
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-3xl font-medium uppercase tracking-[-0.06em]">
                  {tier.name}
                </h3>

                <p
                  className={`mt-4 max-w-xs text-sm leading-6 ${
                    tier.featured ? "text-black/55" : "text-white/45"
                  }`}
                >
                  {tier.description}
                </p>
              </div>

              <div className="mb-10">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-medium tracking-[-0.06em]">
                    {tier.price}
                  </span>

                  {tier.period && (
                    <span
                      className={`pb-1 text-sm ${
                        tier.featured ? "text-black/50" : "text-white/40"
                      }`}
                    >
                      {tier.period}
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-8 flex-1">
                <p
                  className={`mb-5 text-xs font-medium uppercase tracking-[0.22em] ${
                    tier.featured ? "text-black/40" : "text-white/35"
                  }`}
                >
                  Incluye
                </p>

                <ul className="space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <FiCheck
                        className={`mt-0.5 shrink-0 ${
                          tier.featured ? "text-black" : "text-white/60"
                        }`}
                      />

                      <span
                        className={`text-sm leading-5 ${
                          tier.featured ? "text-black/70" : "text-white/60"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#demo"
                className={`group inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-medium uppercase transition ${
                  tier.featured
                    ? "bg-black text-white hover:bg-zinc-800"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {tier.cta}
                <FiArrowUpRight className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}