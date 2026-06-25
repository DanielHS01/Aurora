"use client";

type CosmicParallaxBgProps = {
  head: string;
  text: string;
  loop?: boolean;
  className?: string;
};

export default function CosmicParallaxBg({
  head,
  text,
  loop = true,
  className = "",
}: CosmicParallaxBgProps) {
  const textParts = text.split(",").map((part) => part.trim());

  const generateStars = (count: number) => {
    const shadows: string[] = [];

    for (let i = 0; i < count; i++) {
      const x = (i * 137) % 2000;
      const y = (i * 269) % 2000;
      shadows.push(`${x}px ${y}px #fff`);
    }

    return shadows.join(", ");
  };

  const smallStars = generateStars(700);
  const mediumStars = generateStars(200);
  const bigStars = generateStars(100);

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-black ${className}`}
      style={{ ["--iteration" as string]: loop ? "infinite" : "1" }}
    >
      <div className="stars stars-small" style={{ boxShadow: smallStars }} />
      <div className="stars stars-medium" style={{ boxShadow: mediumStars }} />
      <div className="stars stars-large" style={{ boxShadow: bigStars }} />

      <div className="horizon" />
      <div className="earth" />

      <div className="cosmic-content">
        <h1>{head}</h1>

        <div className="cosmic-subtitle">
          {textParts.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .stars {
          position: absolute;
          top: 0;
          left: 0;
          background: transparent;
          border-radius: 999px;
        }

        .stars::after {
          content: "";
          position: absolute;
          top: 2000px;
          left: 0;
          background: transparent;
          border-radius: 999px;
        }

        .stars-small,
        .stars-small::after {
          width: 1px;
          height: 1px;
          animation: animStar 50s linear var(--iteration);
        }

        .stars-medium,
        .stars-medium::after {
          width: 2px;
          height: 2px;
          animation: animStar 90s linear var(--iteration);
        }

        .stars-large,
        .stars-large::after {
          width: 3px;
          height: 3px;
          animation: animStar 140s linear var(--iteration);
        }

        .horizon {
          position: absolute;
          left: -30%;
          bottom: -45%;
          width: 160%;
          height: 70%;
          border-radius: 50%;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 255, 255, 0.18),
            transparent 62%
          );
          filter: blur(35px);
        }

        .earth {
          position: absolute;
          left: -35%;
          bottom: -52%;
          width: 170%;
          height: 65%;
          border-radius: 50%;
          background: radial-gradient(
            ellipse at center,
            #090909 0%,
            #000 70%
          );
          box-shadow: 0 -40px 140px rgba(255, 255, 255, 0.12);
        }

        .cosmic-content {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
        }

        .cosmic-content h1 {
          font-size: clamp(4rem, 20vw, 14rem);
          font-weight: 700;
          line-height: 0.72;
          letter-spacing: -0.09em;
          text-transform: uppercase;
        }

        .cosmic-subtitle {
          margin-top: 2rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          font-size: clamp(0.75rem, 1.1vw, 1rem);
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
        }

        .cosmic-subtitle span {
          animation: subtitleIn 6s ease-in-out var(--iteration);
        }

        @keyframes animStar {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-2000px);
          }
        }

        @keyframes subtitleIn {
          0%,
          15% {
            opacity: 0;
            transform: translateY(-20px);
          }
          35%,
          80% {
            opacity: 1;
            transform: translateY(0);
          }
          92%,
          100% {
            opacity: 0;
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}