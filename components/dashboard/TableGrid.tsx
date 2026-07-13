import { Database } from '@/lib/types/database.types';

// Definimos el tipo basado en tu esquema de Supabase
type RestaurantTable = Database['public']['Tables']['restaurant_tables']['Row'];

interface TableGridProps {
  tables: RestaurantTable[];
}

export default function TableGrid({ tables }: TableGridProps) {
  // Verificamos si no hay mesas para mostrar un estado vacío elegante
  if (!tables || tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-black/10 rounded-3xl bg-gray-50/50">
        <p className="text-black/60 font-medium mb-4">No hay mesas registradas actualmente.</p>
        <button className="px-4 py-2 bg-black text-white text-sm rounded-full hover:bg-black/80 transition-colors">
          + Crear primera mesa
        </button>
      </div>
    );
  }

  // Renderizado normal cuando sí hay mesas
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tables.map((table) => (
        <div 
          key={table.id} 
          className={`p-6 rounded-2xl border transition-all duration-200 ${
            table.status === 'occupied' 
              ? 'bg-black text-white border-transparent shadow-lg' 
              : 'bg-white border-black/10 text-black hover:border-black/30'
          }`}
        >
          <h4 className="font-medium text-lg">Mesa {table.table_number}</h4>
          <p className="text-xs opacity-60 uppercase mt-1 tracking-wider">
            {table.status}
          </p>
        </div>
      ))}
    </div>
  );
}