"use client";

type StarsBackgroundProps = {
  children: React.ReactNode;
  className?: string;
};

function generateStars(count: number, size: number) {
  const shadows: string[] = [];

  for (let i = 0; i < count; i++) {
    const x = ((i * 137) % 4000) - 2000;
    const y = ((i * 269) % 4000) - 2000;
    shadows.push(`${x}px ${y}px #fff`);
  }

  return shadows.join(", ");
}

export default function StarsBackground({
  children,
  className = "",
}: StarsBackgroundProps) {
  const smallStars = generateStars(900, 1);
  const mediumStars = generateStars(350, 2);
  const bigStars = generateStars(150, 3);

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[radial-gradient(ellipse_at_bottom,#171717_0%,#000_75%)] ${className}`}
    >
      <div className="stars-layer stars-small" style={{ boxShadow: smallStars }} />
      <div className="stars-layer stars-medium" style={{ boxShadow: mediumStars }} />
      <div className="stars-layer stars-large" style={{ boxShadow: bigStars }} />

      <div className="relative z-10 h-full w-full">{children}</div>

      <style jsx>{`
        .stars-layer {
          position: absolute;
          top: 0;
          left: 0;
          border-radius: 999px;
          background: transparent;
          opacity: 0.75;
        }

        .stars-layer::after {
          content: "";
          position: absolute;
          top: 2000px;
          left: 0;
          border-radius: 999px;
          background: transparent;
          box-shadow: inherit;
        }

        .stars-small,
        .stars-small::after {
          width: 1px;
          height: 1px;
          animation: starsMove 55s linear infinite;
        }

        .stars-medium,
        .stars-medium::after {
          width: 2px;
          height: 2px;
          animation: starsMove 95s linear infinite;
        }

        .stars-large,
        .stars-large::after {
          width: 3px;
          height: 3px;
          animation: starsMove 140s linear infinite;
        }

        @keyframes starsMove {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-2000px);
          }
        }
      `}</style>
    </div>
  );
}