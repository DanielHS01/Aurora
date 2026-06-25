"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FiMessageCircle,
  FiPhoneCall,
  FiCreditCard,
  FiCalendar,
  FiBarChart2,
  FiFileText,
} from "react-icons/fi";
import DottedSurface from "./DottedSurface";

gsap.registerPlugin(ScrollTrigger);

const modules = [
  {
    title: "WhatsApp IA",
    subtitle: "Atención automática desde el canal que tus clientes ya usan.",
    text: "Responde dudas, toma pedidos, confirma reservas y registra cada conversación en el sistema del negocio.",
    icon: <FiMessageCircle />,
  },
  {
    title: "Llamadas IA",
    subtitle: "Nunca más una llamada perdida.",
    text: "Atiende llamadas, entiende la intención del cliente, agenda reservas, toma pedidos y guarda cada solicitud.",
    icon: <FiPhoneCall />,
  },
  {
    title: "Pagos",
    subtitle: "Cobros conectados con la operación.",
    text: "Gestiona pagos, métodos de cobro, estados de transacción y confirmaciones desde un único panel.",
    icon: <FiCreditCard />,
  },
  {
    title: "Reservas",
    subtitle: "Disponibilidad en tiempo real.",
    text: "Organiza mesas, citas, horarios y clientes para restaurantes, clínicas, hoteles y más negocios.",
    icon: <FiCalendar />,
  },
  {
    title: "Factura Digital",
    subtitle: "Todo queda registrado.",
    text: "Crea recibos, facturas e historial comercial conectado a pedidos, pagos y clientes.",
    icon: <FiFileText />,
  },
  {
    title: "Analítica",
    subtitle: "Datos claros para decidir.",
    text: "Visualiza ventas, pedidos, reservas, clientes y rendimiento operativo en tiempo real.",
    icon: <FiBarChart2 />,
  },
];

export default function HorizontalScrollSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const panelsRef = useRef<HTMLDivElement[]>([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(introRef.current, { opacity: 1 });

      panelsRef.current.forEach((panel, index) => {
        gsap.set(panel, {
          xPercent: 100,
        });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${modules.length * 700}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      panelsRef.current.forEach((panel) => {
        tl.to(panel, {
          xPercent: 0,
          duration: 1,
          ease: "power3.out",
        });
      });

      setTimeout(() => ScrollTrigger.refresh(), 300);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const setPanelRef = (index: number, el: HTMLDivElement | null) => {
    if (el) panelsRef.current[index] = el;
  };

  return (
    <section
      ref={sectionRef}
      id="soluciones"
      className="relative h-screen overflow-hidden bg-black text-white"
    >
      <div
        ref={introRef}
        className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden px-6 text-center"
      >
        <DottedSurface />

        <div className="relative z-10 max-w-6xl">
          <span className="mb-8 inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium uppercase text-white/70 backdrop-blur-xl">
            Aurora Core
          </span>

          <h2 className="text-5xl font-medium uppercase leading-[0.92] tracking-[-0.06em] md:text-7xl lg:text-8xl">
            Bienvenido al centro operativo de Aurora.
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-lg font-normal leading-8 text-white/55 md:text-xl">
            Una plataforma diseñada para conectar atención, pedidos, reservas,
            pagos, facturación e inteligencia artificial.
          </p>
        </div>
      </div>

      {modules.map((item, index) => (
        <div
          key={item.title}
          ref={(el) => setPanelRef(index, el)}
          className="absolute inset-0 flex items-center justify-center bg-black px-6 text-white"
          style={{ zIndex: 20 + index }}
        >
          <div className="grid h-[86vh] w-full max-w-[1400px] overflow-hidden rounded-[3rem] border border-white/10  lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative flex flex-col justify-between border-b border-white/10 p-8 md:p-10 lg:border-b-0 lg:border-r lg:p-14">
              <div>
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-3xl md:h-20 md:w-20 md:text-4xl">
                  {item.icon}
                </div>

                <p className="mb-6 text-sm font-medium uppercase tracking-[0.25em] text-white/40">
                  0{index + 1} / 06
                </p>

                <h3 className="max-w-2xl text-5xl font-medium uppercase leading-[0.92] tracking-[-0.06em] md:text-7xl lg:text-8xl">
                  {item.title}
                </h3>
              </div>

              <p className="max-w-xl text-xl font-normal leading-7 text-white/55 md:text-2xl md:leading-8">
                {item.subtitle}
              </p>
            </div>

            <div className="relative flex items-center p-8 md:p-10 lg:p-14">
              <div className="absolute inset-0" />

              <p className="relative z-10 max-w-3xl text-3xl font-normal leading-[1.08] tracking-[-0.04em] text-white/85 md:text-4xl lg:text-6xl">
                {item.text}
              </p>

              <div className="absolute bottom-8 right-8 hidden rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/45 lg:block">
                Aurora Module
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
