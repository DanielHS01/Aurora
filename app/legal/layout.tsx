import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <header className="border-b border-black/10 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="text-lg font-black uppercase tracking-[-0.06em]">
            AURORA
          </Link>
          <Link href="/register" className="text-sm text-black/50 hover:text-black">
            Volver al registro
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">{children}</main>

      <footer className="border-t border-black/10 px-4 py-8 text-center text-xs text-black/40">
        © {new Date().getFullYear()} Aurora. Todos los derechos reservados.
      </footer>
    </div>
  );
}