"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FiPhoneCall,
  FiMessageCircle,
  FiCreditCard,
  FiBarChart2,
  FiCheck,
} from "react-icons/fi";
import StarsBackground from "./StarsBackground";
import AuroraDashboardMockup from "./AuroraDashboardMockup";

gsap.registerPlugin(ScrollTrigger);

export default function ProblemSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const cardsWrapRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(dashboardRef.current, {
        opacity: 0,
        y: 120,
        scale: 0.72,
        rotateX: 58,
        rotateZ: -9,
        transformPerspective: 1200,
        transformOrigin: "50% 50%",
      });

      gsap.set(titleRef.current, {
        opacity: 0,
        scale: 0.15,
        y: 60,
        transformOrigin: "58% 18%",
      });

      gsap.set(cardsWrapRef.current, {
        opacity: 0,
        y: 70,
        scale: 0.96,
      });

      gsap.set(".problem-card", {
        opacity: 0,
        y: 45,
        scale: 0.96,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=4300",
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(dashboardRef.current, {
        opacity: 1,
        y: 0,
        scale: 0.78,
        rotateX: 48,
        rotateZ: -8,
        duration: 0.8,
        ease: "power3.out",
      })
        .to(dashboardRef.current, {
          scale: 0.9,
          rotateX: 22,
          rotateZ: -4,
          y: -20,
          duration: 1,
          ease: "power2.inOut",
        })
        .to(dashboardRef.current, {
          scale: 0.95,
          rotateX: 0,
          rotateZ: 0,
          y: 0,
          duration: 1,
          ease: "power2.inOut",
        })
        .to(dashboardRef.current, {
          scale: 0.75,
          opacity: 0.25,
          duration: 0.8,
          ease: "power2.out",
        })
        .to(
          titleRef.current,
          {
            opacity: 1,
            scale: 1.65,
            y: 0,
            duration: 1,
            ease: "power2.out",
          },
          "-=0.45"
        )
        .to(titleRef.current, {
          scale: 0.78,
          duration: 1.1,
          ease: "power2.inOut",
        })
        .to(
          dashboardRef.current,
          {
            opacity: 0,
            scale: 0.45,
            y: 160,
            duration: 1,
            ease: "power2.out",
          },
          "<"
        )
        .to(
          cardsWrapRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.35"
        )
        .to(
          ".problem-card",
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.1,
            duration: 0.75,
            ease: "power3.out",
          },
          "-=0.45"
        )
        .to(
          cardsWrapRef.current,
          {
            opacity: 0,
            scale: 0.92,
            duration: 0.8,
            ease: "power2.out",
          },
          "+=0.35"
        )
        .to(titleRef.current, {
          scale: 110,
          opacity: 1,
          duration: 1.6,
          ease: "power2.inOut",
        })
        .to(titleRef.current, {
          opacity: 0,
          duration: 0.12,
          ease: "none",
        });

      setTimeout(() => ScrollTrigger.refresh(), 300);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="producto"
      className="relative h-screen overflow-hidden bg-black text-white"
    >
      <StarsBackground>
        <div className="relative flex h-screen items-center justify-center overflow-hidden px-4 pt-24 sm:px-6 lg:px-8">
          <div ref={dashboardRef} className="absolute z-20 origin-center">
            <AuroraDashboardMockup />
          </div>

          <h2
            ref={titleRef}
            className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 text-center text-5xl font-black uppercase leading-[0.82] tracking-[-0.08em] text-white md:text-7xl"
          >
            AURORA
            <br />
            TODO EN
            <br />
            UNO
          </h2>

          <div
            ref={cardsWrapRef}
            className="absolute left-1/2 top-[55%] z-30 h-[68vh] w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[78%] w-[94%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-dashed border-white/20 lg:block" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-px w-[94%] -translate-x-1/2 border-t border-dashed border-white/20 lg:block" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[78%] w-px -translate-y-1/2 border-l border-dashed border-white/20 lg:block" />

            <div className="relative grid h-full grid-cols-1 gap-4 overflow-y-auto pb-8 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-12 lg:overflow-visible">
              <FeatureCard
                className="problem-card lg:col-span-5 lg:col-start-1 lg:row-span-5 lg:row-start-1"
                title="Llamadas IA"
                description="Atiende llamadas, entiende la intención del cliente y registra cada solicitud dentro del sistema."
                icon={<FiPhoneCall />}
                features={[
                  "Reservas automáticas",
                  "Registro de llamadas",
                  "Seguimiento comercial",
                ]}
              />

              <FeatureCard
                className="problem-card lg:col-span-5 lg:col-start-8 lg:row-span-5 lg:row-start-1"
                title="WhatsApp IA"
                description="Responde mensajes, toma pedidos y confirma reservas desde el canal que tus clientes ya usan."
                icon={<FiMessageCircle />}
                features={[
                  "Respuestas instantáneas",
                  "Pedidos conectados",
                  "Conversaciones guardadas",
                ]}
              />

              <FeatureCard
                className="problem-card lg:col-span-5 lg:col-start-1 lg:row-span-5 lg:row-start-8"
                title="Pagos"
                description="Centraliza cobros, estados de pago, confirmaciones y operaciones comerciales en un mismo panel."
                icon={<FiCreditCard />}
                features={[
                  "Pagos registrados",
                  "Estados visibles",
                  "Historial comercial",
                ]}
              />

              <FeatureCard
                className="problem-card lg:col-span-5 lg:col-start-8 lg:row-span-5 lg:row-start-8"
                title="Analítica"
                description="Visualiza ventas, pedidos, clientes y rendimiento operativo con métricas claras en tiempo real."
                icon={<FiBarChart2 />}
                features={[
                  "Métricas clave",
                  "Reportes operativos",
                  "Decisiones rápidas",
                ]}
              />
            </div>
          </div>
        </div>
      </StarsBackground>
    </section>
  );
}

function FeatureCard({
  title,
  description,
  icon,
  features,
  className = "",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  className?: string;
}) {
  return (
    <div
      className={`group relative min-h-[240px] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#101010]/90 p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] transition duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-[#171717] hover:shadow-[0_40px_120px_rgba(255,255,255,0.08)] sm:p-7 lg:min-h-0 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.12),transparent_42%)] opacity-70 transition duration-500 group-hover:opacity-100" />

      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl text-white/85 transition duration-500 group-hover:bg-white group-hover:text-black">
          {icon}
        </div>

        <h3 className="text-2xl font-medium leading-[0.95] tracking-[-0.05em] sm:text-3xl">
          {title}
        </h3>

        <p className="mt-3 max-w-md text-sm leading-5 text-white/60">
          {description}
        </p>

        <div className="mt-5 space-y-2">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 text-xs text-white/70"
            >
              <FiCheck className="shrink-0 text-white/40 transition group-hover:text-white" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}