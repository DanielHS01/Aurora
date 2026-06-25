"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function PricingIntro() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const leftTextRef = useRef<HTMLSpanElement | null>(null);
  const rightTextRef = useRef<HTMLSpanElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([leftTextRef.current, rightTextRef.current], {
        y: 120,
        opacity: 0,
        scale: 0.85,
      });

      gsap.set(subtitleRef.current, {
        y: 40,
        opacity: 0,
      });

      gsap.set(portalRef.current, {
        scaleX: 0,
        scaleY: 1,
        opacity: 0,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=1500",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to([leftTextRef.current, rightTextRef.current], {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
      })
        .to(
          subtitleRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.3"
        )
        .to(portalRef.current, {
          scaleX: 1,
          opacity: 1,
          duration: 0.6,
          ease: "power3.inOut",
        })
        .to(
          leftTextRef.current,
          {
            xPercent: -120,
            opacity: 0,
            duration: 0.9,
            ease: "power3.inOut",
          },
          "+=0.1"
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
            y: -40,
            duration: 0.5,
            ease: "power2.out",
          },
          "<"
        )
        .to(
          portalRef.current,
          {
            scaleY: 650,
            duration: 0.9,
            ease: "power3.inOut",
          },
          "-=0.25"
        )
        .to(portalRef.current, {
          opacity: 0,
          duration: 0.25,
          ease: "none",
        });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen items-center justify-center overflow-hidden bg-black px-6 text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_38%)]" />

      <div
        ref={portalRef}
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[2px] w-[70vw] max-w-5xl origin-center -translate-x-1/2 -translate-y-1/2 bg-white"
      />

      <div className="relative z-20 text-center">
        <p
          ref={subtitleRef}
          className="mb-8 text-sm font-medium uppercase tracking-[0.35em] text-white/40"
        >
          Aurora Pricing
        </p>

        <h2 className="flex flex-col items-center text-6xl font-medium uppercase leading-[0.82] tracking-[-0.08em] md:text-8xl lg:text-9xl">
          <span ref={leftTextRef}>Elige cómo</span>
          <span ref={rightTextRef}>empieza Aurora</span>
        </h2>
      </div>
    </section>
  );
}