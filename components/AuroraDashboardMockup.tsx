"use client";

import {
  FiHome,
  FiShoppingCart,
  FiMessageCircle,
  FiCreditCard,
  FiBarChart2,
  FiUsers,
  FiBell,
  FiSearch,
  FiSettings,
  FiMenu,
} from "react-icons/fi";

export default function AuroraDashboardMockup() {
  return (
    <div className="aurora-theme relative h-[620px] w-[340px] overflow-hidden rounded-[2rem] border border-black/10 bg-white text-black shadow-[0_40px_120px_rgba(0,0,0,0.45)] md:h-[620px] md:w-[1040px]">
      <aside className="absolute left-0 top-0 hidden h-full w-[210px] flex-col border-r border-black/10 bg-[#F7F7F7] md:flex">
        <div className="flex h-20 items-center px-7">
          <h2 className="text-2xl font-medium uppercase tracking-[-0.08em]">
            AURORA
          </h2>
        </div>

        <nav className="mt-2 flex flex-col gap-2 px-4">
          <NavItem icon={<FiHome />} text="Dashboard" active />
          <NavItem icon={<FiShoppingCart />} text="Pedidos" />
          <NavItem icon={<FiMessageCircle />} text="WhatsApp IA" />
          <NavItem icon={<FiCreditCard />} text="Pagos" />
          <NavItem icon={<FiUsers />} text="Clientes" />
          <NavItem icon={<FiBarChart2 />} text="Analítica" />
        </nav>

        <div className="mt-auto p-5">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-black/40">
              Aurora AI
            </p>
            <p className="mt-2 text-sm text-black/70">
              14 conversaciones activas
            </p>
          </div>
        </div>
      </aside>

      <main className="flex h-full flex-col md:ml-[210px]">
        <div className="flex h-20 items-center justify-between border-b border-black/10 px-5 md:px-7">
          <h2 className="text-2xl font-medium uppercase tracking-[-0.08em] md:hidden">
            AURORA
          </h2>

          <div className="hidden w-[380px] items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-3 md:flex">
            <FiSearch className="text-black/40" />
            <span className="text-sm text-black/35">
              Buscar pedidos o clientes...
            </span>
          </div>

          <div className="flex items-center gap-4">
            <FiSettings className="hidden text-xl text-black/45 md:block" />
            <FiBell className="text-xl text-black/45" />
            <div className="hidden h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-medium text-white transition-colors duration-700 md:flex">
              N
            </div>
            <FiMenu className="text-2xl md:hidden" />
          </div>
        </div>

        <div className="grid flex-1 gap-4 p-4 md:grid-cols-[1.65fr_1fr] md:gap-5 md:p-5">
          <div className="flex flex-col gap-4 md:gap-5">
            <div className="rounded-[1.5rem] bg-[var(--accent)] p-5 text-white transition-colors duration-700 md:hidden">
              <p className="text-sm opacity-70">Ventas hoy</p>
              <h3 className="mt-2 text-4xl font-medium tracking-[-0.05em]">
                $8.420
              </h3>
              <p className="mt-1 text-sm opacity-80">+24% vs ayer</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              <KpiCard title="Ventas" value="$48.420" growth="+24%" />
              <KpiCard title="Pedidos" value="1.248" growth="+18%" />
              <KpiCard
                title="Clientes"
                value="873"
                growth="+12%"
                className="hidden md:block"
              />
            </div>

            <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm md:rounded-[1.7rem] md:p-5">
              <p className="text-xs uppercase tracking-widest text-black/40">
                Rendimiento
              </p>

              <div className="mt-6 flex h-[120px] items-end gap-3 md:mt-8 md:h-[170px] md:gap-4">
                {["42%", "58%", "50%", "72%", "86%", "68%", "100%"].map(
                  (h, i) => (
                    <Bar key={i} h={h} delay={`${i * 0.12}s`} />
                  )
                )}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm md:rounded-[1.7rem] md:p-5">
              <div className="mb-4 flex justify-between">
                <h3 className="text-base font-medium md:text-lg">
                  Últimos pedidos
                </h3>
                <span className="text-sm text-black/40">Hoy</span>
              </div>

              <OrderRow name="Mesa 14" status="Preparando" total="$84" />
              <OrderRow name="Pedido WhatsApp" status="Pagado" total="$126" />
              <OrderRow
                name="Reserva Online"
                status="Confirmado"
                total="$58"
                className="hidden md:flex"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 md:gap-5">
            <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm md:rounded-[1.7rem] md:p-5">
              <p className="text-xs uppercase tracking-widest text-black/40">
                IA activa
              </p>

              <h3 className="mt-3 text-2xl font-medium tracking-[-0.04em] md:text-3xl">
                WhatsApp Assistant
              </h3>

              <div className="mt-5 space-y-3 md:mt-6">
                <Message text="¿Tienen mesa para 4?" />
                <Message text="Sí, disponible a las 21:00." bot />
                <Message text="Perfecto, reservar." />
              </div>
            </div>

            <div className="flex-1 rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm md:rounded-[1.7rem] md:p-5">
              <h3 className="text-lg font-medium md:text-xl">
                Actividad reciente
              </h3>

              <div className="mt-4 space-y-3 md:mt-5">
                <Activity text="Reserva creada automáticamente" />
                <Activity text="Factura enviada al cliente" />
                <Activity text="Pago confirmado" />
                <Activity text="Nuevo lead desde WhatsApp" className="hidden md:block" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="demo-cursor absolute z-50 h-5 w-5 rounded-full border-2 border-[var(--accent)] bg-white shadow-xl transition-colors duration-700" />

      <style jsx>{`
        .aurora-theme {
          --accent: #111111;
          animation: themeShift 8s ease-in-out infinite;
        }

        .demo-cursor {
          left: 74%;
          top: 38%;
          animation: cursorMove 7s ease-in-out infinite;
        }

        @keyframes themeShift {
          0%,
          100% {
            --accent: #111111;
          }
          33% {
            --accent: #2563eb;
          }
          66% {
            --accent: #dc2626;
          }
        }

        @keyframes cursorMove {
          0% {
            transform: translate(0, 0) scale(1);
          }
          18% {
            transform: translate(-18px, 82px) scale(0.92);
          }
          22% {
            transform: translate(-18px, 82px) scale(0.7);
          }
          28% {
            transform: translate(-18px, 82px) scale(1);
          }
          48% {
            transform: translate(-405px, 240px) scale(1);
          }
          52% {
            transform: translate(-405px, 240px) scale(0.7);
          }
          60% {
            transform: translate(-135px, -40px) scale(1);
          }
          82% {
            transform: translate(120px, 220px) scale(0.75);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }

        @media (max-width: 767px) {
          .demo-cursor {
            left: 76%;
            top: 38%;
            animation: mobileCursor 6s ease-in-out infinite;
          }

          @keyframes mobileCursor {
            0% {
              transform: translate(0, 0) scale(1);
            }
            30% {
              transform: translate(-120px, 170px) scale(1);
            }
            34% {
              transform: translate(-120px, 170px) scale(0.75);
            }
            55% {
              transform: translate(-40px, 260px) scale(1);
            }
            70% {
              transform: translate(-40px, 260px) scale(0.75);
            }
            100% {
              transform: translate(0, 0) scale(1);
            }
          }
        }
      `}</style>
    </div>
  );
}

function NavItem({
  icon,
  text,
  active,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors duration-700 ${
        active ? "bg-[var(--accent)] text-white" : "text-black/55"
      }`}
    >
      {icon}
      {text}
    </div>
  );
}

function KpiCard({
  title,
  value,
  growth,
  className = "",
}: {
  title: string;
  value: string;
  growth: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.3rem] border border-black/10 bg-white p-4 shadow-sm md:rounded-[1.4rem] ${className}`}
    >
      <p className="text-sm text-black/40">{title}</p>
      <h3 className="mt-2 text-2xl font-medium tracking-[-0.04em] md:text-3xl">
        {value}
      </h3>
      <span className="text-sm text-emerald-600">{growth}</span>
    </div>
  );
}

function Bar({ h, delay }: { h: string; delay: string }) {
  return (
    <div className="flex-1 overflow-hidden rounded-t-xl bg-black/10">
      <div
        className="bar-fill h-full rounded-t-xl bg-[var(--accent)] transition-colors duration-700"
        style={{ height: h, animationDelay: delay }}
      />

      <style jsx>{`
        .bar-fill {
          transform-origin: bottom;
          animation: barPulse 2.8s ease-in-out infinite;
        }

        @keyframes barPulse {
          0%,
          100% {
            transform: scaleY(0.75);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}

function OrderRow({
  name,
  status,
  total,
  className = "",
}: {
  name: string;
  status: string;
  total: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between border-t border-black/10 py-3 ${className}`}
    >
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-black/40">{status}</p>
      </div>
      <p className="font-medium">{total}</p>
    </div>
  );
}

function Message({ text, bot }: { text: string; bot?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-3 text-sm transition-colors duration-700 ${
        bot ? "bg-[var(--accent)] text-white" : "bg-black/[0.05] text-black"
      }`}
    >
      {text}
    </div>
  );
}

function Activity({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl bg-black/[0.04] p-3 text-sm text-black/65 ${className}`}
    >
      {text}
    </div>
  );
}