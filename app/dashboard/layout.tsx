import Sidebar from '@/components/dashboard/Sidebar'; // Crearemos este componente

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#FDFDFD]">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />
      
      {/* Contenido principal con scroll */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}